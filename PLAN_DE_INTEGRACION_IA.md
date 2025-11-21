# Plan de Integración del Modelo de IA en el Frontend

## 1. Objetivo

Integrar el modelo de predicción de precios de propiedades directamente en la aplicación Next.js, ejecutándose 100% en el navegador del cliente. Esto permitirá a los usuarios obtener tasaciones en tiempo real desde la sección `/dashboard/tasacion` sin necesidad de un servidor de backend adicional.

## 2. Arquitectura Seleccionada: Ejecución en el Cliente (Client-Side)

- **Modelo y Lógica:** El modelo de TensorFlow.js y toda la lógica de preprocesamiento de datos se cargarán y ejecutarán en el navegador del usuario.
- **Ventajas:** Despliegue simplificado en Vercel, menor coste de infraestructura y predicciones con baja latencia (tras la carga inicial).
- **Desafío Principal:** Replicar la lógica de preprocesamiento de Python (Scikit-learn) en TypeScript, un desafío técnico que abordaremos en la Fase 2.

## 3. Fases de Implementación

### Fase 1: Preparación de Artefactos del Modelo (Completada)

- **Acción Realizada:** Se ha definido el proceso para extraer los parámetros internos de los preprocesadores de `scikit-learn` (`ColumnTransformer`, `TfidfVectorizer`) y las medianas de imputación a archivos JSON.
- **Artefactos a Utilizar:**
    - `modelo_precios_tfjs/`: El modelo de red neuronal.
    - `medianas.json`: Valores para rellenar datos faltantes.
    - `preprocessor_config.json`: Contiene las medias/desviaciones del `StandardScaler` y las categorías del `OneHotEncoder`.
    - `vectorizer_config.json`: Contiene el vocabulario y los pesos IDF del `TfidfVectorizer`.

### Fase 2: Implementación y Adaptación del Frontend

Esta es la fase principal del trabajo y se divide en los siguientes puntos:

- **2.1. Estructura de Archivos:**
    - Se creará la ruta `public/models/tasacion_propiedades/`.
    - Todos los artefactos de la Fase 1 se moverán a este directorio para que sean accesibles públicamente por el frontend.

- **2.2. Implementación del Preprocesador en TypeScript:**
    - Se creará un nuevo archivo: `src/lib/prediction/preprocessor.ts`.
    - Este archivo contendrá la lógica en TypeScript para:
        1.  Cargar los archivos JSON de configuración.
        2.  Replicar la funcionalidad de `StandardScaler` para normalizar los datos numéricos.
        3.  Replicar la funcionalidad de `OneHotEncoder` para convertir las categorías a formato numérico.
        4.  Replicar la funcionalidad de `TfidfVectorizer` para procesar el texto de las características.
        5.  Combinar todos los datos procesados en un único tensor de entrada para el modelo.

- **2.3. Creación del Servicio de Predicción:**
    - Se creará un nuevo archivo: `src/lib/prediction/predictionService.ts`.
    - Este servicio será el orquestador principal en el lado del cliente. Sus responsabilidades serán:
        1.  Cargar el modelo de TensorFlow.js desde la carpeta `public/`.
        2.  Instanciar y utilizar el preprocesador del punto anterior.
        3.  Exponer una única función `predict(propertyData)` que reciba los datos del formulario, los procese y devuelva la predicción del modelo.

- **2.4. Adaptación del Formulario de Tasación:**
    - Se modificará el componente `src/ui/components/tasacion/TasacionForm.tsx`.
    - **Se agregarán los siguientes campos al formulario** para que coincidan con las entradas que el modelo espera:
        - `Tipo de Propiedad` (select/dropdown)
        - `Barrio` (input de texto)
        - `Ciudad` (input de texto)
        - `Provincia` (input de texto)
        - `Habitaciones` (input numérico)
        - `Baños` (input numérico)
        - `Expensas` (input numérico)
        - `Características adicionales` (área de texto para `all_features`)
    - La lógica del componente se actualizará para que, al hacer clic en "Calcular Tasación", se llame al `predictionService` y se muestre el resultado o los errores correspondientes.

- **2.5. Gestión de Dependencias:**
    - Se instalará la librería de TensorFlow.js en el proyecto mediante el comando `npm install @tensorflow/tfjs`.

### Fase 3: Pruebas y Validación

- Se realizarán pruebas manuales introduciendo datos de ejemplo en el nuevo formulario y comparando el resultado de la predicción en el frontend con el resultado obtenido en el notebook de Python original para asegurar la consistencia.

## 4. Próximos Pasos

Una vez aprobado este plan, procederé inmediatamente con la **Fase 2**, comenzando por la creación del archivo `src/lib/prediction/preprocessor.ts` (Paso 2.2).