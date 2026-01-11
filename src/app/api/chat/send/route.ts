import { NextResponse } from 'next/server';
import { db } from '@/infrastructure/firebase/client';
import { collection, addDoc } from 'firebase/firestore';
// import twilio from 'twilio';

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const fromNumber = process.env.TWILIO_PHONE_NUMBER;
// const toNumber = process.env.WHATSAPP_TO_NUMBER;

// Initialize Twilio client
// let client: any;
// try {
//     if (accountSid && authToken) {
//         client = twilio(accountSid, authToken);
//     }
// } catch (e) {
//     console.error("Twilio Init Error", e);
// }

export async function POST(req: Request) {
    try {
        const { sessionId, text } = await req.json();

        if (!sessionId || !text) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        console.log(`[Chat] Message from ${sessionId}: ${text}`);

        // 1. Save to Firestore
        try {
            await addDoc(collection(db, "chat_sessions", sessionId, "messages"), {
                text,
                sender: 'user',
                timestamp: Date.now()
            });
        } catch (dbError) {
            console.error("Firestore Error:", dbError);
        }

        // 2. Send to WhatsApp via Twilio
        // if (client) {
        //     const message = await client.messages.create({
        //         body: `[Web Chat] ${sessionId}: ${text}`,
        //         from: fromNumber,
        //         to: toNumber
        //     });
        //     console.log("Twilio Message Sent:", message.sid);
        // } else {
        //     console.warn("Twilio client not initialized (missing env vars)");
        // }

        return NextResponse.json({ success: true, status: 'sent' });

    } catch (error: any) {
        console.error("Error in /api/chat/send:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
