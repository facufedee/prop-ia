import { NextRequest, NextResponse } from "next/server";
import { subscriptionService } from "@/infrastructure/services/subscriptionService";
import crypto from "crypto";

function verifyMercadoPagoSignature(request: NextRequest, rawBody: string): boolean {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) {
        console.error("[Webhook MP] MP_WEBHOOK_SECRET is not set");
        return false;
    }

    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");
    const dataId = new URL(request.url).searchParams.get("data.id");

    if (!xSignature) return false;

    // Parse ts and hash from x-signature header (format: "ts=...,v1=...")
    const parts = Object.fromEntries(
        xSignature.split(",").map(part => part.split("=") as [string, string])
    );
    const ts = parts["ts"];
    const receivedHash = parts["v1"];
    if (!ts || !receivedHash) return false;

    // Build the signed template
    const template = [
        dataId ? `id:${dataId}` : null,
        xRequestId ? `request-id:${xRequestId}` : null,
        `ts:${ts}`,
    ]
        .filter(Boolean)
        .join(";");

    const expectedHash = crypto
        .createHmac("sha256", secret)
        .update(template)
        .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(receivedHash), Buffer.from(expectedHash));
}

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text();

        if (!verifyMercadoPagoSignature(request, rawBody)) {
            console.warn("[Webhook MP] Invalid signature — request rejected");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = JSON.parse(rawBody);
        const { type, data } = body;

        if (type === "payment" && data?.id) {
            console.log(`[Webhook MP] Processing payment ${data.id}...`);

            const result = await subscriptionService.processPaymentWebhook(data.id);

            if (result.success) {
                return NextResponse.json({ status: "success", message: result.message }, { status: 200 });
            } else {
                return NextResponse.json({ status: "ignored", message: result.message }, { status: 200 });
            }
        }

        return NextResponse.json({ status: "ignored", message: "Not a payment event" }, { status: 200 });

    } catch (error: any) {
        console.error("[Webhook MP] Error:", error.message);
        return NextResponse.json({ status: "error" }, { status: 500 });
    }
}
