import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { configService } from "@/infrastructure/services/configService";
import { subscriptionService } from "@/infrastructure/services/subscriptionService";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { formData, transaction_amount, planId, userId, billing } = body;

        // 1. Get the ACTIVE Access Token (dynamically, like we do for public key)
        const mpConfig = await configService.getMercadoPagoConfig(true); // Decrypted

        if (!mpConfig) {
            console.error("❌ Process Payment: Config not found");
            return NextResponse.json({ error: "Configuration not found" }, { status: 500 });
        }

        const activeEnv = mpConfig.activeMode;
        const activeConfig = mpConfig[activeEnv];

        if (!activeConfig || !activeConfig.accessToken) {
            console.error(`❌ Process Payment: Missing Access Token for ${activeEnv}`);
            return NextResponse.json({ error: "Access Token missing" }, { status: 500 });
        }

        // 2. Initialize Mercado Pago with the Active Token
        const client = new MercadoPagoConfig({
            accessToken: activeConfig.accessToken,
            options: { timeout: 10000 }
        });

        const payment = new Payment(client);

        // 3. Create the payment with full metadata to allow webhook activation
        console.log(`🚀 Process Payment: Creating payment for $${transaction_amount} in ${mpConfig.activeMode} mode...`);
        console.log(`📋 formData received:`, JSON.stringify({
            payment_method_id: formData.payment_method_id,
            installments: formData.installments,
            issuer_id: formData.issuer_id,
            token: formData.token ? `${formData.token.substring(0, 8)}...` : 'MISSING',
            payer_email: formData.payer?.email,
            identification: formData.payer?.identification,
        }));

        const paymentBody: any = {
            transaction_amount: Number(transaction_amount),
            token: formData.token,
            description: formData.description || "Suscripción ZetaProp",
            installments: Number(formData.installments) || 1,
            payment_method_id: formData.payment_method_id,
            binary_mode: true,
            payer: {
                email: formData.payer.email,
                identification: {
                    type: formData.payer.identification?.type || "DNI",
                    number: formData.payer.identification?.number || ""
                }
            },
            metadata: {
                plan_id: planId,
                billing_period: billing,
                user_id: userId
            }
        };

        if (formData.issuer_id) {
            paymentBody.issuer_id = formData.issuer_id;
        }

        console.log(`📤 Sending to MP:`, JSON.stringify(paymentBody));

        const result = await payment.create({ body: paymentBody });

        console.log("✅ Process Payment: Payment created:", result.id, result.status);

        // 4. If payment was approved immediately (e.g. debit card), activate subscription directly
        if (result.status === 'approved' && result.id) {
            console.log("✅ Payment approved immediately, triggering subscription activation...");
            const activationResult = await subscriptionService.processPaymentWebhook(String(result.id));
            console.log(`[Direct Activation] Result:`, activationResult.message);
        }

        return NextResponse.json({
            id: result.id,
            status: result.status,
            status_detail: result.status_detail,
        });

    } catch (error: any) {
        console.error("❌ Process Payment Error:", error);
        return NextResponse.json({
            error: error.message || "Error processing payment",
            details: error.cause || null
        }, { status: 500 });
    }
}
