import { NextResponse } from "next/server";
import { adminDb } from "@/infrastructure/firebase/admin";
import { sendEmailWithResend } from "@/lib/resend";
import * as admin from "firebase-admin";

interface BulkEmailBody {
    subject: string;
    html: string;
    userIds: string[];
    campaignName?: string;
}

export async function POST(req: Request) {
    try {
        const body = await req.json() as BulkEmailBody;
        const { subject, html, userIds, campaignName } = body;

        if (!subject || !html || !userIds?.length) {
            return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
        }

        // Fetch emails for selected user IDs
        const emailsToSend: { uid: string; email: string }[] = [];
        const chunks: string[][] = [];
        for (let i = 0; i < userIds.length; i += 10) {
            chunks.push(userIds.slice(i, i + 10));
        }

        for (const chunk of chunks) {
            const snaps = await Promise.all(
                chunk.map(uid => adminDb.collection("users").doc(uid).get())
            );
            snaps.forEach(snap => {
                if (snap.exists) {
                    const data = snap.data()!;
                    const email = data.email;
                    const unsubscribed = data.unsubscribedMarketing === true;
                    if (email && !unsubscribed) {
                        emailsToSend.push({ uid: snap.id, email });
                    }
                }
            });
        }

        // Send emails and log results
        let sent = 0;
        let failed = 0;

        for (const { uid, email } of emailsToSend) {
            try {
                await sendEmailWithResend({ to: email, subject, html });
                await adminDb.collection("emailLogs").add({
                    type: "bulk_campaign",
                    to: email,
                    userId: uid,
                    subject,
                    campaignName: campaignName || "Campaña manual",
                    status: "sent",
                    sentAt: admin.firestore.Timestamp.now(),
                });
                sent++;
            } catch {
                await adminDb.collection("emailLogs").add({
                    type: "bulk_campaign",
                    to: email,
                    userId: uid,
                    subject,
                    campaignName: campaignName || "Campaña manual",
                    status: "failed",
                    sentAt: admin.firestore.Timestamp.now(),
                });
                failed++;
            }
        }

        return NextResponse.json({ success: true, sent, failed, total: emailsToSend.length });
    } catch (error: any) {
        console.error("[bulk-email]", error);
        return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 });
    }
}
