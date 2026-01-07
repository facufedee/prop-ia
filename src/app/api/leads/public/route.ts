import { NextResponse } from "next/server";
import { db } from "@/infrastructure/firebase/client";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nombre, email, telefono, mensaje, propertyId, propertyTitle, userId, organizationId, tipo, origen } = body;

        if (!userId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const leadData = {
            nombre,
            email,
            telefono,
            mensaje,
            propertyId,
            propertyTitle,
            userId,       // The agent who owns the property
            organizationId: organizationId || null,
            tipo: tipo || 'consulta',
            estado: 'nuevo' as const,
            origen: origen || 'web',
            notas: [],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            fechaContacto: Timestamp.now()
        };

        const docRef = await addDoc(collection(db, 'leads'), leadData);

        return NextResponse.json({ id: docRef.id, success: true });
    } catch (error: any) {
        console.error("Error creating public lead:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
