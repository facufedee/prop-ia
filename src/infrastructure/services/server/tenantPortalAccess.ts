import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { Alquiler } from "@/domain/models/Alquiler";

/**
 * Tenant portal (/inquilino) session tokens. Tenants have no Firebase account:
 * they prove access with rental code + DNI, and the server issues a short-lived
 * HS256 token bound to that rental. Same secret as /api/portal/login.
 */

export const TENANT_SESSION_SECONDS = 2 * 60 * 60; // Matches the portal's 2-hour client session.

function getSecret(): Uint8Array {
    const secret = process.env.PORTAL_JWT_SECRET;
    if (!secret) throw new Error("PORTAL_JWT_SECRET env var must be set");
    return new TextEncoder().encode(secret);
}

export async function signTenantToken(alquilerId: string): Promise<string> {
    return new SignJWT({ role: "tenant_portal", alquilerId })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${TENANT_SESSION_SECONDS}s`)
        .sign(getSecret());
}

/** Returns the rental id the token grants access to, or null when invalid/expired. */
export async function verifyTenantToken(token: string): Promise<string | null> {
    try {
        const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
        if (payload.role !== "tenant_portal" || typeof payload.alquilerId !== "string") return null;
        return payload.alquilerId;
    } catch {
        return null;
    }
}

const iso = (value: unknown) => (value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : value ?? null);

/** Only the fields the tenant portal renders (no bank data, guarantors, notes, ...). */
export function toTenantView(alquiler: Alquiler) {
    return {
        id: alquiler.id,
        codigoAlquiler: alquiler.codigoAlquiler ?? null,
        estado: alquiler.estado,
        direccion: alquiler.direccion,
        propiedadTipo: alquiler.propiedadTipo ?? null,
        fechaInicio: iso(alquiler.fechaInicio),
        fechaFin: iso(alquiler.fechaFin),
        nombreInquilino: alquiler.nombreInquilino,
        dniInquilino: alquiler.dniInquilino ?? null,
        nombrePropietario: alquiler.nombrePropietario ?? null,
        emailPropietario: alquiler.emailPropietario ?? null,
        montoMensual: alquiler.montoMensual,
        diaVencimiento: alquiler.diaVencimiento ?? null,
        historialPagos: (alquiler.historialPagos || []).map((p) => ({
            id: p.id,
            mes: p.mes,
            monto: p.monto,
            estado: p.estado,
            fechaVencimiento: iso(p.fechaVencimiento),
            fechaPago: iso(p.fechaPago),
        })),
    };
}

export type TenantRentalView = ReturnType<typeof toTenantView>;
