import { NextRequest, NextResponse } from "next/server";
import { configService, MercadoPagoConfig } from "@/infrastructure/services/configService";
import { verifyAdmin } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
    const authResult = await verifyAdmin(request);
    if (authResult.error) return authResult.error;

    try {
        const config = await configService.getMercadoPagoConfig(true);
        if (!config) {
            return NextResponse.json({
                activeMode: "sandbox",
                sandbox: { publicKey: "", accessToken: "" },
                production: { publicKey: "", accessToken: "" },
            });
        }
        return NextResponse.json(config);
    } catch (error: any) {
        console.error("API MP Config GET Error:", error.message);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const authResult = await verifyAdmin(request);
    if (authResult.error) return authResult.error;

    try {
        const body = await request.json();
        const { activeMode, sandbox, production } = body;

        const config: MercadoPagoConfig = {
            activeMode: activeMode === "production" ? "production" : "sandbox",
            sandbox: {
                publicKey: sandbox?.publicKey || "",
                accessToken: sandbox?.accessToken || "",
            },
            production: {
                publicKey: production?.publicKey || "",
                accessToken: production?.accessToken || "",
            },
        };

        await configService.saveMercadoPagoConfig(config);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("API MP Config POST Error:", error.message);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
