import { NextRequest, NextResponse } from "next/server";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { verifyAuth } from "@/lib/apiAuth";
import { z } from "zod";

const pagoSchema = z.object({
    monto: z.number().positive(),
    fecha: z.string(),
    metodoPago: z.string().max(50).optional(),
    comprobante: z.string().max(500).optional(),
    notas: z.string().max(1000).optional(),
});

// POST - Register payment
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const authResult = await verifyAuth(request);
    if (authResult.error) return authResult.error;

    try {
        const alquiler = await alquileresService.getAlquilerById(params.id);
        if (!alquiler) {
            return NextResponse.json({ error: "Contract not found" }, { status: 404 });
        }
        if (alquiler.userId !== authResult.user.uid) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const parsed = pagoSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
        }

        await alquileresService.registrarPago(params.id, parsed.data as any);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
