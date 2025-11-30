import { NextRequest, NextResponse } from "next/server";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { Pago } from "@/domain/models/Alquiler";

// POST - Register payment
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const pago: Pago = await request.json();
        await alquileresService.registrarPago(params.id, pago);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
