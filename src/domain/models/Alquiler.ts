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
    monto: number; // Total a pagar o pagado
    montoAlquiler?: number;
    montoServicios?: number;
    montoPunitorios?: number;
    montoDescuento?: number;
    pagoParcial?: number;

    // Detailed breakdown
    desglose?: {
        alquilerPuro: number;
        servicios: number;
        honorarios?: number;
        cargosAdicionales?: number;
        otros?: number;
    };
    cargosAdicionales?: { id: string; concepto: string; monto: number }[];
    punitoriosAplicados?: { dias: number; monto: number; nota?: string; tasaApplied?: number };

    detalleServicios?: { concepto: string; monto: number }[];
    fechaPago?: Date;
    fechaVencimiento: Date;
    estado: 'pendiente' | 'pagado' | 'vencido' | 'parcial';
    metodoPago?: string;
    comprobante?: string;
    moneda?: string;
    nota?: string;
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
    // Datos del Inquilino
    inquilinoId: string;
    nombreInquilino: string;
    contactoInquilino: string;
    telefonoInquilino?: string;
    whatsappInquilino?: string;
    dniInquilino?: string;
    cuitInquilino?: string;
    domicilioInquilino?: string;

    // Datos del Propietario
    propietarioId?: string;
    nombrePropietario?: string;
    dniPropietario?: string;
    domicilioPropietario?: string;
    emailPropietario?: string;
    cuitPropietario?: string;
    telefonoPropietario?: string;

    // Datos Bancarios
    cuentaBancaria?: string;
    banco?: string;
    cbu?: string;
    alias?: string;

    // Tipo de garantía
    tipoGarantia?: 'garante' | 'seguro_caucion';
    garante?: Garante | null; // Solo si tipoGarantia === 'garante'
    seguroCaucion?: SeguroCaucion | null; // Solo si tipoGarantia === 'seguro_caucion'

    // Nuevos campos
    nroPartidaInmobiliaria?: string;
    valorDeposito?: number;

    honorariosTipo?: 'fijo' | 'porcentaje';
    honorariosValor?: number;

    metodoPago?: string;
    serviciosAdicionales?: string[]; // Array de keys ['luz', 'gas', 'cochera', 'wifi', 'expensas', 'agua']

    punitoriosTipo?: 'fijo' | 'porcentaje';
    punitoriosValor?: number;

    fechaInicio: Date;
    fechaFin: Date;
    montoMensual: number;
    diaVencimiento: number;
    ajusteTipo: 'porcentaje' | 'ICL' | 'IPC' | 'casa_propia' | 'manual';
    ajusteValor: number;
    estadoInmueble?: string;
    // tasaPunitorios deprecated in favor of punitoriosTipo/Val

    historialPagos: Pago[];
    incidencias: Incidencia[];
    estado: 'activo' | 'pendiente' | 'finalizado' | 'suspendido';
    documentos: string[];
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
