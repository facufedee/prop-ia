import { NextRequest, NextResponse } from "next/server";
import MercadoPagoConfig, { Preference } from "mercadopago";

// Initialize MercadoPago client
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || "",
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { planId, planName, price, billing, user } = body;

        if (!process.env.MP_ACCESS_TOKEN) {
            return NextResponse.json(
                { error: "MercadoPago Access Token not configured" },
                { status: 500 }
            );
        }

        const preference = new Preference(client);

        const result = await preference.create({
            body: {
                items: [
                    {
                        id: planId,
                        title: `PropIA - Plan ${planName} (${billing === 'yearly' ? 'Anual' : 'Mensual'})`,
                        quantity: 1,
                        unit_price: Number(price),
                        currency_id: "ARS",
                    },
                ],
                payer: {
                    name: user.name,
                    email: user.email,
                    phone: {
                        area_code: "",
                        number: user.phone,
                    },
                    address: {
                        street_name: user.address,
                        street_number: "",
                        zip_code: "",
                    }
                },
                back_urls: {
                    success: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?payment=success`,
                    failure: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkout?payment=failure`,
                    pending: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkout?payment=pending`,
                },
                auto_return: "approved",
                metadata: {
                    plan_id: planId,
                    billing_cycle: billing,
                    user_email: user.email,
                    company: user.company,
                    cuit: user.cuit
                }
            },
        });

        return NextResponse.json({
            id: result.id,
            init_point: result.init_point,
        });

    } catch (error: any) {
        console.error("Error creating preference:", error);
        return NextResponse.json(
            { error: error.message || "Error creating payment preference" },
            { status: 500 }
        );
    }
}
