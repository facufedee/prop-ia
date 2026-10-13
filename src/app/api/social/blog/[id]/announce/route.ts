import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/apiAuth";
import { announceBlogPost } from "@/lib/social/announceBlogPost";

// Sends a published blog post to the Make.com social scenario. Called by the
// dashboard right after a draft gets published, and by the /social generator
// ("Enviar a redes ahora", force=true). Admins only.
//
// POST /api/social/blog/{id}/announce
// Header: Authorization: Bearer <Firebase ID token>
// Body (optional): { force?: boolean }
export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await verifyAdmin(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let force = false;
    try {
        const body = await request.json();
        force = body?.force === true;
    } catch {
        // Empty or invalid body: defaults apply.
    }

    const result = await announceBlogPost(id, { force });
    return NextResponse.json(result, { status: result.status === "failed" ? 502 : 200 });
}
