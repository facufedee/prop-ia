import { db } from "@/infrastructure/firebase/client";
import { collection, getDocs, query, orderBy, where, getDoc, doc } from "firebase/firestore";
import { User } from "@/domain/models/User";
import { Subscription } from "@/domain/models/Subscription";

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
                organizationId: userData.organizationId,
                subscription: sub ? {
                    planId: sub.planTier, // Using tier as ID for display
                    status: sub.status,
                    billingPeriod: sub.billingPeriod
                } : undefined
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
    }
};
