import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/infrastructure/firebase/admin";
import { configService } from "@/infrastructure/services/configService";
import { Plan } from "@/domain/models/Subscription";
import { PLANS } from "@/infrastructure/data/plans";

/**
 * Server-side (Admin SDK) subscription activation for the MercadoPago webhook and
 * the direct card payment route. Firestore rules make `payments`, `subscriptions`,
 * `notifications` (for other users) and `users.roleId` unwritable by an
 * unauthenticated web-SDK caller, so this flow must not use the client SDK.
 * Document shapes and statuses mirror src/infrastructure/services/subscriptionService.ts.
 */

const PLANS_COLLECTION = "plans";
const SUBSCRIPTIONS_COLLECTION = "subscriptions";
const PAYMENTS_COLLECTION = "payments";

type BillingPeriod = "monthly" | "quarterly" | "yearly";

/** Fields read from GET https://api.mercadopago.com/v1/payments/{id}. */
interface MercadoPagoPayment {
    status?: string;
    metadata?: { plan_id?: string; billing_period?: BillingPeriod };
    preference_id?: string;
    transaction_amount?: number;
}

const getPlanById = async (id: string): Promise<Plan | null> => {
    const snap = await adminDb.collection(PLANS_COLLECTION).doc(id).get();
    if (!snap.exists) {
        // Same fallback as the client service: local seed data until the plan is seeded.
        return (PLANS.find((p) => p.id === id) as Plan | undefined) || null;
    }
    const data = snap.data()!;
    return {
        id: snap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Plan;
};

const getActiveSubscription = async (userId: string): Promise<{ id: string; endDate: Date } | null> => {
    const snapshot = await adminDb
        .collection(SUBSCRIPTIONS_COLLECTION)
        .where("userId", "==", userId)
        .where("status", "==", "active")
        .orderBy("createdAt", "desc")
        .get();
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, endDate: d.data().endDate?.toDate() || new Date() };
};

const addPeriod = (date: Date, billingPeriod: BillingPeriod) => {
    if (billingPeriod === "yearly") date.setFullYear(date.getFullYear() + 1);
    else if (billingPeriod === "quarterly") date.setMonth(date.getMonth() + 3);
    else date.setMonth(date.getMonth() + 1);
};

// Same document shape as notificationService.createNotification.
const createNotification = (
    title: string,
    message: string,
    type: "info" | "success" | "warning" | "error",
    targetRole?: string,
    link?: string,
    targetUserId?: string,
) =>
    adminDb.collection("notifications").add({
        title,
        message,
        type,
        targetRole: targetRole || null,
        targetUserId: targetUserId || null,
        readBy: [],
        createdAt: Timestamp.now(),
        link: link || null,
    });

export const subscriptionAdminService = {
    /**
     * Verifies a MercadoPago payment and activates or extends the subscription of the
     * user who owns the matching pending payment. Idempotent: only a payment record in
     * status "pending" for the payment's preference is activated, then marked completed.
     */
    processPaymentWebhook: async (paymentId: string): Promise<{ success: boolean; message: string }> => {
        console.log(`[Webhook] Processing payment ${paymentId}...`);

        // 1. Fetch active MP access token from Firestore (supports sandbox/production switch)
        const mpConfig = await configService.getMercadoPagoConfig(true);

        if (!mpConfig) {
            console.error("[Webhook] Mercado Pago configuration not found in Firestore");
            return { success: false, message: "Payment provider not configured" };
        }

        const activeEnv = mpConfig.activeMode;
        const mpAccessToken = mpConfig[activeEnv]?.accessToken;

        if (!mpAccessToken) {
            console.error(`[Webhook] MP_ACCESS_TOKEN not configured for mode: ${activeEnv}`);
            return { success: false, message: "Payment provider token not configured" };
        }

        console.log(`[Webhook] Using ${activeEnv} mode with token prefix: ${mpAccessToken.substring(0, 8)}...`);

        let paymentData: MercadoPagoPayment;
        try {
            const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { Authorization: `Bearer ${mpAccessToken}` },
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
        if (paymentData.status !== "approved") {
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

        try {
            // 4. Find pending payment record by preference_id
            const pendingPayments = await adminDb
                .collection(PAYMENTS_COLLECTION)
                .where("preferenceId", "==", preferenceId)
                .where("status", "==", "pending")
                .get();

            if (pendingPayments.empty) {
                console.error("[Webhook] No pending payment found for preference:", preferenceId);
                return { success: false, message: "No pending payment found" };
            }

            const pendingPayment = pendingPayments.docs[0];
            const userId = pendingPayment.data().userId;

            console.log(`[Webhook] Found pending payment for user: ${userId}`);

            // 5. Get plan details
            const plan = await getPlanById(planId);
            if (!plan) {
                console.error("[Webhook] Plan not found:", planId);
                return { success: false, message: "Plan not found" };
            }

            // 6. Calculate subscription dates and price
            const startDate = new Date();
            const endDate = new Date(startDate);
            const price =
                billingPeriod === "yearly" ? plan.price.yearly :
                billingPeriod === "quarterly" ? (plan.price.quarterly ?? Math.round(plan.price.yearly / 4)) :
                plan.price.monthly;
            addPeriod(endDate, billingPeriod);

            // 7. Extend the active subscription or create a new one
            const existingSubscription = await getActiveSubscription(userId);
            let accessUntil = endDate;

            if (existingSubscription) {
                console.log(`[Webhook] Extending existing subscription for user: ${userId}`);
                const newEndDate = new Date(existingSubscription.endDate);
                addPeriod(newEndDate, billingPeriod);
                accessUntil = newEndDate;

                await adminDb.collection(SUBSCRIPTIONS_COLLECTION).doc(existingSubscription.id).update({
                    endDate: Timestamp.fromDate(newEndDate),
                    lastPaymentDate: startDate,
                    status: "active",
                    updatedAt: Timestamp.now(),
                });
            } else {
                console.log(`[Webhook] Creating new subscription for user: ${userId}`);
                await adminDb.collection(SUBSCRIPTIONS_COLLECTION).add({
                    userId,
                    planId,
                    planTier: plan.tier,
                    status: "active",
                    billingPeriod: billingPeriod as "monthly" | "yearly",
                    amount: price,
                    currency: "ARS",
                    startDate: Timestamp.fromDate(startDate),
                    endDate: Timestamp.fromDate(endDate),
                    paymentMethod: "mercadopago",
                    lastPaymentDate: startDate,
                    nextPaymentDate: endDate,
                    usage: {
                        properties: 0,
                        users: 0,
                        clients: 0,
                        tasaciones: 0,
                        aiCredits: 0,
                    },
                    trialEndDate: null,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                });
            }

            // 7.1 Mirror the paid access window into the user doc (read by Firestore rules).
            await adminDb.collection("users").doc(userId).set(
                { accessUntil: Timestamp.fromDate(accessUntil) },
                { merge: true },
            );

            // 7.5 Update user role based on plan ("Cliente Pro" / "Cliente Enterprise")
            try {
                const rolesSnap = await adminDb.collection("roles").get();
                const roles = rolesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as { id: string; name?: string }));

                let targetRoleName = "Cliente Free";
                const tier = String(plan.tier || "").toLowerCase();
                const name = String(plan.name || "").toLowerCase();

                if (tier === "pro" || name.includes("pro")) {
                    targetRoleName = "Cliente Pro";
                } else if (tier === "enterprise" || name.includes("enterprise")) {
                    targetRoleName = "Cliente Enterprise";
                }

                if (targetRoleName !== "Cliente Free") {
                    const targetRole = roles.find((r) => r.name === targetRoleName);
                    if (targetRole) {
                        console.log(`[Webhook] Upgrading user ${userId} to role: ${targetRoleName}`);
                        await adminDb.collection("users").doc(userId).update({ roleId: targetRole.id });
                    } else {
                        console.warn(`[Webhook] Target role ${targetRoleName} not found for upgrade.`);
                    }
                }
            } catch (error) {
                console.error("[Webhook] Error updating user role:", error);
            }

            // 8. Update payment record
            await adminDb.collection(PAYMENTS_COLLECTION).doc(pendingPayment.id).update({
                status: "completed",
                providerPaymentId: String(paymentId),
                amount: paymentData.transaction_amount,
                updatedAt: Timestamp.now(),
            });

            // 9. Send notifications (same arguments as the former client-side flow)
            try {
                await createNotification(
                    "¡Suscripción Activada!",
                    `Tu plan ${plan.name} ha sido activado correctamente. ¡Bienvenido!`,
                    "success",
                    userId,
                    "/dashboard/suscripcion",
                );
                await createNotification(
                    "Nueva Suscripción",
                    `Usuario ${userId} activó el plan ${plan.name} (${billingPeriod})`,
                    "success",
                    "Administrador",
                    "/dashboard/admin/suscripciones",
                );
            } catch (error) {
                console.error("[Webhook] Error sending notifications:", error);
            }

            // Trigger Email Notification (Email)
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zetaprop.com.ar";
            fetch(`${baseUrl}/api/notifications/trigger`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event: "newPayment",
                    data: {
                        userId,
                        plan: plan.name,
                        amount: price,
                        period: billingPeriod,
                        paymentId,
                    },
                    subject: "Nuevo Pago Recibido",
                    message: `Se ha procesado un pago exitoso:<br/>
                              <strong>Usuario:</strong> ${userId}<br/>
                              <strong>Plan:</strong> ${plan.name} (${billingPeriod})<br/>
                              <strong>Monto:</strong> $${price}<br/>
                              <strong>Ref:</strong> ${paymentId}`,
                }),
            }).catch((err) => console.error("Failed to trigger email notification:", err));

            // Send Marketing Email via Resend (fire-and-forget)
            void (async () => {
                try {
                    const userSnap = await adminDb.collection("users").doc(userId).get();
                    if (userSnap.exists) {
                        const userData = userSnap.data();
                        const userEmail = userData?.email;
                        if (userEmail) {
                            const endDateFormatted = endDate.toLocaleDateString("es-AR", {
                                year: "numeric", month: "long", day: "numeric",
                            });
                            await fetch(`${baseUrl}/api/marketing/send`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    type: "payment_confirmed",
                                    to: userEmail,
                                    data: {
                                        userName: userData?.displayName || userData?.name,
                                        planName: plan.name,
                                        amount: price,
                                        period: billingPeriod,
                                        endDate: endDateFormatted,
                                    },
                                }),
                            });
                        }
                    }
                } catch (emailErr) {
                    console.error("[Webhook] Marketing email send failed:", emailErr);
                }
            })();

            console.log(`✅ [Webhook] Subscription activated successfully for user: ${userId}`);
            return { success: true, message: "Subscription activated successfully" };
        } catch (error: unknown) {
            console.error("[Webhook] Error processing subscription:", error);
            return { success: false, message: error instanceof Error ? error.message : String(error) };
        }
    },
};
