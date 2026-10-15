import { NextRequest, NextResponse } from "next/server";
import { alquileresAdminService } from "@/infrastructure/services/server/alquileresAdminService";
import { signTenantToken } from "@/infrastructure/services/server/tenantPortalAccess";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/inquilino/acceso — tenant portal login with rental code + tenant DNI.
 * Firestore rules deny `alquileres` to anonymous clients, so the lookup runs here
 * with the Admin SDK. A wrong code and a wrong DNI return the same response.
 */

const INVALID = { error: "Datos incorrectos" };
const FAILURE_DELAY_MS = 1000; // Slows down guessing, as the former client-side check did.
const MAX_ATTEMPTS_PER_WINDOW = 10;
const limiter = rateLimit({ interval: 10 * 60 * 1000, uniqueTokenPerInterval: 500 });

const clientIp = (req: NextRequest) =>
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;

export async function POST(request: NextRequest) {
    const ip = clientIp(request);
    if (ip) {
        try {
            await limiter.check(MAX_ATTEMPTS_PER_WINDOW, ip);
        } catch {
            return NextResponse.json(
                { error: "Demasiados intentos. Probá de nuevo en unos minutos." },
                { status: 429 },
            );
        }
    }

    try {
        const body = await request.json().catch(() => null);
        const codigo = typeof body?.codigo === "string" ? body.codigo.slice(0, 100) : "";
        const dni = typeof body?.dni === "string" ? body.dni.trim().slice(0, 20) : "";
        if (!codigo.trim() || !dni) {
            return NextResponse.json({ error: "Por favor completa todos los campos" }, { status: 400 });
        }

        const rental = await alquileresAdminService.findRentalForTenant(codigo, dni);
        if (!rental) {
            await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS));
            return NextResponse.json(INVALID, { status: 401 });
        }

        const token = await signTenantToken(rental.id);
        return NextResponse.json({ alquilerId: rental.id, token });
    } catch (error) {
        console.error("[API inquilino/acceso] Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
