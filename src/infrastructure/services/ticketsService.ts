import { db, auth } from "@/infrastructure/firebase/client";
import { auditLogService } from "@/infrastructure/services/auditLogService";
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
    Timestamp,
    onSnapshot,
    deleteDoc
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

        // Log Bitácora
        if (auth?.currentUser) {
            await auditLogService.logTicket(
                auth.currentUser.uid,
                auth.currentUser.email || "",
                auth.currentUser.displayName || "Usuario",
                'ticket_create',
                docRef.id,
                data.title,
                data.organizationId
            );
        }

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

        // Log Bitácora (Generic update)
        if (auth?.currentUser) {
            // We'd ideally fetch the ticket to get the title, but for now we skip or just log ID
            // Optimally we pass title or fetch it. Let's fetch it for the log to be useful.
            const ticketSnap = await getDoc(docRef);
            const ticketTitle = ticketSnap.exists() ? ticketSnap.data().title : "Sin título";

            await auditLogService.logTicket(
                auth.currentUser.uid,
                auth.currentUser.email || "",
                auth.currentUser.displayName || "Usuario",
                'ticket_update',
                id,
                ticketTitle,
                ticketSnap.exists() ? ticketSnap.data().organizationId : "unknown",
                { changes: Object.keys(data) }
            );
        }
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

        // Log Bitácora
        if (auth?.currentUser) {
            const ticketSnap = await getDoc(docRef);
            const ticketData = ticketSnap.data();

            await auditLogService.logTicket(
                auth.currentUser.uid,
                auth.currentUser.email || "",
                auth.currentUser.displayName || "Usuario",
                'ticket_status_update',
                id,
                ticketData?.title || "Sin título",
                ticketData?.organizationId || "unknown",
                { newStatus: status }
            );
        }
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

        // Log Bitácora
        if (auth?.currentUser) {
            const ticketSnap = await getDoc(docRef);
            const ticketData = ticketSnap.data();

            await auditLogService.logTicket(
                auth.currentUser.uid,
                auth.currentUser.email || "",
                auth.currentUser.displayName || "Usuario",
                'ticket_update',
                id,
                ticketData?.title || "Sin título",
                ticketData?.organizationId || "unknown",
                { assignedTo: adminName }
            );
        }
    },

    // Eliminar ticket
    deleteTicket: async (id: string): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");

        // 1. Obtener mensajes asociados
        const qMessages = query(collection(db, MESSAGES_COLLECTION), where("ticketId", "==", id));
        const messagesSnap = await getDocs(qMessages);

        // 2. Eliminar mensajes (batch o uno por uno, aqui uno por uno es mas simple aunque menos atómico)
        // Para consistencia seria mejor batch pero por brevedad:
        const deletePromises = messagesSnap.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        // 3. Eliminar ticket
        const ticketRef = doc(db, TICKETS_COLLECTION, id);

        // Log antes de borrar para tener referencia
        if (auth?.currentUser) {
            const ticketSnap = await getDoc(ticketRef);
            const ticketData = ticketSnap.data();
            await auditLogService.logTicket(
                auth.currentUser.uid,
                auth.currentUser.email || "",
                auth.currentUser.displayName || "Usuario",
                'ticket_delete',
                id,
                ticketData?.title || "Sin título",
                ticketData?.organizationId || "unknown",
                {}
            );
        }

        await deleteDoc(ticketRef);
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
            // Determinar nuevo estado
            let newStatus = ticketSnap.data().status;

            if (data.isAdmin) {
                // Si responde un admin, pasa a "Esperando Respuesta" del usuario
                newStatus = 'esperando_respuesta';
            } else {
                // Si responde el usuario, pasa a "En Progreso" (para que el admin lo vea)
                newStatus = 'en_progreso';
            }

            await updateDoc(ticketRef, {
                messagesCount: (ticketSnap.data().messagesCount || 0) + 1,
                lastMessageAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                status: newStatus
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
    // Obtener tickets pendientes para admin (abierto o en_progreso)
    getAdminPendingTickets: async (): Promise<Ticket[]> => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(
            collection(db, TICKETS_COLLECTION),
            where("status", "in", ["abierto", "en_progreso"]),
            orderBy("updatedAt", "desc")
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

    // ========== SUBSCRIPCIONES (REAL-TIME) ==========

    // Suscribirse a un ticket
    subscribeToTicket: (id: string, callback: (ticket: Ticket | null) => void): (() => void) => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, TICKETS_COLLECTION, id);

        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                callback({
                    id: docSnap.id,
                    ...docSnap.data(),
                    createdAt: docSnap.data().createdAt?.toDate() || new Date(),
                    updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
                    resolvedAt: docSnap.data().resolvedAt?.toDate(),
                    closedAt: docSnap.data().closedAt?.toDate(),
                    lastMessageAt: docSnap.data().lastMessageAt?.toDate(),
                } as Ticket);
            } else {
                callback(null);
            }
        });
    },

    // Suscribirse a mensajes de un ticket
    subscribeToMessages: (ticketId: string, callback: (messages: TicketMessage[]) => void): (() => void) => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(
            collection(db, MESSAGES_COLLECTION),
            where("ticketId", "==", ticketId),
            orderBy("timestamp", "asc")
        );

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date(),
            })) as TicketMessage[];
            callback(messages);
        });
    },

    // Suscribirse a tickets de un usuario (para notificaciones)
    subscribeToUserTickets: (userId: string, callback: (tickets: Ticket[]) => void): (() => void) => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(
            collection(db, TICKETS_COLLECTION),
            where("userId", "==", userId),
            orderBy("updatedAt", "desc") // Ordenar por actualización para notar cambios recientes
        );

        return onSnapshot(q, (snapshot) => {
            const tickets = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate() || new Date(),
                resolvedAt: doc.data().resolvedAt?.toDate(),
                closedAt: doc.data().closedAt?.toDate(),
                lastMessageAt: doc.data().lastMessageAt?.toDate(),
            })) as Ticket[];
            callback(tickets);
        });
    },
};
