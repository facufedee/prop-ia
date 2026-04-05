import { NextRequest, NextResponse } from "next/server";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { verifyAuth } from "@/lib/apiAuth";

// GET - List all contracts for user
export async function GET(request: NextRequest) {
    const authResult = await verifyAuth(request);
    if (authResult.error) return authResult.error;

    try {
        const alquileres = await alquileresService.getAlquileres(authResult.user.uid);
        return NextResponse.json(alquileres);
    } catch (error: any) {
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST - Create new contract
export async function POST(request: NextRequest) {
    const authResult = await verifyAuth(request);
    if (authResult.error) return authResult.error;

    try {
        const body = await request.json();
        const id = await alquileresService.createAlquiler({
            ...body,
            userId: authResult.user.uid,
        });

        return NextResponse.json({ id }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
