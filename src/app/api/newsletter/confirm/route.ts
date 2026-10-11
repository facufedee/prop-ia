import { NextRequest, NextResponse } from "next/server";
import { confirmSubscription } from "@/lib/newsletter/subscribers";
import { verifyConfirmToken } from "@/lib/unsubscribeToken";

/**
 * POST /api/newsletter/confirm  `{ s: <subscriberId>, t: <confirmToken> }`
 *
 * Called by the /newsletter/confirmar page. The signed token is the only
 * authorization and already proves the id, so an unknown id may return 404.
 */
export async function POST(request: NextRequest) {
    let docId: string | null = null;
    let token: string | null = null;
    try {
        const body = await request.json();
        docId = typeof body?.s === "string" ? body.s : null;
        token = typeof body?.t === "string" ? body.t : null;
    } catch {
        // Malformed JSON is handled as missing params below.
    }

    if (!docId || !token) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    let valid: boolean;
    try {
        valid = verifyConfirmToken(docId, token);
    } catch (error) {
        console.error("[Newsletter] Cannot verify confirm token:", error);
        return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    if (!valid) {
        return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    try {
        const outcome = await confirmSubscription(docId);
        if (outcome === "not_found") {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (outcome === "unsubscribed") {
            return NextResponse.json({ error: "Unsubscribed" }, { status: 409 });
        }
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("[Newsletter] Confirm failed:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
