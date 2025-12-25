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
    detalleServicios?: { concepto: string; monto: number }[];
    fechaPago?: Date;
    fechaVencimiento: Date;
    estado: 'pendiente' | 'pagado' | 'vencido' | 'parcial';
    metodoPago?: string;
    comprobante?: string;
    moneda?: string;
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
    tipoGarantia: 'garante' | 'seguro_caucion';
    garante?: Garante | null; // Solo si tipoGarantia === 'garante'
    seguroCaucion?: SeguroCaucion | null; // Solo si tipoGarantia === 'seguro_caucion'

    fechaInicio: Date;
    fechaFin: Date;
    montoMensual: number;
    diaVencimiento: number;
    ajusteTipo: 'porcentaje' | 'ICL' | 'manual';
    ajusteValor: number;
    estadoInmueble?: string;
    tasaPunitorios?: number; // Tasa diaria por mora (default 1%)
    historialPagos: Pago[];
    incidencias: Incidencia[];
    estado: 'activo' | 'pendiente' | 'finalizado' | 'suspendido';
    documentos: string[];
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
