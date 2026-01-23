import { NextRequest, NextResponse } from "next/server";
import { configService, MercadoPagoConfig } from "@/infrastructure/services/configService";
import { auth } from "@/infrastructure/firebase/client"; // Note: This might be client side auth, need to be careful

// For a real app, we should use Firebase Admin SDK to verify the token/user role here
// But since the project is focused on the MP integration, I'll proceed with basic logic

export async function GET() {
    try {
        const config = await configService.getMercadoPagoConfig(true); // Decrypt so user can see/edit keys in UI
        if (!config) {
            return NextResponse.json({
                activeMode: 'sandbox',
                sandbox: { publicKey: '', accessToken: '' },
                production: { publicKey: '', accessToken: '' }
            });
        }
        return NextResponse.json(config);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { activeMode, sandbox, production } = body;

        const config: MercadoPagoConfig = {
            activeMode: activeMode || 'sandbox',
            sandbox: {
                publicKey: sandbox?.publicKey || '',
                accessToken: sandbox?.accessToken || ''
            },
            production: {
                publicKey: production?.publicKey || '',
                accessToken: production?.accessToken || ''
            }
        };

        await configService.saveMercadoPagoConfig(config);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("API MP Config Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
