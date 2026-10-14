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
            abierto: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
            en_proceso: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
            resuelto: "bg-[var(--color-positive-soft)] text-[var(--color-positive)]",
        };
        return styles[estado as keyof typeof styles] || styles.abierto;
    };

    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'resuelto':
                return <CheckCircle strokeWidth={1.5} className="w-5 h-5 text-[var(--color-positive)]" />;
            case 'en_proceso':
                return <Clock strokeWidth={1.5} className="w-5 h-5 text-[var(--color-warning)]" />;
            default:
                return <AlertCircle strokeWidth={1.5} className="w-5 h-5 text-[var(--color-danger)]" />;
        }
    };

    return (
        <div className="space-y-4">
            {incidencias.length === 0 ? (
                <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-12 text-center text-[var(--color-muted)]">
                    No hay incidencias registradas
                </div>
            ) : (
                incidencias.map((incidencia) => (
                    <div key={incidencia.id} className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-6">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3">
                                {getEstadoIcon(incidencia.estado)}
                                <div>
                                    <h4 className="font-semibold text-[var(--color-ink)]">{incidencia.titulo}</h4>
                                    <p className="text-sm text-[var(--color-ink-2)] mt-1">{incidencia.descripcion}</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getEstadoBadge(incidencia.estado)}`}>
                                {incidencia.estado.replace('_', ' ')}
                            </span>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--color-rule-2)]">
                            <div className="text-sm text-[var(--color-muted)]">
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
                                            className="px-3 py-1 text-sm bg-[var(--color-warning)] text-[var(--color-accent-ink)] rounded-lg hover:bg-[var(--color-warning)] transition-colors"
                                        >
                                            En Proceso
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onUpdateStatus(incidencia.id, 'resuelto')}
                                        className="px-3 py-1 text-sm bg-[var(--color-positive)] text-[var(--color-accent-ink)] rounded-lg hover:bg-[var(--color-positive)] transition-colors"
                                    >
                                        Marcar Resuelto
                                    </button>
                                </div>
                            )}
                        </div>

                        {incidencia.comentarios && incidencia.comentarios.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-[var(--color-rule-2)]">
                                <p className="text-sm font-medium text-[var(--color-ink-2)] mb-2">Comentarios:</p>
                                <div className="space-y-2">
                                    {incidencia.comentarios.map((comentario, idx) => (
                                        <p key={idx} className="text-sm text-[var(--color-ink-2)] pl-4 border-l-2 border-[var(--color-rule)]">
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
