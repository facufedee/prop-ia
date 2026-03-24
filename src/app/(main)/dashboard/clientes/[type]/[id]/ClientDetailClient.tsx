"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Mail, Phone, MessageSquare, Calendar, Building2, User, Save, Loader2, StickyNote, Activity, FileText, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { auth } from "@/infrastructure/firebase/client";
import { inquilinosService } from "@/infrastructure/services/inquilinosService";
import { propietariosService } from "@/infrastructure/services/propietariosService";
import { leadsService } from "@/infrastructure/services/leadsService";
import { publicService, PublicProperty } from "@/infrastructure/services/publicService";
import { Inquilino } from "@/domain/models/Inquilino";
import { Propietario } from "@/domain/models/Propietario";
import { Lead } from "@/domain/models/Lead";
import LeadAgendaSidebar from "../../components/LeadAgendaSidebar";

import { toast } from "sonner"; // Assuming sonner is used

interface ClientDetailClientProps {
    type: string;
    id: string;
}

export default function ClientDetailClient({ type, id }: ClientDetailClientProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Inquilino | Propietario | Lead | null>(null);
    const [activeTab, setActiveTab] = useState<'activity' | 'notes' | 'properties'>('activity');
    const [propiedadesLinked, setPropiedadesLinked] = useState<PublicProperty[]>([]);
    const [newNote, setNewNote] = useState("");
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
    const [openCommentIdx, setOpenCommentIdx] = useState<number | null>(null);
    const [isSavingComment, setIsSavingComment] = useState(false);
    const [archivedConsultas, setArchivedConsultas] = useState<Set<number>>(new Set());

    useEffect(() => {
        const unsubscribe = auth?.onAuthStateChanged((user) => {
            if (user) {
                fetchData(user.uid);
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe?.();
    }, [type, id]);

    const fetchData = async (uid: string) => {
        try {
            setLoading(true);
            let result = null;

            if (type === 'inquilinos') {
                const items = await inquilinosService.getInquilinos(uid);
                result = items.find(i => i.id === id);
            } else if (type === 'propietarios') {
                const items = await propietariosService.getPropietarios(uid);
                result = items.find(i => i.id === id);
            } else if (type === 'leads') {
                const items = await leadsService.getLeads(uid);
                result = items.find(i => i.id === id);
            }

            if (!result) {
                toast.error("Cliente no encontrado.");
                router.push('/dashboard/clientes');
                return;
            }

            setData(result);

            // If propietario, fetch linked properties for display
            if (type === 'propietarios' && result) {
                const prop = result as Propietario;
                if (prop.propiedades && prop.propiedades.length > 0) {
                    const propDetails = await Promise.all(
                        prop.propiedades.map(pid => publicService.getPropertyById(pid).catch(() => null))
                    );
                    setPropiedadesLinked(propDetails.filter(Boolean) as PublicProperty[]);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Error cargando detalles del cliente");
        } finally {
            setLoading(false);
        }
    };
    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        setIsSavingNote(true);
        try {
            const noteEntry = `${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })} - ${newNote}`;
            if (type === 'leads') {
                const lead = data as Lead;
                const updatedNotas = [noteEntry, ...(lead.notas || [])];
                await leadsService.updateLead(id, { notas: updatedNotas });
                setData({ ...lead, notas: updatedNotas });
            } else {
                toast.info("Las notas están habilitadas principalmente para Leads en esta versión.");
            }
            setNewNote("");
            toast.success("Nota agregada");
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar la nota");
        } finally {
            setIsSavingNote(false);
        }
    };

    const handleVisitCreated = async (fechaHora: Date, propiedadInfo: string) => {
        if (type !== 'leads' || !data) return;
        try {
            const dateStr = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });
            const userFriendlyVisitDate = format(fechaHora, "dd/MM/yyyy HH:mm");
            const noteEntry = `[Visita Programada] ${dateStr} - Se agendó una visita para la propiedad ${propiedadInfo} el día ${userFriendlyVisitDate}`;

            const lead = data as Lead;
            const updatedNotas = [noteEntry, ...(lead.notas || [])];
            await leadsService.updateLead(id, { notas: updatedNotas });
            setData({ ...lead, notas: updatedNotas });

        } catch (error) {
            console.error("Error al agregar nota de visita:", error);
        }
    };

    const handleSaveConsultaComment = async (consultaIdx: number) => {
        const comment = commentInputs[consultaIdx]?.trim();
        if (!comment || type !== 'leads') return;
        setIsSavingComment(true);
        try {
            const lead = data as Lead;
            const dateStr = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });
            const noteEntry = `[Consulta #${consultaIdx + 1}] ${dateStr} - ${comment}`;
            const updatedNotas = [noteEntry, ...(lead.notas || [])];
            await leadsService.updateLead(id, { notas: updatedNotas });
            setData({ ...lead, notas: updatedNotas });
            setCommentInputs(prev => ({ ...prev, [consultaIdx]: '' }));
            setOpenCommentIdx(null);
            toast.success('Comentario guardado');
        } catch (err) {
            console.error(err);
            toast.error('Error al guardar comentario');
        } finally {
            setIsSavingComment(false);
        }
    };

    const handleDeleteConsulta = async (consultaIdx: number) => {
        if (!confirm('¿Eliminar esta consulta del historial?') || type !== 'leads') return;
        try {
            const lead = data as Lead;
            const updated = (lead.consultas || []).filter((_, i) => i !== consultaIdx);
            await leadsService.updateLead(id, { consultas: updated } as any);
            setData({ ...lead, consultas: updated });
            toast.success('Consulta eliminada');
        } catch (err) {
            console.error(err);
            toast.error('Error al eliminar consulta');
        }
    };

    const handleUpdateLeadEstado = async (newEstado: string) => {
        if (type !== 'leads') return;
        try {
            const estadoTyped = newEstado as import("@/domain/models/Lead").LeadEstado;
            await leadsService.updateLead(id, { estado: estadoTyped });
            setData(prev => prev ? { ...prev, estado: estadoTyped } : prev);
            toast.success(`Estado actualizado a ${newEstado}`);
        } catch (err) {
            console.error(err);
            toast.error('Error al actualizar estado');
        }
    };

    const handleArchiveConsulta = (idx: number) => {
        setArchivedConsultas(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx); else next.add(idx);
            return next;
        });
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
            </div>
        );
    }

    if (!data) return null;

    const leadData = type === 'leads' ? (data as Lead) : null;
    const propData = type === 'propietarios' ? (data as Propietario) : null;
    const inqData = type === 'inquilinos' ? (data as Inquilino) : null;

    return (
        <div className="flex h-screen bg-gray-50 -m-6"> {/* Negative margin to span full dashboard area */}
            {/* LEFT SIDEBAR: Contact Profile */}
            <div className="w-[350px] bg-white border-r border-gray-200 flex flex-col shadow-sm z-10 overflow-y-auto hidden md:flex">
                <div className="p-6 pb-4">
                    <Link href="/dashboard/clientes" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Volver a Clientes
                    </Link>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 border border-indigo-200 flex items-center justify-center text-indigo-700 text-2xl font-bold shadow-sm">
                            {data.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 leading-tight">{data.nombre}</h1>
                            <p className="text-sm border border-gray-200 rounded-full px-2 py-0.5 mt-1 inline-block text-gray-500 bg-gray-50 capitalize">
                                {type.slice(0, -1)} {/* Singular type */}
                            </p>
                        </div>
                    </div>

                    {/* Quick Access Buttons */}
                    <div className="flex justify-between gap-2 mb-6">
                        <a
                            href={`https://wa.me/${data.telefono.replace(/\D/g, '')}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50 text-gray-600 hover:text-green-600 transition-all cursor-pointer group"
                        >
                            <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-green-100 flex items-center justify-center transition-colors">
                                <MessageSquare className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">WhatsApp</span>
                        </a>
                        <a
                            href={`mailto:${data.email}`}
                            className="flex-1 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all cursor-pointer group"
                        >
                            <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                                <Mail className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">Correo</span>
                        </a>
                        <a
                            href={`tel:${data.telefono}`}
                            className="flex-1 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 transition-all cursor-pointer group"
                        >
                            <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                                <Phone className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">Llamar</span>
                        </a>
                    </div>
                </div>

                {/* About this contact */}
                <div className="px-6 py-4 border-t border-gray-100">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">Sobre este contacto</h3>

                    <div className="space-y-4 text-sm text-gray-600">
                        {data.email && (
                            <div>
                                <p className="text-gray-400 text-[10px] uppercase font-bold mb-0.5">Email Principal</p>
                                <p className="font-medium text-gray-900">{data.email}</p>
                            </div>
                        )}
                        {data.telefono && (
                            <div>
                                <p className="text-gray-400 text-[10px] uppercase font-bold mb-0.5">Teléfono</p>
                                <p className="font-medium text-gray-900">{data.telefono}</p>
                            </div>
                        )}
                        {leadData && (
                            <>
                                <div>
                                    <p className="text-gray-400 text-[10px] uppercase font-bold mb-0.5">Estado del Lead</p>
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-semibold text-xs border border-indigo-100 capitalize">
                                        {leadData.estado}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-[10px] uppercase font-bold mb-0.5">Origen</p>
                                    <p className="font-medium text-gray-900 capitalize">{leadData.origen}</p>
                                </div>
                            </>
                        )}
                        {(propData || inqData) && (
                            <div>
                                <p className="text-gray-400 text-[10px] uppercase font-bold mb-0.5">DNI</p>
                                <p className="font-medium text-gray-900">{(data as any).dni || 'No registrado'}</p>
                            </div>
                        )}
                        {/* Propietario: linked properties count */}
                        {propData && (
                            <div>
                                <p className="text-gray-400 text-[10px] uppercase font-bold mb-0.5">Propiedades vinculadas</p>
                                {propiedadesLinked.length > 0 ? (
                                    <div className="flex flex-col gap-2 mt-1">
                                        {propiedadesLinked.map(p => (
                                            <Link
                                                key={p.id}
                                                href={`/dashboard/propiedades`}
                                                className="flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 hover:bg-indigo-100 transition-colors"
                                            >
                                                {p.imageUrls?.[0] ? (
                                                    <img src={p.imageUrls[0]} alt={p.address || p.title} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                                        <Building2 size={14} className="text-indigo-500" />
                                                    </div>
                                                )}
                                                <span className="truncate">{p.address || p.title || 'Propiedad'}</span>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic mt-1">Sin propiedades asignadas. Asigná el propietario al crear o editar una propiedad.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col bg-white/50 overflow-hidden">
                {/* Header (Mobile Only + Tabs) */}
                <div className="bg-white border-b border-gray-200 px-8 pt-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-indigo-500" />
                        Historial y Registro
                    </h2>

                    <div className="flex gap-6 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('activity')}
                            className={`pb-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'activity' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                        >
                            Actividad
                        </button>
                        <button
                            onClick={() => setActiveTab('notes')}
                            className={`pb-4 text-sm font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === 'notes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                        >
                            Notas {(leadData?.notas?.length || 0) > 0 && (
                                <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full">{leadData?.notas?.length}</span>
                            )}
                        </button>
                        {propData && (
                            <button
                                onClick={() => setActiveTab('properties')}
                                className={`pb-4 text-sm font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === 'properties' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                            >
                                <Building2 size={14} />
                                Propiedades
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${propiedadesLinked.length > 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                                    {propiedadesLinked.length}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-8">

                    {/* ACTIVITY TAB */}
                    {activeTab === 'activity' && (() => {
                        const CARD_STYLES = [
                            { borderColor: 'border-l-indigo-500', numBg: 'bg-indigo-600', labelBg: 'bg-indigo-50 text-indigo-700 border-indigo-100', label: 'Primer mensaje' },
                            { borderColor: 'border-l-violet-500', numBg: 'bg-violet-600', labelBg: 'bg-violet-50 text-violet-700 border-violet-100', label: 'Nueva consulta' },
                            { borderColor: 'border-l-amber-500', numBg: 'bg-amber-500', labelBg: 'bg-amber-50 text-amber-700 border-amber-100', label: 'Consulta' },
                            { borderColor: 'border-l-emerald-500', numBg: 'bg-emerald-600', labelBg: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Consulta' },
                            { borderColor: 'border-l-rose-500', numBg: 'bg-rose-600', labelBg: 'bg-rose-50 text-rose-700 border-rose-100', label: 'Consulta' },
                        ];

                        const consultas = leadData?.consultas && leadData.consultas.length > 0
                            ? leadData.consultas
                            : leadData?.mensaje
                                ? [{ mensaje: leadData.mensaje, fecha: leadData.createdAt, origen: leadData.origen, propertyId: leadData.propertyId, propertyTitle: leadData.propertyTitle }]
                                : null;

                        const getConsultaComments = (idx: number) =>
                            (leadData?.notas || []).filter(n => n.startsWith(`[Consulta #${idx + 1}]`));

                        return (
                            <div className="max-w-3xl">
                                {/* Section header */}
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                        <span className="w-7 h-7 rounded-xl bg-indigo-100 flex items-center justify-center">
                                            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                                        </span>
                                        Historial de consultas
                                    </h3>
                                    {consultas && consultas.length > 1 && (
                                        <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 font-semibold">
                                            {consultas.length} consultas
                                        </span>
                                    )}
                                </div>

                                {!consultas ? (
                                    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
                                        <MessageSquare className="w-10 h-10 text-gray-300 mb-3" />
                                        <p className="text-sm text-gray-400">Sin consultas registradas</p>
                                    </div>
                                ) : consultas.map((consulta, idx) => {
                                    const style = CARD_STYLES[idx % CARD_STYLES.length];
                                    const isArchived = archivedConsultas.has(idx);
                                    const comments = getConsultaComments(idx);
                                    const isLast = idx === consultas.length - 1;
                                    const rawDate = (consulta.fecha as any);
                                    const displayDate = rawDate instanceof Date ? rawDate
                                        : rawDate?.seconds ? new Date(rawDate.seconds * 1000) : new Date();

                                    return (
                                        <div key={idx} className={`relative mb-5 transition-all duration-300 ${isArchived ? 'opacity-40 scale-[0.99]' : ''}`}>
                                            {/* Timeline connector */}
                                            {!isLast && (
                                                <div className="absolute left-4 top-[52px] bottom-[-20px] w-px bg-gradient-to-b from-gray-200 to-transparent z-0" />
                                            )}

                                            <div className={`relative z-10 bg-white rounded-2xl border border-gray-100 border-l-4 ${style.borderColor} shadow-sm group hover:shadow-md transition-shadow`}>
                                                {/* Card Header */}
                                                <div className="flex items-start gap-3 p-4 pb-0">
                                                    {/* Number badge */}
                                                    <div className={`w-8 h-8 rounded-full ${style.numBg} text-white flex items-center justify-center text-xs font-black flex-shrink-0 shadow-sm mt-0.5`}>
                                                        {idx + 1}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2 flex-wrap">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className={`text-[10px] font-bold uppercase tracking-wider border px-2.5 py-0.5 rounded-full ${style.labelBg}`}>
                                                                    {idx === 0 ? style.label : 'Nueva consulta'}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 capitalize">
                                                                    {consulta.origen || 'web'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[11px] text-gray-400 mr-1">
                                                                    {format(displayDate, "dd MMM yyyy · HH:mm", { locale: es })}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Property link */}
                                                        {consulta.propertyTitle && (
                                                            <Link
                                                                href={`/propiedades/p/${consulta.propertyId}`}
                                                                target="_blank" rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-indigo-600 hover:underline bg-indigo-50 rounded-lg px-2.5 py-1 border border-indigo-100"
                                                            >
                                                                <Home className="w-3 h-3" />
                                                                {consulta.propertyTitle}
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Message body */}
                                                {consulta.mensaje && (
                                                    <div className="mx-4 mt-3 mb-4 bg-gray-50 rounded-xl px-4 pt-5 pb-3.5 border border-gray-100 relative">
                                                        <span className="absolute top-1.5 left-2.5 text-3xl text-gray-200 leading-none font-serif select-none">"</span>
                                                        <p className="text-base font-medium text-gray-800 italic whitespace-pre-wrap leading-relaxed">
                                                            {consulta.mensaje}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Action Toolbar */}
                                                {!isArchived && (
                                                    <div className="mx-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-gray-100 p-2 shadow-sm">
                                                        {/* Left: Status and Whatsapp */}
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {(idx === 0) && leadData && ( // Only show status changer on the first/latest message logic or globally. Let's show globally for ease.
                                                                <div className="flex items-center gap-2 bg-gray-50/50 rounded-lg p-1 pr-2 border border-gray-100">
                                                                    <span className="text-[10px] font-bold text-gray-400 uppercase pl-2">Estado</span>
                                                                    <select
                                                                        id="estado-select"
                                                                        value={leadData.estado || 'nuevo'}
                                                                        onChange={(e) => handleUpdateLeadEstado(e.target.value)}
                                                                        className="text-xs bg-white border border-gray-200 rounded-md px-2 py-1 font-semibold text-gray-700 outline-none hover:border-indigo-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                                                                    >
                                                                        <option value="nuevo">Nuevo</option>
                                                                        <option value="leido">Leído</option>
                                                                        <option value="pendiente">Pendiente</option>
                                                                        <option value="respondido">Respondido</option>
                                                                        <option value="contactado">Contactado</option>
                                                                        <option value="finalizado">Finalizado</option>
                                                                        <option value="descartado">Descartado</option>
                                                                    </select>
                                                                </div>
                                                            )}

                                                            <a
                                                                id="whatsapp-contact-btn"
                                                                href={`https://wa.me/${data.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${data.nombre}, te contacto desde Zeta Prop por tu consulta.`)}`}
                                                                target="_blank" rel="noopener noreferrer"
                                                                onClick={() => {
                                                                    if (leadData?.estado === 'nuevo') handleUpdateLeadEstado('contactado');
                                                                }}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${(leadData?.estado === 'nuevo' || leadData?.estado === 'pendiente')
                                                                    ? 'bg-green-500 text-white animate-pulse hover:bg-green-600 ring-4 ring-green-100 hover:animate-none'
                                                                    : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                                                                    }`}
                                                            >
                                                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" /></svg>
                                                                WhatsApp
                                                            </a>
                                                        </div>

                                                        {/* Right: Actions */}
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => setOpenCommentIdx(openCommentIdx === idx ? null : idx)}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${openCommentIdx === idx ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                                            >
                                                                <StickyNote size={14} /> Comentar
                                                            </button>
                                                            <button
                                                                onClick={() => handleArchiveConsulta(idx)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border bg-white text-gray-600 border-gray-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200"
                                                            >
                                                                <FileText size={14} /> Archivar
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Existing inline comments */}
                                                {comments.length > 0 && (
                                                    <div className="mx-4 mb-3 space-y-2">
                                                        {comments.map((c, ci) => {
                                                            const cleaned = c.replace(/^\[Consulta #\d+\]\s*/, '');
                                                            return (
                                                                <div key={ci} className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                                                                    <StickyNote size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                                                    <p className="text-xs text-gray-700 whitespace-pre-wrap flex-1">{cleaned}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Inline comment composer */}
                                                {openCommentIdx === idx && (
                                                    <div className="mx-4 mb-4 rounded-xl overflow-hidden border border-indigo-200 shadow-sm ring-1 ring-indigo-200">
                                                        <textarea
                                                            autoFocus
                                                            rows={3}
                                                            className="w-full px-3 py-2.5 text-sm text-gray-800 outline-none resize-none placeholder-gray-400 bg-white"
                                                            placeholder="¿Qué respondiste? ¿Qué dijo el cliente? Agrega una nota interna..."
                                                            value={commentInputs[idx] || ''}
                                                            onChange={e => setCommentInputs(prev => ({ ...prev, [idx]: e.target.value }))}
                                                            onKeyDown={e => { if (e.key === 'Escape') setOpenCommentIdx(null); }}
                                                        />
                                                        <div className="flex items-center justify-between bg-gray-50 border-t border-gray-100 px-3 py-2">
                                                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                                <StickyNote size={9} /> Nota interna · no visible para el cliente
                                                            </span>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => setOpenCommentIdx(null)}
                                                                    className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1 rounded-lg hover:bg-gray-200 transition-colors"
                                                                >
                                                                    Cancelar
                                                                </button>
                                                                <button
                                                                    onClick={() => handleSaveConsultaComment(idx)}
                                                                    disabled={isSavingComment || !commentInputs[idx]?.trim()}
                                                                    className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                                                                >
                                                                    {isSavingComment && <Loader2 size={10} className="animate-spin" />}
                                                                    Guardar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Archive notice */}
                                                {isArchived && (
                                                    <div className="mx-4 mb-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5">
                                                        <FileText size={11} /> Archivada ·
                                                        <button onClick={() => handleArchiveConsulta(idx)} className="underline font-semibold">restaurar</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Creation log */}
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 mt-2">
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-800">Contacto creado</p>
                                        <p className="text-xs text-gray-400">El contacto fue registrado en el sistema.</p>
                                    </div>
                                    <span className="text-[11px] text-gray-400">
                                        {format(new Date((data.createdAt as any)?.seconds ? (data.createdAt as any).seconds * 1000 : data.createdAt instanceof Date ? data.createdAt : new Date()), "dd MMM yyyy", { locale: es })}
                                    </span>
                                </div>
                            </div>
                        );
                    })()}


                    {/* NOTES TAB */}
                    {activeTab === 'notes' && (
                        <div className="max-w-3xl space-y-6">
                            {/* Create Note area */}
                            <div className="bg-white p-1 rounded-2xl border border-gray-200 shadow-sm overflow-hidden focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 transition-all">
                                <textarea
                                    className="w-full px-4 py-3 outline-none resize-none text-sm text-gray-900 min-h-[100px]"
                                    placeholder="Escribe una nota sobre este contacto..."
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                ></textarea>
                                <div className="flex justify-between items-center bg-gray-50 px-4 py-3 border-t border-gray-100">
                                    <div className="flex gap-2">
                                        {/* formatting tools can go here in the future */}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddNote}
                                        disabled={isSavingNote || !newNote.trim() || type !== 'leads'}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isSavingNote && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Guardar nota
                                    </button>
                                </div>
                            </div>

                            {/* Note History */}
                            <div className="space-y-4 pt-4">
                                {leadData?.notas && leadData.notas.length > 0 ? (
                                    leadData.notas.map((nota, idx) => (
                                        <div key={idx} className="bg-yellow-50/50 p-5 rounded-2xl border border-yellow-100 shadow-sm relative pl-12">
                                            <div className="absolute left-4 top-5 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center border border-yellow-200">
                                                <StickyNote className="w-4 h-4 text-yellow-600" />
                                            </div>
                                            <p className="text-gray-700 text-sm whitespace-pre-wrap">{nota}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
                                        <StickyNote className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm font-medium text-gray-500">Aún no hay notas registradas</p>
                                        {type !== 'leads' && (
                                            <p className="text-xs text-gray-400 mt-1">Las notas avanzadas están reservadas para Leads.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PROPIEDADES TAB */}
                    {activeTab === 'properties' && propData && (
                        <div className="max-w-3xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-xl bg-indigo-100 flex items-center justify-center">
                                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                                    </span>
                                    Propiedades del propietario
                                </h3>
                            </div>

                            {propiedadesLinked.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                                    <Building2 className="w-12 h-12 text-gray-300 mb-4" />
                                    <p className="text-base font-semibold text-gray-500 mb-1">Sin propiedades vinculadas</p>
                                    <p className="text-sm text-gray-400 max-w-xs text-center">
                                        Para vincular una propiedad a este propietario, andá a <strong>Propiedades</strong>, creá o editá una propiedad y seleccioná a este propietario en el campo correspondiente.
                                    </p>
                                    <Link
                                        href="/dashboard/propiedades/nueva"
                                        className="mt-5 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors shadow"
                                    >
                                        <Building2 size={14} /> Agregar propiedad
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {propiedadesLinked.map(p => (
                                        <Link
                                            key={p.id}
                                            href={`/propiedades/p/${p.id}`}
                                            target="_blank" rel="noopener noreferrer"
                                            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
                                        >
                                            {/* Image */}
                                            {p.imageUrls?.[0] ? (
                                                <div className="h-36 overflow-hidden bg-gray-100">
                                                    <img
                                                        src={p.imageUrls[0]}
                                                        alt={p.address || p.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-36 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                                                    <Building2 className="w-10 h-10 text-indigo-200" />
                                                </div>
                                            )}
                                            {/* Info */}
                                            <div className="p-4 flex-1">
                                                <p className="font-bold text-gray-900 text-sm truncate mb-1">
                                                    {p.address || p.calle ? `${p.calle || ''} ${p.altura || ''}`.trim() : p.title || 'Sin dirección'}
                                                </p>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {p.operation_type && (
                                                        <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full px-2 py-0.5">{p.operation_type}</span>
                                                    )}
                                                    {p.status && (
                                                        <span className={`text-[10px] uppercase font-bold tracking-wider rounded-full px-2 py-0.5 border ${p.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{p.status}</span>
                                                    )}
                                                    {p.price > 0 && (
                                                        <span className="text-xs font-semibold text-gray-700 ml-auto">{p.currency} {p.price.toLocaleString()}</span>
                                                    )}
                                                </div>
                                                {(p.localidad || p.provincia) && (
                                                    <p className="text-xs text-gray-400 mt-1">{[p.localidad, p.provincia].filter(Boolean).join(', ')}</p>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* RIGHT SIDEBAR: Agenda (Only for leads) */}
            {type === 'leads' && leadData && (
                <div className="hidden lg:block z-10 w-80 flex-shrink-0 bg-white h-screen sticky top-0">
                    <LeadAgendaSidebar
                        lead={leadData}
                        onVisitCreated={handleVisitCreated}
                    />
                </div>
            )}
            {/* Mobile Agenda toggle (optional future feature, usually leads agenda is okay hidden on very small mobile, but we can make it accessible) */}
        </div>
    );
}
