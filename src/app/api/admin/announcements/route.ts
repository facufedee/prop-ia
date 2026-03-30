import { NextResponse } from "next/server";
import { adminDb } from "@/infrastructure/firebase/admin";
import * as admin from "firebase-admin";

const Timestamp = admin.firestore.Timestamp;

export async function GET() {
    try {
        // Fetch all announcements instead of filtering in DB to avoid index issues
        const snap = await adminDb.collection("announcements").get();

        if (snap.empty) return NextResponse.json({ announcements: [] });

        const announcements = snap.docs
            .map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title || "",
                    message: data.message || "",
                    type: data.type || "info",
                    active: data.active ?? true,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null,
                    expiresAt: data.expiresAt instanceof Timestamp ? data.expiresAt.toDate().toISOString() : null,
                };
            })
            .filter(ann => ann.active)
            .sort((a, b) => {
                const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return db - da;
            });

        return NextResponse.json({ announcements });
    } catch (error: any) {
        console.error("Error in announcements API:", error);
        return NextResponse.json({ announcements: [], error: error.message }, { status: 200 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, message, type, expiresAt } = body;

        const data: any = {
            title,
            message,
            type,
            active: true,
            createdAt: Timestamp.now(),
        };

        if (expiresAt) {
            data.expiresAt = Timestamp.fromDate(new Date(expiresAt));
        }

        const ref = await adminDb.collection("announcements").add(data);
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
