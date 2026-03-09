export type LeadTipo = 'compra' | 'venta' | 'alquiler' | 'consulta';
export type LeadEstado = 'nuevo' | 'contactado' | 'leido' | 'respondido' | 'pendiente' | 'finalizado' | 'descartado' | 'calificado' | 'convertido';
export type LeadOrigen = 'web' | 'telefono' | 'email' | 'referido' | 'otro';

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
    userId: string;
    organizationId?: string;
    propertyId?: string;
    propertyTitle?: string;
    consultas?: LeadConsulta[]; // History of grouped inquiries
    createdAt: Date;
    updatedAt: Date;
}
