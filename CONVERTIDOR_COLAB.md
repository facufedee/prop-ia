# Código para Convertir Modelo en Google Colab

Copie y pegue todo este código en una única celda de un nuevo cuaderno de Google Colab ([https://colab.research.google.com/](https://colab.research.google.com/)) y ejecútela.

```python
#@title 1. Sube tus archivos y convierte el modelo
#@markdown Sigue los pasos para obtener tu modelo convertido.

import os
import zipfile
from google.colab import files
import shutil

# --- Funciones de limpieza y configuración ---
def clean_up():
    """Elimina directorios y archivos de ejecuciones anteriores."""
    if os.path.exists('modelo_precios_tfjs'):
        shutil.rmtree('modelo_precios_tfjs')
    if os.path.exists('modelo_web_convertido'):
        shutil.rmtree('modelo_web_convertido')
    if os.path.exists('modelo_precios_tfjs.zip'):
        os.remove('modelo_precios_tfjs.zip')
    if os.path.exists('preprocessor.joblib'):
        os.remove('preprocessor.joblib')
    if os.path.exists('vectorizer.joblib'):
        os.remove('vectorizer.joblib')
    if os.path.exists('modelo_web_convertido.zip'):
        os.remove('modelo_web_convertido.zip')

print("--- Paso 1: Limpiando entorno ---")
clean_up()

# --- Subida de archivos ---
print("\n--- Paso 2: Sube tus archivos ---")
print("Por favor, sube el archivo 'modelo_precios_tfjs.zip'.")
uploaded_model = files.upload()
if 'modelo_precios_tfjs.zip' not in uploaded_model:
    raise Exception("No se subió 'modelo_precios_tfjs.zip'. Abortando.")

print("\nDescomprimiendo modelo...")
with zipfile.ZipFile('modelo_precios_tfjs.zip', 'r') as zip_ref:
    zip_ref.extractall('.')
print("Modelo descomprimido en la carpeta 'modelo_precios_tfjs/'.")

# No necesitamos los preprocesadores para la conversión, pero los subimos para
# mantener el flujo de trabajo si fueran necesarios en el futuro.
# print("\nPor favor, sube el archivo 'preprocessor.joblib'.")
# files.upload()
# print("\nPor favor, sube el archivo 'vectorizer.joblib'.")
# files.upload()


# --- Instalación de dependencias ---
print("\n--- Paso 3: Instalando dependencias ---")
# Se simplifica el comando para permitir que Colab resuelva las dependencias.
!pip install -q tensorflowjs

# --- Conversión del modelo ---
print("\n--- Paso 4: Convirtiendo el modelo a formato web ---")
output_dir = 'modelo_web_convertido'
!tensorflowjs_converter --input_format=tf_saved_model --output_format=tfjs_graph_model modelo_precios_tfjs/ {output_dir}

if not os.path.exists(os.path.join(output_dir, 'model.json')):
    raise Exception("¡La conversión falló! No se encontró 'model.json' en el directorio de salida.")

print("\n¡Conversión exitosa! El archivo 'model.json' fue creado.")

# --- Empaquetado y descarga ---
print("\n--- Paso 5: Empaquetando el modelo convertido para descarga ---")
shutil.make_archive('modelo_web_convertido', 'zip', output_dir)

print("\n--- ¡LISTO! Haz clic en el enlace de abajo para descargar 'modelo_web_convertido.zip' ---")
files.download('modelo_web_convertido.zip')