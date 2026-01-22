import { NextResponse } from 'next/server';
import { db } from '@/infrastructure/firebase/client';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
        }

        const messagesRef = collection(db, "chat_sessions", sessionId, "messages");
        const q = query(messagesRef, orderBy("timestamp", "asc"));

        const querySnapshot = await getDocs(q);
        const messages = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ messages });

    } catch (error: any) {
        console.error("Error in /api/chat/sync:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
