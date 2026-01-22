import { NextResponse } from "next/server";
import { mpPreference } from "@/lib/mercadopago";
import { subscriptionService } from "@/infrastructure/services/subscriptionService";
import { db } from "@/infrastructure/firebase/client";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export async function POST(request: Request) {
    try {
        // Parse request body to get plan information
        const body = await request.json();
        const { planId, billing, userId } = body;

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

        // Calculate price based on billing period
        const price = billing === 'monthly' ? plan.price.monthly : plan.price.yearly;
        const billingLabel = billing === 'monthly' ? 'Mensual' : 'Anual';

        // Base URL for redirects
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        console.log(`Creating preference for ${plan.name} - ${billingLabel} - $${price}`);

        // Create Mercado Pago preference with real plan data
        const result = await mpPreference.create({
            body: {
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
                // Metadata to identify the subscription when webhook is received
                metadata: {
                    plan_id: planId,
                    billing_period: billing,
                    plan_name: plan.name
                },
                // Notification URL for webhooks
                notification_url: `${baseUrl}/api/webhooks/mercadopago`,
                // Statement descriptor (what appears on credit card statement)
                statement_descriptor: "Zeta Prop"
            }
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
