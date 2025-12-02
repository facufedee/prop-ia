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
    orderBy,
    Timestamp
} from "firebase/firestore";
import { Visita, VisitaEstado } from "@/domain/models/Visita";

const COLLECTION_NAME = "visitas";

export const visitasService = {
    // Get all visitas for a user
    getVisitas: async (userId: string): Promise<Visita[]> => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(
            collection(db, COLLECTION_NAME),
            where("userId", "==", userId),
            orderBy("fechaHora", "desc")
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            fechaHora: doc.data().fechaHora?.toDate() || new Date(),
            checkInHora: doc.data().checkInHora?.toDate(),
            checkOutHora: doc.data().checkOutHora?.toDate(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Visita[];
    },

    // Get visitas by date range
    getVisitasByDateRange: async (userId: string, startDate: Date, endDate: Date): Promise<Visita[]> => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(
            collection(db, COLLECTION_NAME),
            where("userId", "==", userId),
            where("fechaHora", ">=", Timestamp.fromDate(startDate)),
            where("fechaHora", "<=", Timestamp.fromDate(endDate)),
            orderBy("fechaHora", "asc")
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            fechaHora: doc.data().fechaHora?.toDate() || new Date(),
            checkInHora: doc.data().checkInHora?.toDate(),
            checkOutHora: doc.data().checkOutHora?.toDate(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Visita[];
    },

    // Get visita by ID
    getVisitaById: async (id: string): Promise<Visita | null> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        return {
            id: docSnap.id,
            ...docSnap.data(),
            fechaHora: docSnap.data().fechaHora?.toDate() || new Date(),
            checkInHora: docSnap.data().checkInHora?.toDate(),
            checkOutHora: docSnap.data().checkOutHora?.toDate(),
            createdAt: docSnap.data().createdAt?.toDate() || new Date(),
            updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        } as Visita;
    },

    // Create new visita
    createVisita: async (data: Omit<Visita, "id" | "createdAt" | "updatedAt">): Promise<string> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
            fechaHora: Timestamp.fromDate(data.fechaHora),
            checkInHora: data.checkInHora ? Timestamp.fromDate(data.checkInHora) : null,
            checkOutHora: data.checkOutHora ? Timestamp.fromDate(data.checkOutHora) : null,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return docRef.id;
    },

    // Update visita
    updateVisita: async (id: string, data: Partial<Visita>): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, COLLECTION_NAME, id);
        const updateData: any = {
            ...data,
            updatedAt: Timestamp.now(),
        };

        if (data.fechaHora) {
            updateData.fechaHora = Timestamp.fromDate(data.fechaHora);
        }
        if (data.checkInHora) {
            updateData.checkInHora = Timestamp.fromDate(data.checkInHora);
        }
        if (data.checkOutHora) {
            updateData.checkOutHora = Timestamp.fromDate(data.checkOutHora);
        }

        await updateDoc(docRef, updateData);
    },

    // Delete visita
    deleteVisita: async (id: string): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    },

    // Check-in
    checkIn: async (id: string): Promise<void> => {
        await visitasService.updateVisita(id, {
            estado: 'en_curso',
            checkInHora: new Date(),
        });
    },

    // Check-out with notes
    checkOut: async (
        id: string,
        notasPostVisita: string,
        nivelInteres: 1 | 2 | 3 | 4 | 5,
        proximosPasos?: string
    ): Promise<void> => {
        await visitasService.updateVisita(id, {
            estado: 'completada',
            checkOutHora: new Date(),
            notasPostVisita,
            nivelInteres,
            proximosPasos,
        });
    },

    // Get visitas by agente
    getVisitasByAgente: async (userId: string, agenteId: string): Promise<Visita[]> => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(
            collection(db, COLLECTION_NAME),
            where("userId", "==", userId),
            where("agenteId", "==", agenteId),
            orderBy("fechaHora", "desc")
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            fechaHora: doc.data().fechaHora?.toDate() || new Date(),
            checkInHora: doc.data().checkInHora?.toDate(),
            checkOutHora: doc.data().checkOutHora?.toDate(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Visita[];
    },

    // Get visitas by estado
    getVisitasByEstado: async (userId: string, estado: VisitaEstado): Promise<Visita[]> => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(
            collection(db, COLLECTION_NAME),
            where("userId", "==", userId),
            where("estado", "==", estado),
            orderBy("fechaHora", "desc")
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            fechaHora: doc.data().fechaHora?.toDate() || new Date(),
            checkInHora: doc.data().checkInHora?.toDate(),
            checkOutHora: doc.data().checkOutHora?.toDate(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Visita[];
    },

    // Get today's visitas
    getTodayVisitas: async (userId: string): Promise<Visita[]> => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return visitasService.getVisitasByDateRange(userId, today, tomorrow);
    },

    // Get upcoming visitas (next 7 days)
    getUpcomingVisitas: async (userId: string): Promise<Visita[]> => {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        return visitasService.getVisitasByDateRange(userId, today, nextWeek);
    },
};
