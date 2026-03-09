export type LeadTipo = 'compra' | 'venta' | 'alquiler' | 'consulta';

export type LeadEstado =
    | 'nuevo'
    | 'contactado'
    | 'seguimiento'
    | 'visita_programada'
    | 'negociacion'
    | 'cerrado'
    | 'perdido'
    // Legacy states (for backwards compatibility)
    | 'leido'
    | 'respondido'
    | 'pendiente'
    | 'finalizado'
    | 'descartado'
    | 'calificado'
    | 'convertido';

export type LeadOrigen = 'web' | 'whatsapp' | 'instagram' | 'facebook' | 'portal' | 'referido' | 'telefono' | 'email' | 'otro';

export type LeadPrioridad = 'alta' | 'media' | 'baja';

export interface LeadInteraccion {
    tipo: 'nota' | 'llamada' | 'whatsapp' | 'email' | 'visita' | 'estado';
    descripcion: string;
    fecha: Date;
    userId?: string;
}

export interface LeadConsulta {
    propertyId?: string;
    propertyTitle?: string;
    mensaje: string;
    fecha: Date;
    origen: LeadOrigen;
}

export interface Lead {
    id: string;
    nombre: string;
    email: string;
    telefono: string;
    tipo: LeadTipo;
    estado: LeadEstado;
    presupuesto?: number;
    zona?: string;
    mensaje: string;
    notas: string[];
    fechaContacto?: Date;
    origen: LeadOrigen;
    prioridad?: LeadPrioridad;
    ultimaActividad?: Date;
    interacciones?: LeadInteraccion[];
    userId: string;
    organizationId?: string;
    propertyId?: string;
    propertyTitle?: string;
    consultas?: LeadConsulta[];
    createdAt: Date;
    updatedAt: Date;
}

// Maps legacy estados to new pipeline estados
export const LEGACY_ESTADO_MAP: Record<string, LeadEstado> = {
    leido: 'contactado',
    respondido: 'seguimiento',
    pendiente: 'seguimiento',
    calificado: 'negociacion',
    finalizado: 'cerrado',
    convertido: 'cerrado',
    descartado: 'perdido',
};

// Normalize a lead's estado to the new pipeline
export function normalizarEstado(estado: LeadEstado): LeadEstado {
    return LEGACY_ESTADO_MAP[estado] ?? estado;
}
