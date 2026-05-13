import { NextRequest, NextResponse } from "next/server";
import { db } from "@/infrastructure/firebase/client";
import { collection, addDoc } from "firebase/firestore";
import crypto from "crypto";

function verifyTwilioSignature(request: NextRequest, params: Record<string, string>): boolean {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) {
        console.error("[Webhook Twilio] TWILIO_AUTH_TOKEN is not set");
        return false;
    }

    const twilioSignature = request.headers.get("x-twilio-signature");
    if (!twilioSignature) return false;

    // Build the full URL Twilio used to call this endpoint
    const url = process.env.TWILIO_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`;

    // Sort params alphabetically and concatenate key+value pairs
    const sortedParams = Object.keys(params)
        .sort()
        .reduce((acc, key) => acc + key + params[key], "");

    const expectedSignature = crypto
        .createHmac("sha1", authToken)
        .update(url + sortedParams)
        .digest("base64");

    return crypto.timingSafeEqual(
        Buffer.from(twilioSignature),
        Buffer.from(expectedSignature)
    );
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const params: Record<string, string> = {};
        formData.forEach((value, key) => {
            params[key] = value as string;
        });

        if (!verifyTwilioSignature(req, params)) {
            console.warn("[Webhook Twilio] Invalid signature — request rejected");
            return new NextResponse("<Response></Response>", {
                status: 403,
                headers: { "Content-Type": "text/xml" },
            });
        }

        const Body = params["Body"] ?? "";
        const From = params["From"] ?? ""; // e.g. whatsapp:+5491112345678

        if (Body && From) {
            // Use the phone number as the session ID
            const targetSessionId = From.replace(/[^a-zA-Z0-9+]/g, '');

            // Ensure the session document exists (upsert)
            // We use setDoc with merge to not overwrite existing data like 'userName' if any
            const { setDoc, doc } = require("firebase/firestore");
            await setDoc(doc(db, "chat_sessions", targetSessionId), {
                phone: From,
                lastMessageAt: Date.now(),
                channel: "whatsapp"
            }, { merge: true });

            await addDoc(collection(db, "chat_sessions", targetSessionId, "messages"), {
                text: Body.trim(),
                sender: "user",
                timestamp: Date.now(),
                channel: "whatsapp"
            });
        }

        return new NextResponse("<Response></Response>", {
            headers: { "Content-Type": "text/xml" },
        });

    } catch (error: any) {
        console.error("[Webhook Twilio] Error:", error.message);
        return new NextResponse("<Response></Response>", {
            status: 500,
            headers: { "Content-Type": "text/xml" },
        });
    }
}
