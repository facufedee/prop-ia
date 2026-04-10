import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/infrastructure/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { nombre, email, telefono, mensaje, userId, propertyId, propertyTitle, origen = "web" } = body;

        if (!nombre || !userId) {
            return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
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

        // Fire-and-forget email notification
        const siteOrigin = req.headers.get("origin") || req.headers.get("referer") || "";
        const baseUrl = siteOrigin.startsWith("http")
            ? new URL(siteOrigin).origin
            : process.env.NEXT_PUBLIC_APP_URL || "https://zetaprop.com.ar";

        fetch(`${baseUrl}/api/notifications/trigger`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                event: "newLead",
                data: { nombre, email, telefono, mensaje, propertyTitle, userId, id: leadId },
                subject: `Nueva consulta de ${nombre}${propertyTitle ? ` — ${propertyTitle}` : ""}`,
                message: `Recibiste una nueva consulta de <strong>${nombre}</strong>${propertyTitle ? ` para <strong>${propertyTitle}</strong>` : ""}.`,
            }),
        }).catch(() => {});

        return NextResponse.json({ success: true, leadId });
    } catch (err: any) {
        console.error("[POST /api/leads]", err);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
