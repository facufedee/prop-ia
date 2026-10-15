import { db } from "@/infrastructure/firebase/client";
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    Timestamp,
    setDoc
} from "firebase/firestore";
import { Plan, Subscription, Payment, Addon } from "@/domain/models/Subscription";
import { PLANS } from "@/infrastructure/data/plans";

const PLANS_COLLECTION = "plans";
const SUBSCRIPTIONS_COLLECTION = "subscriptions";
const PAYMENTS_COLLECTION = "payments";
const ADDONS_COLLECTION = "addons";

export const subscriptionService = {
    // ========== PLANS ==========

    getAllPlans: async (): Promise<Plan[]> => {
        if (!db) throw new Error("Firestore not initialized");
        const snapshot = await getDocs(collection(db, PLANS_COLLECTION));

        if (snapshot.empty) {
            // Seed DB with hardcoded PLANS if empty
            const seedPromises = PLANS.map((plan: any) => {
                const planData = {
                    ...plan,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now()
                };
                if ('id' in planData) delete planData.id;
                return setDoc(doc(db, PLANS_COLLECTION, plan.id), planData);
            });
            await Promise.all(seedPromises);

            // Return them formatted
            return PLANS as Plan[];
        }

        // Firestore is the single source of truth once seeded — never overwrite
        // admin-edited limits/features with the hardcoded local PLANS array.
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            };
        }) as Plan[];
    },

    getPlanById: async (id: string): Promise<Plan | null> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, PLANS_COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            // Fallback to the local seed data only when the plan hasn't been
            // seeded into Firestore yet — never once a Firestore doc exists.
            const localPlan = PLANS.find((p: any) => p.id === id) as Plan | undefined;
            return localPlan || null;
        }

        const data = docSnap.data();

        return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Plan;
    },

    deletePlan: async (id: string): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        // @ts-ignore
        const { deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, PLANS_COLLECTION, id));
    },

    // ========== SUBSCRIPTIONS ==========

    getUserSubscription: async (userId: string): Promise<Subscription | null> => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(
            collection(db, SUBSCRIPTIONS_COLLECTION),
            where("userId", "==", userId),
            where("status", "==", "active"),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data(),
            startDate: doc.data().startDate?.toDate() || new Date(),
            endDate: doc.data().endDate?.toDate() || new Date(),
            trialEndDate: doc.data().trialEndDate?.toDate(),
            cancelledAt: doc.data().cancelledAt?.toDate(),
            lastPaymentDate: doc.data().lastPaymentDate?.toDate(),
            nextPaymentDate: doc.data().nextPaymentDate?.toDate(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        } as Subscription;
    },

    getAllSubscriptions: async (): Promise<Subscription[]> => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(
            collection(db, SUBSCRIPTIONS_COLLECTION),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            startDate: doc.data().startDate?.toDate() || new Date(),
            endDate: doc.data().endDate?.toDate() || new Date(),
            trialEndDate: doc.data().trialEndDate?.toDate(),
            cancelledAt: doc.data().cancelledAt?.toDate(),
            lastPaymentDate: doc.data().lastPaymentDate?.toDate(),
            nextPaymentDate: doc.data().nextPaymentDate?.toDate(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Subscription[];
    },

    createSubscription: async (data: Omit<Subscription, "id" | "createdAt" | "updatedAt">): Promise<string> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), {
            ...data,
            startDate: Timestamp.fromDate(data.startDate),
            endDate: Timestamp.fromDate(data.endDate),
            trialEndDate: data.trialEndDate ? Timestamp.fromDate(data.trialEndDate) : null,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return docRef.id;
    },

    updateSubscription: async (id: string, data: Partial<Subscription>): Promise<void> => {
        const updateData: any = {
            ...data,
            updatedAt: Timestamp.now(),
        };

        if (data.endDate) updateData.endDate = Timestamp.fromDate(data.endDate);
        if (data.cancelledAt) updateData.cancelledAt = Timestamp.fromDate(data.cancelledAt);
        if (data.nextPaymentDate) updateData.nextPaymentDate = Timestamp.fromDate(data.nextPaymentDate);

        if (data.nextPaymentDate) updateData.nextPaymentDate = Timestamp.fromDate(data.nextPaymentDate);

        if (!db) throw new Error("Firestore not initialized");
        await updateDoc(doc(db, SUBSCRIPTIONS_COLLECTION, id), updateData);
    },

    cancelSubscription: async (id: string): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        await updateDoc(doc(db, SUBSCRIPTIONS_COLLECTION, id), {
            status: 'cancelled',
            cancelledAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });

        // Trigger Email Notification (Email)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zetaprop.com.ar';
        fetch(`${baseUrl}/api/notifications/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'subscriptionCancelled',
                data: { subscriptionId: id },
                subject: 'Suscripción Cancelada',
                message: `Una suscripción ha sido cancelada.<br/><strong>ID Suscripción:</strong> ${id}`
            })
        }).catch(err => console.error("Failed to trigger email notification:", err));
    },

    deleteSubscription: async (id: string): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const { deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, SUBSCRIPTIONS_COLLECTION, id));
    },

    // ========== PAYMENTS ==========

    getUserPayments: async (userId: string): Promise<Payment[]> => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(
            collection(db, PAYMENTS_COLLECTION),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Payment[];
    },

    createPayment: async (data: Omit<Payment, "id" | "createdAt" | "updatedAt">): Promise<string> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = await addDoc(collection(db, PAYMENTS_COLLECTION), {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });

        // Notify Admins
        try {
            const { notificationService } = await import("./notificationService");
            await notificationService.createNotification(
                "Nuevo Pago Recibido",
                `Se ha registrado un pago de $${data.amount} por el usuario ${data.userId}`,
                "success",
                "Administrador",
                "/dashboard/admin/pagos" // Assuming this route exists or similar
            );
        } catch (error) {
            console.error("Error sending payment notification:", error);
        }

        return docRef.id;
    },

    updatePaymentStatus: async (id: string, status: Payment['status']): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        await updateDoc(doc(db, PAYMENTS_COLLECTION, id), {
            status,
            updatedAt: Timestamp.now(),
        });
    },

    // Payment activation (MercadoPago webhook / direct card payments) runs on the
    // server with the Admin SDK: see server/subscriptionAdminService.ts.

    // ========== ADDONS ==========

    getAllAddons: async (): Promise<Addon[]> => {
        if (!db) throw new Error("Firestore not initialized");
        const snapshot = await getDocs(collection(db, ADDONS_COLLECTION));
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Addon[];
    },

    // ========== USAGE TRACKING ==========

    updateUsage: async (subscriptionId: string, usage: Partial<Subscription['usage']>): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const subDoc = await getDoc(doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId));
        if (!subDoc.exists()) return;

        const currentUsage = subDoc.data().usage || { properties: 0, users: 0, tasaciones: 0, aiCredits: 0 };

        await updateDoc(doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId), {
            usage: { ...currentUsage, ...usage },
            updatedAt: Timestamp.now(),
        });
    },

    checkUsageLimit: async (userId: string, resource: 'properties' | 'clients'): Promise<{ allowed: boolean; current: number; limit: number | string }> => {
        if (!db) throw new Error("Firestore not initialized");

        // 1. Get Plan Limits
        const subscription = await subscriptionService.getUserSubscription(userId);
        let limit: number | 'unlimited' = resource === 'properties' ? 25 : 80; // Default Free Limit

        if (subscription) {
            const plan = await subscriptionService.getPlanById(subscription.planId);
            if (plan) {
                // @ts-ignore
                limit = plan.limits[resource] ?? (resource === 'clients' ? 5 : 10); // Fallback to 10 for properties if undefined
            }
            // If subscription exists but NO plan is active/found, we might default to free limits or block.
            // Assuming active subscription implies a valid plan, but fallback is safe.
        }

        if (limit === 'unlimited') {
            return { allowed: true, current: 0, limit: 'unlimited' };
        }

        // If NO subscription (Free Tier default), set defaults here explicitly if plan logic didn't catch it
        // The above block only runs if subscription exists.
        // If subscription is null, we need to set the default limit.
        if (!subscription) {
            limit = resource === 'properties' ? 25 : 80;
        }

        // 2. Count Current Usage (Real-time)
        let count = 0;

        if (resource === 'properties') {
            const q = query(collection(db, "properties"), where("userId", "==", userId));
            const snapshot = await getDocs(q);
            count = snapshot.size;
        } else if (resource === 'clients') {
            // Count Inquilinos + Propietarios
            const qInquilinos = query(collection(db, "inquilinos"), where("userId", "==", userId));
            const snapInquilinos = await getDocs(qInquilinos);

            const qPropietarios = query(collection(db, "propietarios"), where("userId", "==", userId));
            const snapPropietarios = await getDocs(qPropietarios);

            count = snapInquilinos.size + snapPropietarios.size;
        }

        return {
            allowed: count < (limit as number),
            current: count,
            limit
        };
    },

    // Legacy check based on stored usage (can be kept for lighter checks if needed)
    checkLimit: async (userId: string, limitType: keyof Subscription['usage']): Promise<{ allowed: boolean; current: number; limit: number | string }> => {
        const subscription = await subscriptionService.getUserSubscription(userId);

        if (!subscription) {
            // Treat no subscription as "Free Plan" for this check, effectively max 0 or default handling? 
            // Logic above in checkUsageLimit is more robust for the "Action Guard"
            return { allowed: false, current: 0, limit: 0 };
        }

        const plan = await subscriptionService.getPlanById(subscription.planId);
        if (!plan) {
            return { allowed: false, current: 0, limit: 0 };
        }

        const limit = plan.limits[limitType];
        const current = subscription.usage[limitType];

        if (limit === 'unlimited') {
            return { allowed: true, current, limit: 'unlimited' };
        }

        return {
            allowed: current < (limit as number),
            current,
            limit,
        };
    },

    // ========== MANUAL PAYMENT FLOW ==========
    setPendingPaymentApproval: async (userId: string, isPending: boolean): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");

        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            pendingPaymentApproval: isPending
        });
    }
};
