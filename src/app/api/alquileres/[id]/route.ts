import { NextRequest, NextResponse } from "next/server";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { verifyAuth } from "@/lib/apiAuth";

// GET - Get contract by ID
export async function GET(
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

        // Ownership check
        if (alquiler.userId !== authResult.user.uid) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(alquiler);
    } catch (error: any) {
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// PUT - Update contract
export async function PUT(
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
        await alquileresService.updateAlquiler(params.id, body);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// DELETE - Delete contract
export async function DELETE(
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

        await alquileresService.deleteAlquiler(params.id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
