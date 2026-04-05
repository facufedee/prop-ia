import { NextRequest, NextResponse } from "next/server";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { verifyAuth } from "@/lib/apiAuth";
import { z } from "zod";

const incidenciaSchema = z.object({
    titulo: z.string().min(3).max(200),
    descripcion: z.string().min(10).max(2000),
    prioridad: z.enum(["baja", "media", "alta"]).optional(),
});

// POST - Create maintenance request
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
        const parsed = incidenciaSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
        }

        await alquileresService.crearIncidencia(params.id, parsed.data as any);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
