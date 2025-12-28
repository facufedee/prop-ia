import { PricingStrategy, PropertyData } from '../../domain/strategies/PricingStrategy';
import { spawn } from 'child_process';
import path from 'path';

export class MLPricingStrategy implements PricingStrategy {
    async calculate(data: PropertyData): Promise<number> {
        return new Promise((resolve, reject) => {
            const pythonPath = process.platform === 'win32' ? 'python' : 'python3';
            const apiDir = path.join(process.cwd(), 'api');

            const scriptPath = path.join(apiDir, 'run_predict.py');
            const inputData = JSON.stringify(data);

            const pythonProcess = spawn(pythonPath, [scriptPath, inputData], {
                cwd: apiDir,
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
                    console.error('Python process stderr:', stderr);
                    return reject(new Error(`Python execution failed with code ${code}`));
                }

                try {
                    const result = JSON.parse(stdout.trim());
                    if (result.statusCode === 200) {
                        const body = JSON.parse(result.body);
                        resolve(body.prediction);
                    } else {
                        const errorBody = JSON.parse(result.body);
                        reject(new Error(errorBody.error || 'Python model error'));
                    }
                } catch (parseError) {
                    console.error('Parse error:', parseError, 'Raw output:', stdout);
                    reject(new Error('Failed to parse Python response'));
                }
            });

            pythonProcess.on('error', (error) => {
                reject(new Error(`Python not available: ${error.message}`));
            });
        });
    }
}
