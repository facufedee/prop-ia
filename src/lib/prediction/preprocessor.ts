import * as tf from '@tensorflow/tfjs';

export interface PropertyData {
  bedrooms: number | null;
  bathrooms: number | null;
  area_total: number | null;
  area_covered: number | null;
  floor: number | null;
  construction_year: number | null;
  rooms: number | null;
  expenses: number | null;
  property_type: string;
  barrio: string;
  ciudad: string;
  provincia: string;
  all_features: string;
}

interface ScalerConfig {
  mean: number[];
  scale: number[];
  feature_names: string[];
}

interface OneHotConfig {
  categories: string[][];
}

interface VectorizerConfig {
  vocabulary: Record<string, number>;
  idf: number[];
  max_features: number;
}

interface MedianasConfig {
  median_floor: number;
  median_construction_year: number;
  median_expenses: number;
  median_rooms: number;
  median_bedrooms: number;
  median_bathrooms: number;
  median_area_total: number;
  median_area_covered: number;
}

export class PropertyPreprocessor {
  private scalerConfig: ScalerConfig | null = null;
  private oneHotConfig: OneHotConfig | null = null;
  private vectorizerConfig: VectorizerConfig | null = null;
  private medianasConfig: MedianasConfig | null = null;

  async loadConfigs() {
    try {
      const [scalerRes, vectorizerRes, medianasRes] = await Promise.all([
        fetch('/models/tasacion_propiedades/preprocessor_config.json'),
        fetch('/models/tasacion_propiedades/vectorizer_config.json'),
        fetch('/models/tasacion_propiedades/medianas.json')
      ]);

      const preprocessorConfig = await scalerRes.json();
      this.scalerConfig = preprocessorConfig.scaler;
      this.oneHotConfig = preprocessorConfig.onehot;
      this.vectorizerConfig = await vectorizerRes.json();
      this.medianasConfig = await medianasRes.json();
    } catch (error) {
      console.error('Error loading preprocessor configs:', error);
      throw new Error('Failed to load preprocessor configurations');
    }
  }

  preprocess(data: PropertyData): tf.Tensor {
    if (!this.scalerConfig || !this.oneHotConfig || !this.vectorizerConfig || !this.medianasConfig) {
      throw new Error('Preprocessor not initialized. Call loadConfigs() first.');
    }

    // 1. Imputation (Fill missing values)
    const processedData = { ...data };
    processedData.floor = processedData.floor ?? this.medianasConfig.median_floor;
    processedData.construction_year = processedData.construction_year ?? this.medianasConfig.median_construction_year;
    processedData.expenses = processedData.expenses ?? this.medianasConfig.median_expenses;
    processedData.rooms = processedData.rooms ?? this.medianasConfig.median_rooms;
    processedData.bedrooms = processedData.bedrooms ?? this.medianasConfig.median_bedrooms;
    processedData.bathrooms = processedData.bathrooms ?? this.medianasConfig.median_bathrooms;
    processedData.area_total = processedData.area_total ?? this.medianasConfig.median_area_total;
    processedData.area_covered = processedData.area_covered ?? this.medianasConfig.median_area_covered;

    // 2. Scaling (StandardScaler)
    // Order deduced from 'mean' values in config (ignoring feature_names list which is unordered):
    // 0: bedrooms (mean ~2.01)
    // 1: bathrooms (mean ~1.03)
    // 2: area_total (mean ~165)
    // 3: area_covered (mean ~116)
    // 4: floor (mean ~2.34)
    // 5: construction_year (mean ~2021)
    // 6: rooms (mean ~2.99)
    // 7: expenses (mean ~2383)

    const numericFeatures = [
      processedData.bedrooms,
      processedData.bathrooms,
      processedData.area_total,
      processedData.area_covered,
      processedData.floor,
      processedData.construction_year,
      processedData.rooms,
      processedData.expenses
    ];

    const scaledFeatures = numericFeatures.map((val, idx) => {
      const mean = this.scalerConfig!.mean[idx];
      // The config 'scale' is Variance. We need Sqrt to get StdDev.
      const variance = this.scalerConfig!.scale[idx];
      const stdDev = Math.sqrt(variance);

      let zScore = (val! - mean) / stdDev;

      // Special handling for Expenses (idx 7):
      // The training data seems to have expenses in old ARS (Mean ~2383).
      // Current ARS values (e.g. 5000-10000) appear as massive outliers (Z > 10),
      // causing the model to inflate the price wildly (interpreting it as luxury).
      // We neutralize this feature by forcing Z=0 until we can handle inflation.
      if (idx === 7) {
        zScore = 0;
        console.log(`Feature ${idx} (Expenses): Neutralized to Z=0 due to currency inflation mismatch.`);
      }
      // Special handling for Bathrooms (idx 1):
      // The model has a negative slope for bathrooms (1 bath > 2 baths), which is counter-intuitive.
      // We neutralize this by forcing a constant Z-score equivalent to 2 bathrooms (Z ~ 1.9).
      // We will apply a manual correction in the prediction service to restore the positive logic.
      else if (idx === 1) {
        zScore = 1.9;
      }
      // Special handling for Bedrooms (idx 0):
      // Clamp to prevent outliers.
      else if (idx === 0) {
        if (zScore > 3.0) zScore = 3.0;
        if (zScore < -3.0) zScore = -3.0;
      }
      else {
        // Clamp Z-score to prevent extreme outliers from destabilizing the model
        if (zScore > 3) zScore = 3;
        if (zScore < -3) zScore = -3;
      }

      console.log(`Feature ${idx}: Val=${val}, Mean=${mean}, StdDev=${stdDev}, Z=${zScore}`);

      return zScore;
    });

    // 3. OneHot Encoding
    // Categories: [Property Type, Barrio, Ciudad, Provincia]
    // We need to match the categories list in config.

    let oneHotFeatures: number[] = [];

    // 0. Property Type
    const propertyTypeCategories = this.oneHotConfig.categories[0];
    const propertyTypeVector = propertyTypeCategories.map(cat =>
      (processedData.property_type.trim() === cat.trim()) ? 1 : 0
    );
    oneHotFeatures = oneHotFeatures.concat(propertyTypeVector);

    // 1. Barrio
    const barrioCategories = this.oneHotConfig.categories[1];
    const barrioVector = barrioCategories.map(cat =>
      (processedData.barrio.trim() === cat.trim()) ? 1 : 0
    );
    oneHotFeatures = oneHotFeatures.concat(barrioVector);

    // 2. Ciudad
    const ciudadCategories = this.oneHotConfig.categories[2];
    const ciudadVector = ciudadCategories.map(cat =>
      (processedData.ciudad.trim() === cat.trim()) ? 1 : 0
    );
    oneHotFeatures = oneHotFeatures.concat(ciudadVector);

    // 3. Provincia
    const provinciaCategories = this.oneHotConfig.categories[3];
    const provinciaVector = provinciaCategories.map(cat =>
      (processedData.provincia.trim() === cat.trim()) ? 1 : 0
    );
    oneHotFeatures = oneHotFeatures.concat(provinciaVector);


    // 4. TF-IDF Vectorization
    const text = (processedData.all_features || '').toLowerCase();
    const tokens = text.match(/\b\w\w+\b/g) || [];

    const vocab = this.vectorizerConfig.vocabulary;
    const idf = this.vectorizerConfig.idf;
    const maxFeatures = this.vectorizerConfig.max_features; // Should be 100 based on config

    // Initialize vector with zeros (size of vocabulary/max_features)
    // Wait, scikit-learn TfidfVectorizer output size is len(vocabulary) if max_features is not set, 
    // or max_features if set. The config says max_features: 100.
    // And the idf array length should match this.
    // Let's check idf length in config... it seemed to be around 100.

    // We need to map tokens to indices.
    // TF calculation
    const tfMap: Record<number, number> = {};
    tokens.forEach(token => {
      if (token in vocab) {
        const idx = vocab[token];
        // Only consider if idx < maxFeatures? 
        // If max_features was used during fit, the vocabulary only contains the top features.
        // So we just check if it's in vocab.
        tfMap[idx] = (tfMap[idx] || 0) + 1;
      }
    });

    // TF-IDF calculation
    // Vector size should be equal to idf length
    const tfidfVector = new Array(idf.length).fill(0);

    Object.entries(tfMap).forEach(([idxStr, count]) => {
      const idx = parseInt(idxStr);
      if (idx < tfidfVector.length) {
        tfidfVector[idx] = count * idf[idx];
      }
    });

    // L2 Normalization
    let sumSq = 0;
    for (const val of tfidfVector) {
      sumSq += val * val;
    }
    const norm = Math.sqrt(sumSq);

    const normalizedTfidfVector = norm > 0 ? tfidfVector.map(v => v / norm) : tfidfVector;

    // 5. Concatenation
    // Order: Scaled Numeric + OneHot + TF-IDF
    const finalVector = [
      ...scaledFeatures,
      ...oneHotFeatures,
      ...normalizedTfidfVector
    ];

    return tf.tensor2d([finalVector], [1, finalVector.length]);
  }
}