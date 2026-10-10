import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/apiAuth";
import { sendNewsletter } from "@/lib/newsletter/sendNewsletter";

// Large audiences are sent in several Resend batch calls.
export const maxDuration = 300;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Cron: blog newsletter.
 * POST /api/cron/send-newsletter
 * Header requerido: x-cron-secret: <CRON_SECRET>
 *
 * Query params:
 *  - dryRun=1          → reports recipients and posts; sends nothing
 *  - testTo=<email>    → sends one email to that address; marks nothing
 *
 * Sends only when at least two published posts were never included in a newsletter.
 */
export async function POST(request: NextRequest) {
    const authError = verifyCronSecret(request);
    if (authError) return authError;

    const params = request.nextUrl.searchParams;
    const dryRun = params.get("dryRun") === "1" || params.get("dryRun") === "true";
    const testTo = params.get("testTo")?.trim() || undefined;

    if (testTo && !EMAIL_PATTERN.test(testTo)) {
        return NextResponse.json({ error: "Invalid testTo address" }, { status: 400 });
    }

    try {
        const result = await sendNewsletter({ dryRun, testTo });
        return NextResponse.json(result);
    } catch (error) {
        console.error("[Cron send-newsletter] Error:", error);
        const message = error instanceof Error ? error.message : "Unexpected error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
