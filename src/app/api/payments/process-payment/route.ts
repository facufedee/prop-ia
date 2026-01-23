import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { configService } from "@/infrastructure/services/configService";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { formData, transaction_amount, activeMode } = body;

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

        // 3. Create the payment
        console.log(`🚀 Process Payment: Creating payment for $${transaction_amount} in ${mpConfig.activeMode} mode...`);

        const result = await payment.create({
            body: {
                transaction_amount: Number(transaction_amount),
                token: formData.token,
                description: formData.description || "Suscripción ZetaProp",
                installments: Number(formData.installments),
                payment_method_id: formData.payment_method_id,
                issuer_id: formData.issuer_id,
                payer: {
                    email: formData.payer.email,
                    identification: {
                        type: formData.payer.identification.type,
                        number: formData.payer.identification.number
                    }
                },
                // Additional data if needed
                // notification_url: ...
            }
        });

        console.log("✅ Process Payment: Payment created:", result.id, result.status);

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
