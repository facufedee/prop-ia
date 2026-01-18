import { db, storage } from "@/infrastructure/firebase/client";
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const COLLECTION_NAME = "developments";

export interface DevelopmentUnit {
    id: string; // generated client-side or uuid
    name: string; // e.g., "Typology A - 2 Rooms"
    type: 'Monoambiente' | '1 Dormitorio' | '2 Dormitorios' | '3 Dormitorios' | '4+ Dormitorios' | 'Oficina' | 'Local' | 'Lote';
    price_currency: 'USD' | 'ARS';
    price_min: number;
    price_max?: number; // Optional
    area_covered: number;
    area_total: number;
    bathrooms: number;
    bedrooms: number; // 0 for Monoambiente
    status: 'available' | 'reserved' | 'sold';
    description?: string;
    images?: string[]; // Optional specific renders for this unit
}

export interface Development {
    id: string;
    name: string;
    slug?: string; // friendly url
    description: string;
    status: 'en-pozo' | 'en-construccion' | 'terminado';
    delivery_date?: Date | string; // Flexible

    // Location
    address: string;
    city: string; // Localidad
    province: string;
    lat?: number;
    lng?: number;

    // Contact / Authors
    developer?: string; // Desarrolladora
    builder?: string; // Constructora
    architect?: string; // Estudio Arquitectura

    // Media
    logoUrl?: string;
    coverPlaceholderUrl?: string; // low res
    imageUrls: string[]; // Main Gallery
    videoUrl?: string;
    brochureUrl?: string;

    // Features
    amenities: string[]; // e.g. ["SUM", "Pileta", "Gimnasio"]
    services: string[]; // e.g. ["Luz", "Gas", "Agua"]

    // Funding
    financing_details?: string;

    // Data
    units: DevelopmentUnit[];

    // System
    createdAt: Date;
    updatedAt: Date;
    active: boolean; // Publish/Unpublish
}

export const developmentService = {
    getAll: async (onlyActive = true): Promise<Development[]> => {
        if (!db) return [];
        try {
            const constraints: any[] = [orderBy("createdAt", "desc")];
            if (onlyActive) {
                constraints.push(where("active", "==", true));
            }

            const q = query(collection(db, COLLECTION_NAME), ...constraints);
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Development));
        } catch (error) {
            console.error("Error getting developments:", error);
            return [];
        }
    },

    getById: async (id: string): Promise<Development | null> => {
        if (!db) return null;
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const snapshot = await getDoc(docRef);
            if (!snapshot.exists()) return null;
            return { id: snapshot.id, ...snapshot.data() } as Development;
        } catch (error) {
            console.error("Error getting development by id:", error);
            return null;
        }
    },

    create: async (data: Omit<Development, "id" | "createdAt" | "updatedAt">): Promise<string> => {
        if (!db) throw new Error("Database not initialized");
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...data,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating development:", error);
            throw error;
        }
    },

    update: async (id: string, data: Partial<Development>): Promise<void> => {
        if (!db) throw new Error("Database not initialized");
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...data,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error("Error updating development:", error);
            throw error;
        }
    },

    delete: async (id: string): Promise<void> => {
        if (!db) throw new Error("Database not initialized");
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
        } catch (error) {
            console.error("Error deleting development:", error);
            throw error;
        }
    },

    uploadImage: async (file: File, path: string): Promise<string> => {
        if (!storage) throw new Error("Storage not initialized");
        try {
            const storageRef = ref(storage, path);
            await uploadBytes(storageRef, file);
            return await getDownloadURL(storageRef);
        } catch (error) {
            console.error("Error uploading image:", error);
            throw error;
        }
    }
};
