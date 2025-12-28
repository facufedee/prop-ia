# Arquitectura del Proyecto

Este proyecto sigue los principios de **Clean Architecture** (Arquitectura Limpia) para garantizar que el código sea mantenible, testeable e independiente de frameworks y herramientas externas tanto como sea posible.

## 🏗️ Visión General

La arquitectura divide el sistema en capas concéntricas, donde las dependencias solo apuntan hacia adentro. Esto significa que la lógica de negocio (el núcleo) no sabe nada sobre la base de datos, la interfaz de usuario o servicios externos.

### Capas del Sistema

#### 1. Domain (Dominio)
*Ruta: `src/domain`*

Es el núcleo de la aplicación. Contiene las reglas de negocio empresariales y es completamente independiente de otras capas.
*   **Entities (`/entities` y `/models`)**: Interfaces y tipos que definen los objetos de negocio (e.g., `Property`, `Client`, `User`).
*   **Repositories (`/repositories`)**: Interfaces (contratos) que definen cómo se debe acceder a los datos, pero no su implementación.

#### 2. Use Cases (Casos de Uso)
*Ruta: `src/usecases`*

Contiene la lógica de negocio específica de la aplicación. Orquesta el flujo de datos hacia y desde las entidades, y dirige a esas entidades para que usen sus reglas de negocio críticas para lograr los objetivos del caso de uso.
*   Ejemplo: `CalcularTasacionUseCase.ts` encapsula la lógica para solicitar una tasación a la IA.

#### 3. Infrastructure (Infraestructura)
*Ruta: `src/infrastructure`*

Contiene implementaciones concretas de las interfaces definidas en el Dominio. Aquí es donde "se ensucian las manos" con tecnologías específicas.
*   **Repositories (`/repositories`)**: Implementaciones reales que conectan con bases de datos (Firestore).
*   **Services (`/services`)**: Servicios externos como autenticación, pagos (MercadoPago), o llamadas a APIs.
*   **AI (`/ai`)**: Integraciones específicas con modelos de IA.

#### 4. UI / App (Presentación)
*Ruta: `src/app` y `src/ui`*

La capa más externa. Es responsable de presentar la información al usuario e interpretar sus comandos.
*   **Next.js App Router**: Maneja el enrutamiento y las páginas.
*   **Components**: Componentes de React para la interfaz visual.
*   **Context**: Gestión de estado global de la UI.

---

## 🔄 Flujo de Datos

El flujo típico de una operación (ej. "Crear una Propiedad") sería:

1.  **UI**: El usuario llena un formulario en `src/app/dashboard/propiedades/page.tsx`.
2.  **Controller/Service Call**: El componente llama a un servicio de infraestructura (o a un caso de uso si la lógica es compleja).
3.  **Infrastructure**: El servicio (`propertiesService.ts`) convierte los datos al formato necesario y llama a Firestore.
4.  **Domain**: Los datos manejados respetan las interfaces definidas en `src/domain`.

## 📂 Estructura de Carpetas

```
src/
├── domain/               # Reglas de negocio puras
│   ├── models/          # Tipos de datos (User, Property, etc.)
│   └── repositories/    # Interfaces de acceso a datos
├── usecases/             # Lógica de aplicación
├── infrastructure/       # Implementaciones concretas
│   ├── services/        # Lógica de conexión (Firebase, APIs)
│   └── repositories/    # Implementación de repositorios
├── ui/                   # Componentes React y estilos
└── app/                  # Rutas y páginas (Next.js)
```

## 🧩 Principios Clave Aplicados

*   **Dependency Rule**: El código fuente de las dependencias solo puede apuntar hacia adentro. Nada en un círculo interno puede saber nada de algo en un círculo externo.
*   **Separation of Concerns**: La UI está desacoplada de la lógica de negocio, y la lógica de negocio de la base de datos.
*   **Abstractions**: Usamos interfaces (en TypeScript) en la capa de Dominio para definir contratos que la Infraestructura debe cumplir.
