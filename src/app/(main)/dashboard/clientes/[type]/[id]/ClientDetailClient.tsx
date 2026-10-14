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
                <Loader2 strokeWidth={1.5} className="animate-spin w-8 h-8 text-[var(--color-accent)]" />
            </div>
        );
    }

    if (!data) return null;

    const leadData = type === 'leads' ? (data as Lead) : null;
    const propData = type === 'propietarios' ? (data as Propietario) : null;
    const inqData = type === 'inquilinos' ? (data as Inquilino) : null;

    return (
        <div className="flex h-full bg-[var(--color-paper)] overflow-hidden">
            {/* LEFT SIDEBAR: Contact Profile */}
            <div className="w-[350px] bg-[var(--color-paper-2)] border-r border-[var(--color-rule)] flex flex-col shadow-sm z-10 overflow-y-auto hidden md:flex">
                <div className="p-6 pb-4">
                    <Link href="/dashboard/clientes" className="inline-flex items-center text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-accent-2)] mb-6 transition-colors">
                        <ArrowLeft strokeWidth={1.5} className="w-4 h-4 mr-1" /> Volver a Clientes
                    </Link>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-[var(--color-paper-3)] border border-[var(--color-rule)] flex items-center justify-center text-[var(--color-ink)] text-2xl font-heading font-bold">
                            {data.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="font-heading text-xl font-bold text-[var(--color-ink)] leading-tight">{data.nombre}</h1>
                            <p className="text-sm border border-[var(--color-rule)] rounded-full px-2 py-0.5 mt-1 inline-block text-[var(--color-muted)] bg-[var(--color-paper)] capitalize">
                                {type.slice(0, -1)} {/* Singular type */}
                            </p>
                        </div>
                    </div>

                    {/* Quick Access Buttons */}
                    <div className="flex justify-between gap-2 mb-6">
                        <a
                            href={`https://wa.me/${data.telefono.replace(/\D/g, '')}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-[var(--color-rule-2)] hover:border-[var(--color-positive)]/30 hover:bg-[var(--color-positive-soft)] text-[var(--color-ink-2)] hover:text-[var(--color-positive)] transition-all cursor-pointer group"
                        >
                            <div className="w-8 h-8 rounded-full bg-[var(--color-paper)] group-hover:bg-[var(--color-paper-3)] flex items-center justify-center transition-colors">
                                <MessageSquare strokeWidth={1.5} className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">WhatsApp</span>
                        </a>
                        <a
                            href={`mailto:${data.email}`}
                            className="flex-1 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-[var(--color-rule-2)] hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-accent-soft)] text-[var(--color-ink-2)] hover:text-[var(--color-accent-2)] transition-all cursor-pointer group"
                        >
                            <div className="w-8 h-8 rounded-full bg-[var(--color-paper)] group-hover:bg-[var(--color-paper-3)] flex items-center justify-center transition-colors">
                                <Mail strokeWidth={1.5} className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">Correo</span>
                        </a>
                        <a
                            href={`tel:${data.telefono}`}
                            className="flex-1 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-[var(--color-rule-2)] hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-accent-soft)] text-[var(--color-ink-2)] hover:text-[var(--color-accent-2)] transition-all cursor-pointer group"
                        >
                            <div className="w-8 h-8 rounded-full bg-[var(--color-paper)] group-hover:bg-[var(--color-paper-3)] flex items-center justify-center transition-colors">
                                <Phone strokeWidth={1.5} className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">Llamar</span>
                        </a>
                    </div>
                </div>

                {/* About this contact */}
                <div className="px-6 py-4 border-t border-[var(--color-rule-2)]">
                    <h3 className="text-xs font-bold text-[var(--color-ink)] uppercase tracking-wider mb-4">Sobre este contacto</h3>

                    <div className="space-y-4 text-sm text-[var(--color-ink-2)]">
                        {data.email && (
                            <div>
                                <p className="text-[var(--color-neutral)] text-[10px] uppercase font-bold mb-0.5">Email Principal</p>
                                <p className="font-medium text-[var(--color-ink)]">{data.email}</p>
                            </div>
                        )}
                        {data.telefono && (
                            <div>
                                <p className="text-[var(--color-neutral)] text-[10px] uppercase font-bold mb-0.5">Teléfono</p>
                                <p className="font-medium text-[var(--color-ink)]">{data.telefono}</p>
                            </div>
                        )}
                        {leadData && (
                            <>
                                <div>
                                    <p className="text-[var(--color-neutral)] text-[10px] uppercase font-bold mb-0.5">Estado del Lead</p>
                                    <span className="px-2 py-0.5 bg-[var(--color-accent-soft)] text-[var(--color-accent)] rounded-md font-semibold text-xs border border-[var(--color-accent)]/30 capitalize">
                                        {leadData.estado}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[var(--color-neutral)] text-[10px] uppercase font-bold mb-0.5">Origen</p>
                                    <p className="font-medium text-[var(--color-ink)] capitalize">{leadData.origen}</p>
                                </div>
                            </>
                        )}
                        {(propData || inqData) && (
                            <div>
                                <p className="text-[var(--color-neutral)] text-[10px] uppercase font-bold mb-0.5">DNI</p>
                                <p className="font-medium text-[var(--color-ink)]">{(data as any).dni || 'No registrado'}</p>
                            </div>
                        )}
                        {/* Propietario: linked properties count */}
                        {propData && (
                            <div>
                                <p className="text-[var(--color-neutral)] text-[10px] uppercase font-bold mb-0.5">Propiedades vinculadas</p>
                                {propiedadesLinked.length > 0 ? (
                                    <div className="flex flex-col gap-2 mt-1">
                                        {propiedadesLinked.map(p => (
                                            <Link
                                                key={p.id}
                                                href={`/dashboard/propiedades`}
                                                className="flex items-center gap-2 text-xs font-semibold text-[var(--color-accent)] bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/30 rounded-xl px-3 py-2 hover:bg-[var(--color-accent-soft)] transition-colors"
                                            >
                                                {p.imageUrls?.[0] ? (
                                                    <img src={p.imageUrls[0]} alt={p.address || p.title} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-[var(--color-paper-3)] flex items-center justify-center flex-shrink-0">
                                                        <Building2 strokeWidth={1.5} size={14} className="text-[var(--color-muted)]" />
                                                    </div>
                                                )}
                                                <span className="truncate">{p.address || p.title || 'Propiedad'}</span>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-[var(--color-neutral)] italic mt-1">Sin propiedades asignadas. Asigná el propietario al crear o editar una propiedad.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-[var(--color-paper-2)] overflow-hidden">
                {/* Mobile Quick Action Header */}
                <div className="md:hidden bg-[var(--color-paper-2)] border-b border-[var(--color-rule)] px-4 py-4 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/clientes" className="p-2 -ml-2 text-[var(--color-neutral)] hover:text-[var(--color-ink)]">
                            <ArrowLeft strokeWidth={1.5} className="w-5 h-5" />
                        </Link>
                        <div className="w-10 h-10 rounded-full bg-[var(--color-paper-3)] border border-[var(--color-rule)] flex items-center justify-center text-[var(--color-ink)] font-bold">
                            {data.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="font-heading text-base font-bold text-[var(--color-ink)] leading-tight">{data.nombre}</h1>
                            <p className="text-[10px] text-[var(--color-muted)] capitalize">{type.slice(0, -1)}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <a href={`https://wa.me/${data.telefono.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-[var(--color-positive-soft)] text-[var(--color-positive)] flex items-center justify-center border border-[var(--color-positive)]/30">
                            <MessageSquare strokeWidth={1.5} size={16} />
                        </a>
                        <a href={`tel:${data.telefono}`} className="w-9 h-9 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center border border-[var(--color-accent)]/30">
                            <Phone strokeWidth={1.5} size={16} />
                        </a>
                    </div>
                </div>

                {/* Header (Tabs) */}
                <div className="bg-[var(--color-paper-2)] border-b border-[var(--color-rule)] px-4 md:px-8 pt-6">
                    <h2 className="text-xl md:text-2xl font-bold text-[var(--color-ink)] mb-6 flex items-center gap-2">
                        <FileText strokeWidth={1.5} className="w-5 h-5 md:w-6 md:h-6 text-[var(--color-accent)]" />
                        Historial y Registro
                    </h2>

                    <div className="flex gap-6 border-b border-[var(--color-rule)]">
                        <button
                            onClick={() => setActiveTab('activity')}
                            className={`pb-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'activity' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'}`}
                        >
                            Actividad
                        </button>
                        <button
                            onClick={() => setActiveTab('notes')}
                            className={`pb-4 text-sm font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === 'notes' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'}`}
                        >
                            Notas {(leadData?.notas?.length || 0) > 0 && (
                                <span className="bg-[var(--color-paper-3)] text-[var(--color-ink-2)] text-[10px] px-1.5 py-0.5 rounded-full">{leadData?.notas?.length}</span>
                            )}
                        </button>
                        {propData && (
                            <button
                                onClick={() => setActiveTab('properties')}
                                className={`pb-4 text-sm font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === 'properties' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'}`}
                            >
                                <Building2 strokeWidth={1.5} size={14} />
                                Propiedades
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${propiedadesLinked.length > 0 ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'bg-[var(--color-paper-3)] text-[var(--color-muted)]'}`}>
                                    {propiedadesLinked.length}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">

                    {/* ACTIVITY TAB */}
                    {activeTab === 'activity' && (() => {
                        const CARD_STYLES = [
                            { borderColor: 'border-l-[var(--color-accent)]', numBg: 'bg-[var(--color-accent)]', labelBg: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[var(--color-accent)]/30', label: 'Primer mensaje' },
                            { borderColor: 'border-l-[var(--color-accent)]', numBg: 'bg-[var(--color-accent)]', labelBg: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[var(--color-accent)]/30', label: 'Nueva consulta' },
                            { borderColor: 'border-l-[var(--color-warning)]', numBg: 'bg-[var(--color-warning)]', labelBg: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[var(--color-warning)]/30', label: 'Consulta' },
                            { borderColor: 'border-l-[var(--color-positive)]', numBg: 'bg-[var(--color-positive)]', labelBg: 'bg-[var(--color-positive-soft)] text-[var(--color-positive)] border-[var(--color-positive)]/30', label: 'Consulta' },
                            { borderColor: 'border-l-[var(--color-danger)]', numBg: 'bg-[var(--color-danger)]', labelBg: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-[var(--color-danger)]/30', label: 'Consulta' },
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
                                    <h3 className="font-bold text-[var(--color-ink)] flex items-center gap-2">
                                        <span className="w-7 h-7 rounded-full bg-[var(--color-paper-3)] flex items-center justify-center">
                                            <MessageSquare strokeWidth={1.5} className="w-3.5 h-3.5 text-[var(--color-muted)]" />
                                        </span>
                                        Historial de consultas
                                    </h3>
                                    {consultas && consultas.length > 1 && (
                                        <span className="text-xs text-[var(--color-accent)] bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/30 rounded-full px-3 py-1 font-semibold">
                                            {consultas.length} consultas
                                        </span>
                                    )}
                                </div>

                                {!consultas ? (
                                    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-[var(--color-rule)] rounded-2xl">
                                        <MessageSquare strokeWidth={1.5} className="w-10 h-10 text-[var(--color-neutral)] mb-3" />
                                        <p className="text-sm text-[var(--color-neutral)]">Sin consultas registradas</p>
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
                                                <div className="absolute left-4 top-[52px] bottom-[-20px] w-px bg-[var(--color-rule)] z-0" />
                                            )}

                                            <div className={`relative z-10 bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule-2)] border-l-4 ${style.borderColor} shadow-sm group hover:shadow-md transition-shadow`}>
                                                {/* Card Header */}
                                                <div className="flex items-start gap-3 p-4 pb-0">
                                                    {/* Number badge */}
                                                    <div className={`w-8 h-8 rounded-full ${style.numBg} text-[var(--color-accent-ink)] flex items-center justify-center text-xs font-black flex-shrink-0 shadow-sm mt-0.5`}>
                                                        {idx + 1}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2 flex-wrap">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className={`text-[10px] font-bold uppercase tracking-wider border px-2.5 py-0.5 rounded-full ${style.labelBg}`}>
                                                                    {idx === 0 ? style.label : 'Nueva consulta'}
                                                                </span>
                                                                <span className="text-[10px] text-[var(--color-neutral)] bg-[var(--color-paper-3)] rounded-full px-2 py-0.5 capitalize">
                                                                    {consulta.origen || 'web'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[11px] text-[var(--color-neutral)] mr-1">
                                                                    {format(displayDate, "dd MMM yyyy · HH:mm", { locale: es })}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Property link */}
                                                        {consulta.propertyTitle && (
                                                            <Link
                                                                href={`/propiedades/p/${consulta.propertyId}`}
                                                                target="_blank" rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-[var(--color-accent)] hover:underline bg-[var(--color-accent-soft)] rounded-lg px-2.5 py-1 border border-[var(--color-accent)]/30"
                                                            >
                                                                <Home strokeWidth={1.5} className="w-3 h-3" />
                                                                {consulta.propertyTitle}
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Message body */}
                                                {consulta.mensaje && (
                                                    <div className="mx-4 mt-3 mb-4 bg-[var(--color-paper)] rounded-xl px-4 pt-5 pb-3.5 border border-[var(--color-rule-2)] relative">
                                                        <span className="absolute top-1.5 left-2.5 text-3xl text-[var(--color-ink-2)] leading-none font-serif select-none">"</span>
                                                        <p className="text-base font-medium text-[var(--color-ink)] italic whitespace-pre-wrap leading-relaxed">
                                                            {consulta.mensaje}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Action Toolbar */}
                                                {!isArchived && (
                                                    <div className="mx-3 md:mx-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule-2)] p-2 shadow-sm">
                                                        {/* Left: Status and Whatsapp */}
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {(idx === 0) && leadData && ( // Only show status changer on the first/latest message logic or globally. Let's show globally for ease.
                                                                <div className="flex items-center gap-2 bg-[var(--color-paper)]/50 rounded-lg p-1 pr-2 border border-[var(--color-rule-2)]">
                                                                    <span className="text-[10px] font-bold text-[var(--color-neutral)] uppercase pl-2">Estado</span>
                                                                    <select
                                                                        id="estado-select"
                                                                        value={leadData.estado || 'nuevo'}
                                                                        onChange={(e) => handleUpdateLeadEstado(e.target.value)}
                                                                        className="text-xs bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-md px-2 py-1 font-semibold text-[var(--color-ink-2)] outline-none hover:border-[var(--color-accent)]/30 focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/40 transition-all cursor-pointer"
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
                                                                    ? 'bg-[var(--color-positive)] text-[var(--color-accent-ink)] animate-pulse hover:bg-[var(--color-positive)] ring-4 ring-[var(--color-positive)]/30 hover:animate-none'
                                                                    : 'bg-[var(--color-positive-soft)] text-[var(--color-positive)] border border-[var(--color-positive)]/30 hover:bg-[var(--color-positive-soft)]'
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
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${openCommentIdx === idx ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[var(--color-accent)]/30' : 'bg-[var(--color-paper-2)] text-[var(--color-ink-2)] border-[var(--color-rule)] hover:bg-[var(--color-paper-3)]'}`}
                                                            >
                                                                <StickyNote strokeWidth={1.5} size={14} /> Comentar
                                                            </button>
                                                            <button
                                                                onClick={() => handleArchiveConsulta(idx)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border bg-[var(--color-paper-2)] text-[var(--color-ink-2)] border-[var(--color-rule)] hover:bg-[var(--color-warning-soft)] hover:text-[var(--color-warning)] hover:border-[var(--color-warning)]/30"
                                                            >
                                                                <FileText strokeWidth={1.5} size={14} /> Archivar
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
                                                                <div key={ci} className="flex items-start gap-2.5 bg-[var(--color-warning-soft)] border border-[var(--color-warning)]/30 rounded-xl px-3 py-2.5">
                                                                    <StickyNote strokeWidth={1.5} size={12} className="text-[var(--color-warning)] flex-shrink-0 mt-0.5" />
                                                                    <p className="text-xs text-[var(--color-ink-2)] whitespace-pre-wrap flex-1">{cleaned}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Inline comment composer */}
                                                {openCommentIdx === idx && (
                                                    <div className="mx-4 mb-4 rounded-xl overflow-hidden border border-[var(--color-accent)]/30 shadow-sm ring-1 ring-[var(--color-accent)]/30">
                                                        <textarea
                                                            autoFocus
                                                            rows={3}
                                                            className="w-full px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none resize-none placeholder-[var(--color-neutral)] bg-[var(--color-paper-2)]"
                                                            placeholder="¿Qué respondiste? ¿Qué dijo el cliente? Agrega una nota interna..."
                                                            value={commentInputs[idx] || ''}
                                                            onChange={e => setCommentInputs(prev => ({ ...prev, [idx]: e.target.value }))}
                                                            onKeyDown={e => { if (e.key === 'Escape') setOpenCommentIdx(null); }}
                                                        />
                                                        <div className="flex items-center justify-between bg-[var(--color-paper)] border-t border-[var(--color-rule-2)] px-3 py-2">
                                                            <span className="text-[10px] text-[var(--color-neutral)] flex items-center gap-1">
                                                                <StickyNote strokeWidth={1.5} size={9} /> Nota interna · no visible para el cliente
                                                            </span>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => setOpenCommentIdx(null)}
                                                                    className="text-xs text-[var(--color-muted)] hover:text-[var(--color-ink-2)] px-2.5 py-1 rounded-lg hover:bg-[var(--color-paper-4)] transition-colors"
                                                                >
                                                                    Cancelar
                                                                </button>
                                                                <button
                                                                    onClick={() => handleSaveConsultaComment(idx)}
                                                                    disabled={isSavingComment || !commentInputs[idx]?.trim()}
                                                                    className="text-xs font-bold bg-[var(--color-ink)] hover:bg-[var(--color-ink-2)] text-[var(--color-paper)] px-3 py-1 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                                                                >
                                                                    {isSavingComment && <Loader2 strokeWidth={1.5} size={10} className="animate-spin" />}
                                                                    Guardar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Archive notice */}
                                                {isArchived && (
                                                    <div className="mx-4 mb-3 flex items-center gap-2 text-xs text-[var(--color-warning)] bg-[var(--color-warning-soft)] border border-[var(--color-warning)]/30 rounded-lg px-3 py-1.5">
                                                        <FileText strokeWidth={1.5} size={11} /> Archivada ·
                                                        <button onClick={() => handleArchiveConsulta(idx)} className="underline font-semibold">restaurar</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Creation log */}
                                <div className="bg-[var(--color-paper-2)] p-4 rounded-2xl border border-[var(--color-rule-2)] shadow-sm flex items-center gap-3 mt-2">
                                    <div className="w-8 h-8 rounded-full bg-[var(--color-paper-3)] flex items-center justify-center flex-shrink-0">
                                        <User strokeWidth={1.5} className="w-4 h-4 text-[var(--color-muted)]" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-[var(--color-ink)]">Contacto creado</p>
                                        <p className="text-xs text-[var(--color-neutral)]">El contacto fue registrado en el sistema.</p>
                                    </div>
                                    <span className="text-[11px] text-[var(--color-neutral)]">
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
                            <div className="bg-[var(--color-paper-2)] p-1 rounded-2xl border border-[var(--color-rule)] shadow-sm overflow-hidden focus-within:border-[var(--color-accent)] focus-within:ring-1 focus-within:ring-[var(--color-accent)]/40 transition-all">
                                <textarea
                                    className="w-full px-4 py-3 outline-none resize-none text-sm text-[var(--color-ink)] min-h-[100px]"
                                    placeholder="Escribe una nota sobre este contacto..."
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                ></textarea>
                                <div className="flex justify-between items-center bg-[var(--color-paper)] px-4 py-3 border-t border-[var(--color-rule-2)]">
                                    <div className="flex gap-2">
                                        {/* formatting tools can go here in the future */}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddNote}
                                        disabled={isSavingNote || !newNote.trim() || type !== 'leads'}
                                        className="bg-[var(--color-ink)] hover:bg-[var(--color-ink-2)] text-[var(--color-paper)] px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isSavingNote && <Loader2 strokeWidth={1.5} className="w-4 h-4 animate-spin" />}
                                        Guardar nota
                                    </button>
                                </div>
                            </div>

                            {/* Note History */}
                            <div className="space-y-4 pt-4">
                                {leadData?.notas && leadData.notas.length > 0 ? (
                                    leadData.notas.map((nota, idx) => (
                                        <div key={idx} className="bg-[var(--color-warning-soft)] p-5 rounded-2xl border border-[var(--color-warning)]/30 shadow-sm relative pl-12">
                                            <div className="absolute left-4 top-5 w-8 h-8 rounded-full bg-[var(--color-paper-3)] flex items-center justify-center">
                                                <StickyNote strokeWidth={1.5} className="w-4 h-4 text-[var(--color-muted)]" />
                                            </div>
                                            <p className="text-[var(--color-ink-2)] text-sm whitespace-pre-wrap">{nota}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 border-2 border-dashed border-[var(--color-rule)] rounded-2xl">
                                        <StickyNote strokeWidth={1.5} className="w-8 h-8 text-[var(--color-neutral)] mx-auto mb-2" />
                                        <p className="text-sm font-medium text-[var(--color-muted)]">Aún no hay notas registradas</p>
                                        {type !== 'leads' && (
                                            <p className="text-xs text-[var(--color-neutral)] mt-1">Las notas avanzadas están reservadas para Leads.</p>
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
                                <h3 className="font-bold text-[var(--color-ink)] flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-full bg-[var(--color-paper-3)] flex items-center justify-center">
                                        <Building2 strokeWidth={1.5} className="w-3.5 h-3.5 text-[var(--color-muted)]" />
                                    </span>
                                    Propiedades del propietario
                                </h3>
                            </div>

                            {propiedadesLinked.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-[var(--color-rule)] rounded-2xl bg-[var(--color-paper)]/50">
                                    <Building2 strokeWidth={1.5} className="w-12 h-12 text-[var(--color-neutral)] mb-4" />
                                    <p className="text-base font-semibold text-[var(--color-muted)] mb-1">Sin propiedades vinculadas</p>
                                    <p className="text-sm text-[var(--color-neutral)] max-w-xs text-center">
                                        Para vincular una propiedad a este propietario, andá a <strong>Propiedades</strong>, creá o editá una propiedad y seleccioná a este propietario en el campo correspondiente.
                                    </p>
                                    <Link
                                        href="/dashboard/propiedades/nueva"
                                        className="mt-5 inline-flex items-center gap-2 bg-[var(--color-ink)] hover:bg-[var(--color-ink-2)] text-[var(--color-paper)] font-semibold text-sm px-4 py-2 rounded-xl transition-colors shadow"
                                    >
                                        <Building2 strokeWidth={1.5} size={14} /> Agregar propiedad
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {propiedadesLinked.map(p => (
                                        <Link
                                            key={p.id}
                                            href={`/propiedades/p/${p.id}`}
                                            target="_blank" rel="noopener noreferrer"
                                            className="group bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule-2)] shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
                                        >
                                            {/* Image */}
                                            {p.imageUrls?.[0] ? (
                                                <div className="h-36 overflow-hidden bg-[var(--color-paper-3)]">
                                                    <img
                                                        src={p.imageUrls[0]}
                                                        alt={p.address || p.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-36 flex items-center justify-center bg-[var(--color-paper-3)]">
                                                    <Building2 strokeWidth={1.5} className="w-10 h-10 text-[var(--color-muted)]" />
                                                </div>
                                            )}
                                            {/* Info */}
                                            <div className="p-4 flex-1">
                                                <p className="font-bold text-[var(--color-ink)] text-sm truncate mb-1">
                                                    {p.address || p.calle ? `${p.calle || ''} ${p.altura || ''}`.trim() : p.title || 'Sin dirección'}
                                                </p>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {p.operation_type && (
                                                        <span className="text-[10px] uppercase font-bold tracking-wider bg-[var(--color-accent-soft)] text-[var(--color-accent)] border border-[var(--color-accent)]/30 rounded-full px-2 py-0.5">{p.operation_type}</span>
                                                    )}
                                                    {p.status && (
                                                        <span className={`text-[10px] uppercase font-bold tracking-wider rounded-full px-2 py-0.5 border ${p.status === 'active' ? 'bg-[var(--color-positive-soft)] text-[var(--color-positive)] border-[var(--color-positive)]/30' : 'bg-[var(--color-paper-3)] text-[var(--color-ink-2)] border-[var(--color-rule)]'}`}>{p.status}</span>
                                                    )}
                                                    {p.price > 0 && (
                                                        <span className="text-xs font-semibold text-[var(--color-ink-2)] ml-auto">{p.currency} {p.price.toLocaleString()}</span>
                                                    )}
                                                </div>
                                                {(p.localidad || p.provincia) && (
                                                    <p className="text-xs text-[var(--color-neutral)] mt-1">{[p.localidad, p.provincia].filter(Boolean).join(', ')}</p>
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
                <div className="hidden lg:block z-10 w-80 flex-shrink-0 bg-[var(--color-paper-2)] h-screen sticky top-0">
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
