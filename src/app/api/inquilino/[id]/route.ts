import { NextRequest, NextResponse } from "next/server";
import { alquileresAdminService } from "@/infrastructure/services/server/alquileresAdminService";
import { toTenantView, verifyTenantToken } from "@/infrastructure/services/server/tenantPortalAccess";

/**
 * GET /api/inquilino/[id] — rental detail for the tenant portal. Requires the
 * Bearer token issued by POST /api/inquilino/acceso for this same rental and
 * returns only the fields the portal renders.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const header = request.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    const allowedId = token ? await verifyTenantToken(token) : null;
    if (!allowedId || allowedId !== id) {
        return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }

    try {
        const alquiler = await alquileresAdminService.getAlquilerById(id);
        if (!alquiler) {
            return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
        }
        return NextResponse.json(toTenantView(alquiler), { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        console.error("[API inquilino/[id]] Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
