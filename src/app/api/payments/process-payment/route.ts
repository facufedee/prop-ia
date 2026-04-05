import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { configService } from "@/infrastructure/services/configService";
import { subscriptionService } from "@/infrastructure/services/subscriptionService";
import { verifyAuth } from "@/lib/apiAuth";

export async function POST(req: NextRequest) {
    const authResult = await verifyAuth(req);
    if (authResult.error) return authResult.error;

    try {
        const body = await req.json();
        const { formData, transaction_amount, planId, userId, billing } = body;

        // Ensure the userId in the body matches the authenticated user
        if (userId && userId !== authResult.user.uid) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const mpConfig = await configService.getMercadoPagoConfig(true);

        if (!mpConfig) {
            console.error("❌ Process Payment: Config not found");
            return NextResponse.json({ error: "Configuration not found" }, { status: 500 });
        }

        const activeEnv = mpConfig.activeMode;
        const activeConfig = mpConfig[activeEnv];

        if (!activeConfig?.accessToken) {
            console.error(`❌ Process Payment: Missing Access Token for ${activeEnv}`);
            return NextResponse.json({ error: "Payment configuration incomplete" }, { status: 500 });
        }

        const client = new MercadoPagoConfig({
            accessToken: activeConfig.accessToken,
            options: { timeout: 10000 },
        });

        const payment = new Payment(client);

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
                    number: formData.payer.identification?.number || "",
                },
            },
            metadata: {
                plan_id: planId,
                billing_period: billing,
                user_id: authResult.user.uid,
            },
        };

        if (formData.issuer_id) {
            paymentBody.issuer_id = formData.issuer_id;
        }

        const result = await payment.create({ body: paymentBody });

        if (result.status === "approved" && result.id) {
            const activationResult = await subscriptionService.processPaymentWebhook(String(result.id));
            console.log(`[Direct Activation] ${activationResult.message}`);
        }

        return NextResponse.json({
            id: result.id,
            status: result.status,
            status_detail: result.status_detail,
        });
    } catch (error: any) {
        console.error("❌ Process Payment Error:", error.message);
        return NextResponse.json({ error: "Error procesando el pago" }, { status: 500 });
    }
}
