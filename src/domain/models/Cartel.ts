export type CartelEstado =
    | "instalado"
    | "almacen"
    | "reparacion"
    | "retirar"
    | "roto"
    | "perdido";

export type CartelTipo = "venta" | "alquiler" | "venta_alquiler" | "obra" | "otro";

export type CartelMaterial =
    | "plastico_corrugado"
    | "lona"
    | "vinilo_autoadhesivo"
    | "chapa"
    | "otro";

export type CartelMedida = "33x50" | "33x100" | "50x70" | "70x100" | "100x200" | "personalizada";

export interface CartelMovimiento {
    fecha: Date;
    estadoAnterior: CartelEstado | null;
    estadoNuevo: CartelEstado;
    propiedadIdAnterior?: string | null;
    propiedadDireccionAnterior?: string | null;
    propiedadIdNuevo?: string | null;
    propiedadDireccionNuevo?: string | null;
    nota?: string;
    usuarioNombre?: string;
}

export interface Cartel {
    id: string;
    userId: string;
    branchId?: string | null;

    codigo: string; // internal label, e.g. "CART-014" — for physically tagging the sign

    tipo: CartelTipo;
    material: CartelMaterial;
    materialPersonalizado?: string; // used when material === "otro"
    medida: CartelMedida;
    medidaPersonalizada?: string; // used when medida === "personalizada"

    estado: CartelEstado;

    // Where it currently is — mutually relevant depending on `estado`
    propiedadId?: string | null; // set when estado === "instalado" (or "retirar")
    propiedadDireccion?: string | null; // denormalized snapshot, avoids an extra fetch per card
    ubicacionAlmacen?: string; // free text, e.g. "Depósito Oeste, estante 3" — relevant when estado === "almacen"

    fotos: string[];

    // Investment tracking — both optional per the owner's request
    costoAdquisicion?: number;
    proveedor?: string;
    costoInstalacion?: number;

    fechaAdquisicion?: Date | null;
    fechaInstalacion?: Date | null;

    notas?: string;

    historial: CartelMovimiento[];

    createdAt: Date;
    updatedAt: Date;
}

export const CARTEL_ESTADO_LABELS: Record<CartelEstado, string> = {
    instalado: "Instalado",
    almacen: "En almacén",
    reparacion: "En reparación",
    retirar: "A retirar",
    roto: "Roto / de baja",
    perdido: "Perdido / robado",
};

export const CARTEL_TIPO_LABELS: Record<CartelTipo, string> = {
    venta: "Venta",
    alquiler: "Alquiler",
    venta_alquiler: "Venta o Alquiler",
    obra: "Obra en construcción",
    otro: "Otro",
};

export const CARTEL_MATERIAL_LABELS: Record<CartelMaterial, string> = {
    plastico_corrugado: "Plástico corrugado",
    lona: "Lona",
    vinilo_autoadhesivo: "Vinilo autoadhesivo",
    chapa: "Chapa",
    otro: "Otro",
};

export const CARTEL_MEDIDA_LABELS: Record<CartelMedida, string> = {
    "33x50": "33 x 50 cm",
    "33x100": "33 x 100 cm",
    "50x70": "50 x 70 cm",
    "70x100": "70 x 100 cm",
    "100x200": "100 x 200 cm",
    personalizada: "Personalizada",
};
