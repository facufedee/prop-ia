import { NextRequest, NextResponse } from "next/server";
import { subscriptionService } from "@/infrastructure/services/subscriptionService";
import { createHmac } from "crypto";

function validateSignature(request: NextRequest, rawBody: string): boolean {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) {
        console.warn("[Webhook] MP_WEBHOOK_SECRET not set, skipping signature validation");
        return true;
    }

    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");
    const dataId = new URL(request.url).searchParams.get("data.id");

    if (!xSignature) {
        console.warn("[Webhook] No x-signature header found, allowing through");
        return true;
    }

    // Parse ts and v1 from x-signature header: "ts=...,v1=..."
    const parts = Object.fromEntries(
        xSignature.split(",").map(part => part.split("=") as [string, string])
    );
    const ts = parts["ts"];
    const v1 = parts["v1"];

    if (!ts || !v1) {
        console.warn("[Webhook] Invalid x-signature format");
        return false;
    }

    // Build the manifest string
    const manifest = [
        dataId ? `id:${dataId}` : null,
        xRequestId ? `request-id:${xRequestId}` : null,
        `ts:${ts}`,
    ].filter(Boolean).join(";");

    const expectedHash = createHmac("sha256", secret).update(manifest).digest("hex");

    if (expectedHash !== v1) {
        console.error("[Webhook] Signature mismatch");
        return false;
    }

    return true;
}

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text();

        if (!validateSignature(request, rawBody)) {
            return NextResponse.json({ status: "unauthorized" }, { status: 401 });
        }

        const body = JSON.parse(rawBody);
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
                return NextResponse.json({ status: "ignored", message: result.message }, { status: 200 });
            }
        }

        return NextResponse.json({ status: "ignored", message: "Not a payment event" }, { status: 200 });

    } catch (error: any) {
        console.error("[Webhook] Error:", error);
        return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }
}
