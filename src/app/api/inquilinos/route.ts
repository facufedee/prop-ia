import { NextRequest, NextResponse } from "next/server";
import { inquilinosService } from "@/infrastructure/services/inquilinosService";

// GET - List all tenants for user
export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const inquilinos = await inquilinosService.getInquilinos(userId);
        return NextResponse.json(inquilinos);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Create new tenant
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const id = await inquilinosService.createInquilino({
            ...body,
            userId,
        });

        return NextResponse.json({ id }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
