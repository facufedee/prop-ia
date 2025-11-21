# PROP-IA

Asistente Inmobiliario Inteligente - Una plataforma IA para profesionales inmobiliarios en Argentina con tasación automática de propiedades.

## 🚀 Características

- **🤖 Tasación IA Avanzada**: Modelo de Machine Learning entrenado con datos reales de Properati
- **📍 Ubicaciones Argentinas**: Soporte completo para barrios, ciudades y provincias
- **🔐 Autenticación Firebase**: Sistema seguro de login con Google y email
- **📊 Dashboard Interactivo**: Panel de control con estadísticas y gestión de propiedades
- **🏗️ Arquitectura Clean**: Código organizado con separación de capas (Domain, Use Cases, Infrastructure)
- **🎨 UI Moderna**: Interfaz construida con Next.js 16, React 19, Tailwind CSS y Lucide Icons
- **☁️ Serverless**: API Python desplegada en Vercel para predicciones en tiempo real

## 🛠️ Tecnologías

### Frontend
- **Next.js 16** - Framework React con App Router
- **React 19** - Biblioteca UI
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework CSS utility-first
- **Lucide React** - Iconos modernos

### Backend & IA
- **Python 3.9+** - Lenguaje para modelos IA
- **TensorFlow 2.13+** - Framework de Machine Learning
- **scikit-learn** - Preprocesamiento y pipelines
- **Flask** - Framework web para APIs
- **Vercel Serverless** - Despliegue de funciones Python

### Servicios
- **Firebase Auth** - Autenticación
- **Recharts** - Gráficos interactivos
- **js-cookie** - Gestión de cookies

## 📦 Instalación

### Prerrequisitos
- **Node.js 18+**
- **Python 3.9+** (para desarrollo local del modelo IA)
- **Cuenta Firebase** (para autenticación)

### Instalación

1. **Clona el repositorio:**
```bash
git clone https://github.com/facufedee/prop-ia.git
cd prop-ia
```

2. **Instala dependencias de Node.js:**
```bash
npm install
```

3. **Configura Firebase:**
   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Habilita Authentication con Google y Email/Password
   - Crea un archivo `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

4. **Instala dependencias de Python (opcional, para desarrollo local):**
```bash
pip install -r api/requirements.txt
```

5. **Ejecuta el servidor de desarrollo:**
```bash
npm run dev
```

6. **Abre [http://localhost:3000](http://localhost:3000) en tu navegador**

## 🏗️ Arquitectura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # APIs de Next.js (desarrollo local)
│   │   └── predict/       # Endpoint de predicción IA
│   ├── dashboard/         # Rutas protegidas del dashboard
│   │   ├── tasacion/     # Página de tasación IA
│   ├── login/            # Página de login
│   └── registro/         # Página de registro
├── domain/               # Lógica de negocio (Clean Architecture)
│   ├── entities/        # Interfaces y tipos
│   └── repositories/    # Interfaces de repositorios
├── infrastructure/      # Capa de infraestructura
│   ├── auth/           # Servicios de autenticación
│   ├── firebase/       # Configuración Firebase
│   └── repositories/   # Implementaciones de repositorios
├── ui/                  # Capa de presentación
│   ├── components/     # Componentes reutilizables
│   │   ├── tasacion/   # Componentes de tasación
│   ├── context/        # Contextos React
│   └── sections/       # Secciones de página
└── usecases/           # Casos de uso

api/                      # Vercel Serverless Functions
├── models/              # Modelos IA y preprocesadores
│   ├── preprocessor.joblib
│   ├── vectorizer.joblib
│   ├── medianas.json
│   └── modelo_precios_tfjs/
├── predict.py           # API de predicción Python
└── requirements.txt     # Dependencias Python

public/models/           # Configuraciones del modelo
├── tasacion_propiedades/
│   ├── preprocessor_config.json
│   ├── vectorizer_config.json
│   └── medianas.json
```

## 🔐 Autenticación

El sistema utiliza Firebase Authentication con:
- Login con Google
- Registro e inicio de sesión con email/contraseña
- Middleware de Next.js para protección de rutas
- Gestión de estado con React Context

## 📊 Funcionalidades

### Dashboard
- Estadísticas generales (propiedades, tasaciones, etc.)
- Gráficos de evolución de tasaciones
- Accesos rápidos a funciones principales

### 🤖 Tasación Inteligente IA
- **Modelo Entrenado**: Red neuronal con datos reales de Properati
- **Variables Consideradas**:
  - Metros cuadrados totales y cubiertos
  - Cantidad de ambientes, dormitorios y baños
  - Tipo de propiedad (Departamento, Casa, etc.)
  - Ubicación completa (barrio, ciudad, provincia)
  - Antigüedad del inmueble
  - Características adicionales (pileta, cochera, etc.)
- **Precisión**: Modelo validado con datos reales
- **Tiempo Real**: Predicciones instantáneas via API serverless

### Formulario de Tasación
- **Campos Inteligentes**: Dropdowns con ubicaciones reales de Argentina
- **Validación**: Campos requeridos y formatos correctos
- **Ejemplo Precargado**: Datos de ejemplo para testing rápido
- **Resultados**: Valor estimado en USD con formato profesional

### Gestión de Propiedades
- Listado de propiedades
- Estadísticas y reportes
- Historial de tasaciones

### API de Predicción
- **Endpoint**: `POST /api/predict`
- **Formato**: JSON con datos de propiedad
- **Respuesta**: Valor estimado en USD
- **Serverless**: Desplegado en Vercel para alta disponibilidad

## 🧠 Modelo de Inteligencia Artificial

### Arquitectura del Modelo
- **Tipo**: Red Neuronal Artificial (ANN)
- **Framework**: TensorFlow 2.13+
- **Entrenamiento**: Datos de Properati (Argentina)
- **Variables**: 15+ características de propiedades
- **Métricas**: Validación cruzada con datos reales

### Preprocesamiento
- **Escalado**: StandardScaler para variables numéricas
- **Codificación**: OneHotEncoder para variables categóricas
- **Texto**: TF-IDF para características adicionales
- **Imputación**: Valores medianos para datos faltantes

### Variables Consideradas
- **Numéricas**: Metros cuadrados, ambientes, baños, antigüedad, piso, expensas
- **Categóricas**: Tipo de propiedad, barrio, ciudad, provincia
- **Texto**: Descripción y características adicionales

### Ejemplo de Uso
```python
# Datos de entrada
propiedad = {
    'rooms': 3,
    'bathrooms': 2,
    'surface_total': 150,
    'surface_covered': 120,
    'property_type': 'Departamento',
    'location': 'Palermo, Capital Federal',
    'description': 'pileta, sum, cochera'
}

# Predicción: $414,644.75 USD
```

## 🚀 Despliegue

### Vercel (Recomendado)
Vercel soporta tanto Next.js como funciones serverless de Python.

1. **Conecta tu repositorio:**
   - Importa el proyecto en [Vercel](https://vercel.com)
   - Conecta tu repositorio de GitHub

2. **Configuración automática:**
   - Vercel detectará automáticamente:
     - `package.json` para el frontend
     - `api/requirements.txt` para las funciones Python
     - `api/predict.py` como función serverless

3. **Variables de entorno:**
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   ```

4. **Deploy:**
   ```bash
   git push origin main
   ```
   Vercel desplegará automáticamente.

### Desarrollo Local
```bash
npm run dev  # Frontend
# La API usa predicciones mock en desarrollo
```

### Producción
- **Frontend**: Next.js optimizado
- **API IA**: Python serverless en Vercel
- **Modelo**: TensorFlow cargado en memoria
- **Escalabilidad**: Auto-scaling según demanda

## 📝 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run start` - Servidor de producción
- `npm run lint` - Ejecutar ESLint

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Contacto

Proyecto desarrollado para la comunidad inmobiliaria argentina.
