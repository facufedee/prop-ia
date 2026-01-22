import { NextRequest, NextResponse } from "next/server";
import { alquileresService } from "@/infrastructure/services/alquileresService";


// GET - List all contracts for user
export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const alquileres = await alquileresService.getAlquileres(userId);
        return NextResponse.json(alquileres);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Create new contract
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const id = await alquileresService.createAlquiler({
            ...body,
            userId,
        });

        return NextResponse.json({ id }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
