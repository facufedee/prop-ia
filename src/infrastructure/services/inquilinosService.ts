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
import { Inquilino } from "@/domain/models/Inquilino";

const COLLECTION = "inquilinos";

export const inquilinosService = {
    // Get all tenants for a user
    getInquilinos: async (userId: string): Promise<Inquilino[]> => {
        const q = query(
            collection(db, COLLECTION),
            where("userId", "==", userId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
        } as Inquilino));
    },

    // Get tenant by ID
    getInquilinoById: async (id: string): Promise<Inquilino | null> => {
        const docRef = doc(db, COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
            } as Inquilino;
        }
        return null;
    },

    // Create new tenant
    createInquilino: async (inquilino: Omit<Inquilino, "id" | "createdAt">): Promise<string> => {
        const docRef = await addDoc(collection(db, COLLECTION), {
            ...inquilino,
            createdAt: Timestamp.now(),
        });
        return docRef.id;
    },

    // Update tenant
    updateInquilino: async (id: string, updates: Partial<Inquilino>): Promise<void> => {
        const docRef = doc(db, COLLECTION, id);
        await updateDoc(docRef, updates);
    },

    // Delete tenant
    deleteInquilino: async (id: string): Promise<void> => {
        await deleteDoc(doc(db, COLLECTION, id));
    },

    // Search tenants by name or DNI
    searchInquilinos: async (userId: string, searchTerm: string): Promise<Inquilino[]> => {
        const allInquilinos = await inquilinosService.getInquilinos(userId);
        const term = searchTerm.toLowerCase();

        return allInquilinos.filter(i =>
            i.nombre.toLowerCase().includes(term) ||
            i.dni.includes(term) ||
            i.email.toLowerCase().includes(term)
        );
    },
};
