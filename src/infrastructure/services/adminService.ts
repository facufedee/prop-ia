import { db } from "@/infrastructure/firebase/client";
import { collection, getDocs, query, orderBy, where, getDoc, doc, deleteDoc, updateDoc, setDoc } from "firebase/firestore";
import { User } from "@/domain/models/User";
import { Subscription, PlanTier } from "@/domain/models/Subscription";

const USERS_COLLECTION = "users";
const SUBSCRIPTIONS_COLLECTION = "subscriptions";
const RENTALS_COLLECTION = "alquileres";

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

        // 3. Fetch Rentals
        const rentalsQuery = query(collection(db, RENTALS_COLLECTION));
        const rentalsSnapshot = await getDocs(rentalsQuery);

        const subscriptionsMap = new Map<string, Subscription>();
        subsSnapshot.docs.forEach(doc => {
            const sub = { id: doc.id, ...doc.data() } as Subscription;
            subscriptionsMap.set(sub.userId, sub);
        });

        const rentalsCountMap = new Map<string, number>();
        rentalsSnapshot.docs.forEach(doc => {
            const rental = doc.data();
            const userId = rental.userId;
            if (userId) {
                rentalsCountMap.set(userId, (rentalsCountMap.get(userId) || 0) + 1);
            }
        });

        // 4. Merge data
        const users: User[] = usersSnapshot.docs.map(doc => {
            const userData = doc.data();
            const sub = subscriptionsMap.get(doc.id);
            const alquileresCount = rentalsCountMap.get(doc.id) || 0;

            return {
                uid: doc.id,
                email: userData.email,
                displayName: userData.displayName,
                photoURL: userData.photoURL,
                roleId: userData.roleId,
                createdAt: userData.createdAt?.toDate(),
                lastLogin: userData.lastLogin?.toDate(),
                organizationId: userData.organizationId,
                alquileresCount,
                subscription: sub ? {
                    planId: sub.planId, // Use actual planId
                    planTier: sub.planTier,
                    status: sub.status,
                    billingPeriod: sub.billingPeriod,
                    endDate: (sub.endDate as any)?.toDate?.() || sub.endDate
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
    },

    // ======== NUEVAS FUNCIONES PARA EL PERFIL DE ADMINISTRADOR ========

    getUserProfileData: async (uid: string) => {
        if (!db) throw new Error("Firestore not initialized");

        // 1. User Data
        const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
        if (!userDoc.exists()) throw new Error("User not found");
        const rawUser = userDoc.data();
        const userData = {
            uid: userDoc.id,
            ...rawUser,
            createdAt: rawUser.createdAt?.toDate(),
            lastLogin: rawUser.lastLogin?.toDate(),
        } as User;

        // 2. Subscription Data
        const subsQuery = query(collection(db, SUBSCRIPTIONS_COLLECTION), where("userId", "==", uid));
        const subsSnapshot = await getDocs(subsQuery);
        let subscription: Subscription | null = null;
        if (!subsSnapshot.empty) {
            const rawSub = subsSnapshot.docs[0].data();
            subscription = {
                id: subsSnapshot.docs[0].id,
                ...rawSub,
                startDate: rawSub.startDate?.toDate(),
                endDate: rawSub.endDate?.toDate(),
                createdAt: rawSub.createdAt?.toDate(),
                updatedAt: rawSub.updatedAt?.toDate(),
                trialEndDate: rawSub.trialEndDate?.toDate(),
                cancelledAt: rawSub.cancelledAt?.toDate(),
                lastPaymentDate: rawSub.lastPaymentDate?.toDate(),
                nextPaymentDate: rawSub.nextPaymentDate?.toDate(),
            } as Subscription;
        }

        // 3. Properties Count
        const propertiesQuery = query(collection(db, "properties"), where("userId", "==", uid));
        const propertiesSnapshot = await getDocs(propertiesQuery);
        const propertiesCount = propertiesSnapshot.size;

        // 4. Clients Count
        const inquilinosQuery = query(collection(db, "inquilinos"), where("userId", "==", uid));
        const propietariosQuery = query(collection(db, "propietarios"), where("userId", "==", uid));
        const [inqSnap, propSnap] = await Promise.all([getDocs(inquilinosQuery), getDocs(propietariosQuery)]);
        const clientsCount = inqSnap.size + propSnap.size;

        // 5. Payments History
        const paymentsQuery = query(collection(db, "payments"), where("userId", "==", uid), orderBy("createdAt", "desc"));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const payments = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 6. Sent Emails History
        const emailsQuery = query(collection(db, "sent_emails"), where("to", "==", userData.email || ""), orderBy("sentAt", "desc"));
        const emailsSnapshot = await getDocs(emailsQuery);
        const sentEmails = emailsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return {
            user: userData,
            subscription,
            usage: {
                properties: propertiesCount,
                clients: clientsCount
            },
            payments,
            sentEmails
        };
    },

    updateSubscriptionDetails: async (uid: string, planTier: PlanTier, endDate: Date) => {
        if (!db) throw new Error("Firestore not initialized");

        const q = query(collection(db, SUBSCRIPTIONS_COLLECTION), where("userId", "==", uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            // Create new if none exists
            const newSubRef = doc(collection(db, SUBSCRIPTIONS_COLLECTION));
            await setDoc(newSubRef, {
                userId: uid,
                planTier: planTier,
                planId: planTier,
                status: 'active',
                billingPeriod: 'monthly',
                createdAt: new Date(),
                updatedAt: new Date(),
                amount: 0,
                currency: 'ARS',
                startDate: new Date(),
                endDate: endDate,
                usage: { properties: 0, users: 0, clients: 0, tasaciones: 0, aiCredits: 0 }
            });
        } else {
            // Update existing
            const subDoc = querySnapshot.docs[0];
            await updateDoc(subDoc.ref, {
                planTier: planTier,
                planId: planTier,
                endDate: endDate,
                status: 'active', // Ensure it's active
                updatedAt: new Date()
            });
        }
    },

    registerManualPayment: async (uid: string, paymentData: { amount: number; paymentMethod: string; description: string; date: Date }) => {
        if (!db) throw new Error("Firestore not initialized");

        // Save the payment
        const newPaymentRef = doc(collection(db, "payments"));
        await setDoc(newPaymentRef, {
            userId: uid,
            amount: paymentData.amount,
            currency: 'ARS',
            paymentMethod: paymentData.paymentMethod,
            status: 'completed',
            description: paymentData.description,
            createdAt: paymentData.date,
            updatedAt: new Date(),
            isManual: true
        });

        // Optionally, we could extend the subscription here if asked, but we'll manage that separately in the UI form
    }
};
