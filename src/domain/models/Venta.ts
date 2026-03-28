export type VentaEtapa =
    | 'prospecto'
    | 'oferta_presentada'
    | 'contraoferta'
    | 'aceptada'
    | 'seña'
    | 'escrituracion'
    | 'cerrada'
    | 'caida';

export type ModalidadComision =
    | 'comprador'
    | 'vendedor'
    | 'ambas_partes';

export interface ParteVenta {
    nombre: string;
    dni: string;
    cuit?: string;
    domicilio?: string;
    email?: string;
    telefono?: string;
    estadoCivil?: string;
    conyuge?: string;
}

export interface Seña {
    monto: number;
    moneda: 'ARS' | 'USD';
    fecha: Date;
    metodoPago: 'efectivo' | 'transferencia' | 'cheque';
    nroComprobante?: string;
    observaciones?: string;
}

export interface Escritura {
    escribanoNombre?: string;
    escribanoRegistro?: string;
    fechaPrevista?: Date;
    fechaRealizada?: Date;
    nroEscritura?: string;
    folioNro?: string;
    tomoNro?: string;
    montoDeclarado?: number;
    moneda?: 'ARS' | 'USD';
    observaciones?: string;
}

export interface EventoVenta {
    id: string;
    tipo: 'nota' | 'llamada' | 'visita' | 'oferta' | 'documento' | 'estado' | 'otro';
    descripcion: string;
    fecha: Date;
    agenteNombre?: string;
}

export interface VentaOperacion {
    id: string;

    // Pipeline
    etapa: VentaEtapa;
    fechaEtapaActual: Date;

    // Propiedad
    propiedadId: string;
    direccion: string;
    propiedadTipo: string;
    nroPartidaInmobiliaria?: string;
    superficie?: number;

    // Precio
    precioListado: number;
    precioAcordado?: number;
    moneda: 'ARS' | 'USD';

    // COTI (requisito legal Argentina)
    cotiNumero?: string;
    cotiFecha?: Date;

    // Partes
    compradores: ParteVenta[];
    vendedores: ParteVenta[];

    // Comisiones
    comisionPorcentaje: number;
    comisionModalidad: ModalidadComision;
    comisionMontoBruto?: number;
    comisionMoneda?: 'ARS' | 'USD';
    agenteVendedorId?: string;
    agenteCompradorId?: string;
    comisionAgenteVendedor?: number;
    comisionAgenteComprador?: number;

    // Seña / Boleto
    seña?: Seña;
    fechaBoleto?: Date;

    // Escritura
    escritura?: Escritura;

    // Timeline
    eventos: EventoVenta[];

    // Documentos (Firebase Storage URLs)
    documentos: string[];

    observaciones?: string;

    estado: 'activo' | 'cerrado' | 'caido';

    userId: string;
    branchId?: string;
    organizationId?: string;

    createdAt: Date;
    updatedAt: Date;
}

// ── UI helpers ────────────────────────────────────────────────────────────────

export const ETAPA_CONFIG: Record<VentaEtapa, { label: string; color: string; bg: string; border: string }> = {
    prospecto:         { label: 'Prospecto',          color: 'text-gray-600',   bg: 'bg-gray-100',   border: 'border-gray-300' },
    oferta_presentada: { label: 'Oferta Presentada',  color: 'text-indigo-700', bg: 'bg-indigo-100', border: 'border-indigo-300' },
    contraoferta:      { label: 'Contraoferta',        color: 'text-amber-700',  bg: 'bg-amber-100',  border: 'border-amber-300' },
    aceptada:          { label: 'Aceptada',            color: 'text-teal-700',   bg: 'bg-teal-100',   border: 'border-teal-300' },
    seña:              { label: 'Seña / Boleto',       color: 'text-blue-700',   bg: 'bg-blue-100',   border: 'border-blue-300' },
    escrituracion:     { label: 'En Escrituración',   color: 'text-violet-700', bg: 'bg-violet-100', border: 'border-violet-300' },
    cerrada:           { label: 'Cerrada',             color: 'text-green-700',  bg: 'bg-green-100',  border: 'border-green-300' },
    caida:             { label: 'Caída',               color: 'text-red-700',    bg: 'bg-red-100',    border: 'border-red-300' },
};

export const ETAPAS_ACTIVAS: VentaEtapa[] = [
    'prospecto', 'oferta_presentada', 'contraoferta', 'aceptada', 'seña', 'escrituracion',
];
