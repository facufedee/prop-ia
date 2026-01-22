import { NextRequest, NextResponse } from "next/server";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { Incidencia } from "@/domain/models/Alquiler";

// POST - Create maintenance request
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const incidencia: Omit<Incidencia, "id" | "fechaCreacion"> = await request.json();
        await alquileresService.crearIncidencia(params.id, incidencia);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
