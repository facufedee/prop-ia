import { useState } from "react";
import { Incidencia } from "@/domain/models/Alquiler";
import MaintenanceList from "./MaintenanceList";
import { Plus, X, Save } from "lucide-react";

interface MaintenanceTabProps {
    incidencias: Incidencia[];
    onUpdateStatus: (id: string, newStatus: 'abierto' | 'en_proceso' | 'resuelto') => void;
    onCreateIncidencia: (incidencia: Omit<Incidencia, 'id' | 'fechaCreacion' | 'comentarios'>) => void;
}

export default function MaintenanceTab({ incidencias, onUpdateStatus, onCreateIncidencia }: MaintenanceTabProps) {
    const [showModal, setShowModal] = useState(false);
    const [newIncidencia, setNewIncidencia] = useState({
        titulo: '',
        descripcion: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreateIncidencia({
            titulo: newIncidencia.titulo,
            descripcion: newIncidencia.descripcion,
            estado: 'abierto',
            // coments and images empty by default
        });
        setNewIncidencia({ titulo: '', descripcion: '' });
        setShowModal(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-[var(--color-ink)]">Solicitudes de Mantenimiento</h3>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-lg hover:bg-[var(--color-ink-2)] transition-colors text-sm font-medium"
                >
                    <Plus strokeWidth={1.5} className="w-4 h-4" />
                    Nueva Solicitud
                </button>
            </div>

            <MaintenanceList
                incidencias={incidencias}
                onUpdateStatus={onUpdateStatus}
            />

            {/* Modal de Nueva Solicitud */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-[var(--color-paper-2)] rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-[var(--color-rule-2)]">
                            <h3 className="font-semibold text-[var(--color-ink)]">Nueva Solicitud de Mantenimiento</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1 text-[var(--color-neutral)] hover:text-[var(--color-ink-2)] rounded-lg hover:bg-[var(--color-paper-3)]"
                            >
                                <X strokeWidth={1.5} className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">
                                    Título / Problema
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                                    placeholder="Ej: Gotera en baño principal"
                                    value={newIncidencia.titulo}
                                    onChange={(e) => setNewIncidencia({ ...newIncidencia, titulo: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">
                                    Descripción Detallada
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full px-3 py-2 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] resize-none text-[var(--color-ink)]"
                                    placeholder="Describa el problema, ubicación exacta, urgencia, etc."
                                    value={newIncidencia.descripcion}
                                    onChange={(e) => setNewIncidencia({ ...newIncidencia, descripcion: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-[var(--color-rule)] text-[var(--color-ink-2)] rounded-lg hover:bg-[var(--color-paper-3)] transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-lg hover:bg-[var(--color-ink-2)] transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    <Save strokeWidth={1.5} className="w-4 h-4" />
                                    Registrar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
