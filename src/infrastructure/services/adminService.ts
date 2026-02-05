import { db } from "@/infrastructure/firebase/client";
import { collection, getDocs, query, orderBy, where, getDoc, doc, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import { User } from "@/domain/models/User";
import { Subscription, PlanTier } from "@/domain/models/Subscription";

const USERS_COLLECTION = "users";
const SUBSCRIPTIONS_COLLECTION = "subscriptions";

export const adminService = {
    // Obtener todos los usuarios con su suscripción
    getAllUsers: async (): Promise<User[]> => {
        if (!db) throw new Error("Firestore not initialized");

        // 1. Fetch Users
        // Note: This fetches ALL users. In a large app, you'd paginate.
        const usersQuery = query(collection(db, USERS_COLLECTION));
        const usersSnapshot = await getDocs(usersQuery);

        // 2. Fetch Subscriptions
        const subsQuery = query(collection(db, SUBSCRIPTIONS_COLLECTION));
        const subsSnapshot = await getDocs(subsQuery);

        const subscriptionsMap = new Map<string, Subscription>();
        subsSnapshot.docs.forEach(doc => {
            const sub = { id: doc.id, ...doc.data() } as Subscription;
            subscriptionsMap.set(sub.userId, sub);
        });

        // 3. Merge data
        const users: User[] = usersSnapshot.docs.map(doc => {
            const userData = doc.data();
            const sub = subscriptionsMap.get(doc.id);

            return {
                uid: doc.id,
                email: userData.email,
                displayName: userData.displayName,
                photoURL: userData.photoURL,
                roleId: userData.roleId,
                createdAt: userData.createdAt?.toDate(),
                lastLogin: userData.lastLogin?.toDate(),
                organizationId: userData.organizationId,
                subscription: sub ? {
                    planId: sub.planId, // Use actual planId
                    planTier: sub.planTier,
                    status: sub.status,
                    billingPeriod: sub.billingPeriod
                } : undefined,
                disabled: userData.disabled === true
            } as User;
        });

        return users;
    },

    // Obtener estadísticas de la plataforma
    getPlatformStats: async () => {
        if (!db) throw new Error("Firestore not initialized");

        const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
        const subsSnapshot = await getDocs(collection(db, SUBSCRIPTIONS_COLLECTION));

        const totalUsers = usersSnapshot.size;
        const totalSubscriptions = subsSnapshot.size;

        let activeSubscriptions = 0;
        let mrr = 0;

        subsSnapshot.docs.forEach(doc => {
            const sub = doc.data() as Subscription;
            if (sub.status === 'active') {
                activeSubscriptions++;
                if (sub.amount) {
                    mrr += sub.amount;
                }
            }
        });

        return {
            totalUsers,
            totalSubscriptions,
            activeSubscriptions,
            mrr
        };
    },

    // Eliminar usuario
    deleteUser: async (uid: string) => {
        if (!db) throw new Error("Firestore not initialized");

        // 1. Delete from users collection
        await deleteDoc(doc(db, USERS_COLLECTION, uid));
    },

    // Verificar usuario
    verifyUser: async (uid: string, status: 'verified' | 'rejected' | 'pending') => {
        if (!db) throw new Error("Firestore not initialized");
        const userRef = doc(db, USERS_COLLECTION, uid);

        await updateDoc(userRef, {
            isVerified: status === 'verified',
            verificationStatus: status
        });
    },

    // Habilitar/Deshabilitar usuario
    toggleUserStatus: async (uid: string, disabled: boolean) => {
        if (!db) throw new Error("Firestore not initialized");
        const userRef = doc(db, USERS_COLLECTION, uid);
        await updateDoc(userRef, { disabled });
    },

    // Actualizar plan de usuario manualmente
    updateUserPlan: async (uid: string, planTier: PlanTier) => {
        if (!db) throw new Error("Firestore not initialized");

        // Buscar suscripción existente
        const q = query(collection(db, SUBSCRIPTIONS_COLLECTION), where("userId", "==", uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            // Crear nueva suscripción si no existe
            const newSubRef = doc(collection(db, SUBSCRIPTIONS_COLLECTION));
            await setDoc(newSubRef, {
                userId: uid,
                planTier: planTier,
                planId: planTier, // Simplificado
                status: 'active',
                billingPeriod: 'monthly',
                createdAt: new Date(),
                updatedAt: new Date(),
                amount: 0,
                currency: 'ARS',
                startDate: new Date(),
                endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 año por defecto
                usage: {
                    properties: 0,
                    users: 0,
                    clients: 0,
                    tasaciones: 0,
                    aiCredits: 0
                }
            });
        } else {
            // Actualizar existente
            const subDoc = querySnapshot.docs[0];
            await updateDoc(subDoc.ref, {
                planTier: planTier,
                planId: planTier,
                updatedAt: new Date()
            });
        }
    }
};
