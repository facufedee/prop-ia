import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { configService } from "@/infrastructure/services/configService";
import { subscriptionService } from "@/infrastructure/services/subscriptionService";
import { db } from "@/infrastructure/firebase/client";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { verifyAuth } from "@/lib/apiAuth";

export async function POST(request: NextRequest) {
    const authResult = await verifyAuth(request);
    if (authResult.error) return authResult.error;

    try {
        const body = await request.json();
        const { planId, billing, creditAmount = 0 } = body;

        if (!planId || !billing) {
            return NextResponse.json({ error: "Missing planId or billing parameter" }, { status: 400 });
        }

        const plan = await subscriptionService.getPlanById(planId);
        if (!plan) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }

        const mpConfig = await configService.getMercadoPagoConfig(true);
        if (!mpConfig) {
            return NextResponse.json({ error: "Payment configuration not found" }, { status: 500 });
        }

        const activeEnv = mpConfig.activeMode;
        const activeMPConfig = mpConfig[activeEnv];

        if (!activeMPConfig.publicKey || !activeMPConfig.accessToken) {
            return NextResponse.json({ error: "Payment configuration incomplete" }, { status: 500 });
        }

        const sdkClient = new MercadoPagoConfig({
            accessToken: activeMPConfig.accessToken,
            options: { timeout: 5000 },
        });

        const mpPreference = new Preference(sdkClient);

        const basePrice =
            billing === "yearly" ? plan.price.yearly :
            billing === "quarterly" ? (plan.price.quarterly ?? Math.round(plan.price.yearly / 4)) :
            plan.price.monthly;

        const credit = Math.min(Number(creditAmount) || 0, basePrice - 1);
        const price = Math.max(basePrice - credit, 1);
        const billingLabel =
            billing === "yearly" ? "Anual" :
            billing === "quarterly" ? "3 Meses" :
            "Mensual";

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const isLocal = baseUrl.includes("localhost");
        const notificationUrl = isLocal ? undefined : `${baseUrl}/api/webhooks/mercadopago`;

        const preferenceBody: any = {
            items: [
                {
                    id: planId,
                    title: `${plan.name} - ${billingLabel}`,
                    description: plan.description,
                    quantity: 1,
                    unit_price: price,
                    currency_id: "ARS",
                },
            ],
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
        };

        if (notificationUrl) {
            preferenceBody.notification_url = notificationUrl;
        }

        const result = await mpPreference.create({ body: preferenceBody });

        if (!result.id) {
            console.error("Mercado Pago returned no ID:", result);
            return NextResponse.json({ error: "Error creating payment preference" }, { status: 500 });
        }

        if (!db) throw new Error("Firestore not initialized");

        const paymentRef = await addDoc(collection(db, "payments"), {
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
            checkout_url: activeEnv === "sandbox" ? result.sandbox_init_point : result.init_point,
        });
    } catch (error: any) {
        console.error("❌ Create Preference Error:", error.message);
        return NextResponse.json({ error: "Error creando preferencia de pago" }, { status: 500 });
    }
}
