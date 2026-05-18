"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Plus, Clock, MapPin, X, Trash2, Edit } from "lucide-react";
import { auth, db } from "@/infrastructure/firebase/client";
import { visitasService } from "@/infrastructure/services/visitasService";
import { Visita } from "@/domain/models/Visita";
import { Lead } from "@/domain/models/Lead";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";

interface Property {
    id: string;
    direccion: string;
    property_type: string;
}

interface LeadAgendaSidebarProps {
    lead: Lead;
    onVisitCreated: (fechaHora: Date, propiedadInfo: string) => void;
}

export default function LeadAgendaSidebar({ lead, onVisitCreated }: LeadAgendaSidebarProps) {
    const [visitas, setVisitas] = useState<Visita[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [properties, setProperties] = useState<Property[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        propiedadId: "",
        agenteId: "",
        fecha: format(new Date(), "yyyy-MM-dd"),
        hora: "10:00",
        duracion: "60",
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (lead.id) {
            fetchVisitas();
            fetchPropertiesAndAgents();
        }
    }, [lead.id]);

    const fetchVisitas = async () => {
        if (!auth?.currentUser) return;
        try {
            setLoading(true);
            const data = await visitasService.getVisitasByLead(auth.currentUser.uid, lead.id);
            setVisitas(data);
        } catch (error) {
            console.error("Error fetching lead visitas:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPropertiesAndAgents = async () => {
        if (!auth?.currentUser || !db) return;
        try {
            // Fetch user properties
            const propsQuery = query(collection(db, "properties"), where("userId", "==", auth?.currentUser?.uid));
            const propsSnap = await getDocs(propsQuery);
            const props = propsSnap.docs.map(doc => ({
                id: doc.id,
                direccion: `${doc.data().calle} ${doc.data().altura}, ${doc.data().localidad}`,
                property_type: doc.data().property_type,
            }));
            setProperties(props);

            // Set current user as default agent for simplicity in this context
            setAgents([{
                id: auth.currentUser.uid,
                nombre: auth.currentUser.displayName || "Agente Actual",
            }]);

            setFormData(prev => ({
                ...prev,
                agenteId: auth?.currentUser?.uid || "",
                propiedadId: lead.propertyId || ""
            }));

        } catch (error) {
            console.error("Error fetching auxiliary data:", error);
        }
    };

    const handleDeleteVisita = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar esta visita?')) return;
        try {
            await visitasService.deleteVisita(id);
            setVisitas(prev => prev.filter(v => v.id !== id));
            toast.success("Visita cancelada/eliminada");
        } catch (error) {
            toast.error("Error al eliminar visita");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth?.currentUser) return;

        try {
            setSaving(true);
            const selectedProp = properties.find(p => p.id === formData.propiedadId);
            const selectedAgent = agents.find(a => a.id === formData.agenteId);

            if (!selectedProp) return toast.error("Seleccioná una propiedad");

            const fechaHora = new Date(`${formData.fecha}T${formData.hora}`);

            await visitasService.createVisita({
                leadId: lead.id,
                propiedadId: selectedProp.id,
                propiedadDireccion: selectedProp.direccion,
                propiedadTipo: selectedProp.property_type,
                clienteNombre: lead.nombre,
                clienteEmail: lead.email || '',
                clienteTelefono: lead.telefono || '',
                agenteId: formData.agenteId,
                agenteNombre: selectedAgent?.nombre || 'Agente',
                fechaHora,
                duracion: parseInt(formData.duracion),
                estado: 'programada',
                notasPrevias: `Agendado desde el perfil del lead ${lead.nombre}`,
                recordatorioEnviado: false,
                recordatorioMismoDiaEnviado: false,
                userId: auth.currentUser.uid,
            } as any);

            toast.success("Visita agendada correctamente");
            setShowForm(false);
            fetchVisitas();

            // Notificar al padre para registrar en el historial
            onVisitCreated(fechaHora, selectedProp.direccion);

        } catch (error) {
            console.error(error);
            toast.error("Error al agendar visita");
        } finally {
            setSaving(false);
        }
    };

    // Status colors
    const estadoColors: Record<string, string> = {
        programada: 'bg-blue-100 text-blue-700',
        confirmada: 'bg-green-100 text-green-700',
        en_curso: 'bg-yellow-100 text-yellow-700',
        completada: 'bg-gray-100 text-gray-700',
        cancelada: 'bg-red-100 text-red-700',
        no_asistio: 'bg-orange-100 text-orange-700',
    };

    return (
        <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col flex-shrink-0">
            {/* Header */}
            <div className="pt-6 px-6 pb-4 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-gray-900">Agenda del Cliente</h3>
                </div>
                {!showForm && (
                    <div className="relative group/addbtn">
                        <button
                            onClick={() => setShowForm(true)}
                            className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                        <div className="absolute top-full right-0 mt-2 w-max bg-gray-800 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg opacity-0 invisible group-hover/addbtn:opacity-100 group-hover/addbtn:visible transition-all duration-300 group-hover/addbtn:delay-[3000ms] pointer-events-none z-[100]">
                            Agendar nueva visita
                        </div>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 relative">

                {/* Agendar Form Modal / Inline */}
                {showForm && (
                    <div className="mb-6 bg-white border border-indigo-100 shadow-sm rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                            <span className="font-medium text-sm text-gray-800">Nueva Visita</span>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Propiedad</label>
                                <select
                                    required
                                    value={formData.propiedadId}
                                    onChange={e => setFormData(p => ({ ...p, propiedadId: e.target.value }))}
                                    className="w-full text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 bg-white"
                                >
                                    <option value="">Seleccionar...</option>
                                    {properties.map(p => (
                                        <option key={p.id} value={p.id}>{p.direccion}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Día</label>
                                    <input
                                        type="date" required
                                        value={formData.fecha}
                                        onChange={e => setFormData(p => ({ ...p, fecha: e.target.value }))}
                                        className="w-full text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Hora</label>
                                    <input
                                        type="time" required
                                        value={formData.hora}
                                        onChange={e => setFormData(p => ({ ...p, hora: e.target.value }))}
                                        className="w-full text-xs p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 bg-white"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit" disabled={saving}
                                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {saving ? "Agendando..." : "Confirmar Visita"}
                            </button>
                        </form>
                    </div>
                )}

                {/* Visits List */}
                {loading && !showForm ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                    </div>
                ) : visitas.length === 0 && !showForm ? (
                    <div className="text-center py-10 px-4">
                        <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Calendar className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-500">No hay visitas programadas con este cliente.</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="mt-4 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                            Agendar la primera
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {visitas.map(visita => (
                            <div key={visita.id} className="bg-white border text-left border-gray-200 rounded-xl p-3 shadow-sm relative group hover:border-indigo-200 transition-colors">
                                {/* Delete Overlay Button */}
                                <div className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-all z-20 group/delbtn">
                                    <button
                                        onClick={() => handleDeleteVisita(visita.id)}
                                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <div className="absolute bottom-full right-0 mb-2 w-max bg-gray-800 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg opacity-0 invisible group-hover/delbtn:opacity-100 group-hover/delbtn:visible transition-all duration-300 group-hover/delbtn:delay-[3000ms] pointer-events-none z-[100]">
                                        Cancelar visita
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mb-2 pr-6">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${estadoColors[visita.estado] || estadoColors.programada}`}>
                                        {visita.estado.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="flex gap-2 items-start mt-2">
                                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">
                                            {format(new Date(visita.fechaHora), "EEEE d 'de' MMMM", { locale: es })}
                                        </p>
                                        <p className="text-[11px] text-gray-500">
                                            {format(new Date(visita.fechaHora), "HH:mm")} hs
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2 items-start mt-2 pt-2 border-t border-gray-50">
                                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-gray-600 font-medium leading-tight">
                                        {visita.propiedadDireccion}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
