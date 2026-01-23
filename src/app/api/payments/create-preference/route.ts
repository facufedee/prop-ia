import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { configService } from "@/infrastructure/services/configService";
import { subscriptionService } from "@/infrastructure/services/subscriptionService";
import { db } from "@/infrastructure/firebase/client";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export async function POST(request: Request) {
    try {
        // Parse request body to get plan information
        const body = await request.json();
        const { planId, billing, userId } = body;
        console.log(`📡 API: Request received for userId: ${userId}, planId: ${planId}, billing: ${billing}`);

        if (!planId || !billing) {
            return NextResponse.json(
                { error: "Missing planId or billing parameter" },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { error: "User not authenticated" },
                { status: 401 }
            );
        }

        // Fetch plan data from Firestore
        const plan = await subscriptionService.getPlanById(planId);

        if (!plan) {
            return NextResponse.json(
                { error: "Plan not found" },
                { status: 404 }
            );
        }

        // Dynamically fetch the Active Access Token from Firestore via configService.
        const mpConfig = await configService.getMercadoPagoConfig(true); // Decrypt keys
        if (!mpConfig) {
            return NextResponse.json(
                { error: "Mercado Pago configuration not found." },
                { status: 500 }
            );
        }

        const activeEnv = mpConfig.activeMode;
        const activeMPConfig = mpConfig[activeEnv];

        if (!activeMPConfig.publicKey || !activeMPConfig.accessToken) {
            return NextResponse.json(
                { error: `Active Mercado Pago ${activeEnv} keys are missing.` },
                { status: 500 }
            );
        }

        const sdkClient = new MercadoPagoConfig({
            accessToken: activeMPConfig.accessToken,
            options: { timeout: 5000 }
        });

        const mpPreference = new Preference(sdkClient);

        // Calculate price based on billing period
        const price = billing === 'monthly' ? plan.price.monthly : plan.price.yearly;
        const billingLabel = billing === 'monthly' ? 'Mensual' : 'Anual';

        // Base URL for redirects
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // Mercado Pago rejects the request with a 403 if notification_url is not HTTPS or is localhost
        const isLocal = baseUrl.includes('localhost');
        const notificationUrl = isLocal ? undefined : `${baseUrl}/api/webhooks/mercadopago`;

        console.log(`📦 API: Found plan "${plan.name}" at price $${price} using ${activeEnv} mode`);
        console.log(`🔑 Token check: Prefix is ${activeMPConfig.accessToken.substring(0, 8)}...`);

        // Create Mercado Pago preference with real plan data
        const preferenceBody: any = {
            items: [
                {
                    id: planId,
                    title: `${plan.name} - ${billingLabel}`,
                    description: plan.description,
                    quantity: 1,
                    unit_price: price,
                    currency_id: 'ARS'
                }
            ],
            back_urls: {
                success: `${baseUrl}/checkout/success`,
                failure: `${baseUrl}/checkout/failure`,
                pending: `${baseUrl}/checkout/pending`
            },
            metadata: {
                plan_id: planId,
                billing_period: billing,
                plan_name: plan.name,
                user_id: userId
            },
            statement_descriptor: "Zeta Prop"
        };

        if (notificationUrl) {
            preferenceBody.notification_url = notificationUrl;
        }

        const result = await mpPreference.create({
            body: preferenceBody
        });

        // Validate that result has an ID
        if (!result.id) {
            console.error("Mercado Pago returned no ID:", result);
            return NextResponse.json(
                { error: "Error creating preference", details: result },
                { status: 500 }
            );
        }

        console.log("✅ Preference created successfully:", result.id);

        // Create pending payment record in Firestore
        if (!db) throw new Error("Firestore not initialized");

        const paymentRef = await addDoc(collection(db, "payments"), {
            userId,
            planId,
            billingPeriod: billing,
            amount: price,
            provider: 'mercadopago',
            preferenceId: result.id,
            status: 'pending',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });

        console.log("✅ Pending payment created:", paymentRef.id);

        return NextResponse.json({
            preference_id: result.id,
            payment_id: paymentRef.id,
            init_point: result.init_point,
            sandbox_init_point: result.sandbox_init_point
        });

    } catch (error: any) {
        console.error("❌ MercadoPago Error:", error);
        console.error("Error details:", error.cause || error.message);

        return NextResponse.json(
            { error: error.message || "Internal server error", details: error.cause },
            { status: 500 }
        );
    }
}
