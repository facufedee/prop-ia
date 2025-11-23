import json
import joblib
import tensorflow as tf
import pandas as pd
import numpy as np

def load_models():
    preprocessor = joblib.load('models/preprocessor.joblib')
    vectorizer = joblib.load('models/vectorizer.joblib')
    with open('models/medianas.json', 'r') as f:
        medianas = json.load(f)
    
    # Keras 3 no soporta el formato SavedModel directamente. Usamos TFSMLayer.
    # TFSMLayer es una capa, no un modelo, así que la envolvemos en un modelo secuencial.
    tf_sm_layer = tf.keras.layers.TFSMLayer('models/modelo_precios_tfjs', call_endpoint='serving_default')
    
    # La capa TFSMLayer es suficiente para hacer predicciones.
    # No es necesario envolverla en un tf.keras.Model.
    # La predicción devolverá un diccionario, que manejaremos más adelante.
    model = tf_sm_layer
    
    return preprocessor, vectorizer, medianas, model

def handler(event, context):
    try:
        # Load models
        preprocessor, vectorizer, medianas, model = load_models()

        # Parse input
        body = json.loads(event['body'])

        # Extract features and map to the names the model preprocessor expects
        data = {
            'rooms': body.get('rooms'),
            'bathrooms': body.get('bathrooms'),
            'bedrooms': body.get('bedrooms'),
            'area_total': body.get('surface_total'),      # Renamed from surface_total
            'area_covered': body.get('surface_covered'),    # Renamed from surface_covered
            'floor': body.get('floor'),
            'lat': body.get('lat'),
            'lon': body.get('lon'),
            'property_type': body.get('property_type'),
            'barrio': body.get('location'),             # Renamed from location
            'ciudad': body.get('ciudad'),               # Added ciudad
            'provincia': body.get('provincia'),           # Added provincia
            'description': body.get('description', ''),
            'expenses': body.get('expenses'),
            'construction_year': body.get('construction_year')
        }

        # Fill missing with medians
        for key, value in data.items():
            if value is None and key in medianas:
                data[key] = medianas[key]

        # Define las columnas que el preprocesador espera
        expected_columns = [
            'rooms', 'bathrooms', 'bedrooms', 'area_total', 'area_covered', 'floor',
            'lat', 'lon', 'property_type', 'barrio', 'ciudad', 'provincia',
            'description', 'expenses', 'construction_year'
        ]
        
        # Crea un DataFrame con las columnas esperadas y los datos recibidos
        df = pd.DataFrame([data], columns=expected_columns)

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
        prediction_output = model(tf.constant(features, dtype=tf.float32))
        
        # La salida es un diccionario. Extraemos la predicción.
        # La clave de salida puede variar, pero a menudo es 'output_0' o 'dense_XYZ'.
        output_key = list(prediction_output.keys())[0]
        prediction = prediction_output[output_key].numpy()[0][0]

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