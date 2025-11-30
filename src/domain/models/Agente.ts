export interface Agente {
    id: string; // userId
    nombre: string;
    email: string;
    telefono: string;
    foto?: string;

    // Comisiones
    comisionVenta: number; // % por venta
    comisionAlquiler: number; // % por alquiler
    comisionPropiedadPropia: number; // % adicional si es su propiedad

    // Estadísticas
    totalVentas: number;
    totalAlquileres: number;
    totalVisitas: number;
    totalComisiones: number;

    // Propiedades
    propiedadesPropias: string[]; // IDs de propiedades que trajo
    propiedadesAsignadas: string[]; // IDs de propiedades asignadas

    // Estado
    activo: boolean;
    fechaIngreso: Date;

    userId: string; // Inmobiliaria owner
    createdAt: Date;
    updatedAt: Date;
}

export interface Transaccion {
    id: string;
    tipo: 'venta' | 'alquiler';
    propiedadId: string;
    propiedadDireccion: string;
    agenteId: string;
    agenteNombre: string;
    clienteId?: string;
    clienteNombre: string;

    // Montos
    montoTotal: number;
    comisionPorcentaje: number;
    comisionMonto: number;

    // Flags
    esPropiedadPropia: boolean; // Si el agente trajo la propiedad
    comisionExtra?: number; // Comisión adicional si es propia

    // Estado
    estado: 'pendiente' | 'pagada' | 'cancelada';
    fechaTransaccion: Date;
    fechaPago?: Date;

    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ConfiguracionComisiones {
    id: string;

    // Comisiones por defecto para nuevos agentes
    comisionVentaDefault: number;
    comisionAlquilerDefault: number;
    comisionPropiedadPropiaDefault: number;

    // Bonificaciones por volumen
    bonificaciones: {
        ventasMinimas: number;
        bonoPorcentaje: number;
    }[];

    userId: string;
    updatedAt: Date;
}
