# Zeta Prop: Documentación Técnica & Arquitectura

> **Versión**: 1.0.0
> **Estado**: En Desarrollo / Producción
> **Fecha de Actualización**: Enero 2026

## 1. Visión General del Proyecto

**Zeta Prop** es una plataforma SaaS ("Software as a Service") integral diseñada para la gestión inmobiliaria moderna. Su objetivo es centralizar la operativa diaria de una inmobiliaria (o red de sucursales) y potenciarla mediante Inteligencia Artificial Generativa.

### Objetivos Clave
*   **Centralización**: Unificar CRM, gestión de propiedades, administración de alquileres y finanzas/caja en un solo sistema.
*   **Automatización**: Reducir carga administrativa (generación de contratos, recibos, recordatorios de vencimiento).
*   **Inteligencia**: Asistir en la tasación de propiedades y gestión de leads mediante modelos de IA.
*   **Accesibilidad**: Proveer portales específicos para Agentes, Administradores e Inquilinos.

---

## 2. Pila Tecnológica (Tech Stack)

El proyecto está construido sobre una arquitectura moderna, escalable y serverless.

### Frontend (Cliente)
*   **Core**: [Next.js 16](https://nextjs.org/) (App Router)
*   **Lenguaje**: TypeScript
*   **UI Framework**: React 19
*   **Estilos**: Tailwind CSS v4 + Lucide React (Iconos)
*   **Mapas**: Leaflet / React-Leaflet
*   **Estado Global**: React Context API (`AuthContext`, `BranchContext`)

### Backend & Servicios (Serverless)
*   **Plataforma**: Firebase (Google Cloud Platform)
*   **Base de Datos**: Firestore (NoSQL, Escalabilidad horizontal)
*   **Autenticación**: Firebase Auth (Email/Password, Google OAuth)
*   **Almacenamiento**: Firebase Storage (Imágenes, Documentos)
*   **Funciones**: Vercel Server Actions / Firebase Functions

### Integraciones Externas
*   **Pagos**: MercadoPago SDK
*   **IA**: Google Generative AI (Gemini Flash 1.5)
*   **Documentos**: `docx` (Generación dinámica de contratos)

---

## 3. Arquitectura del Sistema

El proyecto sigue una arquitectura modular basada en **Capas de Servicios**.

### Estructura de Directorios (`src/`)

```text
src/
├── app/                  # Rutas de Next.js (App Router)
│   ├── (auth)/           # Rutas públicas de autenticación (login, register)
│   ├── (main)/           # Panel de Administración (requiere Auth)
│   ├── (tenant)/         # Portal de Inquilinos (acceso limitado)
│   └── api/              # Endpoints API (Webhooks, etc.)
├── domain/               # Entidades y Modelos de Datos (Interfaces TS)
│   ├── models/           # Definiciones: Alquiler, Propiedad, Usuario...
├── infrastructure/       # Implementación técnica y acceso a datos
│   ├── firebase/         # Configuración del cliente Firebase
│   ├── services/         # Lógica de Negocio (Service Layer)
│   │   ├── alquileresService.ts
│   │   ├── propiedadesService.ts
│   │   └── notificationService.ts
├── ui/                   # Componentes Visuales Reutilizables
│   ├── components/       # Átomos y Moléculas (Botones, Inputs, Tablas)
│   ├── forms/            # Formularios complejos
│   ├── layout/           # Sidebar, Header, Wrappers
├── lib/                  # Utilidades generales (formateo fechas, cálculo montos)
```

### Patrones de Diseño Implementados

1.  **Service Layer Pattern**: La lógica de negocio no reside en los componentes de React, sino en servicios dedicados (`infrastructure/services/`). Los componentes solo llaman a estos servicios.
2.  **Repository Pattern (Implícito)**: Los servicios actúan como repositorios que abstraen la lógica de Firestore.
3.  **Context API**: Manejo de estado global para Sesión de Usuario (`AuthContext.tsx`) y Selección de Sucursal (`BranchContext.tsx`).
4.  **Observer Pattern**: Implementado en el sistema de Notificaciones (`notificationService`), donde los eventos (nuevo lead, ticket) disparan alertas a los roles suscritos.

---

## 4. Módulos Principales

### 4.1. Gestión de Propiedades
*   **Funcionalidad**: CRUD completo de inmuebles.
*   **Características**: Carga múltiple de imágenes, geolocalización, asignación a sucursales y agentes.
*   **Modelo de Datos**: Colección `properties`.

### 4.2. Administración de Alquileres
*   **Funcionalidad**: Gestión de contratos locativos.
*   **Características**:
    *   Generación automática de períodos de pago.
    *   Cálculo de ajustes (IPC, ICL) y punitorios por mora.
    *   Generación de contratos en Word (.docx) usando plantillas dinámicas.
*   **Modelo de Datos**: Colección `alquileres`.

### 4.3. Portal de Inquilinos
*   **Ruta**: `/inquilino/[id]`
*   **Seguridad**: Acceso mediante Código Único de Alquiler + DNI (sin usuario/contraseña tradicional).
*   **Funcionalidad**: Visualización de estado de cuenta, historial de pagos y próximos vencimientos.
*   **Prevención**: Validación de sesión con `sessionStorage` para evitar acceso directo por URL.

### 4.4. CRM & Leads
*   **Funcionalidad**: Pipeline de ventas y seguimiento.
*   **Características**: Tablero Kanban para estados de leads (Nuevo, Contactado, Visita, Reservado).
*   **IA**: Clasificación automática de leads entrantes.

---

## 5. Guía para Desarrolladores

### Requisitos Previos
*   **Node.js**: v18.17 o superior.
*   **NPM**: v9 o superior.

### Instalación Local

1.  **Clonar repositorio**:
    ```bash
    git clone <repo-url>
    ```
2.  **Instalar dependencias**:
    ```bash
    npm install
    ```
3.  **Configurar Variables de Entorno**:
    Crear archivo `.env.local` con credenciales de Firebase y APIs.
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    gemini_api_key=...
    ```
4.  **Iniciar Servidor de Desarrollo**:
    ```bash
    npm run dev
    ```

### Despliegue

El proyecto está optimizado para desplegarse en **Vercel**:
1.  Conectar repositorio de GitHub a Vercel.
2.  Configurar las mismas variables de entorno del `.env.local` en el panel de Vercel.
3.  Vercel detectará automáticamente Next.js y configurará el build.

---

## 6. Seguridad

*   **Frontend**: Rutas protegidas mediante HOCs (Higher Order Components) o checks en `layout.tsx` que verifican `UserRole`.
*   **Backend**: Reglas de Seguridad de Firestore (`firestore.rules`) para validar lectura/escritura según el `auth.uid` y el rol del usuario en la colección `users`.
*   **Tenant Portal**: Rate limiting en el login para prevenir fuerza bruta.

---

## 7. Próximos Pasos & Roadmap

*   [ ] Implementar Tests E2E (Playwright/Cypress).
*   [ ] Migrar a PostgreSQL + Prisma para mayor integridad relacional (Planificado).
*   [ ] App Móvil Nativa (React Native) reutilizando la lógica de servicios.
