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
                <h3 className="text-lg font-semibold text-gray-900">Solicitudes de Mantenimiento</h3>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
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
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900">Nueva Solicitud de Mantenimiento</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Título / Problema
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                    placeholder="Ej: Gotera en baño principal"
                                    value={newIncidencia.titulo}
                                    onChange={(e) => setNewIncidencia({ ...newIncidencia, titulo: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción Detallada
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-gray-900"
                                    placeholder="Describa el problema, ubicación exacta, urgencia, etc."
                                    value={newIncidencia.descripcion}
                                    onChange={(e) => setNewIncidencia({ ...newIncidencia, descripcion: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
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
