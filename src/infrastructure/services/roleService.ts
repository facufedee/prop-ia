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
    { id: "/dashboard/chat", label: "Chat Prop-IA", description: "Acceso al asistente de IA" },
    { id: "/dashboard/publicaciones", label: "Publicaciones", description: "Gestión de publicaciones en portales" },
    { id: "/dashboard/finanzas", label: "Finanzas", description: "Módulo financiero" },
    { id: "/dashboard/calendario", label: "Calendario", description: "Agenda y eventos" },
    { id: "/dashboard/soporte", label: "Soporte", description: "Mesa de ayuda y tickets de soporte" },
    { id: "/dashboard/soporte/ticketera", label: "Ticketera", description: "Gestión de tickets (solo administradores)" },
    { id: "/dashboard/bitacora", label: "Bitácora", description: "Registro de auditoría del sistema" },
    { id: "/dashboard/cuenta", label: "Cuenta", description: "Configuración de cuenta personal" },
    { id: "/dashboard/configuracion", label: "Configuración", description: "Configuración global del sistema" },
    { id: "/dashboard/configuracion/roles", label: "Roles y Permisos", description: "Gestión de roles y permisos (solo administradores)" },
    { id: "/dashboard/configuracion/backup", label: "Backup y Restauración", description: "Copias de seguridad de la base de datos (solo administradores)" },
    { id: "/dashboard/configuracion/suscripciones", label: "Planes y Suscripciones", description: "Gestión de planes de suscripción (solo administradores)" },
    { id: "/dashboard/sucursales", label: "Sucursales", description: "Gestión de sucursales (Multisucursal)" },
    { id: "/dashboard/blog", label: "Blog / Novedades", description: "Gestión de noticias y blog" },
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
            console.log("roleService: User data found:", userData);
            if (userData.roleId) {
                const role = await roleService.getRoleById(userData.roleId);
                console.log("roleService: Role fetched:", role);
                return role;
            } else {
                console.warn("roleService: User has no roleId");
            }
        } else {
            console.warn("roleService: User document not found for ID:", userId);
        }
        return null;
    },

    // Initialize default roles if they don't exist
    initializeDefaultRoles: async () => {
        const roles = await roleService.getRoles();
        const roleNames = roles.map(r => r.name);

        if (!roleNames.includes("Administrador")) {
            const adminRole: Omit<Role, "id"> = {
                name: "Administrador",
                description: "Acceso completo al sistema",
                permissions: PERMISSIONS.map(p => p.id),
                isSystem: true
            };
            await roleService.createRole(adminRole);
        }

        // Check if "Cliente Pro" role exists, if not create it (User request: Pro can use Sucursales)
        if (!roleNames.includes("Cliente Pro")) {
            const proRole: Omit<Role, "id"> = {
                name: "Cliente Pro",
                permissions: [
                    "/dashboard",
                    "/dashboard/propiedades",
                    "/dashboard/cuenta",
                    "/dashboard/sucursales" // Pro feature
                ],
                isSystem: false // Can be edited
            };
            await roleService.createRole(proRole);
        }

        if (!roleNames.includes("Agente")) {
            const agentRole: Omit<Role, "id"> = {
                name: "Agente",
                permissions: [
                    "/dashboard",
                    "/dashboard/propiedades",
                    "/dashboard/alquileres",
                    "/dashboard/agentes",
                    "/dashboard/leads",
                    "/dashboard/calendario",
                    "/dashboard/cuenta",
                    "/dashboard/blog"
                ],
                isSystem: true
            };
            await roleService.createRole(agentRole);
        }

        if (!roleNames.includes("Cliente")) {
            const clientRole: Omit<Role, "id"> = {
                name: "Cliente",
                permissions: [
                    "/dashboard",
                    "/dashboard/propiedades",
                    "/dashboard/cuenta"
                ],
                isSystem: true
            };
            await roleService.createRole(clientRole);
        }
    },
    // Get the default role (Cliente)
    getDefaultRole: async (): Promise<Role | null> => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(collection(db, ROLES_COLLECTION), where("name", "==", "Cliente"));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() } as Role;
        }
        return null;
    }
};
