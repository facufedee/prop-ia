export interface DatosGarante {
    nombre: string;
    telefono: string;
    email: string;
    dni: string;
    domicilio?: string;
}

export interface Inquilino {
    id: string;
    nombre: string;
    email: string;
    telefono: string;
    dni: string;
    domicilio: string;
    datosGarante: DatosGarante;
    documentos: string[];
    userId: string;
    createdAt: Date;
}
