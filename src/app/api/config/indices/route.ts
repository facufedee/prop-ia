import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/apiAuth";
import { getIndices, syncIndices } from "@/infrastructure/services/indicesSyncService";

// IPC (INDEC) and ICL (BCRA) are official public data shared by every tenant, so
// reading is open and nobody can overwrite them: the values come only from the
// official APIs and are refreshed automatically when older than 12 hours.
export async function GET() {
    try {
        const indices = await getIndices();
        return NextResponse.json(indices, {
            headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" },
        });
    } catch (error) {
        console.error("[indices] GET failed:", error);
        return NextResponse.json({ error: "Failed to load indices" }, { status: 500 });
    }
}

// Lets an administrator force a refresh from the official sources.
export async function POST(request: NextRequest) {
    const auth = await verifyAdmin(request);
    if (auth.error) return auth.error;

    try {
        const indices = await syncIndices({ force: true });
        return NextResponse.json(indices);
    } catch (error: any) {
        console.error("[indices] forced sync failed:", error);
        return NextResponse.json({ error: error?.message ?? "No se pudo actualizar" }, { status: 502 });
    }
}
