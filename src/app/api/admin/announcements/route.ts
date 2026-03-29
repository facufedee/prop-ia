import { NextResponse } from "next/server";
import { adminDb } from "@/infrastructure/firebase/admin";
import * as admin from "firebase-admin";

export async function GET() {
    try {
        const snap = await adminDb
            .collection("announcements")
            .where("active", "==", true)
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();

        if (snap.empty) return NextResponse.json({ announcement: null });

        const doc = snap.docs[0];
        const data = doc.data();
        return NextResponse.json({
            announcement: {
                id: doc.id,
                title: data.title,
                message: data.message,
                type: data.type,
                active: data.active,
                createdAt: data.createdAt?.toDate?.()?.toISOString(),
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, message, type } = body;

        if (!title || !message || !type) {
            return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
        }

        const ref = await adminDb.collection("announcements").add({
            title,
            message,
            type,
            active: true,
            createdAt: admin.firestore.Timestamp.now(),
        });

        return NextResponse.json({ id: ref.id });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();
        await adminDb.collection("announcements").doc(id).update({ active: false });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
