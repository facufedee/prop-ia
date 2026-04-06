import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { decryptConfigValue } from "@/infrastructure/services/configService";
import { adminDb } from "@/infrastructure/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { verifyAuth } from "@/lib/apiAuth";

/** Read and decrypt the MercadoPago config using the Admin SDK (bypasses Firestore auth rules). */
async function getMpConfig() {
    const snap = await adminDb.collection("configurations").doc("mercadopago").get();
    if (!snap.exists) return null;
    const data = snap.data()!;

    const mode: "sandbox" | "production" = data.activeMode ?? data.mode ?? "sandbox";
    const raw = data[mode] ?? {};
    // Support old flat structure too
    const rawKey   = raw.publicKey   ?? (data.mode === mode ? data.publicKey   : "");
    const rawToken = raw.accessToken ?? (data.mode === mode ? data.accessToken : "");

    return {
        mode,
        publicKey:   decryptConfigValue(rawKey),
        accessToken: decryptConfigValue(rawToken),
    };
}

export async function POST(request: NextRequest) {
    const authResult = await verifyAuth(request);
    if (authResult.error) return authResult.error;

    try {
        const body = await request.json();
        const { planId, billing, creditAmount = 0 } = body;

        if (!planId || !billing) {
            return NextResponse.json({ error: "Missing planId or billing parameter" }, { status: 400 });
        }

        // Read plan via adminDb
        const planSnap = await adminDb.collection("plans").doc(planId).get();
        if (!planSnap.exists) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }
        const plan = planSnap.data()!;

        // Read MP config via adminDb + decrypt
        const mpConfig = await getMpConfig();
        if (!mpConfig) {
            return NextResponse.json({ error: "Payment configuration not found" }, { status: 500 });
        }
        if (!mpConfig.publicKey || !mpConfig.accessToken) {
            return NextResponse.json({ error: "Payment configuration incomplete" }, { status: 500 });
        }

        const sdkClient = new MercadoPagoConfig({
            accessToken: mpConfig.accessToken,
            options: { timeout: 5000 },
        });
        const mpPreference = new Preference(sdkClient);

        const basePrice =
            billing === "yearly"    ? plan.price.yearly :
            billing === "quarterly" ? (plan.price.quarterly ?? Math.round(plan.price.yearly / 4)) :
            plan.price.monthly;

        const credit = Math.min(Number(creditAmount) || 0, basePrice - 1);
        const price  = Math.max(basePrice - credit, 1);
        const billingLabel =
            billing === "yearly"    ? "Anual" :
            billing === "quarterly" ? "3 Meses" :
            "Mensual";

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const isLocal = baseUrl.includes("localhost");

        const preferenceBody: any = {
            items: [{
                id: planId,
                title: `${plan.name} - ${billingLabel}`,
                description: plan.description,
                quantity: 1,
                unit_price: price,
                currency_id: "ARS",
            }],
            back_urls: {
                success: `${baseUrl}/checkout/success`,
                failure: `${baseUrl}/checkout/failure`,
                pending: `${baseUrl}/checkout/pending`,
            },
            ...(isLocal ? {} : { auto_return: "approved" }),
            metadata: {
                plan_id: planId,
                billing_period: billing,
                plan_name: plan.name,
                user_id: authResult.user.uid,
                credit_applied: credit,
                base_amount: basePrice,
            },
            statement_descriptor: "Zeta Prop",
            ...(!isLocal && { notification_url: `${baseUrl}/api/webhooks/mercadopago` }),
        };

        const result = await mpPreference.create({ body: preferenceBody });

        if (!result.id) {
            console.error("Mercado Pago returned no ID:", result);
            return NextResponse.json({ error: "Error creating payment preference" }, { status: 500 });
        }

        // Save payment record via adminDb
        const paymentRef = await adminDb.collection("payments").add({
            userId: authResult.user.uid,
            planId,
            billingPeriod: billing,
            amount: price,
            baseAmount: basePrice,
            creditApplied: credit,
            provider: "mercadopago",
            preferenceId: result.id,
            status: "pending",
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });

        return NextResponse.json({
            preference_id: result.id,
            payment_id: paymentRef.id,
            checkout_url: mpConfig.mode === "sandbox" ? result.sandbox_init_point : result.init_point,
        });

    } catch (error: any) {
        console.error("❌ Create Preference Error:", error.message, error.cause ?? "");
        return NextResponse.json({ error: "Error creando preferencia de pago" }, { status: 500 });
    }
}
