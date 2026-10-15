import { NextResponse } from "next/server";
import { adminDb } from "@/infrastructure/firebase/admin";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get("sessionId");

        if (!sessionId || typeof sessionId !== "string" || sessionId.length > 128) {
            return NextResponse.json({ error: "Missing or invalid sessionId" }, { status: 400 });
        }

        // Admin SDK: `chat_sessions` is closed to client SDK access by Firestore rules.
        const querySnapshot = await adminDb
            .collection("chat_sessions")
            .doc(sessionId)
            .collection("messages")
            .orderBy("timestamp", "asc")
            .get();

        const messages = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json({ messages });
    } catch (error: any) {
        console.error("Error in /api/chat/sync:", error.message);
        return NextResponse.json({ error: "Error obteniendo mensajes" }, { status: 500 });
    }
}
