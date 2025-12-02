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
import { Propietario } from "@/domain/models/Propietario";

const COLLECTION_NAME = "propietarios";

export const propietariosService = {
    // Get all propietarios for a user
    getPropietarios: async (userId: string): Promise<Propietario[]> => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(collection(db, COLLECTION_NAME), where("userId", "==", userId));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Propietario[];
    },

    // Get propietario by ID
    getPropietarioById: async (id: string): Promise<Propietario | null> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        return {
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate() || new Date(),
            updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        } as Propietario;
    },

    // Create new propietario
    createPropietario: async (data: Omit<Propietario, "id" | "createdAt" | "updatedAt">): Promise<string> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return docRef.id;
    },

    // Update propietario
    updatePropietario: async (id: string, data: Partial<Propietario>): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now(),
        });
    },

    // Delete propietario
    deletePropietario: async (id: string): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    },

    // Search propietarios
    searchPropietarios: async (userId: string, searchTerm: string): Promise<Propietario[]> => {
        const allPropietarios = await propietariosService.getPropietarios(userId);

        const term = searchTerm.toLowerCase();
        return allPropietarios.filter(p =>
            p.nombre.toLowerCase().includes(term) ||
            p.email.toLowerCase().includes(term) ||
            p.telefono.includes(term) ||
            p.dni.includes(term)
        );
    },
};
