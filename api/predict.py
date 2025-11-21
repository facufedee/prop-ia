import json
import joblib
import tensorflow as tf
import pandas as pd
import numpy as np

def load_models():
    preprocessor = joblib.load('api/models/preprocessor.joblib')
    vectorizer = joblib.load('api/models/vectorizer.joblib')
    with open('api/models/medianas.json', 'r') as f:
        medianas = json.load(f)
    model = tf.keras.models.load_model('api/models/modelo_precios_tfjs')
    return preprocessor, vectorizer, medianas, model

def handler(event, context):
    try:
        # Load models
        preprocessor, vectorizer, medianas, model = load_models()

        # Parse input
        body = json.loads(event['body'])

        # Extract features
        data = {
            'rooms': body.get('rooms'),
            'bathrooms': body.get('bathrooms'),
            'bedrooms': body.get('bedrooms'),
            'surface_total': body.get('surface_total'),
            'surface_covered': body.get('surface_covered'),
            'floor': body.get('floor'),
            'lat': body.get('lat'),
            'lon': body.get('lon'),
            'property_type': body.get('property_type'),
            'location': body.get('location'),
            'description': body.get('description', '')
        }

        # Fill missing with medians
        for key, value in data.items():
            if value is None and key in medianas:
                data[key] = medianas[key]

        # Create DataFrame
        df = pd.DataFrame([data])

        # Separate features
        numerical = df[['rooms', 'bathrooms', 'bedrooms', 'surface_total', 'surface_covered', 'floor', 'lat', 'lon']]
        categorical = df[['property_type', 'location']]
        text = df['description']

        # Transform numerical and categorical
        num_cat_df = pd.concat([numerical, categorical], axis=1)
        num_cat_transformed = preprocessor.transform(num_cat_df)

        # Transform text
        text_transformed = vectorizer.transform(text)

        # Concatenate
        features = np.hstack([num_cat_transformed.toarray(), text_transformed.toarray()])

        # Predict
        prediction = model.predict(features)[0][0]

        # Return
        return {
            'statusCode': 200,
            'body': json.dumps({'prediction': float(prediction)})
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }