import * as tf from '@tensorflow/tfjs';
import { PropertyPreprocessor, PropertyData } from './preprocessor';

class PredictionService {
    private model: tf.GraphModel | null = null;
    private preprocessor: PropertyPreprocessor;
    private isModelLoading: boolean = false;

    constructor() {
        this.preprocessor = new PropertyPreprocessor();
    }

    async loadModel() {
        if (this.model) return;
        if (this.isModelLoading) {
            // Wait for loading to finish
            while (this.isModelLoading) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return;
        }

        this.isModelLoading = true;
        try {
            console.log('Loading model and preprocessor configs...');
            await this.preprocessor.loadConfigs();

            // Load the model from public folder
            // The model format is 'graph-model', so we must use loadGraphModel
            this.model = await tf.loadGraphModel('/models/tasacion_propiedades/modelo_web_convertido/model.json');
            console.log('Model loaded successfully');
        } catch (error) {
            console.error('Error loading model:', error);
            throw error;
        } finally {
            this.isModelLoading = false;
        }
    }

    async predict(data: PropertyData): Promise<number> {
        if (!this.model) {
            await this.loadModel();
        }

        if (!this.model) {
            throw new Error('Model could not be loaded');
        }

        return tf.tidy(() => {
            try {
                const inputTensor = this.preprocessor.preprocess(data);

                // For GraphModel, we use execute() or predict() but sometimes execute() is safer if signature is complex.
                // However, predict() usually works for single input/output.
                // The model signature shows input name 'dense_input' and output 'Identity'.
                // tf.GraphModel.predict() can take a Tensor.

                const predictionTensor = this.model!.predict(inputTensor) as tf.Tensor;
                const predictionValue = predictionTensor.dataSync()[0];
                console.log('Raw model output (log scale):', predictionValue);

                // Inverse transform of target (log1p -> expm1)
                // The model predicts log(price_in_thousands).
                // We multiply by 1000 to get USD.
                const priceInThousands = Math.expm1(predictionValue);
                let price = priceInThousands * 1000;

                // Manual Logic Adjustment:
                // The model has a negative correlation for bathrooms, so we neutralized it in the preprocessor (fixed at 2 baths).
                // Now we apply a manual correction to restore the expected logic (More Baths = Higher Price).
                // Baseline is 2 bathrooms.
                // Each additional bathroom adds ~3% value.
                // Each missing bathroom removes ~5% value.
                if (data.bathrooms !== null) {
                    const diff = data.bathrooms - 2;
                    let adjustment = 0;
                    if (diff > 0) {
                        adjustment = diff * 0.03; // +3% per extra bath
                    } else {
                        adjustment = diff * 0.05; // -5% per missing bath
                    }
                    price = price * (1 + adjustment);
                }

                return price;
            } catch (error) {
                console.error('Prediction error:', error);
                throw error;
            }
        });
    }
}

export const predictionService = new PredictionService();
