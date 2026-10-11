import { NextRequest, NextResponse } from "next/server";
import { normalizeEmail, requestSubscription } from "@/lib/newsletter/subscribers";

/**
 * POST /api/newsletter/subscribe  `{ email, website? }`
 *
 * Footer newsletter form (double opt-in). Every valid request gets the same
 * `{ ok: true }` body, whether a confirmation was sent or the address was
 * already a user, a confirmed subscriber or recently emailed, so the endpoint
 * does not reveal who is subscribed. `website` is a honeypot: bots that fill
 * it get the same response and nothing happens.
 */
export async function POST(request: NextRequest) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { email: rawEmail, website } = (body ?? {}) as { email?: unknown; website?: unknown };

    if (typeof website === "string" && website.trim() !== "") {
        return NextResponse.json({ ok: true });
    }

    const email = normalizeEmail(rawEmail);
    if (!email) {
        return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    try {
        await requestSubscription(email);
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("[Newsletter] Subscribe failed:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
