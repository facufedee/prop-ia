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
import { Lead, LeadEstado } from "@/domain/models/Lead";

const COLLECTION_NAME = "leads";

export const leadsService = {
    // Get all leads for a user
    getLeads: async (userId: string): Promise<Lead[]> => {
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

    // Create new lead
    createLead: async (data: Omit<Lead, "id" | "createdAt" | "updatedAt">): Promise<string> => {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
            fechaContacto: data.fechaContacto ? Timestamp.fromDate(data.fechaContacto) : null,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return docRef.id;
    },

    // Update lead
    updateLead: async (id: string, data: Partial<Lead>): Promise<void> => {
        const docRef = doc(db, COLLECTION_NAME, id);
        const updateData: any = {
            ...data,
            updatedAt: Timestamp.now(),
        };

        if (data.fechaContacto) {
            updateData.fechaContacto = Timestamp.fromDate(data.fechaContacto);
        }

        await updateDoc(docRef, updateData);
    },

    // Delete lead
    deleteLead: async (id: string): Promise<void> => {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    },

    // Get leads by estado
    getLeadsByEstado: async (userId: string, estado: LeadEstado): Promise<Lead[]> => {
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
        await leadsService.updateLead(id, { estado: 'convertido' });
    },
};
