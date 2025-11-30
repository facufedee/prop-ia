"use client";

import { Incidencia } from "@/domain/models/Alquiler";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

interface MaintenanceListProps {
    incidencias: Incidencia[];
    onUpdateStatus: (id: string, newStatus: 'abierto' | 'en_proceso' | 'resuelto') => void;
}

export default function MaintenanceList({ incidencias, onUpdateStatus }: MaintenanceListProps) {
    const getEstadoBadge = (estado: string) => {
        const styles = {
            abierto: "bg-red-100 text-red-700",
            en_proceso: "bg-yellow-100 text-yellow-700",
            resuelto: "bg-green-100 text-green-700",
        };
        return styles[estado as keyof typeof styles] || styles.abierto;
    };

    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'resuelto':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'en_proceso':
                return <Clock className="w-5 h-5 text-yellow-600" />;
            default:
                return <AlertCircle className="w-5 h-5 text-red-600" />;
        }
    };

    return (
        <div className="space-y-4">
            {incidencias.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
                    No hay incidencias registradas
                </div>
            ) : (
                incidencias.map((incidencia) => (
                    <div key={incidencia.id} className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3">
                                {getEstadoIcon(incidencia.estado)}
                                <div>
                                    <h4 className="font-semibold text-gray-900">{incidencia.titulo}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{incidencia.descripcion}</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getEstadoBadge(incidencia.estado)}`}>
                                {incidencia.estado.replace('_', ' ')}
                            </span>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                            <div className="text-sm text-gray-500">
                                Creado: {new Date(incidencia.fechaCreacion).toLocaleDateString()}
                                {incidencia.fechaResolucion && (
                                    <span className="ml-4">
                                        Resuelto: {new Date(incidencia.fechaResolucion).toLocaleDateString()}
                                    </span>
                                )}
                            </div>

                            {incidencia.estado !== 'resuelto' && (
                                <div className="flex gap-2">
                                    {incidencia.estado === 'abierto' && (
                                        <button
                                            onClick={() => onUpdateStatus(incidencia.id, 'en_proceso')}
                                            className="px-3 py-1 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                                        >
                                            En Proceso
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onUpdateStatus(incidencia.id, 'resuelto')}
                                        className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Marcar Resuelto
                                    </button>
                                </div>
                            )}
                        </div>

                        {incidencia.comentarios && incidencia.comentarios.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-sm font-medium text-gray-700 mb-2">Comentarios:</p>
                                <div className="space-y-2">
                                    {incidencia.comentarios.map((comentario, idx) => (
                                        <p key={idx} className="text-sm text-gray-600 pl-4 border-l-2 border-gray-200">
                                            {comentario}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}
