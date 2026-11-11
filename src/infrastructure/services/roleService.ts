import { db, auth } from "@/infrastructure/firebase/client";
import { auditLogService } from "@/infrastructure/services/auditLogService";
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { planAdminOnlyPermissionStrips } from "@/lib/roles/adminOnlyPermissions";

export interface Permission {
    id: string;
    label: string;
    description: string;
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    permissions: string[]; // List of permission IDs (which correspond to menu hrefs or specific actions)
    logoUrl?: string; // Extended for UI checking
    isSystem?: boolean; // System roles cannot be deleted
}

export const DEFAULT_PERMISSIONS: Permission[] = [
    { id: "/dashboard", label: "Dashboard", description: "Acceso al panel principal" },
    { id: "/dashboard/tasacion", label: "Tasación Inteligente", description: "Acceso a herramientas de tasación" },
    { id: "/dashboard/propiedades", label: "Propiedades", description: "Gestión de propiedades" },
    { id: "/dashboard/alquileres", label: "Alquileres", description: "Gestión de contratos de alquiler" },
    { id: "/dashboard/agenda-cobros", label: "Agenda de Cobros", description: "Cobros pendientes de todos los contratos" },
    { id: "/dashboard/liquidaciones", label: "Liquidaciones", description: "Pagos pendientes a propietarios" },
    { id: "/dashboard/ventas", label: "Ventas", description: "Pipeline de operaciones de compraventa" },
    { id: "/dashboard/ventas/reportes", label: "Reportes de Ventas", description: "Volumen, comisiones y cierres" },
    { id: "/dashboard/agentes", label: "Agentes", description: "Gestión de agentes y comisiones" },
    { id: "/dashboard/leads", label: "Consultas", description: "Gestión de clientes potenciales" },
    { id: "/dashboard/clientes", label: "Clientes", description: "Base de datos de clientes" },
    { id: "/dashboard/chat", label: "Chat Zeta Prop", description: "Acceso al asistente de IA" },
    { id: "/dashboard/publicaciones", label: "Publicaciones", description: "Gestión de publicaciones en portales" },
    { id: "/dashboard/finanzas", label: "Reportes", description: "Módulo financiero y balances" },
    { id: "/dashboard/calendario", label: "Calendario", description: "Agenda y eventos" },
    { id: "/dashboard/soporte", label: "Soporte", description: "Mesa de ayuda y tickets de soporte" },
    { id: "/dashboard/soporte/ticketera", label: "Ticketera", description: "Gestión de tickets (solo administradores)" },
    { id: "/dashboard/bitacora", label: "Bitácora", description: "Registro de auditoría del sistema" },
    { id: "/dashboard/gestion-plataforma", label: "Gestión de Plataforma", description: "Administración de usuarios y plataforma" },
    { id: "/dashboard/cuenta", label: "Cuenta", description: "Configuración de cuenta personal" },
    { id: "/dashboard/configuracion", label: "Tasación IA", description: "Configuración del tasador online" },
    { id: "/dashboard/configuracion/roles", label: "Roles y Permisos", description: "Gestión de roles y permisos (solo administradores)" },
    { id: "/dashboard/configuracion/backup", label: "Backup y Restauración", description: "Copias de seguridad de la base de datos (solo administradores)" },
    { id: "/dashboard/configuracion/suscripciones", label: "Planes y Suscripciones", description: "Gestión de planes de suscripción (solo administradores)" },
    { id: "/dashboard/sucursales", label: "Sucursales", description: "Gestión de sucursales (Multisucursal)" },
    { id: "/dashboard/blog", label: "Gestión Blog", description: "Gestión de noticias y blog (Admin)" },
    { id: "/dashboard/novedades", label: "Novedades Zeta", description: "Acceso a noticias y actualizaciones para clientes" },
    { id: "/dashboard/emprendimientos", label: "Emprendimientos", description: "Gestión de emprendimientos y desarrollos" },
    { id: "/dashboard/tutoriales", label: "Tutoriales", description: "Acceso a guías y tutoriales del sistema" },
    { id: "/dashboard/marketing", label: "Marketing", description: "Emails y campañas de la plataforma (Admin)" },
    { id: "/dashboard/mi-sitio", label: "Mi Sitio Web", description: "Portal inmobiliario público propio con subdominio" },
    { id: "/dashboard/carteleria", label: "Cartelería", description: "Inventario y seguimiento de carteles físicos de venta/alquiler" },
];


// Default permission set per role, used to seed new roles and to sync existing
// ones. Admin-only routes (ADMIN_ONLY_PERMISSIONS) never appear in a client or
// agency role.
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
    "Super Admin": DEFAULT_PERMISSIONS.map(p => p.id),
    "Administrador": DEFAULT_PERMISSIONS.map(p => p.id),
    "Cliente Enterprise": [
        "/dashboard", "/dashboard/propiedades", "/dashboard/tasacion",
        "/dashboard/alquileres", "/dashboard/agenda-cobros", "/dashboard/liquidaciones",
        "/dashboard/ventas", "/dashboard/ventas/reportes",
        "/dashboard/agentes", "/dashboard/leads", "/dashboard/clientes", "/dashboard/chat",
        "/dashboard/publicaciones", "/dashboard/finanzas", "/dashboard/calendario",
        "/dashboard/soporte", "/dashboard/sucursales",
        "/dashboard/cuenta", "/dashboard/configuracion", "/dashboard/novedades",
        "/dashboard/emprendimientos", "/dashboard/tutoriales",
        "/dashboard/mi-sitio", "/dashboard/carteleria",
    ],
    "Cliente Pro": [
        "/dashboard", "/dashboard/propiedades", "/dashboard/tasacion",
        "/dashboard/alquileres", "/dashboard/agenda-cobros", "/dashboard/liquidaciones",
        "/dashboard/ventas", "/dashboard/ventas/reportes",
        "/dashboard/agentes", "/dashboard/leads", "/dashboard/clientes", "/dashboard/chat",
        "/dashboard/publicaciones", "/dashboard/finanzas", "/dashboard/calendario",
        "/dashboard/sucursales", "/dashboard/cuenta",
        "/dashboard/novedades", "/dashboard/emprendimientos", "/dashboard/tutoriales",
        "/dashboard/mi-sitio", "/dashboard/carteleria",
    ],
    "Cliente Básico": [
        "/dashboard", "/dashboard/propiedades", "/dashboard/alquileres",
        "/dashboard/agenda-cobros", "/dashboard/liquidaciones",
        "/dashboard/ventas", "/dashboard/clientes", "/dashboard/finanzas",
        "/dashboard/soporte", "/dashboard/tutoriales", "/dashboard/mi-sitio",
        "/dashboard/carteleria",
    ],
    "Agente": [
        "/dashboard", "/dashboard/propiedades", "/dashboard/alquileres",
        "/dashboard/leads", "/dashboard/calendario", "/dashboard/cuenta",
        "/dashboard/novedades", "/dashboard/tutoriales",
        "/dashboard/carteleria",
    ],
};
const ROLES_COLLECTION = "roles";
const USERS_COLLECTION = "users";
const PERMISSIONS_COLLECTION = "permissions_list";

export const roleService = {
    // Get all available permissions dynamically
    getAvailablePermissions: async (): Promise<Permission[]> => {
        if (!db) return DEFAULT_PERMISSIONS;
        const querySnapshot = await getDocs(collection(db, PERMISSIONS_COLLECTION));
        const existingIds = new Set(querySnapshot.docs.map(d => (d.data() as Permission).id));
        const missing = DEFAULT_PERMISSIONS.filter(p => !existingIds.has(p.id));

        if (missing.length > 0) {
            // Backfill permissions added to DEFAULT_PERMISSIONS after this collection was seeded
            await Promise.all(missing.map(p => setDoc(doc(db, PERMISSIONS_COLLECTION, p.id.replace(/\//g, "_")), p)));
        }

        if (querySnapshot.empty) return DEFAULT_PERMISSIONS;
        return [...querySnapshot.docs.map(doc => doc.data() as Permission), ...missing];
    },

    // Get all roles
    getRoles: async (): Promise<Role[]> => {
        if (!db) throw new Error("Firestore not initialized");
        const querySnapshot = await getDocs(collection(db, ROLES_COLLECTION));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
    },

    // Get a specific role by ID
    getRoleById: async (roleId: string): Promise<Role | null> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, ROLES_COLLECTION, roleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Role;
        }
        return null;
    },

    // Create a new role
    createRole: async (role: Omit<Role, "id">): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const newRoleRef = doc(collection(db, ROLES_COLLECTION));
        await setDoc(newRoleRef, { ...role, isSystem: false });

        if (auth?.currentUser) {
            await auditLogService.logConfig(
                auth.currentUser.uid,
                auth.currentUser.email || "",
                auth.currentUser.displayName || "Usuario",
                'role_update',
                `Creó el rol "${role.name}"`,
                "system", // Org ID not clear here, using system or generic
                { role: role.name }
            );
        }
    },

    // Update an existing role
    updateRole: async (roleId: string, updates: Partial<Role>): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const roleRef = doc(db, ROLES_COLLECTION, roleId);
        await updateDoc(roleRef, updates);

        if (auth?.currentUser) {
            const roleSnap = await getDoc(roleRef);
            const roleName = roleSnap.exists() ? roleSnap.data().name : roleId;

            await auditLogService.logConfig(
                auth.currentUser.uid,
                auth.currentUser.email || "",
                auth.currentUser.displayName || "Usuario",
                'role_update',
                `Actualizó el rol "${roleName}"`,
                "system",
                { roleId, changes: Object.keys(updates) }
            );
        }
    },

    // Delete a role
    deleteRole: async (roleId: string): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const roleRef = doc(db, ROLES_COLLECTION, roleId);
        // Get name before delete
        const roleSnap = await getDoc(roleRef);
        const roleName = roleSnap.exists() ? roleSnap.data().name : roleId;

        await deleteDoc(roleRef);

        if (auth?.currentUser) {
            await auditLogService.logConfig(
                auth.currentUser.uid,
                auth.currentUser.email || "",
                auth.currentUser.displayName || "Usuario",
                'role_update',
                `Eliminó el rol "${roleName}"`,
                "system",
                { roleId, roleName }
            );
        }
    },

    // Assign a role to a user
    assignRoleToUser: async (userId: string, roleId: string): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const userRef = doc(db, USERS_COLLECTION, userId);
        await updateDoc(userRef, { roleId });

        if (auth?.currentUser) {
            const role = await roleService.getRoleById(roleId);

            await auditLogService.logConfig(
                auth.currentUser.uid,
                auth.currentUser.email || "",
                auth.currentUser.displayName || "Usuario",
                'user_update',
                `Asignó el rol "${role?.name || roleId}" al usuario ${userId}`,
                "system",
                { userId, roleId, roleName: role?.name }
            );
        }
    },

    // Get user's role
    getUserRole: async (userId: string): Promise<Role | null> => {
        if (!db) throw new Error("Firestore not initialized");
        const userRef = doc(db, USERS_COLLECTION, userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();

            if (userData.roleId) {
                const role = await roleService.getRoleById(userData.roleId);

                // Inheritance Logic for Agents
                // If Agent, inherit "Sucursales" if Organization is Pro/Enterprise
                if (role && role.name === "Agente" && userData.organizationId) {
                    try {
                        // Avoid fetching if org is self (unlikely for agent but safe check)
                        if (userData.organizationId !== userId) {
                            const orgRef = doc(db, USERS_COLLECTION, userData.organizationId);
                            const orgSnap = await getDoc(orgRef);

                            if (orgSnap.exists()) {
                                const orgData = orgSnap.data();
                                if (orgData.roleId) {
                                    const orgRole = await roleService.getRoleById(orgData.roleId);

                                    if (orgRole && (orgRole.name === "Cliente Pro" || orgRole.name === "Cliente Enterprise" || orgRole.name === "Super Admin")) {
                                        // Add Pro features explicitly
                                        // We can expand this list if more features are "Pro-only" but shared with Agents
                                        const inherited = ["/dashboard/sucursales"];

                                        const newPermissions = new Set([...role.permissions, ...inherited]);
                                        role.permissions = Array.from(newPermissions);
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Error inheriting permissions:", e);
                    }
                }

                return role;
            }
        }
        return null;
    },

    // Initialize default roles if they don't exist
    initializeDefaultRoles: async () => {
        const roles = await roleService.getRoles();
        const roleNames = roles.map(r => r.name);

        const defaults: Omit<Role, "id" | "permissions">[] = [
            { name: "Super Admin", description: "Acceso total y configuración del sistema", isSystem: true },
            { name: "Cliente Enterprise", description: "Plan Enterprise con todas las funcionalidades de negocio", isSystem: false },
            { name: "Cliente Pro", description: "Plan Profesional con multisucursal y equipo", isSystem: false },
            { name: "Cliente Básico", description: "Plan inicial", isSystem: false },
            { name: "Agente", description: "Colaborador de inmobiliaria", isSystem: true },
        ];

        for (const role of defaults) {
            if (roleNames.includes(role.name)) continue;
            await roleService.createRole({ ...role, permissions: DEFAULT_ROLE_PERMISSIONS[role.name] });
        }
    },

    // Sync default roles: add missing default permissions to existing roles and
    // strip admin-only permissions from every non-admin role. Idempotent.
    syncDefaultRoles: async (): Promise<{ updated: string[] }> => {
        const roles = await roleService.getRoles();
        const strips = new Map(planAdminOnlyPermissionStrips(roles).map(s => [s.id, s.permissions]));
        const updated: string[] = [];

        for (const role of roles) {
            const current = strips.get(role.id) ?? role.permissions ?? [];
            const existing = new Set(current);
            const missing = (DEFAULT_ROLE_PERMISSIONS[role.name] ?? []).filter(p => !existing.has(p));

            if (missing.length > 0 || strips.has(role.id)) {
                await roleService.updateRole(role.id, {
                    permissions: [...current, ...missing],
                });
                updated.push(role.name);
            }
        }

        return { updated };
    },

    // Get the default role (Cliente)
    getDefaultRole: async (): Promise<Role | null> => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(collection(db, ROLES_COLLECTION), where("name", "==", "Cliente Básico"));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() } as Role;
        }
        return null;
    }
};
