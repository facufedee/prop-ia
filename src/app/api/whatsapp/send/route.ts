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

        // Meta requires clean phone number (no plus, no spaces)
        // Adjust locally if needed, e.g. strictly numbers
        // 'to' should include country code, e.g. 54911...

        const response = await fetch(`https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: to,
                type: type, // 'template'
                template: template
            }),
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
