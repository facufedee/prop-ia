# Guía: Cómo crear un nuevo módulo en ZetaProp

Checklist completo para agregar un módulo nuevo al dashboard, con acceso controlado por roles, planes y sidebar.

---

## Ejemplo de referencia

Vamos a usar `Ejemplo` como nombre del módulo y `/dashboard/ejemplo` como ruta.

---

## Paso 1 — Crear la carpeta y página

```
src/app/(main)/dashboard/ejemplo/
├── page.tsx          ← página principal (obligatorio)
├── loading.tsx       ← skeleton de carga (recomendado)
└── [id]/
    └── page.tsx      ← detalle/edición (si aplica)
```

**Estructura base de `page.tsx`:**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/ui/context/AuthContext";
import { useBranchContext } from "@/infrastructure/context/BranchContext";

export default function EjemploPage() {
    const { user } = useAuth();
    const { selectedBranchId } = useBranchContext();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchData();
    }, [user, selectedBranchId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // llamar a service o Firestore
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Ejemplo</h1>
            {/* contenido */}
        </div>
    );
}
```

---

## Paso 2 — Agregar el permiso en `roleService.ts`

**Archivo:** `src/infrastructure/services/roleService.ts`

Agregar al array `PERMISSIONS`:

```ts
{ id: "/dashboard/ejemplo", label: "Ejemplo", description: "Acceso al módulo Ejemplo" },
```

---

## Paso 3 — Asignar el permiso a los roles que corresponda

En la misma función `initializeDefaultRoles()` dentro de `roleService.ts`, agregar `/dashboard/ejemplo` al array `permissions` de cada rol que deba tener acceso:

| Rol | ¿Dar acceso? |
|-----|-------------|
| Super Admin | Automático (tiene todos) |
| Cliente Enterprise | Según corresponda |
| Cliente Pro | Según corresponda |
| Cliente Básico | Según corresponda |
| Agente | Según corresponda |

```ts
// Ejemplo: agregar al rol "Cliente Pro"
{
    name: "Cliente Pro",
    permissions: [
        "/dashboard",
        "/dashboard/propiedades",
        // ... los que ya tiene ...
        "/dashboard/ejemplo",   // ← agregar acá
    ]
}
```

> **Importante:** `initializeDefaultRoles()` solo crea los roles si no existen. Si ya están creados en Firestore, hay que actualizar el rol manualmente desde `/dashboard/configuracion/roles` en la UI.

---

## Paso 4 — Agregar al Sidebar

**Archivo:** `src/ui/components/layout/DashboardSidebar.tsx`

Agregar un item al array `MENU_ITEMS`:

```ts
import { LayoutGrid } from "lucide-react"; // elegir ícono de lucide-react

// En MENU_ITEMS:
{
    href: "/dashboard/ejemplo",
    label: "Ejemplo",
    icon: LayoutGrid,
    permission: "/dashboard/ejemplo",  // debe coincidir exactamente con el id del permiso
    // adminOnly: true,                // descomentar si solo lo ve el super admin
    // description: "Descripción...",  // tooltip opcional
},
```

**Dónde insertarlo según el tipo de módulo:**

- Módulos principales (propiedades, alquileres, leads) → arriba, antes del primer divider
- Herramientas Pro (tasación, chat IA, marketing) → sección "Pro Tools"
- Configuración / Admin → sección final

---

## Paso 5 — Crear el servicio (si tiene lógica de negocio)

**Archivo:** `src/infrastructure/services/ejemploService.ts`

```ts
import { db } from "@/infrastructure/firebase/client";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from "firebase/firestore";

const COLLECTION = "ejemplos";

export const ejemploService = {
    getAll: async (userId: string) => {
        const q = query(collection(db, COLLECTION), where("userId", "==", userId), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    create: async (data: any) => {
        return await addDoc(collection(db, COLLECTION), {
            ...data,
            createdAt: new Date(),
        });
    },

    update: async (id: string, data: any) => {
        await updateDoc(doc(db, COLLECTION, id), data);
    },

    delete: async (id: string) => {
        await deleteDoc(doc(db, COLLECTION, id));
    },
};
```

---

## Paso 6 — (Opcional) Proteger según plan con `usePlanPermission`

Si el módulo debe estar restringido por plan de suscripción (además del rol):

```tsx
import { usePlanPermission } from "@/ui/hooks/usePlanPermission";

export default function EjemploPage() {
    const { canAccess, getLimit } = usePlanPermission();

    if (!canAccess("Nombre del Feature en plans.ts")) {
        return <div>Tu plan no incluye esta función.</div>;
    }

    const limite = getLimit("properties"); // o 'users' | 'clients'
    // ...
}
```

Los features disponibles están definidos en `src/infrastructure/data/plans.ts` en el campo `features` de cada plan.

---

## Paso 7 — (Opcional) Agregar reglas en Firestore

**Archivo:** `firestore.rules`

```
match /ejemplos/{docId} {
    allow read, write: if isAuthenticated() && isOwner(resource.data.userId);
}
```

---

## Paso 8 — (Opcional) Agregar API route si se necesita lógica servidor

```
src/app/api/ejemplo/
└── route.ts
```

```ts
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // lógica servidor (Firebase Admin, etc.)
        return NextResponse.json({ data: [] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
```

---

## Checklist resumen

```
[ ] 1. Carpeta y page.tsx creados en src/app/(main)/dashboard/ejemplo/
[ ] 2. Permiso agregado en PERMISSIONS (roleService.ts)
[ ] 3. Permiso asignado a los roles correspondientes (roleService.ts)
[ ] 4. Rol actualizado en Firestore si ya existía (desde /configuracion/roles)
[ ] 5. Item agregado en MENU_ITEMS (DashboardSidebar.tsx)
[ ] 6. Servicio creado en src/infrastructure/services/ (si aplica)
[ ] 7. Restricción de plan con usePlanPermission (si aplica)
[ ] 8. Reglas en firestore.rules (si tiene colección propia)
[ ] 9. API route creada (si necesita lógica servidor)
```

---

## Flujo de acceso (cómo funciona internamente)

```
Usuario navega a /dashboard/ejemplo
        ↓
middleware.ts → verifica cookie authToken → si no existe: /login
        ↓
AuthGuard → verifica sesión Firebase → si no: /access-denied
        ↓
PermissionGuard → busca "/dashboard/ejemplo" en role.permissions del usuario
        ↓ (si no tiene permiso → /access-denied)
DashboardSidebar → muestra el item solo si hasPermission("/dashboard/ejemplo")
        ↓
page.tsx renderiza
        ↓
usePlanPermission (opcional) → valida features/límites del plan de suscripción
```

---

## Dónde vive cada cosa

| Qué | Archivo |
|-----|---------|
| Lista de permisos | `src/infrastructure/services/roleService.ts` → `PERMISSIONS` |
| Roles y sus permisos | `src/infrastructure/services/roleService.ts` → `initializeDefaultRoles()` |
| Items del sidebar | `src/ui/components/layout/DashboardSidebar.tsx` → `MENU_ITEMS` |
| Planes y features | `src/infrastructure/data/plans.ts` |
| Guard de autenticación | `src/ui/auth/AuthGuard.tsx` |
| Guard de permisos | `src/ui/auth/PermissionGuard.tsx` |
| Hook de plan | `src/ui/hooks/usePlanPermission.ts` |
| Layout del dashboard | `src/app/(main)/dashboard/layout.tsx` |
| Middleware de rutas | `src/app/middleware.ts` |
