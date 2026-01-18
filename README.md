# Zeta Prop: Asistente Inmobiliario Inteligente

**Zeta Prop* es una plataforma integral diseñada para potenciar la gestión inmobiliaria moderna. Combina herramientas de gestión clásicas (CRM, propiedades, alquileres) con el poder de la Inteligencia Artificial Generativa para automatizar tareas, tasar propiedades y asistir a los agentes en tiempo real.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC) ![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-orange) ![AI](https://img.shields.io/badge/AI-Generative-purple)

## 🚀 Características Principales

### 🧠 Inteligencia Artificial
*   **Tasación Automática (AVM)**: Estimación de precios de mercado en tiempo real utilizando modelos de Machine Learning entrenados con datos locales.
*   **Generador de Descripciones**: Creación automática de descripciones atractivas para publicaciones inmobiliarias.
*   **Chat Inteligente**: Asistente virtual capaz de responder consultas sobre inventario y procesos internos.

### 🏢 Gestión Inmobiliaria
*   **Gestión de Propiedades**: ABM completo de inmuebles (Venta/Alquiler) con carga de imágenes y documentos.
*   **CRM de Clientes**: Seguimiento de propietarios, inquilinos e interesados (Leads).
*   **Administración de Alquileres**: Control de contratos, vencimientos, ajustes y generación de recibos.
*   **Panel de Agentes**: Herramientas para coordinar equipos de ventas.

### 🛠️ Herramientas Operativas
*   **Dashboard Financiero**: Visualización de ingresos, egresos y métricas clave.
*   **Calendario**: Agenda integrada para visitas y recordatorios.
*   **Soporte**: Sistema de tickets para resolución de incidencias.


## 🛠️ Stack Tecnológico

### Frontend
*   **Framework**: Next.js 16 (App Router)
*   **UI Library**: React 19
*   **Estilos**: Tailwind CSS v4
*   **Iconos**: Lucide React
*   **Mapas**: Leaflet / Google Maps API

### Backend & Servicios
*   **Base de Datos**: Firebase Firestore (NoSQL)
*   **Autenticación**: Firebase Auth (Google & Email)
*   **Serverless**: Funciones Python (Vercel) para inferencia de modelos IA.
*   **Pagos**: Integración con MercadoPago.

### Inteligencia Artificial
*   **Modelos**: TensorFlow (Python/JS) y Google Generative AI (Gemini).
*   **Vector Search**: Implementación para búsqueda semántica.

## 📦 Instalación y Configuración

### Prerrequisitos
*   Node.js 18+
*   Python 3.9+ (opcional, para desarrollo de modelos)
*   Cuenta de Firebase activa

### Pasos

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/facufedee/prop-ia.git
    cd prop-ia
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno:**
    Crea un archivo `.env.local` en la raíz basado en `env.template` (si existe) o con las siguientes variables:

    ```env
    # Firebase
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=...

    # APIs Externas
    NEXT_PUBLIC_GOOGLE_MAPS_KEY=...
    gemini_api_key=...
    ```

4.  **Ejecutar en desarrollo:**
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:3000`.

## 🤝 Contribución

1.  Haz un Fork del proyecto.
2.  Crea una rama para tu feature (`git checkout -b feature/NuevaFeature`).
3.  Commit de tus cambios (`git commit -m 'Agrega nueva feature'`).
4.  Push a la rama (`git push origin feature/NuevaFeature`).
5.  Abre un Pull Request.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
