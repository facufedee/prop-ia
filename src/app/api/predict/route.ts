import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Mock prediction for local development
    // In production (Vercel), use the Python API
    const { rooms, bathrooms, surface_total, surface_covered, property_type, location, description, expenses, construction_year } = body;

    // Base prediction formula
    let prediction = (surface_total || 100) * 1000 + (rooms || 3) * 20000 + (bathrooms || 2) * 15000;

    // Add expenses impact (higher expenses = higher value, better maintained building)
    if (expenses) prediction += expenses * 1; // 100% of expenses value added for clear visibility

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
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}