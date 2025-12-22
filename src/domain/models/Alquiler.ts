export interface Garante {
    nombre: string;
    telefono: string;
    email: string;
    dni: string;
}

export interface SeguroCaucion {
    compania: string; // Nombre de la compañía aseguradora
    numeroPoliza: string;
    montoAsegurado: number;
    fechaEmision: Date;
    fechaVencimiento: Date;
    contactoCompania: string; // Email o teléfono de la aseguradora
    observaciones?: string;
}

export interface Pago {
    id: string;
    mes: string; // "2024-01"
    monto: number;
    fechaPago?: Date;
    fechaVencimiento: Date;
    estado: 'pendiente' | 'pagado' | 'vencido';
    metodoPago?: string;
    comprobante?: string;
}

export interface Incidencia {
    id: string;
    titulo: string;
    descripcion: string;
    estado: 'abierto' | 'en_proceso' | 'resuelto';
    fechaCreacion: Date;
    fechaResolucion?: Date;
    comentarios: string[];
    imagenes?: string[];
}

export interface Alquiler {
    id: string;
    propiedadId: string;
    propiedadTipo: string;
    direccion: string;
    inquilinoId: string;
    nombreInquilino: string;
    contactoInquilino: string;

    // Tipo de garantía
    tipoGarantia: 'garante' | 'seguro_caucion';
    garante?: Garante | null; // Solo si tipoGarantia === 'garante'
    seguroCaucion?: SeguroCaucion | null; // Solo si tipoGarantia === 'seguro_caucion'

    fechaInicio: Date;
    fechaFin: Date;
    montoMensual: number;
    diaVencimiento: number;
    ajusteTipo: 'porcentaje' | 'ICL' | 'manual';
    ajusteValor: number;
    historialPagos: Pago[];
    incidencias: Incidencia[];
    estado: 'activo' | 'pendiente' | 'finalizado';
    documentos: string[];
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
