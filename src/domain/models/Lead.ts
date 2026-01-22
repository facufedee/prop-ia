export type LeadTipo = 'compra' | 'venta' | 'alquiler' | 'consulta';
export type LeadEstado = 'nuevo' | 'contactado' | 'calificado' | 'convertido' | 'descartado';
export type LeadOrigen = 'web' | 'telefono' | 'email' | 'referido' | 'otro';

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
    createdAt: Date;
    updatedAt: Date;
}
