import { NextRequest, NextResponse } from "next/server";
import { subscriptionService } from "@/infrastructure/services/subscriptionService";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, data } = body;

        // MercadoPago sends 'payment' type webhooks
        if (type === "payment" && data?.id) {
            console.log(`[Webhook] Processing payment ${data.id}...`);

            const result = await subscriptionService.processPaymentWebhook(data.id);

            if (result.success) {
                console.log(`[Webhook] Success for payment ${data.id}: ${result.message}`);
                return NextResponse.json({ status: "success", message: result.message }, { status: 200 });
            } else {
                console.warn(`[Webhook] Failed logic for payment ${data.id}: ${result.message}`);
                // Return 200 anyway to MP to stop retries if it's a logic error (e.g. status not approved yet)
                // Return 400 only if we want retry.
                return NextResponse.json({ status: "ignored", message: result.message }, { status: 200 });
            }
        }

        return NextResponse.json({ status: "ignored", message: "Not a payment event" }, { status: 200 });

    } catch (error: any) {
        console.error("[Webhook] Error:", error);
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
