import { NextRequest, NextResponse } from "next/server";
import MercadoPagoConfig, { Payment } from "mercadopago";

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || "",
});

export async function POST(req: NextRequest) {
    try {
        // 1. Validate the request
        const body = await req.json();
        const { type, data } = body;

        if (type === "payment") {
            // 2. Fetch the payment status from MercadoPago to verify it's real
            const payment = new Payment(client);
            const paymentInfo = await payment.get({ id: data.id });

            // 3. Handle the payment status
            if (paymentInfo.status === "approved") {
                // TODO: Update user subscription in your database
                // Example: await updateUserSubscription(paymentInfo.metadata.user_email, paymentInfo.metadata.plan_id);
                console.log(`Payment approved for user: ${paymentInfo.metadata.user_email}`);
            }
        }

        // 4. Always return 200 OK to MercadoPago
        return NextResponse.json({ status: "success" });

    } catch (error) {
        console.error("Webhook error:", error);
        return NextResponse.json({ status: "error" }, { status: 500 });
    }
}
