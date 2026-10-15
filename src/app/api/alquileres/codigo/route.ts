import { NextRequest, NextResponse } from "next/server";
import { alquileresAdminService } from "@/infrastructure/services/server/alquileresAdminService";
import { verifyAuth } from "@/lib/apiAuth";

/**
 * POST /api/alquileres/codigo — returns a globally unique rental code for an address.
 * Uniqueness needs a cross-account lookup that Firestore rules deny to clients,
 * so the dashboard asks the server (Admin SDK) for the code before creating a rental.
 */
export async function POST(request: NextRequest) {
    const authResult = await verifyAuth(request);
    if (authResult.error) return authResult.error;

    try {
        const body = await request.json().catch(() => ({}));
        const direccion = typeof body?.direccion === "string" ? body.direccion.slice(0, 300) : "";
        if (!direccion.trim()) {
            return NextResponse.json({ error: "Dirección requerida" }, { status: 400 });
        }

        const codigo = await alquileresAdminService.generateUniqueCode(direccion);
        return NextResponse.json({ codigo });
    } catch (error) {
        console.error("[API alquileres/codigo] Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
