import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/infrastructure/firebase/admin";

/**
 * GET /api/invitations/[token] — validates an agent invitation for the anonymous
 * visitor of /invitacion/[token]. Firestore rules only let the invitee read the
 * invitation once signed in, so the lookup by token runs here with the Admin SDK
 * and returns only what the sign-up page needs.
 */
const NOT_FOUND = { error: "La invitación no es válida o ha expirado." };

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    if (!token || token.length > 100) {
        return NextResponse.json(NOT_FOUND, { status: 404 });
    }

    try {
        const snapshot = await adminDb
            .collection("invitations")
            .where("token", "==", token)
            .where("status", "==", "pending")
            .limit(1)
            .get();
        if (snapshot.empty) return NextResponse.json(NOT_FOUND, { status: 404 });

        const invitationDoc = snapshot.docs[0];
        const data = invitationDoc.data();
        const expiresAt: Date | undefined = data.expiresAt?.toDate?.();
        if (!expiresAt || expiresAt < new Date()) {
            return NextResponse.json(NOT_FOUND, { status: 404 });
        }

        return NextResponse.json(
            {
                id: invitationDoc.id,
                token: data.token,
                agenteId: data.agenteId,
                email: data.email,
                branchId: data.branchId ?? "",
                organizationId: data.organizationId,
                status: data.status,
                expiresAt: expiresAt.toISOString(),
            },
            { headers: { "Cache-Control": "no-store" } },
        );
    } catch (error) {
        console.error("[API invitations/[token]] Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
