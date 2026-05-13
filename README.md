# ZetaProp — Plataforma SaaS Inmobiliaria

> **Versión**: 0.1.0 | **Estado**: En producción activa | **Actualizado**: Mayo 2026

ZetaProp es un SaaS inmobiliario integral para inmobiliarias argentinas. Centraliza CRM, gestión de propiedades, administración de alquileres, finanzas y portales públicos personalizados bajo una sola plataforma, potenciada con Inteligencia Artificial.

---

## ¿Qué es ZetaProp?

Una herramienta diseñada para que las inmobiliarias argentinas reemplacen las hojas de cálculo, los WhatsApp y los sistemas desconectados por una plataforma unificada. Cada inmobiliaria tiene su propio espacio de trabajo, su propio portal público y acceso a herramientas de IA para automatizar tareas repetitivas.

**Posicionamiento**: Alternativa moderna y accesible a Tokko Broker, con foco en automatización, IA y portales personalizados.

---

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript |
| Estilos | Tailwind CSS v4 + Lucide React |
| Base de datos | Firebase Firestore (database: `propia`) |
| Autenticación | Firebase Auth (Email/Password + Google OAuth) |
| Almacenamiento | Firebase Storage |
| Pagos | MercadoPago SDK v2.11.0 + React Brick |
| Email | Resend + Postmark |
| IA | Google Gemini Flash 1.5 (`@google/generative-ai`) |
| WhatsApp | Twilio |
| Documentos | `docx` (contratos Word) |
| Mapas | Leaflet / React-Leaflet |
| Validación | Zod v4 + React Hook Form |
| ML | TensorFlow + Python (tasación) |

---

## Arquitectura

El proyecto sigue un **Service Layer Pattern** con separación clara entre UI, lógica de negocio e infraestructura.

```
src/
├── app/                    # Rutas Next.js (App Router)
│   ├── (auth)/             # Login, registro
│   ├── (main)/             # Dashboard (requiere auth)
│   │   └── dashboard/      # Todos los módulos del panel
│   ├── (tenant)/           # Portal de inquilinos
│   ├── (social)/           # Blog público
│   ├── (print)/            # Vista de impresión
│   ├── sites/[slug]/       # Sitios públicos multitenancy
│   └── api/                # 33 endpoints REST
│
├── infrastructure/
│   ├── firebase/           # Cliente y Admin SDK
│   ├── services/           # 36 servicios (lógica de negocio)
│   ├── ai/                 # Chat tools + Gemini
│   ├── adapters/           # WhatsApp, Messaging
│   └── data/               # plans.ts, roles hardcodeados
│
├── domain/
│   ├── models/             # Interfaces TypeScript (User, Property, Alquiler...)
│   ├── entities/           # PropiedadData, TasacionResult
│   └── repositories/       # Interfaces de repositorio
│
├── ui/
│   ├── components/         # 66 componentes React
│   ├── context/            # AuthContext, BranchContext, ThemeContext
│   ├── auth/               # AuthGuard, PermissionGuard
│   ├── emails/             # Templates (Resend)
│   └── hooks/              # Custom hooks (usePlanPermission, etc.)
│
└── lib/
    ├── apiAuth.ts          # verifyAuth, verifyAdmin, verifyCronSecret
    ├── mercadopago.ts      # Config SDK MP
    └── prediction/         # ML preprocessing
```

### Flujo de acceso a rutas protegidas

```
Usuario → middleware.ts (verifica cookie authToken)
        → AuthGuard (verifica sesión Firebase)
        → PermissionGuard (verifica role.permissions)
        → page.tsx
        → usePlanPermission (valida límites del plan, si aplica)
```

---

## Multitenancy — Sitios Públicos

Cada inmobiliaria tiene un portal público en `https://zetaprop.com.ar/sites/[slug]/`.

- **Colección Firestore**: `sites`
- **Middleware**: reescribe `slug.zetaprop.com.ar/*` → `/sites/slug/*`
- **SiteProvider**: expone `basePath` en contexto (vacío en subdominio, `/sites/slug` en path)
- **Personalización**: colores, logo, cover, favicon, WhatsApp, redes sociales, descripción

**Rutas del sitio público:**

| Ruta | Descripción |
|------|-------------|
| `/sites/[slug]/` | Homepage de la inmobiliaria |
| `/sites/[slug]/propiedades` | Listado de propiedades publicadas |
| `/sites/[slug]/propiedades/[id]` | Detalle de propiedad |
| `/sites/[slug]/favoritos` | Propiedades marcadas como favorito |

Las propiedades aparecen en el portal solo si tienen `publishToPortal: true`.

---

## Módulos del Dashboard

### Propiedades
- CRUD completo con carga múltiple de imágenes
- Geolocalización con Leaflet
- Asignación a agentes y sucursales
- Generación de descripciones con Gemini IA
- Publicación en portal propio
- Formulario en wizard (`PropertyWizard.tsx`)

### Alquileres
- Gestión de contratos locativos
- Generación automática de períodos de pago
- Cálculo de ajustes IPC / ICL
- Cálculo de punitorios por mora
- Generación de contratos en Word (.docx)
- Registro de pagos con historial
- Gestión de incidencias (reportes de mantenimiento)
- Liquidación a propietarios e inquilinos
- Cron job automático de vencimientos (`/api/cron/check-rentals`)

### Ventas
- CRUD de operaciones de compraventa
- Seguimiento de estado
- Registro de comisiones

### CRM — Leads
- CRUD de consultas y prospectos
- Tablero Kanban (Nuevo → Contactado → Visita → Reservado → Cerrado)
- Asignación a agentes
- Formulario de contacto público integrado

### Clientes
- Propietarios e inquilinos en perfiles unificados
- Historial de operaciones por cliente
- Contacto directo desde el perfil

### Agentes
- CRUD de agentes por inmobiliaria
- Asignación de propiedades y leads
- Reporte de productividad

### Finanzas
- Reportes de ingresos y egresos
- Rentabilidad por propiedad
- Exportación de datos

### Blog con IA
- CRUD de posts
- Generación automática de contenido con Gemini (scraping + IA)
- Generación de copy para redes sociales
- Blog público en `/blog`

### Marketing por Email
- Templates de email reutilizables
- Envío de campañas a segmentos de clientes
- Bulk email para administradores

### Tasación con IA
- Estimación de precios con enfoque rule-based
- Modelo ML con TensorFlow (script Python ejecutado en servidor)
- Endpoint: `/api/predict`

### Mi Sitio (Editor del portal público)
- Configuración de colores, logo, descripción
- Activar/desactivar publicación
- Vista previa del portal

### Portal del Inquilino
- Acceso sin contraseña: Código de alquiler + DNI
- Dashboard de estado de cuenta
- Historial de pagos (parcialmente conectado a Firestore)

### Chat IA
- Chat autenticado con Gemini
- Tool calling (buscar propiedades, posts, datos del sistema)
- Sesiones persistidas en Firestore

---

## Planes de Suscripción

| Plan | Precio mensual | Usuarios | Propiedades | Clientes | Tasaciones |
|------|---------------|----------|-------------|----------|------------|
| **Basic** | $42.000 ARS | 1 | 25 | 80 | 0 |
| **Professional** | $69.000 ARS | 5 | 150 | Ilimitados | Ilimitadas |
| **Enterprise** | $99.000 ARS | Ilimitados | Ilimitadas | Ilimitados | Ilimitadas |

**Duraciones**: Mensual, Trimestral (25% descuento), Anual.

**Pagos**: Integración completa con MercadoPago (Brick + Webhooks HMAC-SHA256).

**Enforcement**: `TrialEnforcer.tsx` (frontend) + cron job de verificación (`/api/cron/check-subscriptions`).

---

## Colecciones Firestore

| Colección | Propósito |
|-----------|-----------|
| `users` | Perfiles de usuarios (email, role, displayName, subscription) |
| `properties` | Propiedades con campo `userId` y `publishToPortal` |
| `alquileres` | Contratos de alquiler activos |
| `ventas` | Registros de operaciones de venta |
| `leads` | Consultas y prospectos |
| `agents` | Agentes inmobiliarios por inmobiliaria |
| `sites` | Configuración de portales personalizados |
| `subscriptions` | Suscripciones activas y su estado |
| `payments` | Histórico de pagos MercadoPago |
| `inquilinos` | Registro de inquilinos |
| `propietarios` | Registro de propietarios |
| `roles` | Definición de roles y permisos |
| `plans` | Planes de suscripción (3 docs) |
| `audit_logs` | Log inmutable de todas las acciones |
| `notifications` | Notificaciones del sistema por usuario |
| `blog_posts` | Posts del blog con IA |
| `marketing_templates` | Templates de email marketing |
| `chat_sessions` | Sesiones de chat con IA |
| `configuration` | Config global (MP, índices IPC/ICL) |
| `announcements` | Anuncios del admin a usuarios |
| `contacts` | Mensajes de formularios públicos |

---

## Roles y Permisos (RBAC)

| Rol | Acceso |
|-----|--------|
| Super Admin | Total, bypass de trial y account lock |
| Administrador | Gestión de usuarios, roles, configuración |
| Agente Inmobiliario | CRUD propiedades, leads, alquileres |
| Asistente Administrativo | Reportes, documentos, sin creación de propiedades |
| Gerente de Ventas | Leads, ventas, reportes |

Los permisos se verifican contra el campo `permissions[]` del rol en Firestore. La matriz está definida en `src/infrastructure/services/roleService.ts`.

---

## Endpoints API

### Pagos
- `POST /api/payments/create-preference` — Crea preferencia MercadoPago
- `POST /api/webhooks/mercadopago` — Webhook de confirmación de pago (HMAC-SHA256)

### Alquileres
- `GET/POST /api/alquileres` — Listado y creación
- `GET/PATCH /api/alquileres/[id]` — Detalle y actualización
- `POST /api/alquileres/[id]/pago` — Registrar pago
- `POST /api/alquileres/[id]/incidencia` — Abrir incidencia

### IA y Generación
- `POST /api/generate-description` — Descripción de propiedad con Gemini
- `POST /api/blog/generate` — Post de blog con scraping + IA
- `POST /api/social/generate` — Copy para redes sociales
- `POST /api/chat` — Chat con herramientas
- `POST /api/predict` — Tasación con ML (Python)

### Marketing
- `POST /api/marketing/send` — Envío de campañas
- `POST /api/admin/bulk-email` — Email masivo a usuarios

### Leads
- `GET/POST /api/leads` — Listado y creación
- `POST /api/leads/public` — Formulario público de contacto

### Cron (protegido por `x-cron-secret`)
- `GET /api/cron/check-subscriptions` — Verifica suscripciones vencidas
- `GET /api/cron/check-rentals` — Verifica alquileres próximos a vencer

### Otros
- `POST /api/auth/send-verification` — Enviar email de verificación
- `GET /api/config/mercadopago` — Config MP del usuario
- `POST /api/webhooks/twilio` — Webhook WhatsApp (entrada)

---

## Integraciones

| Servicio | Estado | Uso |
|----------|--------|-----|
| MercadoPago | ✅ Completo | Suscripciones y pagos |
| Google Gemini | ✅ Completo | IA generativa (descripciones, blog, chat) |
| Resend | ✅ Completo | Emails transaccionales |
| Postmark | ✅ Completo | Emails adicionales |
| Twilio | ⚠️ Parcial | WhatsApp (solo envío, sin recepción) |
| Firebase Storage | ✅ Completo | Imágenes y documentos |
| Leaflet | ✅ Completo | Mapas y geolocalización |
| ZonaProp / ArgenProp | ❌ Pendiente | Feed XML generado, no API real |
| Mercado Libre Inmuebles | ❌ Pendiente | Sin integración |
| DocuSign / Signaturit | ❌ Pendiente | Firma digital no implementada |

---

## Lo que ZetaProp hace mejor que la competencia

- **Ajustes ICL/IPC automáticos**: más simples de configurar que Tokko Broker
- **Portal del inquilino sin contraseña**: acceso por código + DNI, sin fricción — ningún competidor tiene esto tan bien resuelto
- **Tasación con IA integrada**: Tokko no tiene esto nativamente
- **Blog y copy para redes sociales con IA**: generación automática de contenido desde el dashboard
- **Precio**: significativamente más accesible que Tokko para inmobiliarias medianas y chicas

---

## Roadmap

### Prioridad 1 — Lo que frena el negocio hoy

| Feature | Descripción | Impacto |
|---------|-------------|---------|
| Publicación real en portales | API Navent (ZonaProp/ArgenProp) + ML Inmuebles, en tiempo real | ★★★★★ |
| Matching lead → propiedad | Notificar automáticamente a leads cuando entra una propiedad que hace match | ★★★★★ |
| Portal del propietario | Ver estado de propiedad, liquidaciones, pagos del inquilino | ★★★★☆ |
| Firma digital | DocuSign/Signaturit: link por email → firma desde celular → PDF en Firestore | ★★★★☆ |
| WhatsApp bidireccional | Webhook Meta Cloud API + historial en lead + creación automática de lead por número | ★★★★★ |

### Prioridad 2 — Lo que separa un CRM básico de uno profesional

| Feature | Descripción |
|---------|-------------|
| Sequences de leads | Follow-up automático: WhatsApp a 2hs, email a 24hs, alerta agente a 48hs |
| Alertas de propiedades | Búsquedas guardadas + notificación automática al cliente cuando hay match |
| Calendario mejorado | Vista mensual, drag & drop, recordatorios automáticos, integración Google Calendar |
| Reportes avanzados | Tiempo en mercado, tasa conversión agente, funnel del pipeline, origen de leads |
| Portal del inquilino completo | Cupón de pago real, incidencias con fotos, comprobantes PDF, alertas de vencimiento |

### Prioridad 3 — Diferenciadores a largo plazo

| Feature | Descripción |
|---------|-------------|
| App móvil | React Native reutilizando servicios existentes |
| CMA / Tasación comparativa | Informe PDF con comparables, precio por m², tiempo estimado de venta |
| Gastos por propiedad | Registro de gastos, rentabilidad real neta |
| Integración contable | Exportación CSV/Excel compatible con Tango, Bejerman, AFIP |
| Tours virtuales | Integración Matterport/Kuula + marca de agua automática en fotos |

---

## Instalación local

**Requisitos**: Node.js v18.17+, npm v9+

```bash
# Clonar
git clone <repo-url>
cd PropIA

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.local.example .env.local
# Completar con credenciales de Firebase, MercadoPago, Gemini, Resend, Twilio

# Iniciar desarrollo
npm run dev
```

### Variables de entorno requeridas

```env
# Firebase (públicas)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (servidor)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# MercadoPago
MP_ACCESS_TOKEN=
MP_PUBLIC_KEY=
MP_WEBHOOK_SECRET=

# IA
GOOGLE_API_KEY=

# Email
RESEND_API_KEY=
POSTMARK_API_TOKEN=

# WhatsApp
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=

# Internos
CRON_SECRET=
DB_ENCRYPTION_KEY=
PORTAL_JWT_SECRET=
```

---

## Despliegue

Plataforma target: **Vercel**

1. Conectar repositorio en Vercel
2. Configurar variables de entorno en el panel de Vercel
3. Vercel detecta Next.js y configura el build automáticamente
4. Los cron jobs se configuran como Vercel Cron Functions

**Firestore**: base de datos nombrada `propia` (no la default).

---

## Estructura de archivos clave

| Archivo | Descripción |
|---------|-------------|
| `src/infrastructure/services/roleService.ts` | Roles, permisos, `PERMISSIONS[]`, `initializeDefaultRoles()` |
| `src/infrastructure/data/plans.ts` | Definición de planes y límites |
| `src/ui/components/layout/DashboardSidebar.tsx` | Menú lateral (`MENU_ITEMS[]`) |
| `src/ui/auth/AuthGuard.tsx` | Protección de rutas por autenticación |
| `src/ui/auth/PermissionGuard.tsx` | Protección de rutas por rol |
| `src/ui/hooks/usePlanPermission.ts` | Límites y features por plan |
| `src/app/middleware.ts` | Middleware: multitenancy + auth |
| `firestore.rules` | Reglas de seguridad de Firestore |
| `src/lib/apiAuth.ts` | `verifyAuth`, `verifyAdmin`, `verifyCronSecret` |

---

## Cómo agregar un módulo nuevo

Ver `MODULO.md` para el checklist completo. Resumen:

1. Crear `src/app/(main)/dashboard/[modulo]/page.tsx`
2. Agregar permiso en `roleService.ts → PERMISSIONS[]`
3. Asignar permiso a los roles en `initializeDefaultRoles()`
4. Agregar item en `DashboardSidebar.tsx → MENU_ITEMS[]`
5. Crear servicio en `src/infrastructure/services/`
6. (opcional) Agregar restricción de plan con `usePlanPermission`
7. (opcional) Agregar reglas en `firestore.rules`
8. (opcional) Crear API route en `src/app/api/[modulo]/`
