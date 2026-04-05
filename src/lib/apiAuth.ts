import { adminAuth } from "@/infrastructure/firebase/admin";
import { NextRequest, NextResponse } from "next/server";

export interface AuthenticatedUser {
    uid: string;
    email?: string;
}

/**
 * Verifies the Firebase ID token from the Authorization header.
 * Expects: Authorization: Bearer <id_token>
 *
 * Returns the decoded user or a 401 NextResponse if invalid.
 */
export async function verifyAuth(
    request: NextRequest
): Promise<{ user: AuthenticatedUser; error: null } | { user: null; error: NextResponse }> {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
        return {
            user: null,
            error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        };
    }

    const token = authHeader.slice(7);

    try {
        const decoded = await adminAuth.verifyIdToken(token);
        return {
            user: { uid: decoded.uid, email: decoded.email },
            error: null,
        };
    } catch {
        return {
            user: null,
            error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        };
    }
}

/**
 * Verifies that the authenticated user has admin role.
 * Checks Firestore users/{uid}.roleId == 'admin'
 */
export async function verifyAdmin(
    request: NextRequest
): Promise<{ user: AuthenticatedUser; error: null } | { user: null; error: NextResponse }> {
    const authResult = await verifyAuth(request);
    if (authResult.error) return authResult;

    const { adminDb } = await import("@/infrastructure/firebase/admin");
    const userSnap = await adminDb.collection("users").doc(authResult.user.uid).get();

    if (!userSnap.exists || userSnap.data()?.roleId !== "admin") {
        return {
            user: null,
            error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
        };
    }

    return authResult;
}

/**
 * Guards cron endpoints with a shared secret.
 * Expects header: x-cron-secret: <CRON_SECRET>
 */
export function verifyCronSecret(request: NextRequest): NextResponse | null {
    const secret = request.headers.get("x-cron-secret");
    const expected = process.env.CRON_SECRET;

    if (!expected) {
        console.error("[Security] CRON_SECRET env var is not set");
        return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    if (!secret || secret !== expected) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return null;
}
