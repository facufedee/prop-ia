import { db } from "@/infrastructure/firebase/client";
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    startAfter,
    QueryConstraint
} from "firebase/firestore";
import { AuditLog, LogAction, LogLevel, LogFilter } from "@/domain/models/AuditLog";

const LOGS_COLLECTION = "audit_logs";

export const auditLogService = {
    // Crear un nuevo log
    createLog: async (
        userId: string,
        userEmail: string,
        userName: string,
        action: LogAction,
        module: string,
        description: string,
        organizationId: string,
        metadata?: Record<string, any>,
        level: LogLevel = 'info'
    ): Promise<void> => {
        try {
            if (!db) throw new Error("Firestore not initialized");
            await addDoc(collection(db, LOGS_COLLECTION), {
                userId,
                userEmail,
                userName,
                action,
                level,
                module,
                description,
                metadata: metadata || {},
                timestamp: Timestamp.now(),
                organizationId,
            });
        } catch (error) {
            console.error("Error creating audit log:", error);
            // No lanzar error para no interrumpir la operación principal
        }
    },

    // Obtener logs con filtros
    getLogs: async (
        organizationId: string,
        filters?: LogFilter,
        limitCount: number = 100
    ): Promise<AuditLog[]> => {
        const constraints: QueryConstraint[] = [
            where("organizationId", "==", organizationId),
            orderBy("timestamp", "desc"),
            limit(limitCount)
        ];

        // Aplicar filtros
        if (filters?.userId) {
            constraints.push(where("userId", "==", filters.userId));
        }
        if (filters?.action) {
            constraints.push(where("action", "==", filters.action));
        }
        if (filters?.level) {
            constraints.push(where("level", "==", filters.level));
        }
        if (filters?.module) {
            constraints.push(where("module", "==", filters.module));
        }
        if (filters?.startDate) {
            constraints.push(where("timestamp", ">=", Timestamp.fromDate(filters.startDate)));
        }
        if (filters?.endDate) {
            constraints.push(where("timestamp", "<=", Timestamp.fromDate(filters.endDate)));
        }

        const q = query(collection(db, LOGS_COLLECTION), ...constraints);
        const snapshot = await getDocs(q);

        let logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date(),
        })) as AuditLog[];

        // Filtro de búsqueda en memoria (para description)
        if (filters?.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            logs = logs.filter(log =>
                log.description.toLowerCase().includes(term) ||
                log.userEmail.toLowerCase().includes(term) ||
                log.userName.toLowerCase().includes(term)
            );
        }

        return logs;
    },

    // Helpers para crear logs específicos
    logAuth: async (
        userId: string,
        userEmail: string,
        userName: string,
        action: 'login' | 'logout' | 'register',
        organizationId: string
    ) => {
        const descriptions = {
            login: `${userName} inició sesión`,
            logout: `${userName} cerró sesión`,
            register: `${userName} se registró en el sistema`,
        };

        await auditLogService.createLog(
            userId,
            userEmail,
            userName,
            action,
            'Autenticación',
            descriptions[action],
            organizationId,
            {},
            'info'
        );
    },

    logProperty: async (
        userId: string,
        userEmail: string,
        userName: string,
        action: 'property_create' | 'property_update' | 'property_delete' | 'property_publish' | 'property_unpublish',
        propertyId: string,
        propertyAddress: string,
        organizationId: string,
        metadata?: Record<string, any>
    ) => {
        const descriptions = {
            property_create: `${userName} creó la propiedad "${propertyAddress}"`,
            property_update: `${userName} modificó la propiedad "${propertyAddress}"`,
            property_delete: `${userName} eliminó la propiedad "${propertyAddress}"`,
            property_publish: `${userName} publicó la propiedad "${propertyAddress}"`,
            property_unpublish: `${userName} despublicó la propiedad "${propertyAddress}"`,
        };

        await auditLogService.createLog(
            userId,
            userEmail,
            userName,
            action,
            'Propiedades',
            descriptions[action],
            organizationId,
            { propertyId, propertyAddress, ...metadata },
            action === 'property_delete' ? 'warning' : 'success'
        );
    },

    logAgent: async (
        userId: string,
        userEmail: string,
        userName: string,
        action: 'agent_create' | 'agent_update' | 'agent_delete',
        agentId: string,
        agentName: string,
        organizationId: string,
        metadata?: Record<string, any>
    ) => {
        const descriptions = {
            agent_create: `${userName} creó el agente "${agentName}"`,
            agent_update: `${userName} modificó el agente "${agentName}"`,
            agent_delete: `${userName} eliminó el agente "${agentName}"`,
        };

        await auditLogService.createLog(
            userId,
            userEmail,
            userName,
            action,
            'Agentes',
            descriptions[action],
            organizationId,
            { agentId, agentName, ...metadata },
            action === 'agent_delete' ? 'warning' : 'success'
        );
    },

    logRental: async (
        userId: string,
        userEmail: string,
        userName: string,
        action: 'rental_create' | 'rental_update' | 'rental_delete' | 'rental_payment',
        rentalId: string,
        propertyAddress: string,
        organizationId: string,
        metadata?: Record<string, any>
    ) => {
        const descriptions = {
            rental_create: `${userName} creó un contrato de alquiler para "${propertyAddress}"`,
            rental_update: `${userName} modificó el contrato de alquiler de "${propertyAddress}"`,
            rental_delete: `${userName} eliminó el contrato de alquiler de "${propertyAddress}"`,
            rental_payment: `${userName} registró un pago para "${propertyAddress}"`,
        };

        await auditLogService.createLog(
            userId,
            userEmail,
            userName,
            action,
            'Alquileres',
            descriptions[action],
            organizationId,
            { rentalId, propertyAddress, ...metadata },
            action === 'rental_payment' ? 'success' : 'info'
        );
    },

    logVisit: async (
        userId: string,
        userEmail: string,
        userName: string,
        action: 'visit_create' | 'visit_update' | 'visit_checkin' | 'visit_checkout',
        visitId: string,
        propertyAddress: string,
        clientName: string,
        organizationId: string,
        metadata?: Record<string, any>
    ) => {
        const descriptions = {
            visit_create: `${userName} agendó una visita a "${propertyAddress}" con ${clientName}`,
            visit_update: `${userName} modificó la visita a "${propertyAddress}"`,
            visit_checkin: `${userName} hizo check-in en "${propertyAddress}"`,
            visit_checkout: `${userName} completó la visita a "${propertyAddress}"`,
        };

        await auditLogService.createLog(
            userId,
            userEmail,
            userName,
            action,
            'Visitas',
            descriptions[action],
            organizationId,
            { visitId, propertyAddress, clientName, ...metadata },
            'info'
        );
    },

    logTransaction: async (
        userId: string,
        userEmail: string,
        userName: string,
        action: 'transaction_create' | 'transaction_update' | 'commission_paid',
        transactionId: string,
        amount: number,
        organizationId: string,
        metadata?: Record<string, any>
    ) => {
        const descriptions = {
            transaction_create: `${userName} registró una transacción de $${amount.toLocaleString()}`,
            transaction_update: `${userName} modificó una transacción`,
            commission_paid: `${userName} marcó como pagada una comisión de $${amount.toLocaleString()}`,
        };

        await auditLogService.createLog(
            userId,
            userEmail,
            userName,
            action,
            'Finanzas',
            descriptions[action],
            organizationId,
            { transactionId, amount, ...metadata },
            'success'
        );
    },

    logConfig: async (
        userId: string,
        userEmail: string,
        userName: string,
        action: 'config_update' | 'role_update' | 'user_update',
        description: string,
        organizationId: string,
        metadata?: Record<string, any>
    ) => {
        await auditLogService.createLog(
            userId,
            userEmail,
            userName,
            action,
            'Configuración',
            description,
            organizationId,
            metadata,
            'warning'
        );
    },

    logValuation: async (
        userId: string,
        userEmail: string,
        userName: string,
        propertyType: string,
        location: string,
        value: number,
        organizationId: string
    ) => {
        await auditLogService.createLog(
            userId,
            userEmail,
            userName,
            'valuation_create',
            'Tasaciones',
            `${userName} realizó una tasación para ${propertyType} en ${location}: USD ${value.toLocaleString()}`,
            organizationId,
            { propertyType, location, value },
            'info'
        );
    },

    logTicket: async (
        userId: string,
        userEmail: string,
        userName: string,
        action: 'ticket_create' | 'ticket_status_update' | 'ticket_update',
        ticketId: string,
        ticketTitle: string,
        organizationId: string,
        metadata?: Record<string, any>
    ) => {
        const descriptions = {
            ticket_create: `${userName} creó el ticket "${ticketTitle}"`,
            ticket_status_update: `${userName} actualizó el estado del ticket "${ticketTitle}"`,
            ticket_update: `${userName} actualizó el ticket "${ticketTitle}"`,
        };

        await auditLogService.createLog(
            userId,
            userEmail,
            userName,
            action,
            'Soporte',
            descriptions[action],
            organizationId,
            { ticketId, ticketTitle, ...metadata },
            'info'
        );
    },
};
