# Integración del Modelo de Predicción de Precios de Propiedades en Next.js

## Resumen

Este documento proporciona una guía completa para integrar el modelo de predicción de precios de propiedades entrenado en TensorFlow/Keras en una aplicación Next.js. El modelo predice precios de propiedades basado en características como habitaciones, baños, área total, área cubierta, piso, año de construcción, habitaciones, gastos, tipo de propiedad, barrio, ciudad, provincia y características de texto.

## Requisitos Previos

### Dependencias de Node.js

Instala las siguientes dependencias en tu proyecto Next.js:

```bash
npm install @tensorflow/tfjs @tensorflow/tfjs-node @tensorflow/tfjs-backend-webgl @tensorflow/tfjs-backend-cpu scikit-learn scipy pandas numpy
```

### Dependencias de Python (para conversión del modelo)

Asegúrate de tener instaladas las siguientes librerías de Python:

```bash
pip install tensorflow tensorflowjs scikit-learn scipy pandas numpy nbformat
```

## Paso 1: Conversión del Modelo a TensorFlow.js

### Guardar el Modelo en Formato TensorFlow.js

Ejecuta el notebook `modelo_precios.ipynb` completamente. Al final, el modelo se guardará automáticamente en la carpeta `modelo_precios_tfjs`.

Si necesitas hacerlo manualmente:

```python
import tensorflow as tf

# Cargar el modelo entrenado (si no está en memoria)
# model = tf.keras.models.load_model('modelo_precios.h5')  # Si guardaste en HDF5

# Guardar en formato TensorFlow.js
model.save('modelo_precios_tfjs', save_format='tf')
```

### Convertir a Formato TensorFlow.js (método alternativo)

Si prefieres usar la herramienta de línea de comandos:

```bash
tensorflowjs_converter --input_format=tf_saved_model --output_format=tfjs_graph_model modelo_precios_tfjs/ modelo_precios_tfjs_web/
```

## Paso 2: Preparación de los Preprocesadores

### Guardar los Preprocesadores

Necesitas guardar los objetos `preprocessor` (ColumnTransformer) y `vectorizer` (TfidfVectorizer) para usarlos en la predicción.

Agrega esto al final del notebook:

```python
import joblib

# Guardar el preprocesador
joblib.dump(preprocessor, 'preprocessor.joblib')

# Guardar el vectorizador
joblib.dump(vectorizer, 'vectorizer.joblib')

# Guardar las medianas calculadas
medianas = {
    'median_floor': median_floor,
    'median_construction_year': median_construction_year,
    'median_expenses': median_expenses,
    'median_rooms': median_rooms,
    'median_bedrooms': median_bedrooms,
    'median_bathrooms': median_bathrooms,
    'median_area_total': median_area_total,
    'median_area_covered': median_area_covered
}

import json
with open('medianas.json', 'w') as f:
    json.dump(medianas, f)
```

### Copiar Archivos a tu Proyecto Next.js

Copia los siguientes archivos a la carpeta `public/models/` de tu proyecto Next.js:

- `modelo_precios_tfjs/` (carpeta completa)
- `preprocessor.joblib`
- `vectorizer.joblib`
- `medianas.json`

## Paso 3: Implementación en Next.js

### Crear el Servicio de Predicción

Crea un archivo `lib/predictionService.js`:

```javascript
import * as tf from '@tensorflow/tfjs';
import { loadLayersModel } from '@tensorflow/tfjs';
import * as sklearn from 'scikit-learn';
import * as joblib from 'joblib'; // Necesitarás una librería para cargar joblib en JS

// Nota: scikit-learn y joblib no están disponibles nativamente en JavaScript
// Necesitarás implementar equivalentes o usar una API REST

class PredictionService {
  constructor() {
    this.model = null;
    this.preprocessor = null;
    this.vectorizer = null;
    this.medianas = null;
  }

  async loadModel() {
    try {
      this.model = await loadLayersModel('/models/modelo_precios_tfjs/model.json');
      console.log('Modelo cargado exitosamente');
    } catch (error) {
      console.error('Error cargando el modelo:', error);
    }
  }

  async loadPreprocessors() {
    // Nota: Cargar joblib en JavaScript es complejo
    // Considera implementar los preprocesadores en JavaScript puro
    // o crear una API REST en Python
  }

  async predict(propertyData) {
    if (!this.model) {
      await this.loadModel();
    }

    // Preprocesar los datos (implementa la lógica equivalente)
    const processedData = this.preprocessData(propertyData);

    // Realizar la predicción
    const prediction = this.model.predict(processedData);
    const predictionValue = prediction.dataSync()[0];

    // Revertir la transformación logarítmica y multiplicar por 1000
    const finalPrice = Math.exp(predictionValue) * 1000;

    return finalPrice;
  }

  preprocessData(propertyData) {
    // Implementa aquí la lógica de preprocesamiento equivalente a Python
    // Esto incluye:
    // - Conversión de tipos numéricos
    // - Relleno de NaNs con medianas
    // - Codificación one-hot para categóricas
    // - Vectorización TF-IDF para texto
    // - Escalado estándar

    // Esta es una implementación simplificada - necesitarás adaptarla
    // completamente a tu caso de uso
  }
}

export default new PredictionService();
```

### Implementación Completa de Preprocesamiento en JavaScript

Dado que scikit-learn no está disponible en JavaScript, necesitas implementar los preprocesadores manualmente:

```javascript
// lib/preprocessors.js

export class StandardScaler {
  constructor() {
    this.mean = null;
    this.scale = null;
  }

  fit(data) {
    // Implementa el cálculo de media y desviación estándar
  }

  transform(data) {
    // Implementa la transformación
  }
}

export class OneHotEncoder {
  constructor() {
    this.categories = null;
  }

  fit(data) {
    // Implementa el aprendizaje de categorías
  }

  transform(data) {
    // Implementa la codificación one-hot
  }
}

export class TfidfVectorizer {
  constructor(maxFeatures = 100) {
    this.maxFeatures = maxFeatures;
    this.vocabulary = null;
    this.idf = null;
  }

  fit(texts) {
    // Implementa el aprendizaje del vocabulario y cálculo de IDF
  }

  transform(texts) {
    // Implementa la vectorización TF-IDF
  }
}
```

### Crear una API Route (Recomendado)

La forma más práctica es crear una API REST en Python y llamarla desde Next.js.

Crea un servidor Flask o FastAPI:

```python
# api_server.py
from flask import Flask, request, jsonify
import tensorflow as tf
import joblib
import numpy as np
from scipy.sparse import hstack

app = Flask(__name__)

# Cargar modelo y preprocesadores
model = tf.keras.models.load_model('modelo_precios_tfjs')
preprocessor = joblib.load('preprocessor.joblib')
vectorizer = joblib.load('vectorizer.joblib')

with open('medianas.json', 'r') as f:
    medianas = json.load(f)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    
    # Preprocesar (implementa la lógica completa)
    # ... (código de preprocesamiento del notebook)
    
    prediction_log = model.predict(input_final.toarray()).flatten()
    prediction = np.expm1(prediction_log) * 1000
    
    return jsonify({'price': float(prediction[0])})

if __name__ == '__main__':
    app.run(debug=True)
```

### Usar la API en Next.js

```javascript
// pages/api/predict.js
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });
      
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Error en la predicción' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
```

### Componente de React para la Predicción

```jsx
// components/PropertyPredictor.js
import { useState } from 'react';

export default function PropertyPredictor() {
  const [formData, setFormData] = useState({
    bedrooms: '',
    bathrooms: '',
    area_total: '',
    area_covered: '',
    floor: '',
    construction_year: '',
    rooms: '',
    expenses: '',
    property_type: '',
    barrio: '',
    ciudad: '',
    provincia: '',
    all_features: ''
  });
  
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      setPrediction(data.price);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div>
      <h2>Predicción de Precio de Propiedad</h2>
      <form onSubmit={handleSubmit}>
        {/* Campos del formulario */}
        <div>
          <label>Habitaciones:</label>
          <input
            type="number"
            name="bedrooms"
            value={formData.bedrooms}
            onChange={handleChange}
            required
          />
        </div>
        
        {/* Agrega todos los demás campos */}
        
        <button type="submit" disabled={loading}>
          {loading ? 'Prediciendo...' : 'Predecir Precio'}
        </button>
      </form>
      
      {prediction && (
        <div>
          <h3>Precio Estimado: ${prediction.toLocaleString()}</h3>
        </div>
      )}
    </div>
  );
}
```

## Paso 4: Despliegue

### Configuración de Next.js para TensorFlow.js

En `next.config.js`:

```javascript
module.exports = {
  experimental: {
    esmExternals: 'loose'
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
};
```

### Variables de Entorno

Si usas una API externa, configura las variables de entorno:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Despliegue del Servidor Python

Para producción, despliega el servidor Flask/FastAPI en un servicio como Heroku, Railway, o Vercel (con serverless functions).

### Optimizaciones de Rendimiento

1. **Carga Lazy del Modelo**: Carga el modelo solo cuando sea necesario.
2. **Cache**: Implementa cache para predicciones frecuentes.
3. **Validación**: Valida los datos de entrada en el frontend y backend.
4. **Error Handling**: Implementa manejo robusto de errores.

## Paso 5: Pruebas

### Pruebas Unitarias

```javascript
// __tests__/predictionService.test.js
import predictionService from '../lib/predictionService';

describe('PredictionService', () => {
  it('should load model successfully', async () => {
    await predictionService.loadModel();
    expect(predictionService.model).toBeDefined();
  });
  
  it('should make prediction', async () => {
    const testData = {
      bedrooms: 3,
      bathrooms: 2,
      area_total: 150,
      // ... otros campos
    };
    
    const price = await predictionService.predict(testData);
    expect(typeof price).toBe('number');
    expect(price).toBeGreaterThan(0);
  });
});
```

## Consideraciones Importantes

### Limitaciones de TensorFlow.js en el Browser

- El modelo debe ser lo suficientemente pequeño para cargar en el navegador.
- Considera usar WebGL backend para mejor rendimiento.
- Para modelos grandes, usa la API REST approach.

### Seguridad

- Valida todos los inputs del usuario.
- Implementa rate limiting en la API.
- No expongas información sensible del modelo.

### Mantenimiento

- Reentrena el modelo periódicamente con nuevos datos.
- Monitorea el rendimiento de las predicciones.
- Actualiza los preprocesadores si cambian las características.

### Alternativas

Si TensorFlow.js resulta demasiado complejo, considera:
- Usar una API completamente en Python desplegada en la nube.
- Convertir el modelo a ONNX y usar onnxruntime-web.
- Usar servicios de ML como Google AI Platform o AWS SageMaker.

## Resolución de Problemas Comunes

### Error de Carga del Modelo
- Verifica que los archivos del modelo estén en `public/models/`.
- Asegúrate de que el servidor sirva correctamente los archivos estáticos.

### Errores de Preprocesamiento
- Implementa validación estricta de inputs.
- Asegúrate de que las categorías de one-hot encoding coincidan.

### Problemas de Rendimiento
- Optimiza el tamaño del modelo.
- Usa Web Workers para predicciones pesadas.
- Implementa cache de predicciones.

Esta documentación cubre todos los aspectos necesarios para integrar exitosamente el modelo de predicción de precios de propiedades en una aplicación Next.js. Si encuentras problemas específicos, revisa los logs de consola y la documentación oficial de TensorFlow.js.