export interface CuentaBancaria {
    banco: string;
    cbu: string;
    alias: string;
}

export interface Propietario {
    id: string;
    nombre: string;
    email: string;
    telefono: string;
    dni: string;
    cuit?: string;
    domicilio: string;
    propiedades: string[]; // IDs de propiedades
    cuentaBancaria?: CuentaBancaria;
    comision: number; // % de comisión
    documentos: string[];
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
