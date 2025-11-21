import json
import joblib
import numpy as np

print("Iniciando la exportación de la configuración de los preprocesadores...")

try:
    # --- Cargar los preprocesadores y medianas existentes ---
    print("Cargando archivos .joblib y medianas.json...")
    preprocessor = joblib.load('preprocessor.joblib')
    vectorizer = joblib.load('vectorizer.joblib')
    with open('medianas.json', 'r') as f:
        medianas = json.load(f)
    print("Archivos cargados exitosamente.")

    # --- 1. Extraer datos del ColumnTransformer ('preprocessor') ---
    print("Extrayendo configuración del ColumnTransformer...")
    
    # Obtener los transformadores por su nombre
    numeric_transformer = preprocessor.named_transformers_['num']
    categorical_transformer = preprocessor.named_transformers_['cat']
    
    # Obtener los nombres de las características en el orden correcto
    numeric_features = [col for col in preprocessor.feature_names_in_ if col in numeric_transformer.feature_names_in_]
    categorical_features = [col for col in preprocessor.feature_names_in_ if col in categorical_transformer.feature_names_in_]

    # Parámetros del StandardScaler
    scaler_params = {
        'mean': numeric_transformer.mean_.tolist(),
        'scale': numeric_transformer.scale_.tolist(),
        'feature_names': numeric_features
    }

    # Parámetros del OneHotEncoder
    ohe_params = {
        'categories': [cats.tolist() for cats in categorical_transformer.categories_],
        'feature_names': categorical_features
    }

    preprocessor_config = {
        'scaler': scaler_params,
        'onehot': ohe_params
    }

    # Guardar la configuración del preprocesador en un archivo JSON
    with open('preprocessor_config.json', 'w') as f:
        json.dump(preprocessor_config, f, indent=4)

    print("-> 'preprocessor_config.json' creado exitosamente.")

    # --- 2. Extraer datos del TfidfVectorizer ('vectorizer') ---
    print("Extrayendo configuración del TfidfVectorizer...")
    
    # Convertir tipos de NumPy a tipos nativos de Python para la serialización JSON
    native_vocabulary = {k: int(v) for k, v in vectorizer.vocabulary_.items()}

    vectorizer_params = {
        'vocabulary': native_vocabulary,
        'idf': vectorizer.idf_.tolist(),
        'max_features': int(vectorizer.max_features),
        'feature_names': vectorizer.get_feature_names_out().tolist()
    }

    # Guardar la configuración del vectorizador en un archivo JSON
    with open('vectorizer_config.json', 'w') as f:
        json.dump(vectorizer_params, f, indent=4)

    print("-> 'vectorizer_config.json' creado exitosamente.")
    
    print("\n¡Exportación completada! Ahora puedes mover los archivos generados a la carpeta 'public' de tu proyecto Next.js.")

except FileNotFoundError as e:
    print(f"\n[ERROR] No se pudo encontrar el archivo: {e.filename}. Asegúrate de que 'preprocessor.joblib', 'vectorizer.joblib' y 'medianas.json' estén en el mismo directorio que este script.")
except Exception as e:
    print(f"\n[ERROR] Ocurrió un error inesperado: {e}")
