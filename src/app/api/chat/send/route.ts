import { NextResponse } from "next/server";
import { db } from "@/infrastructure/firebase/client";
import { collection, addDoc } from "firebase/firestore";

export async function POST(req: Request) {
    try {
        const { sessionId, text } = await req.json();

        if (!sessionId || !text || typeof sessionId !== "string" || typeof text !== "string") {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Basic length limits to prevent abuse
        if (sessionId.length > 128 || text.length > 2000) {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        await addDoc(collection(db, "chat_sessions", sessionId, "messages"), {
            text,
            sender: "user",
            timestamp: Date.now(),
        });

        return NextResponse.json({ success: true, status: "sent" });
    } catch (error: any) {
        console.error("Error in /api/chat/send:", error.message);
        return NextResponse.json({ error: "Error enviando mensaje" }, { status: 500 });
    }
}
