import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/infrastructure/firebase/admin";
import { verifyUnsubscribeToken } from "@/lib/unsubscribeToken";

/**
 * POST /api/newsletter/unsubscribe?u=<userId>&t=<token>
 *
 * - RFC 8058 one-click: mail clients POST `List-Unsubscribe=One-Click` as form
 *   data to the URL from the List-Unsubscribe header; params come from the
 *   query string and the body is ignored.
 * - The /unsubscribe page posts a JSON body `{ u, t }`.
 *
 * The signed token is the only authorization. Unknown users still get 200 so
 * the endpoint does not reveal which ids exist.
 */
export async function POST(request: NextRequest) {
    let userId = request.nextUrl.searchParams.get("u");
    let token = request.nextUrl.searchParams.get("t");

    if ((!userId || !token) && request.headers.get("content-type")?.includes("application/json")) {
        try {
            const body = await request.json();
            userId = userId || (typeof body?.u === "string" ? body.u : null);
            token = token || (typeof body?.t === "string" ? body.t : null);
        } catch {
            // Malformed JSON is handled as missing params below.
        }
    }

    if (!userId || !token) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    let valid: boolean;
    try {
        valid = verifyUnsubscribeToken(userId, token);
    } catch (error) {
        console.error("[Unsubscribe] Cannot verify token:", error);
        return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    if (!valid) {
        return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    try {
        const userRef = adminDb.collection("users").doc(userId);
        const snap = await userRef.get();
        if (snap.exists) {
            await userRef.update({
                unsubscribedMarketing: true,
                unsubscribedAt: new Date().toISOString(),
            });
        }
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("[Unsubscribe] Error updating user:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
