import { NextResponse } from "next/server";
import { adminDb } from "@/infrastructure/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { sendNewLeadNotificationEmail } from "@/lib/resendClient";
import { z } from "zod";

const leadSchema = z.object({
    nombre: z.string().min(1).max(100).trim(),
    email: z.string().email().max(200).optional().or(z.literal("")),
    telefono: z.string().max(30).optional(),
    mensaje: z.string().max(2000).optional(),
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

        const host = request.headers.get('host');
        const forwardedProto = request.headers.get('x-forwarded-proto');
        const inferredProtocol = forwardedProto || (host?.includes('localhost') ? 'http' : 'https');
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${inferredProtocol}://${host}` : 'http://localhost:3000');

        const triggerNotification = async (leadId: string) => {
            try {
                await fetch(`${baseUrl}/api/notifications/trigger`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: 'Nueva consulta web',
                        message: `Has recibido una nueva consulta de ${nombre || 'un cliente'} por ${propertyTitle || 'una propiedad'}.`,
                        type: 'info',
                        targetUserId: userId,
                        link: `/dashboard/leads`
                    })
                });
            } catch (err) {
                console.error("Failed to trigger notification for new lead:", err);
            }
        };

        /**
         * Trigger email to the agent (userId) informing them of the new lead via Resend.
         * Fetches the agent's email from Firestore and sends a direct Resend email.
         * If no agent email is found, falls back to Facundo's email.
         */
        const triggerLeadEmail = async () => {
            try {
                const agentSnap = await adminDb.collection('users').doc(userId).get();
                const agentData = agentSnap.exists ? agentSnap.data() : null;

                const agentEmail =
                    agentData?.email ||
                    agentData?.contactEmail ||
                    "zetaprop.com.ar@gmail.com";

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

            // Trigger notification & email (fire-and-forget)
            await triggerNotification(existingLeadSnap.id);
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

            // Trigger notification & email (fire-and-forget)
            await triggerNotification(docRef.id);
            triggerLeadEmail().catch(console.error);

            return NextResponse.json({ id: docRef.id, success: true, unified: false });
        }
    } catch (error: any) {
        console.error("Error creating public lead:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
