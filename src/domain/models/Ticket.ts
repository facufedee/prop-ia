export type TicketCategory =
    | 'soporte_tecnico'
    | 'mejora'
    | 'bug'
    | 'consulta'
    | 'administrativo'
    | 'otro';

export type TicketPriority = 'baja' | 'media' | 'alta' | 'urgente';

export type TicketStatus =
    | 'abierto'
    | 'en_progreso'
    | 'esperando_respuesta'
    | 'resuelto'
    | 'cerrado';

export interface TicketMessage {
    id: string;
    ticketId: string;
    userId: string;
    userName: string;
    userEmail: string;
    isAdmin: boolean;
    message: string;
    attachments?: string[]; // URLs de archivos adjuntos
    timestamp: Date;
}

export interface Ticket {
    id: string;

    // Usuario que creó el ticket
    userId: string;
    userName: string;
    userEmail: string;
    organizationId: string;
    organizationName: string;

    // Información del ticket
    title: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;

    // Asignación
    assignedToId?: string; // ID del admin asignado
    assignedToName?: string;

    // Mensajes
    messagesCount: number;
    lastMessageAt?: Date;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    resolvedAt?: Date;
    closedAt?: Date;
}
