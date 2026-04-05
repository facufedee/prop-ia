import { NextResponse } from "next/server";
import { configService } from "@/infrastructure/services/configService";

// Public endpoint — only exposes the public key (not the access token)
export async function GET() {
    try {
        const config = await configService.getMercadoPagoConfig(true);
        if (!config) {
            return NextResponse.json({ activeMode: "sandbox", publicKey: "" });
        }

        const activeMode = config.activeMode;
        const publicKey = config[activeMode]?.publicKey || "";

        return NextResponse.json({ activeMode, publicKey });
    } catch (error: any) {
        console.error("[config/mercadopago/public] Error:", error.message);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
