export type LogAction =
    // Auth
    | 'login'
    | 'logout'
    | 'register'
    // Propiedades
    | 'property_create'
    | 'property_update'
    | 'property_delete'
    | 'property_publish'
    | 'property_unpublish'
    // Agentes
    | 'agent_create'
    | 'agent_update'
    | 'agent_delete'
    // Alquileres
    | 'rental_create'
    | 'rental_update'
    | 'rental_delete'
    | 'rental_payment'
    // Visitas
    | 'visit_create'
    | 'visit_update'
    | 'visit_checkin'
    | 'visit_checkout'
    // Clientes
    | 'client_create'
    | 'client_update'
    | 'client_delete'
    // Leads
    | 'lead_create'
    | 'lead_update'
    | 'lead_convert'
    // Transacciones
    | 'transaction_create'
    | 'transaction_update'
    | 'commission_paid'
    // Tasaciones
    | 'valuation_create'
    // Tickets
    | 'ticket_create'
    | 'ticket_update'
    | 'ticket_status_update'
    // Configuración
    | 'config_update'
    | 'role_update'
    | 'user_update';

export type LogLevel = 'info' | 'warning' | 'error' | 'success';

export interface AuditLog {
    id: string;
    userId: string; // ID del usuario que realizó la acción
    userEmail: string;
    userName: string;
    action: LogAction;
    level: LogLevel;
    module: string; // Propiedades, Agentes, Alquileres, etc.
    description: string; // Descripción legible de la acción
    metadata?: Record<string, any>; // Datos adicionales (IDs, valores anteriores/nuevos, etc.)
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
    organizationId: string; // ID de la inmobiliaria
}

export interface LogFilter {
    userId?: string;
    action?: LogAction;
    level?: LogLevel;
    module?: string;
    startDate?: Date;
    endDate?: Date;
    searchTerm?: string;
}
