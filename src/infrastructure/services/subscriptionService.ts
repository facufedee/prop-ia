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
    Timestamp
} from "firebase/firestore";
import { Plan, Subscription, Payment, Addon } from "@/domain/models/Subscription";

const PLANS_COLLECTION = "plans";
const SUBSCRIPTIONS_COLLECTION = "subscriptions";
const PAYMENTS_COLLECTION = "payments";
const ADDONS_COLLECTION = "addons";

export const subscriptionService = {
    // ========== PLANS ==========

    getAllPlans: async (): Promise<Plan[]> => {
        if (!db) throw new Error("Firestore not initialized");
        const snapshot = await getDocs(collection(db, PLANS_COLLECTION));
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Plan[];
    },

    getPlanById: async (id: string): Promise<Plan | null> => {
        if (!db) throw new Error("Firestore not initialized");
        const docSnap = await getDoc(doc(db, PLANS_COLLECTION, id));
        if (!docSnap.exists()) return null;

        return {
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate() || new Date(),
            updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        } as Plan;
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
        return docRef.id;
    },

    updatePaymentStatus: async (id: string, status: Payment['status']): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        await updateDoc(doc(db, PAYMENTS_COLLECTION, id), {
            status,
            updatedAt: Timestamp.now(),
        });
    },

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

    checkLimit: async (userId: string, limitType: keyof Subscription['usage']): Promise<{ allowed: boolean; current: number; limit: number | string }> => {
        const subscription = await subscriptionService.getUserSubscription(userId);

        if (!subscription) {
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
};
