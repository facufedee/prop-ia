import { db } from "@/infrastructure/firebase/client";
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    Timestamp
} from "firebase/firestore";
import { Lead, LeadEstado, LeadInteraccion } from "@/domain/models/Lead";

const COLLECTION_NAME = "leads";

export const leadsService = {
    // Get all leads for a user
    getLeads: async (userId: string): Promise<Lead[]> => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(collection(db, COLLECTION_NAME), where("userId", "==", userId));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            fechaContacto: doc.data().fechaContacto?.toDate(),
        })) as Lead[];
    },

    // Get lead by ID
    getLeadById: async (id: string): Promise<Lead | null> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        return {
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate() || new Date(),
            updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
            fechaContacto: docSnap.data().fechaContacto?.toDate(),
        } as Lead;
    },

    // Create new lead (with Unification Logic)
    createLead: async (data: Omit<Lead, "id" | "createdAt" | "updatedAt">, recipientEmail?: string): Promise<string> => {
        if (!db) throw new Error("Firestore not initialized");
        const leadsRef = collection(db, COLLECTION_NAME);

        let existingLeadDoc = null;

        // Try find by Email
        if (data.email) {
            const qEmail = query(leadsRef, where("userId", "==", data.userId), where("email", "==", data.email));
            const snapEmail = await getDocs(qEmail);
            if (!snapEmail.empty) {
                existingLeadDoc = snapEmail.docs[0];
            }
        }

        // Try find by Phone
        if (!existingLeadDoc && data.telefono) {
            const qPhone = query(leadsRef, where("userId", "==", data.userId), where("telefono", "==", data.telefono));
            const snapPhone = await getDocs(qPhone);
            if (!snapPhone.empty) {
                existingLeadDoc = snapPhone.docs[0];
            }
        }

        const nuevaConsulta = {
            propertyId: data.propertyId || null,
            propertyTitle: data.propertyTitle || null,
            mensaje: data.mensaje || '',
            fecha: data.fechaContacto || new Date(),
            origen: data.origen || 'web'
        };

        if (existingLeadDoc) {
            // Unify with existing lead
            const existingData = existingLeadDoc.data();
            const consultasAnteriores = existingData.consultas || [];

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

            await updateDoc(doc(db, COLLECTION_NAME, existingLeadDoc.id), {
                consultas: consultasAnteriores,
                estado: 'nuevo',
                updatedAt: Timestamp.now(),
                mensaje: data.mensaje || existingData.mensaje,
                propertyId: data.propertyId || existingData.propertyId,
                propertyTitle: data.propertyTitle || existingData.propertyTitle,
            });

            // Trigger Email Notification (merged lead)
            fetch('/api/notifications/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'newLead',
                    data: { ...existingData, id: existingLeadDoc.id, isMerged: true },
                    subject: `Nueva Consulta de ${data.nombre} (Contacto Existente)`,
                    message: `Has recibido una nueva consulta de un contacto que ya tenías guardado: <strong>${data.nombre}</strong>.`
                })
            }).catch(err => console.error("Failed to trigger notification:", err));

            return existingLeadDoc.id;

        } else {
            // Create brand new
            const leadData = {
                ...data,
                consultas: [nuevaConsulta],
                fechaContacto: data.fechaContacto ? Timestamp.fromDate(data.fechaContacto) : null,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            const docRef = await addDoc(leadsRef, leadData);

            // Trigger Email Notification (Fire and forget)
            fetch('/api/notifications/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'newLead',
                    data: { ...data, id: docRef.id },
                    subject: `Nueva Consulta de ${data.nombre}`,
                    message: `Has recibido una nueva consulta de <strong>${data.nombre}</strong> para la propiedad <strong>${data.propertyTitle || 'N/A'}</strong>.`,
                    recipientEmail
                })
            }).catch(err => console.error("Failed to trigger notification:", err));

            return docRef.id;
        }
    },

    // Update lead
    updateLead: async (id: string, data: Partial<Lead>): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, COLLECTION_NAME, id);
        const updateData: any = {
            ...data,
            ultimaActividad: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        if (data.fechaContacto) {
            updateData.fechaContacto = Timestamp.fromDate(data.fechaContacto);
        }

        await updateDoc(docRef, updateData);
    },

    // Delete lead
    deleteLead: async (id: string): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    },

    // Get leads by estado
    getLeadsByEstado: async (userId: string, estado: LeadEstado): Promise<Lead[]> => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(
            collection(db, COLLECTION_NAME),
            where("userId", "==", userId),
            where("estado", "==", estado)
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            fechaContacto: doc.data().fechaContacto?.toDate(),
        })) as Lead[];
    },

    // Add note to lead
    addNote: async (id: string, note: string): Promise<void> => {
        const lead = await leadsService.getLeadById(id);
        if (!lead) return;

        const updatedNotas = [...lead.notas, note];
        await leadsService.updateLead(id, { notas: updatedNotas });
    },

    // Convert lead to client (mark as converted)
    convertLead: async (id: string): Promise<void> => {
        await leadsService.updateLead(id, { estado: 'cerrado' });
    },

    // Add interaction to history
    addInteraccion: async (id: string, interaccion: Omit<LeadInteraccion, 'fecha'>): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const lead = await leadsService.getLeadById(id);
        if (!lead) return;

        const nuevaInteraccion: LeadInteraccion = {
            ...interaccion,
            fecha: new Date(),
        };

        const interacciones = [
            ...(lead.interacciones || []),
            nuevaInteraccion,
        ];

        await updateDoc(doc(db, COLLECTION_NAME, id), {
            interacciones,
            ultimaActividad: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
    },
};
