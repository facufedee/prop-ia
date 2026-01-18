import { db, auth } from "@/infrastructure/firebase/client";
import { auditLogService } from "@/infrastructure/services/auditLogService";
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";

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

export const PERMISSIONS: Permission[] = [
    { id: "/dashboard", label: "Dashboard", description: "Acceso al panel principal" },
    { id: "/dashboard/tasacion", label: "Tasación Inteligente", description: "Acceso a herramientas de tasación" },
    { id: "/dashboard/propiedades", label: "Propiedades", description: "Gestión de propiedades" },
    { id: "/dashboard/alquileres", label: "Alquileres", description: "Gestión de contratos de alquiler" },
    { id: "/dashboard/agentes", label: "Agentes", description: "Gestión de agentes y comisiones" },
    { id: "/dashboard/leads", label: "Leads / Consultas", description: "Gestión de clientes potenciales" },
    { id: "/dashboard/clientes", label: "Clientes", description: "Base de datos de clientes" },
    { id: "/dashboard/chat", label: "Chat Zeta Prop", description: "Acceso al asistente de IA" },
    { id: "/dashboard/publicaciones", label: "Publicaciones", description: "Gestión de publicaciones en portales" },
    { id: "/dashboard/finanzas", label: "Finanzas", description: "Módulo financiero" },
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
    { id: "/dashboard/blog", label: "Gestión Blog", description: "Gestión de noticias y blog (Admin)" }, // Renaming old /dashboard/blog permission to avoid confusion if needed, or keep as is. The user said "Novedades" for clients.
    { id: "/dashboard/novedades", label: "Novedades Zeta", description: "Acceso a noticias y actualizaciones para clientes" },
    { id: "/dashboard/emprendimientos", label: "Emprendimientos", description: "Gestión de emprendimientos y desarrollos" },
];

const ROLES_COLLECTION = "roles";
const USERS_COLLECTION = "users";

export const roleService = {
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

        // 1. Super Admin
        if (!roleNames.includes("Super Admin")) {
            await roleService.createRole({
                name: "Super Admin",
                description: "Acceso total y configuración del sistema",
                permissions: PERMISSIONS.map(p => p.id), // All permissions
                isSystem: true
            });
        }

        // 2. Cliente Enterprise (Alles + Support?)
        if (!roleNames.includes("Cliente Enterprise")) {
            await roleService.createRole({
                name: "Cliente Enterprise",
                description: "Plan Enterprise con todas las funcionalidades de negocio",
                permissions: [
                    "/dashboard",
                    "/dashboard/propiedades",
                    "/dashboard/tasacion", // Advanced
                    "/dashboard/alquileres",
                    "/dashboard/agentes",
                    "/dashboard/leads",
                    "/dashboard/clientes",
                    "/dashboard/chat",
                    "/dashboard/publicaciones",
                    "/dashboard/finanzas",
                    "/dashboard/calendario",
                    "/dashboard/soporte",
                    "/dashboard/sucursales",
                    "/dashboard/blog",
                    "/dashboard/cuenta",
                    "/dashboard/cuenta",
                    "/dashboard/configuracion",
                    "/dashboard/novedades",
                    "/dashboard/emprendimientos"
                ],
                isSystem: false
            });
        }

        // 3. Cliente Pro
        if (!roleNames.includes("Cliente Pro")) {
            await roleService.createRole({
                name: "Cliente Pro",
                description: "Plan Profesional con multisucursal y equipo",
                permissions: [
                    "/dashboard",
                    "/dashboard/propiedades",
                    "/dashboard/tasacion",
                    "/dashboard/alquileres",
                    "/dashboard/agentes",
                    "/dashboard/leads",
                    "/dashboard/clientes",
                    "/dashboard/chat",
                    "/dashboard/publicaciones",
                    "/dashboard/finanzas",
                    "/dashboard/calendario",
                    "/dashboard/sucursales", // Pro Feature
                    "/dashboard/blog",
                    "/dashboard/cuenta",
                    "/dashboard/novedades",
                    "/dashboard/emprendimientos"
                ],
                isSystem: false
            });
        }

        // 4. Cliente Free
        if (!roleNames.includes("Cliente Free")) {
            await roleService.createRole({
                name: "Cliente Free",
                description: "Plan gratuito inicial",
                permissions: [
                    "/dashboard",
                    "/dashboard/propiedades",
                    "/dashboard/cuenta",
                    "/dashboard/blog",
                    "/dashboard/novedades"
                ],
                isSystem: false
            });
        }

        // 5. Agente
        if (!roleNames.includes("Agente")) {
            await roleService.createRole({
                name: "Agente",
                description: "Colaborador de inmobiliaria",
                permissions: [
                    "/dashboard",
                    "/dashboard/propiedades",
                    "/dashboard/alquileres",
                    "/dashboard/leads",
                    "/dashboard/calendario",
                    "/dashboard/cuenta",
                    "/dashboard/blog",
                    "/dashboard/novedades"
                ],
                isSystem: true
            });
        }
    },
    // Get the default role (Cliente)
    getDefaultRole: async (): Promise<Role | null> => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(collection(db, ROLES_COLLECTION), where("name", "==", "Cliente Free"));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() } as Role;
        }
        return null;
    }
};
