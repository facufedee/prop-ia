import { NextResponse } from 'next/server';

// Meta Cloud API Setup
const WHATSAPP_TOKEN = process.env.WHATSAPP_API_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const API_VERSION = 'v17.0';

export async function POST(request: Request) {
    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
        // En desarrollo, logueamos que falta configuración pero no fallamos feo
        console.warn("WhatsApp API credentials missing in .env");
        return NextResponse.json({
            success: false,
            message: "WhatsApp not configured (Missing Envs)"
        }, { status: 200 }); // Return 200 to not break client flow, just log it.
    }

    try {
        const body = await request.json();
        const { to, type, template } = body;

        // Meta requires clean phone number (no plus, no spaces, no dashes)
        const cleanTo = to.replace(/\D/g, ''); // Removes everything except digits


        // Prepare payload dynamically based on type
        const payload: any = {
            messaging_product: 'whatsapp',
            to: cleanTo,
            type: type, // 'template' or 'text'
        };

        if (type === 'template') {
            payload.template = template;
        } else if (type === 'text') {
            // body has { to, type, text: { body: "..." } }
            // API expects 'text': { 'body': '...' }
            // The incoming request body likely has `text: { body: message }` already
            payload.text = body.text;
        }

        const response = await fetch(`https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Meta API Error:", data);
            return NextResponse.json({ error: data }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Internal API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
