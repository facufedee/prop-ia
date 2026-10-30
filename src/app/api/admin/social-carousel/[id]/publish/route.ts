import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/apiAuth";
import { publishCarousel } from "@/lib/social/publishCarousel";

// POST /api/admin/social-carousel/{topicNumber}/publish  Body: { force?: true }
// Sends the carousel to Make (Instagram). A published topic is only re-sent
// with an explicit force (the "Republicar" button).

const HTTP_STATUS = {
    sent: 200,
    "not-found": 404,
    "already-published": 409,
    "not-configured": 503,
    failed: 502,
} as const;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authResult = await verifyAdmin(request);
    if (authResult.error) return authResult.error;

    const { id } = await params;
    if (!/^[1-9]\d{0,2}$/.test(id)) return NextResponse.json({ status: "not-found" }, { status: 404 });

    let body: { force?: unknown } = {};
    try {
        body = (await request.json()) ?? {};
    } catch {
        // An empty body means a normal (non-forced) publish.
    }

    const result = await publishCarousel(id, { force: body.force === true });
    return NextResponse.json(result, { status: HTTP_STATUS[result.status] });
}
