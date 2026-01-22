import { NextResponse } from 'next/server';
import { db } from '@/infrastructure/firebase/client';
import { collection, addDoc } from 'firebase/firestore';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const Body = formData.get('Body') as string;
        const From = formData.get('From') as string;

        console.log(`[Twilio Webhook] Received from ${From}: ${Body}`);

        // Logic to extract session ID or broadcast
        let targetSessionId = null;

        // MVP Strategy: Look for "guest_..." pattern in the message body
        // e.g. "guest_123: Hello" -> reply "Hello"
        // But the BODY is the reply from the Agent.
        // The Agent sees "[Web Chat] guest_xyz: Message".
        // The Agent replies "Hi".
        // The Body is "Hi".

        // Problem: We lost the session ID context in WhatsApp unless the Agent quotes it or we track "Last Active".
        // For MVP, we will try to find the sessionId if the agent types it, or otherwise we can't route it properly without state.
        // Let's assume for now the agent must prefix "guest_ID:" to reply specifically, OR we implement "Last Active Session" in Firestore.

        // Since we can't easily implement "Last Active" globally reliably without a dedicated "state" doc, 
        // We will just log this limitation and try to parse.

        const match = Body.match(/^(guest_[a-z0-9]+):/i);
        if (match) {
            targetSessionId = match[1];
            const replyText = Body.replace(match[0], '').trim();

            await addDoc(collection(db, "chat_sessions", targetSessionId, "messages"), {
                text: replyText,
                sender: 'agent',
                timestamp: Date.now()
            });
            console.log(`[Twilio Webhook] Saved reply to session ${targetSessionId}`);
        } else {
            console.log("[Twilio Webhook] No session ID found in reply. Agent should prefix 'guest_ID:' to route reply.");
            // Ideally we'd send a WhatsApp back saying "Who is this for?"
        }

        return new NextResponse('<Response></Response>', {
            headers: { 'Content-Type': 'text/xml' }
        });

    } catch (error: any) {
        console.error("Error in Twilio Webhook:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
