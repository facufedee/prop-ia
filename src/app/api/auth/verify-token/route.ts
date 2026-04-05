import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/infrastructure/firebase/admin";

// Generic error message to prevent user/token enumeration
const INVALID_MSG = "Token inválido o expirado";

export async function POST(req: Request) {
    try {
        const { token, uid } = await req.json();

        if (!token || !uid || typeof token !== "string" || typeof uid !== "string") {
            return NextResponse.json({ error: INVALID_MSG }, { status: 400 });
        }

        const verificationRef = adminDb
            .collection("users")
            .doc(uid)
            .collection("verification")
            .doc("email");

        const docSnap = await verificationRef.get();

        // Always return the same message regardless of why it failed (prevents enumeration)
        if (!docSnap.exists) {
            return NextResponse.json({ error: INVALID_MSG }, { status: 400 });
        }

        const data = docSnap.data()!;

        if (data.token !== token) {
            return NextResponse.json({ error: INVALID_MSG }, { status: 400 });
        }

        if (data.verified) {
            return NextResponse.json({ message: "Ya verificado" });
        }

        const now = new Date();
        const expiresAt = data.expiresAt.toDate();

        if (now > expiresAt) {
            return NextResponse.json({ error: INVALID_MSG }, { status: 400 });
        }

        await verificationRef.update({ verified: true, verifiedAt: new Date() });
        await adminDb.collection("users").doc(uid).update({ emailVerified: true });
        await adminAuth.updateUser(uid, { emailVerified: true });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error verifying token:", error.message);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
