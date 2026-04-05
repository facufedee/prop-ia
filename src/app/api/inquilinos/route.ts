import { NextRequest, NextResponse } from "next/server";
import { inquilinosService } from "@/infrastructure/services/inquilinosService";
import { verifyAuth } from "@/lib/apiAuth";

// GET - List all tenants for user
export async function GET(request: NextRequest) {
    const authResult = await verifyAuth(request);
    if (authResult.error) return authResult.error;

    try {
        const inquilinos = await inquilinosService.getInquilinos(authResult.user.uid);
        return NextResponse.json(inquilinos);
    } catch (error: any) {
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST - Create new tenant
export async function POST(request: NextRequest) {
    const authResult = await verifyAuth(request);
    if (authResult.error) return authResult.error;

    try {
        const body = await request.json();
        const id = await inquilinosService.createInquilino({
            ...body,
            userId: authResult.user.uid,
        });

        return NextResponse.json({ id }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
