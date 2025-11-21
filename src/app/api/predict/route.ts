import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if we should use ML model (query param ?useML=true)
    const url = new URL(request.url);
    const useML = url.searchParams.get('useML') === 'true';

    if (useML) {
      // Use Python ML model locally
      return await usePythonModel(body);
    }

    // Mock prediction for local development
    // In production (Vercel), use the Python API
    const { rooms, bathrooms, bedrooms, surface_total, property_type, location, description, expenses, construction_year, floor } = body;

    // Base prediction formula
    let prediction = (surface_total || 100) * 1000 + (rooms || 3) * 20000 + (bathrooms || 2) * 15000 + (bedrooms || 2) * 25000;

    // Add expenses impact (higher expenses = higher value, better maintained building)
    if (expenses) prediction += expenses * 1; // 100% of expenses value added for clear visibility

    // Floor impact (higher floors = higher value for apartments)
    if (floor && property_type === 'Departamento') {
      if (floor >= 10) prediction *= 1.08; // 8% more for high floors
      else if (floor >= 5) prediction *= 1.05; // 5% more for mid-high floors
      else if (floor >= 3) prediction *= 1.02; // 2% more for mid floors
    }

    // Construction year impact (newer = higher value)
    if (construction_year) {
      const age = new Date().getFullYear() - construction_year;
      if (age < 10) prediction *= 1.1;
      else if (age > 30) prediction *= 0.9;
    }

    // Features impact
    if (description) {
      const features = description.toLowerCase();
      if (features.includes('pileta')) prediction *= 1.15; // 15% more for pool
      if (features.includes('cochera')) prediction *= 1.10; // 10% more for garage
      if (features.includes('sum')) prediction *= 1.12; // 12% more for SUM
      if (features.includes('seguridad')) prediction *= 1.08; // 8% more for security
      if (features.includes('balcon')) prediction *= 1.05; // 5% more for balcony
      if (features.includes('terraza')) prediction *= 1.06; // 6% more for terrace
      if (features.includes('jardin')) prediction *= 1.07; // 7% more for garden
      if (features.includes('gimnasio')) prediction *= 1.04; // 4% more for gym
    }

    // Property type multiplier (based on Argentine market averages)
    if (property_type === 'Casa') prediction *= 1.25; // Houses 25% more expensive
    else if (property_type === 'PH') prediction *= 1.15; // PH 15% more expensive
    else if (property_type === 'Departamento') prediction *= 1.0; // Apartments base price

    // Location multiplier based on common Argentine locations
    let locationMultiplier = 1.0;
    if (location) {
      const loc = location.toLowerCase();
      if (loc.includes('capital federal') || loc.includes('palermo') || loc.includes('belgrano') || loc.includes('recoleta') || loc.includes('puerto madero')) {
        locationMultiplier = 1.2; // Premium areas
      } else if (loc.includes('buenos aires') || loc.includes('la plata') || loc.includes('mar del plata') || loc.includes('rosario') || loc.includes('córdoba')) {
        locationMultiplier = 1.0; // Major cities
      } else if (loc.includes('mendoza') || loc.includes('bariloche') || loc.includes('salta') || loc.includes('ushuaia')) {
        locationMultiplier = 0.9; // Tourist areas
      } else {
        locationMultiplier = 0.6; // Other areas
      }
    }

    prediction *= locationMultiplier;

    return NextResponse.json({ prediction: prediction });
  } catch (error: unknown) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Function to use Python ML model locally
async function usePythonModel(body: any): Promise<NextResponse> {
  return new Promise((resolve, reject) => {
    const pythonPath = process.platform === 'win32' ? 'python' : 'python3';
    const scriptPath = path.join(process.cwd(), 'api', 'predict.py');

    // Create a temporary Python script that calls the handler
    const tempScript = `
import json
import sys
import os
sys.path.append(os.path.dirname('${scriptPath}'))

# Import the handler function
from predict import handler

# Mock event for local execution
event = {
    'body': json.dumps(${JSON.stringify(body)})
}

# Mock context
context = {}

# Call handler
result = handler(event, context)

# Print result as JSON
print(json.dumps(result))
`;

    const pythonProcess = spawn(pythonPath, ['-c', tempScript], {
      cwd: path.join(process.cwd(), 'api'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python process error:', stderr);
        resolve(NextResponse.json({
          error: `Python execution failed: ${stderr}`
        }, { status: 500 }));
        return;
      }

      try {
        const result = JSON.parse(stdout.trim());

        if (result.statusCode === 200) {
          const body = JSON.parse(result.body);
          resolve(NextResponse.json(body));
        } else {
          const errorBody = JSON.parse(result.body);
          resolve(NextResponse.json({
            error: errorBody.error || 'Python model error'
          }, { status: result.statusCode }));
        }
      } catch (parseError) {
        console.error('Parse error:', parseError, 'Raw output:', stdout);
        resolve(NextResponse.json({
          error: 'Failed to parse Python response'
        }, { status: 500 }));
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python process:', error);
      resolve(NextResponse.json({
        error: 'Python not available. Install Python and required packages.'
      }, { status: 500 }));
    });
  });
}