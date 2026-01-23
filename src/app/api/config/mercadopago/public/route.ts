import { NextResponse } from "next/server";
import { configService } from "@/infrastructure/services/configService";

export async function GET() {
    try {
        const config = await configService.getMercadoPagoConfig(true); // Decrypt for use in frontend SDK
        if (!config) {
            return NextResponse.json({
                activeMode: 'sandbox',
                publicKey: ''
            });
        }

        const activeMode = config.activeMode;
        const publicKey = config[activeMode]?.publicKey || '';

        return NextResponse.json({
            activeMode,
            publicKey
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
