import { NextResponse } from "next/server";
import { db } from "@/infrastructure/firebase/client";
import { collection, addDoc, updateDoc, Timestamp, query, where, getDocs, doc } from "firebase/firestore";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nombre, email, telefono, mensaje, propertyId, propertyTitle, userId, organizationId, tipo, origen } = body;

        if (!userId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Unification Logic - Check if lead already exists by email or phone for the same user (agent)
        let existingLeadDoc = null;
        const leadsRef = collection(db, 'leads');

        if (email) {
            const qEmail = query(leadsRef, where("userId", "==", userId), where("email", "==", email));
            const snapEmail = await getDocs(qEmail);
            if (!snapEmail.empty) {
                existingLeadDoc = snapEmail.docs[0];
            }
        }

        if (!existingLeadDoc && telefono) {
            const qPhone = query(leadsRef, where("userId", "==", userId), where("telefono", "==", telefono));
            const snapPhone = await getDocs(qPhone);
            if (!snapPhone.empty) {
                existingLeadDoc = snapPhone.docs[0];
            }
        }

        const nuevaConsulta = {
            propertyId: propertyId || null,
            propertyTitle: propertyTitle || null,
            mensaje: mensaje || '',
            fecha: new Date(), // using literal date obj for the array
            origen: origen || 'web'
        };

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (request.headers.get('host') ? `http://${request.headers.get('host')}` : 'http://localhost:3000');

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

        if (existingLeadDoc) {
            // Update existing lead
            const existingData = existingLeadDoc.data();
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

            await updateDoc(doc(db, 'leads', existingLeadDoc.id), {
                consultas: consultasAnteriores,
                estado: 'nuevo', // flag as new to get agent's attention
                updatedAt: Timestamp.now(),
                // Optionally update the main message/property to the latest inquiry so it shows up on lists
                mensaje: mensaje || existingData.mensaje,
                propertyId: propertyId || existingData.propertyId,
                propertyTitle: propertyTitle || existingData.propertyTitle,
            });

            // Trigger notification
            await triggerNotification(existingLeadDoc.id);

            return NextResponse.json({ id: existingLeadDoc.id, success: true, unified: true });

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
                estado: 'nuevo' as const,
                origen: origen || 'web',
                notas: [],
                consultas: [nuevaConsulta], // Initialize the history array
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                fechaContacto: Timestamp.now()
            };

            const docRef = await addDoc(collection(db, 'leads'), leadData);

            // Trigger notification
            await triggerNotification(docRef.id);

            return NextResponse.json({ id: docRef.id, success: true, unified: false });
        }
    } catch (error: any) {
        console.error("Error creating public lead:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
