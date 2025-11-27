import { db } from "@/infrastructure/firebase/client";
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";

export interface Permission {
    id: string;
    label: string;
    description: string;
}

export interface Role {
    id: string;
    name: string;
    permissions: string[]; // List of permission IDs (which correspond to menu hrefs or specific actions)
    isSystem?: boolean; // System roles cannot be deleted
}

export const PERMISSIONS: Permission[] = [
    { id: "/dashboard", label: "Dashboard", description: "Acceso al panel principal" },
    { id: "/dashboard/tasacion", label: "Tasación Inteligente", description: "Acceso a herramientas de tasación" },
    { id: "/dashboard/propiedades", label: "Propiedades", description: "Gestión de propiedades" },
    { id: "/dashboard/leads", label: "Leads / Consultas", description: "Gestión de clientes potenciales" },
    { id: "/dashboard/clientes", label: "Clientes", description: "Base de datos de clientes" },
    { id: "/dashboard/chat", label: "Chat Prop-IA", description: "Acceso al asistente de IA" },
    { id: "/dashboard/publicaciones", label: "Publicaciones", description: "Gestión de publicaciones en portales" },
    { id: "/dashboard/finanzas", label: "Finanzas", description: "Módulo financiero" },
    { id: "/dashboard/calendario", label: "Calendario", description: "Agenda y eventos" },
    { id: "/dashboard/cuenta", label: "Cuenta", description: "Configuración de cuenta personal" },
    { id: "/dashboard/configuracion", label: "Configuración", description: "Configuración global del sistema" },
];

const ROLES_COLLECTION = "roles";
const USERS_COLLECTION = "users";

export const roleService = {
    // Get all roles
    getRoles: async (): Promise<Role[]> => {
        const querySnapshot = await getDocs(collection(db, ROLES_COLLECTION));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
    },

    // Get a specific role by ID
    getRoleById: async (roleId: string): Promise<Role | null> => {
        const docRef = doc(db, ROLES_COLLECTION, roleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Role;
        }
        return null;
    },

    // Create a new role
    createRole: async (role: Omit<Role, "id">): Promise<void> => {
        const newRoleRef = doc(collection(db, ROLES_COLLECTION));
        await setDoc(newRoleRef, { ...role, isSystem: false });
    },

    // Update an existing role
    updateRole: async (roleId: string, updates: Partial<Role>): Promise<void> => {
        const roleRef = doc(db, ROLES_COLLECTION, roleId);
        await updateDoc(roleRef, updates);
    },

    // Delete a role
    deleteRole: async (roleId: string): Promise<void> => {
        await deleteDoc(doc(db, ROLES_COLLECTION, roleId));
    },

    // Assign a role to a user
    assignRoleToUser: async (userId: string, roleId: string): Promise<void> => {
        const userRef = doc(db, USERS_COLLECTION, userId);
        await updateDoc(userRef, { roleId });
    },

    // Get user's role
    getUserRole: async (userId: string): Promise<Role | null> => {
        const userRef = doc(db, USERS_COLLECTION, userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.roleId) {
                return await roleService.getRoleById(userData.roleId);
            }
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
                permissions: PERMISSIONS.map(p => p.id),
                isSystem: true
            };
            await roleService.createRole(adminRole);
        }

        if (!roleNames.includes("Agente")) {
            const agentRole: Omit<Role, "id"> = {
                name: "Agente",
                permissions: [
                    "/dashboard",
                    "/dashboard/propiedades",
                    "/dashboard/leads",
                    "/dashboard/calendario",
                    "/dashboard/cuenta"
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
        const q = query(collection(db, ROLES_COLLECTION), where("name", "==", "Cliente"));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() } as Role;
        }
        return null;
    }
};
