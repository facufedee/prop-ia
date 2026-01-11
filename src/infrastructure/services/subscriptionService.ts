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
        } as unknown as Plan)) as Plan[];
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
        } as unknown as Plan;
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

    processPaymentWebhook: async (paymentId: string): Promise<{ success: boolean; message: string }> => {
        console.log(`[Webhook] Processing payment ${paymentId}...`);

        // 1. Fetch payment details from Mercado Pago
        const mpAccessToken = process.env.MP_ACCESS_TOKEN;
        if (!mpAccessToken) {
            console.error("[Webhook] MP_ACCESS_TOKEN not configured");
            return { success: false, message: "Payment provider not configured" };
        }

        let paymentData: any;
        try {
            const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${mpAccessToken}` }
            });

            if (!res.ok) {
                console.error(`[Webhook] Failed to fetch payment from MP: ${res.status}`);
                return { success: false, message: "Could not verify payment with provider" };
            }

            paymentData = await res.json();
            console.log(`[Webhook] Payment status: ${paymentData.status}`);
        } catch (e) {
            console.error("[Webhook] MP Fetch Error:", e);
            return { success: false, message: "Could not verify payment with provider" };
        }

        // 2. Check payment status
        if (paymentData.status !== 'approved') {
            console.log(`[Webhook] Payment not approved yet: ${paymentData.status}`);
            return { success: false, message: `Payment status is ${paymentData.status}` };
        }

        // 3. Extract metadata
        const metadata = paymentData.metadata || {};
        const planId = metadata.plan_id;
        const billingPeriod = metadata.billing_period;
        const preferenceId = paymentData.preference_id;

        if (!planId || !billingPeriod) {
            console.error("[Webhook] Missing plan_id or billing_period in metadata");
            return { success: false, message: "Invalid payment metadata" };
        }

        if (!db) throw new Error("Firestore not initialized");

        try {
            // 4. Find pending payment record by preference_id
            const paymentsRef = collection(db, PAYMENTS_COLLECTION);
            const q = query(
                paymentsRef,
                where("preferenceId", "==", preferenceId),
                where("status", "==", "pending")
            );
            const pendingPayments = await getDocs(q);

            if (pendingPayments.empty) {
                console.error("[Webhook] No pending payment found for preference:", preferenceId);
                return { success: false, message: "No pending payment found" };
            }

            const pendingPayment = pendingPayments.docs[0];
            const userId = pendingPayment.data().userId;

            console.log(`[Webhook] Found pending payment for user: ${userId}`);

            // 5. Get plan details
            const plan = await subscriptionService.getPlanById(planId);
            if (!plan) {
                console.error("[Webhook] Plan not found:", planId);
                return { success: false, message: "Plan not found" };
            }

            // 6. Calculate subscription dates and price
            const startDate = new Date();
            const endDate = new Date(startDate);
            const price = billingPeriod === 'yearly' ? plan.price.yearly : plan.price.monthly;

            if (billingPeriod === 'yearly') {
                endDate.setFullYear(endDate.getFullYear() + 1);
            } else {
                endDate.setMonth(endDate.getMonth() + 1);
            }

            // 7. Check if user already has an active subscription
            const existingSubscription = await subscriptionService.getUserSubscription(userId);

            if (existingSubscription) {
                // Extend existing subscription
                console.log(`[Webhook] Extending existing subscription for user: ${userId}`);

                const newEndDate = new Date(existingSubscription.endDate);
                if (billingPeriod === 'yearly') {
                    newEndDate.setFullYear(newEndDate.getFullYear() + 1);
                } else {
                    newEndDate.setMonth(newEndDate.getMonth() + 1);
                }

                await subscriptionService.updateSubscription(existingSubscription.id, {
                    endDate: newEndDate,
                    lastPaymentDate: startDate,
                    status: 'active'
                });
            } else {
                // Create new subscription
                console.log(`[Webhook] Creating new subscription for user: ${userId}`);

                await subscriptionService.createSubscription({
                    userId,
                    planId,
                    planTier: plan.tier,
                    status: 'active',
                    billingPeriod: billingPeriod as 'monthly' | 'yearly',
                    amount: price,
                    currency: 'ARS',
                    startDate,
                    endDate,
                    paymentMethod: 'mercadopago',
                    lastPaymentDate: startDate,
                    nextPaymentDate: endDate,
                    usage: {
                        properties: 0,
                        users: 0,
                        clients: 0,
                        tasaciones: 0,
                        aiCredits: 0
                    }
                });
            }

            // 8. Update payment record
            await updateDoc(doc(db, PAYMENTS_COLLECTION, pendingPayment.id), {
                status: 'completed',
                providerPaymentId: String(paymentId),
                amount: paymentData.transaction_amount,
                updatedAt: Timestamp.now()
            });

            // 9. Send notifications
            try {
                const { notificationService } = await import("./notificationService");

                // Notify user
                await notificationService.createNotification(
                    "¡Suscripción Activada!",
                    `Tu plan ${plan.name} ha sido activado correctamente. ¡Bienvenido!`,
                    "success",
                    userId,
                    "/dashboard/suscripcion"
                );

                // Notify admin
                await notificationService.createNotification(
                    "Nueva Suscripción",
                    `Usuario ${userId} activó el plan ${plan.name} (${billingPeriod})`,
                    "success",
                    "Administrador",
                    "/dashboard/admin/suscripciones"
                );
            } catch (error) {
                console.error("[Webhook] Error sending notifications:", error);
            }

            console.log(`✅ [Webhook] Subscription activated successfully for user: ${userId}`);
            return { success: true, message: "Subscription activated successfully" };

        } catch (error: any) {
            console.error("[Webhook] Error processing subscription:", error);
            return { success: false, message: error.message };
        }
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

    checkUsageLimit: async (userId: string, resource: 'properties' | 'clients'): Promise<{ allowed: boolean; current: number; limit: number | string }> => {
        if (!db) throw new Error("Firestore not initialized");

        // 1. Get Plan Limits
        const subscription = await subscriptionService.getUserSubscription(userId);
        let limit: number | 'unlimited' = 5; // Default Free Limit

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
            limit = resource === 'properties' ? 10 : 5;
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
};
