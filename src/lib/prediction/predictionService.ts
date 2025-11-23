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

    async predict(data: PropertyData, options: { skipConfig?: boolean } = {}): Promise<number> {
        if (!this.model) {
            await this.loadModel();
        }

        if (!this.model) {
            throw new Error('Model could not be loaded');
        }

        // Fetch configuration first (async) unless skipped
        let config: any = {};
        if (!options.skipConfig) {
            try {
                const response = await fetch('/api/config/tasacion');
                if (response.ok) {
                    config = await response.json();
                }
            } catch (e) {
                console.error("Error loading tasacion adjustments:", e);
            }
        }

        // Run model inference (synchronous inside tidy)
        let price = tf.tidy(() => {
            try {
                const inputTensor = this.preprocessor.preprocess(data);
                const predictionTensor = this.model!.predict(inputTensor) as tf.Tensor;
                const predictionValue = predictionTensor.dataSync()[0];
                console.log('Raw model output (log scale):', predictionValue);

                const priceInThousands = Math.expm1(predictionValue);
                return Math.max(0, priceInThousands * 1000);
            } catch (error) {
                console.error('Prediction error:', error);
                throw error;
            }
        });

        // Apply Manual Logic Adjustment (Bathrooms)
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

        // Apply User Configuration Adjustments (from Server API)
        if (!options.skipConfig && config && Object.keys(config).length > 0) {
            let totalAdjustment = 0;

            // Apply adjustments for boolean features if they are present
            const booleanFeatures = ["pileta", "sum", "seguridad", "cochera", "balcon", "terraza", "jardin", "gimnasio", "laundry", "calefaccion"];
            const featureList = data.all_features.toLowerCase().split(',').map(f => f.trim());

            booleanFeatures.forEach(feature => {
                if (featureList.includes(feature) && config[feature]) {
                    totalAdjustment += config[feature];
                }
            });

            // Apply adjustments for numeric fields (Always apply if configured)
            const numericFeatures = ["area_total", "area_covered", "rooms", "bedrooms", "bathrooms", "floor", "construction_year", "expenses"];
            numericFeatures.forEach(field => {
                if (config[field]) {
                    totalAdjustment += config[field];
                }
            });

            price = price * (1 + (totalAdjustment / 100));
        }

        return price;
    }
}

export const predictionService = new PredictionService();
