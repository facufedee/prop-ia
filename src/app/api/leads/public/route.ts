import { NextResponse } from "next/server";
import { adminDb } from "@/infrastructure/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { sendNewLeadNotificationEmail } from "@/lib/resendClient";
import { z } from "zod";

const leadSchema = z.object({
    nombre: z.string().min(2, "Nombre demasiado corto").max(60, "Nombre demasiado largo").trim(),
    email: z.string().email("Email inválido").max(100).optional().or(z.literal("")),
    telefono: z.string().max(20).regex(/^[\d\s\+\-\(\)]*$/, "Teléfono inválido").optional(),
    mensaje: z.string().max(500, "Mensaje demasiado largo").optional(),
    propertyId: z.string().max(100).optional().nullable(),
    propertyTitle: z.string().max(200).optional().nullable(),
    userId: z.string().min(1).max(128),
    organizationId: z.string().max(128).optional().nullable(),
    tipo: z.enum(["consulta", "visita", "tasacion", "otro"]).optional(),
    origen: z.string().max(50).optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = leadSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
        }

        const { nombre, email, telefono, mensaje, propertyId, propertyTitle, userId, organizationId, tipo, origen } = parsed.data;

        // Unification Logic - Check if lead already exists by email or phone for the same user (agent)
        let existingLeadSnap: FirebaseFirestore.QueryDocumentSnapshot | null = null;
        const leadsRef = adminDb.collection('leads');

        if (email) {
            const snapEmail = await leadsRef
                .where("userId", "==", userId)
                .where("email", "==", email)
                .limit(1)
                .get();
            if (!snapEmail.empty) {
                existingLeadSnap = snapEmail.docs[0];
            }
        }

        if (!existingLeadSnap && telefono) {
            const snapPhone = await leadsRef
                .where("userId", "==", userId)
                .where("telefono", "==", telefono)
                .limit(1)
                .get();
            if (!snapPhone.empty) {
                existingLeadSnap = snapPhone.docs[0];
            }
        }

        const nuevaConsulta = {
            propertyId: propertyId || null,
            propertyTitle: propertyTitle || null,
            mensaje: mensaje || '',
            fecha: new Date(),
            origen: origen || 'web'
        };

        const triggerLeadEmail = async () => {
            try {
                const agentSnap = await adminDb.collection('users').doc(userId).get();
                const agentData = agentSnap.exists ? agentSnap.data() : null;

                const agentEmail =
                    agentData?.email ||
                    agentData?.contactEmail ||
                    "facundoflores8@gmail.com";

                await sendNewLeadNotificationEmail({
                    to: agentEmail,
                    leadName: nombre || "Un interesado",
                    leadEmail: email || undefined,
                    message: mensaje || undefined,
                    propertyTitle: propertyTitle || undefined,
                });
            } catch (err) {
                console.error("Failed to trigger lead email:", err);
            }

            // Notificación in-app para la campanita del agente
            adminDb.collection("notifications").add({
                title: "Nueva consulta recibida",
                message: `${nombre || "Un interesado"} consultó${propertyTitle ? ` por "${propertyTitle}"` : ""}`,
                type: "info",
                targetUserId: userId,
                targetRole: null,
                readBy: [],
                createdAt: new Date(),
                link: "/dashboard/leads",
            }).catch((err: any) => console.error("[/api/leads/public] Failed to create notification:", err));
        };

        if (existingLeadSnap) {
            // Update existing lead
            const existingData = existingLeadSnap.data();
            const consultasAnteriores = existingData.consultas || [];

            // If the old lead didn't have the 'consultas' array, initialize it with its original message
            if (consultasAnteriores.length === 0 && existingData.mensaje) {
                consultasAnteriores.push({
                    propertyId: existingData.propertyId || null,
                    propertyTitle: existingData.propertyTitle || null,
                    mensaje: existingData.mensaje,
                    fecha: existingData.createdAt?.toDate() || new Date(),
                    origen: existingData.origen || 'web'
                });
            }

            consultasAnteriores.push(nuevaConsulta);

            await adminDb.collection('leads').doc(existingLeadSnap.id).update({
                consultas: consultasAnteriores,
                estado: 'nuevo',
                updatedAt: Timestamp.now(),
                mensaje: mensaje || existingData.mensaje,
                propertyId: propertyId || existingData.propertyId,
                propertyTitle: propertyTitle || existingData.propertyTitle,
            });

            // Email directo al agente (fire-and-forget)
            triggerLeadEmail().catch(console.error);

            return NextResponse.json({ id: existingLeadSnap.id, success: true, unified: true });

        } else {
            // Create new lead
            const leadData = {
                nombre,
                email: email || '',
                telefono: telefono || '',
                mensaje: mensaje || '',
                propertyId: propertyId || null,
                propertyTitle: propertyTitle || null,
                userId,
                organizationId: organizationId || null,
                tipo: tipo || 'consulta',
                estado: 'nuevo',
                origen: origen || 'web',
                notas: [],
                consultas: [nuevaConsulta],
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                fechaContacto: Timestamp.now()
            };

            const docRef = await leadsRef.add(leadData);

            // Email directo al agente (fire-and-forget)
            triggerLeadEmail().catch(console.error);

            return NextResponse.json({ id: docRef.id, success: true, unified: false });
        }
    } catch (error: any) {
        console.error("Error creating public lead:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
