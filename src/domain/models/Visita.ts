export type VisitaEstado =
    | 'programada'
    | 'confirmada'
    | 'en_curso'
    | 'completada'
    | 'cancelada'
    | 'no_asistio';

export interface Visita {
    id: string;
    propiedadId: string;
    propiedadDireccion: string;
    propiedadTipo: string;
    clienteId?: string; // Optional if creating new client
    clienteNombre: string;
    clienteEmail: string;
    clienteTelefono: string;
    agenteId: string;
    agenteNombre: string;
    fechaHora: Date;
    duracion: number; // minutos
    estado: VisitaEstado;
    notasPrevias?: string;
    notasPostVisita?: string;
    nivelInteres?: 1 | 2 | 3 | 4 | 5;
    proximosPasos?: string;
    checkInHora?: Date;
    checkOutHora?: Date;
    recordatorioEnviado: boolean;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
