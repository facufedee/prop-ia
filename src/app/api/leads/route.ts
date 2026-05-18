import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/infrastructure/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { sendNewLeadNotificationEmail } from "@/lib/resendClient";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, propertyId, propertyTitle, origen = "web" } = body;
        const nombre = body.nombre?.trim().slice(0, 60) || "";
        const email = body.email?.trim().slice(0, 100) || "";
        const telefono = (body.telefono || "").replace(/[^0-9\s\+\-\(\)]/g, "").slice(0, 20);
        const mensaje = body.mensaje?.trim().slice(0, 500) || "";

        if (!nombre || nombre.length < 2 || !userId) {
            return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
        }
        if (telefono && telefono.replace(/\D/g, "").length < 6) {
            return NextResponse.json({ error: "Teléfono inválido" }, { status: 400 });
        }

        const leadsRef = adminDb.collection("leads");
        const now = FieldValue.serverTimestamp();

        const nuevaConsulta = {
            propertyId: propertyId || null,
            propertyTitle: propertyTitle || null,
            mensaje: mensaje || "",
            fecha: new Date().toISOString(),
            origen,
        };

        // Check if lead already exists (by email or phone)
        let existingDoc = null;

        if (email) {
            const snap = await leadsRef
                .where("userId", "==", userId)
                .where("email", "==", email)
                .limit(1)
                .get();
            if (!snap.empty) existingDoc = snap.docs[0];
        }

        if (!existingDoc && telefono) {
            const snap = await leadsRef
                .where("userId", "==", userId)
                .where("telefono", "==", telefono)
                .limit(1)
                .get();
            if (!snap.empty) existingDoc = snap.docs[0];
        }

        let leadId: string;

        if (existingDoc) {
            // Merge with existing lead
            const existing = existingDoc.data();
            const prevConsultas = existing.consultas || [];

            // Migrate old-style single message to consultas array
            if (prevConsultas.length === 0 && existing.mensaje) {
                prevConsultas.push({
                    propertyId: existing.propertyId || null,
                    propertyTitle: existing.propertyTitle || null,
                    mensaje: existing.mensaje,
                    fecha: existing.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
                    origen: existing.origen || "web",
                });
            }

            await existingDoc.ref.update({
                consultas: [...prevConsultas, nuevaConsulta],
                estado: "nuevo",
                mensaje: mensaje || existing.mensaje,
                propertyId: propertyId || existing.propertyId,
                propertyTitle: propertyTitle || existing.propertyTitle,
                updatedAt: now,
            });

            leadId = existingDoc.id;
        } else {
            // Create new lead
            const ref = await leadsRef.add({
                nombre,
                email: email || "",
                telefono: telefono || "",
                mensaje: mensaje || "",
                userId,
                tipo: "consulta",
                estado: "nuevo",
                origen,
                notas: [],
                consultas: [nuevaConsulta],
                propertyId: propertyId || null,
                propertyTitle: propertyTitle || null,
                createdAt: now,
                updatedAt: now,
            });

            leadId = ref.id;
        }

        // Notificación in-app para la campanita del agente (fire-and-forget)
        adminDb.collection("notifications").add({
            title: "Nueva consulta recibida",
            message: `${nombre} consultó${propertyTitle ? ` por "${propertyTitle}"` : ""}`,
            type: "info",
            targetUserId: userId,
            targetRole: null,
            readBy: [],
            createdAt: new Date(),
            link: "/dashboard/leads",
        }).catch((err: any) => console.error("[/api/leads] Failed to create notification:", err));

        // Email directo al agente (fire-and-forget)
        (async () => {
            try {
                const agentSnap = await adminDb.collection("users").doc(userId).get();
                const agentData = agentSnap.exists ? agentSnap.data() : null;
                const agentEmail = agentData?.email || agentData?.contactEmail || "facundoflores8@gmail.com";

                await sendNewLeadNotificationEmail({
                    to: agentEmail,
                    leadName: nombre || "Un interesado",
                    leadEmail: email || undefined,
                    message: mensaje || undefined,
                    propertyTitle: propertyTitle || undefined,
                });
            } catch (err) {
                console.error("[/api/leads] Failed to send lead email:", err);
            }
        })();

        return NextResponse.json({ success: true, leadId });
    } catch (err: any) {
        console.error("[POST /api/leads]", err);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
