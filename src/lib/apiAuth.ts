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

// Owner email always has full access, consistent with the client-side guards
// (PermissionGuard, AdminGuard, RoleProtection)
const OWNER_EMAIL = "facundoflores8@gmail.com";

/**
 * Verifies that the authenticated user has admin role.
 * Resolves users/{uid}.roleId -> roles/{roleId}.name and checks it's
 * "Super Admin" or "Administrador" — roleId is a Firestore-generated
 * document id (see roleService.createRole), never the literal string "admin".
 */
export async function verifyAdmin(
    request: NextRequest
): Promise<{ user: AuthenticatedUser; error: null } | { user: null; error: NextResponse }> {
    const authResult = await verifyAuth(request);
    if (authResult.error) return authResult;

    if (authResult.user.email === OWNER_EMAIL) {
        return authResult;
    }

    const { adminDb } = await import("@/infrastructure/firebase/admin");
    const userSnap = await adminDb.collection("users").doc(authResult.user.uid).get();
    const roleId = userSnap.exists ? userSnap.data()?.roleId : null;

    const roleSnap = roleId ? await adminDb.collection("roles").doc(roleId).get() : null;
    const roleName = roleSnap?.exists ? roleSnap.data()?.name : null;

    if (roleName !== "Super Admin" && roleName !== "Administrador") {
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
