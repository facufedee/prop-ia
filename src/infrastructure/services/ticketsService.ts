import { db } from "@/infrastructure/firebase/client";
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    Timestamp
} from "firebase/firestore";
import { Ticket, TicketMessage, TicketStatus, TicketCategory, TicketPriority } from "@/domain/models/Ticket";

const TICKETS_COLLECTION = "tickets";
const MESSAGES_COLLECTION = "ticket_messages";

export const ticketsService = {
    // ========== TICKETS ==========

    // Obtener todos los tickets (para admins)
    getAllTickets: async (): Promise<Ticket[]> => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(collection(db, TICKETS_COLLECTION), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            resolvedAt: doc.data().resolvedAt?.toDate(),
            closedAt: doc.data().closedAt?.toDate(),
            lastMessageAt: doc.data().lastMessageAt?.toDate(),
        })) as Ticket[];
    },

    // Obtener tickets de un usuario
    getUserTickets: async (userId: string): Promise<Ticket[]> => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(
            collection(db, TICKETS_COLLECTION),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            resolvedAt: doc.data().resolvedAt?.toDate(),
            closedAt: doc.data().closedAt?.toDate(),
            lastMessageAt: doc.data().lastMessageAt?.toDate(),
        })) as Ticket[];
    },

    // Obtener ticket por ID
    getTicketById: async (id: string): Promise<Ticket | null> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, TICKETS_COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        return {
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate() || new Date(),
            updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
            resolvedAt: docSnap.data().resolvedAt?.toDate(),
            closedAt: docSnap.data().closedAt?.toDate(),
            lastMessageAt: docSnap.data().lastMessageAt?.toDate(),
        } as Ticket;
    },

    // Crear ticket
    createTicket: async (data: Omit<Ticket, "id" | "createdAt" | "updatedAt" | "messagesCount">): Promise<string> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = await addDoc(collection(db, TICKETS_COLLECTION), {
            ...data,
            messagesCount: 0,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return docRef.id;
    },

    // Actualizar ticket
    updateTicket: async (id: string, data: Partial<Ticket>): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, TICKETS_COLLECTION, id);
        const updateData: any = {
            ...data,
            updatedAt: Timestamp.now(),
        };

        if (data.resolvedAt) {
            updateData.resolvedAt = Timestamp.fromDate(data.resolvedAt);
        }
        if (data.closedAt) {
            updateData.closedAt = Timestamp.fromDate(data.closedAt);
        }

        await updateDoc(docRef, updateData);
    },

    // Cambiar estado
    updateStatus: async (id: string, status: TicketStatus): Promise<void> => {
        const updateData: any = {
            status,
            updatedAt: Timestamp.now(),
        };

        if (status === 'resuelto') {
            updateData.resolvedAt = Timestamp.now();
        } else if (status === 'cerrado') {
            updateData.closedAt = Timestamp.now();
        }

        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, TICKETS_COLLECTION, id);
        await updateDoc(docRef, updateData);
    },

    // Asignar ticket
    assignTicket: async (id: string, adminId: string, adminName: string): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, TICKETS_COLLECTION, id);
        await updateDoc(docRef, {
            assignedToId: adminId,
            assignedToName: adminName,
            status: 'en_progreso',
            updatedAt: Timestamp.now(),
        });
    },

    // ========== MENSAJES ==========

    // Obtener mensajes de un ticket
    getTicketMessages: async (ticketId: string): Promise<TicketMessage[]> => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(
            collection(db, MESSAGES_COLLECTION),
            where("ticketId", "==", ticketId),
            orderBy("timestamp", "asc")
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date(),
        })) as TicketMessage[];
    },

    // Agregar mensaje
    addMessage: async (data: Omit<TicketMessage, "id" | "timestamp">): Promise<string> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), {
            ...data,
            timestamp: Timestamp.now(),
        });

        // Actualizar contador de mensajes y última actividad
        const ticketRef = doc(db, TICKETS_COLLECTION, data.ticketId);
        const ticketSnap = await getDoc(ticketRef);

        if (ticketSnap.exists()) {
            await updateDoc(ticketRef, {
                messagesCount: (ticketSnap.data().messagesCount || 0) + 1,
                lastMessageAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });
        }

        return docRef.id;
    },

    // Filtrar tickets
    filterTickets: async (filters: {
        status?: TicketStatus;
        category?: TicketCategory;
        priority?: TicketPriority;
        assignedToId?: string;
    }): Promise<Ticket[]> => {
        if (!db) throw new Error("Firestore not initialized");
        let q = query(collection(db, TICKETS_COLLECTION));

        if (filters.status) {
            q = query(q, where("status", "==", filters.status));
        }
        if (filters.category) {
            q = query(q, where("category", "==", filters.category));
        }
        if (filters.priority) {
            q = query(q, where("priority", "==", filters.priority));
        }
        if (filters.assignedToId) {
            q = query(q, where("assignedToId", "==", filters.assignedToId));
        }

        q = query(q, orderBy("createdAt", "desc"));

        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            resolvedAt: doc.data().resolvedAt?.toDate(),
            closedAt: doc.data().closedAt?.toDate(),
            lastMessageAt: doc.data().lastMessageAt?.toDate(),
        })) as Ticket[];
    },
};
