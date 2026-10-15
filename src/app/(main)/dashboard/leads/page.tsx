"use client";

import { useEffect, useState, useCallback } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import {
    Loader2, Search, MessageSquare, CheckCircle2, LayoutGrid, List, Plus,
    Inbox, PhoneCall, Eye, Scale, Trophy, XCircle, BarChart2
} from "lucide-react";
import { auth } from "@/infrastructure/firebase/client";
import { leadsService } from "@/infrastructure/services/leadsService";
import { Lead, LeadEstado, normalizarEstado, LeadOrigen, LeadPrioridad } from "@/domain/models/Lead";
import { useAuth } from "@/ui/context/AuthContext";
import KanbanColumn from "./components/KanbanColumn";
import LeadCard from "./components/LeadCard";
import PipelineMetrics from "./components/PipelineMetrics";
import NewLeadModal from "./components/NewLeadModal";
import { toast } from "sonner";

// ─── Column Definitions ───────────────────────────────────────────────────────

type ColumnKey =
    | "nuevo"
    | "contactado"
    | "seguimiento"
    | "visita_programada"
    | "negociacion"
    | "cerrado"
    | "perdido";

const COLUMNS: {
    id: ColumnKey;
    title: string;
    subtitle: string;
    icon: any;
    color: string;
    headerBg: string;
    columnBg: string;
    states: LeadEstado[];
    targetEstado: LeadEstado;
}[] = [
        {
            id: "nuevo",
            title: "Nuevos Leads",
            subtitle: "Sin respuesta",
            icon: Inbox,
            color: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
            headerBg: "bg-[var(--color-accent-soft)]",
            columnBg: "bg-[var(--color-paper)]/70",
            states: ["nuevo", "leido"],
            targetEstado: "nuevo",
        },
        {
            id: "contactado",
            title: "Contactado",
            subtitle: "Ya respondiste",
            icon: PhoneCall,
            color: "bg-[var(--color-paper-3)] text-[var(--color-ink-2)]",
            headerBg: "bg-[var(--color-paper-2)]",
            columnBg: "bg-[var(--color-paper)]/70",
            states: ["contactado"],
            targetEstado: "contactado",
        },
        {
            id: "seguimiento",
            title: "En Seguimiento",
            subtitle: "Mostró interés",
            icon: Eye,
            color: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
            headerBg: "bg-[var(--color-warning-soft)]",
            columnBg: "bg-[var(--color-paper)]/70",
            states: ["seguimiento", "respondido", "pendiente"],
            targetEstado: "seguimiento",
        },
        {
            id: "visita_programada",
            title: "Visita Programada",
            subtitle: "Coordinó visita",
            icon: CheckCircle2,
            color: "bg-[var(--color-paper-3)] text-[var(--color-ink-2)]",
            headerBg: "bg-[var(--color-paper-2)]",
            columnBg: "bg-[var(--color-paper)]/70",
            states: ["visita_programada"],
            targetEstado: "visita_programada",
        },
        {
            id: "negociacion",
            title: "Negociación",
            subtitle: "Tratando condiciones",
            icon: Scale,
            color: "bg-[var(--color-paper-3)] text-[var(--color-ink-2)]",
            headerBg: "bg-[var(--color-paper-2)]",
            columnBg: "bg-[var(--color-paper)]/70",
            states: ["negociacion", "calificado"],
            targetEstado: "negociacion",
        },
        {
            id: "cerrado",
            title: "Cerrado",
            subtitle: "Operación concretada",
            icon: Trophy,
            color: "bg-[var(--color-positive-soft)] text-[var(--color-positive)]",
            headerBg: "bg-[var(--color-positive-soft)]",
            columnBg: "bg-[var(--color-paper)]/70",
            states: ["cerrado", "convertido", "finalizado"],
            targetEstado: "cerrado",
        },
        {
            id: "perdido",
            title: "Perdido",
            subtitle: "Sin actividad",
            icon: XCircle,
            color: "bg-[var(--color-paper-4)] text-[var(--color-muted)]",
            headerBg: "bg-[var(--color-paper-3)]/60",
            columnBg: "bg-[var(--color-paper)]/70",
            states: ["perdido", "descartado"],
            targetEstado: "perdido",
        },
    ];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getColumnForLead = (lead: Lead): ColumnKey => {
    const normalizedEstado = normalizarEstado(lead.estado);
    for (const col of COLUMNS) {
        if (col.states.includes(normalizedEstado) || col.states.includes(lead.estado)) {
            return col.id;
        }
    }
    return "nuevo";
};

const ORIGEN_OPTIONS: { value: LeadOrigen | 'all'; label: string }[] = [
    { value: 'all', label: 'Todas las fuentes' },
    { value: 'web', label: 'Web' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'portal', label: 'Portal' },
    { value: 'referido', label: 'Referido' },
    { value: 'telefono', label: 'Teléfono' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
    const [activeColumn, setActiveColumn] = useState<ColumnKey>(COLUMNS[0].id);
    const [isMobile, setIsMobile] = useState(false);
    const [filterOrigen, setFilterOrigen] = useState<LeadOrigen | 'all'>('all');
    const [filterPrioridad, setFilterPrioridad] = useState<LeadPrioridad | 'all'>('all');
    const [showNewLeadModal, setShowNewLeadModal] = useState(false);
    const { userRole, user } = useAuth();

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchLeads = useCallback(async () => {
        if (!auth?.currentUser) return;
        try {
            setLoading(true);
            let data: Lead[] =
                userRole?.name === "Super Admin"
                    ? await leadsService.getLeads("SYSTEM_ZETA_PROP")
                    : await leadsService.getLeads(auth.currentUser.uid);
            data = data.sort((a, b) => {
                const toMs = (d: any) => (d instanceof Date ? d : new Date(d?.toDate?.() ?? d ?? 0)).getTime();
                const aMs = toMs(a.ultimaActividad ?? a.createdAt);
                const bMs = toMs(b.ultimaActividad ?? b.createdAt);
                return bMs - aMs;
            });
            setLeads(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [userRole]);

    useEffect(() => { fetchLeads(); }, [fetchLeads]);

    // ── Filter ────────────────────────────────────────────────────────────────
    const filteredLeads = leads.filter((l) => {
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            const matchesSearch =
                (l.nombre && l.nombre.toLowerCase().includes(term)) ||
                (l.email && l.email.toLowerCase().includes(term)) ||
                (l.propertyTitle && l.propertyTitle.toLowerCase().includes(term)) ||
                (l.telefono && l.telefono.includes(term));
            if (!matchesSearch) return false;
        }
        if (filterOrigen !== 'all' && l.origen !== filterOrigen) return false;
        if (filterPrioridad !== 'all' && l.prioridad !== filterPrioridad) return false;
        return true;
    });

    const columnLeads = (colId: ColumnKey) =>
        filteredLeads.filter((l) => getColumnForLead(l) === colId);

    // ── Drag & Drop ───────────────────────────────────────────────────────────
    const handleDragEnd = async (result: DropResult) => {
        const { draggableId, destination, source } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const destCol = COLUMNS.find((c) => c.id === destination.droppableId);
        if (!destCol) return;

        const newEstado = destCol.targetEstado;
        setLeads((prev) =>
            prev.map((l) => (l.id === draggableId ? { ...l, estado: newEstado, ultimaActividad: new Date() } : l))
        );

        try {
            await leadsService.updateLead(draggableId, { estado: newEstado });
            await leadsService.addInteraccion(draggableId, {
                tipo: 'estado',
                descripcion: `Movido a "${destCol.title}"`,
            });
            toast.success(`Movido a "${destCol.title}"`);
        } catch (err) {
            console.error(err);
            toast.error("Error al mover la consulta");
            fetchLeads();
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const handleStatusChange = async (id: string, newStatus: LeadEstado) => {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, estado: newStatus } : l)));
        try {
            await leadsService.updateLead(id, { estado: newStatus });
            toast.success("Estado actualizado");
        } catch {
            fetchLeads();
            toast.error("Error al actualizar estado");
        }
    };

    const handleDelete = async (id: string) => {
        setLeads((prev) => prev.filter((l) => l.id !== id));
        try {
            await leadsService.deleteLead(id);
            toast.success("Consulta eliminada");
        } catch {
            fetchLeads();
            toast.error("Error al eliminar");
        }
    };

    const handleLeadCreated = (lead: Lead) => {
        setLeads(prev => [lead, ...prev]);
    };

    // ── Render ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-[var(--color-muted)] flex items-center gap-2">
                    <Loader2 strokeWidth={1.5} className="animate-spin" /> Cargando pipeline...
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-0">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)] flex items-center gap-2">
                        <BarChart2 strokeWidth={1.5} className="text-[var(--color-accent)]" size={22} />
                        Pipeline Comercial
                    </h1>
                    <p className="text-[var(--color-muted)] text-sm mt-0.5">
                        {leads.length} leads · {COLUMNS.filter(c => c.id !== 'perdido').map(c => columnLeads(c.id).length).reduce((a, b) => a + b, 0)} activos
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* View toggle */}
                    <div className="flex items-center bg-[var(--color-paper-3)] rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setViewMode("kanban")}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${viewMode === "kanban" ? "bg-[var(--color-paper-2)] shadow text-[var(--color-accent)]" : "text-[var(--color-muted)] hover:text-[var(--color-ink-2)]"}`}
                        >
                            <LayoutGrid strokeWidth={1.5} size={14} /> Tablero
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${viewMode === "list" ? "bg-[var(--color-paper-2)] shadow text-[var(--color-accent)]" : "text-[var(--color-muted)] hover:text-[var(--color-ink-2)]"}`}
                        >
                            <List strokeWidth={1.5} size={14} /> Lista
                        </button>
                    </div>

                    {/* New lead button */}
                    <button
                        onClick={() => setShowNewLeadModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--color-ink)] hover:bg-[var(--color-ink-2)] text-[var(--color-paper)] rounded-xl text-sm font-semibold transition shadow-sm active:scale-95"
                    >
                        <Plus strokeWidth={1.5} size={16} /> Nuevo Lead
                    </button>
                </div>
            </div>

            {/* ── Metrics ── */}
            <PipelineMetrics leads={leads} />

            {/* ── Controls Bar ── */}
            <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-3 mb-5 shadow-sm flex flex-wrap items-center gap-3">
                <Search strokeWidth={1.5} className="w-4 h-4 text-[var(--color-neutral)] flex-shrink-0 ml-1" />
                <input
                    type="text"
                    placeholder="Buscar por nombre, email, teléfono o propiedad..."
                    className="flex-1 bg-transparent text-sm outline-none text-[var(--color-ink-2)] placeholder-[var(--color-neutral)] min-w-[180px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {/* Filters */}
                <select
                    value={filterOrigen}
                    onChange={e => setFilterOrigen(e.target.value as any)}
                    className="text-xs border border-[var(--color-rule)] rounded-lg px-2.5 py-1.5 bg-[var(--color-paper-2)] text-[var(--color-ink-2)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/40"
                >
                    {ORIGEN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select
                    value={filterPrioridad}
                    onChange={e => setFilterPrioridad(e.target.value as any)}
                    className="text-xs border border-[var(--color-rule)] rounded-lg px-2.5 py-1.5 bg-[var(--color-paper-2)] text-[var(--color-ink-2)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/40"
                >
                    <option value="all">Todas las prioridades</option>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                </select>
                {(searchTerm || filterOrigen !== 'all' || filterPrioridad !== 'all') && (
                    <button
                        onClick={() => { setSearchTerm(""); setFilterOrigen('all'); setFilterPrioridad('all'); }}
                        className="text-xs text-[var(--color-neutral)] hover:text-[var(--color-ink-2)] px-2 py-1 rounded-lg hover:bg-[var(--color-paper-3)]"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            {/* ── Kanban Board ── */}
            {/* ── Main View Area ────────────────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-h-0">
                {viewMode === "kanban" ? (
                    isMobile ? (
                        <div className="flex-1 flex flex-col min-h-0">
                            {/* Mobile Column Tabs */}
                            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2 shrink-0">
                                {COLUMNS.map((col) => {
                                    const count = columnLeads(col.id).length;
                                    const isActive = activeColumn === col.id;
                                    return (
                                        <button
                                            key={col.id}
                                            onClick={() => setActiveColumn(col.id)}
                                            className={`
                                                flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border
                                                ${isActive
                                                    ? `${col.color} border-current ring-1 ring-current/20 shadow-sm`
                                                    : "bg-[var(--color-paper-2)] text-[var(--color-neutral)] border-[var(--color-rule-2)] hover:border-[var(--color-neutral)]"
                                                }
                                            `}
                                        >
                                            <col.icon size={14} className={isActive ? "text-current" : "text-[var(--color-neutral)]"} />
                                            <span>{col.title}</span>
                                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? "bg-[var(--color-paper-2)]/20" : "bg-[var(--color-paper-3)] text-[var(--color-muted)]"}`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Active Column */}
                            <div className="flex-1 min-h-0">
                                <DragDropContext onDragEnd={handleDragEnd}>
                                    <KanbanColumn
                                        {...COLUMNS.find((c) => c.id === activeColumn)!}
                                        leads={columnLeads(activeColumn)}
                                        onStatusChange={handleStatusChange}
                                        onDelete={handleDelete}
                                    />
                                </DragDropContext>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-x-auto min-h-0 pb-4 no-scrollbar">
                            <DragDropContext onDragEnd={handleDragEnd}>
                                <div className="flex gap-4 h-full pr-8">
                                    {COLUMNS.map((col) => (
                                        <KanbanColumn
                                            key={col.id}
                                            {...col}
                                            leads={columnLeads(col.id)}
                                            onStatusChange={handleStatusChange}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            </DragDropContext>
                        </div>
                    )
                ) : (
                    /* LIST VIEW */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
                        {filteredLeads.length === 0 ? (
                            <div className="col-span-full text-center py-16 bg-[var(--color-paper)] rounded-xl border border-[var(--color-rule)] border-dashed">
                                <MessageSquare strokeWidth={1.5} className="w-12 h-12 text-[var(--color-neutral)] mx-auto mb-4" />
                                <p className="text-[var(--color-muted)] text-lg">No se encontraron consultas</p>
                                <button
                                    onClick={() => setShowNewLeadModal(true)}
                                    className="mt-4 px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-xl text-sm font-semibold hover:bg-[var(--color-ink-2)] transition"
                                >
                                    + Nuevo Lead
                                </button>
                            </div>
                        ) : (
                            filteredLeads.map((lead) => (
                                // content-visibility skips layout/paint work for cards scrolled out of
                                // view. Only applied to this static grid, never the Kanban drag view
                                // above — drag-and-drop needs accurate layout for off-screen cards too.
                                <div key={lead.id} style={{ contentVisibility: 'auto', containIntrinsicSize: '0 220px' }}>
                                    <LeadCard
                                        lead={lead}
                                        onStatusChange={handleStatusChange}
                                        onDelete={handleDelete}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* ── New Lead Modal ── */}
            {showNewLeadModal && user && (
                <NewLeadModal
                    userId={user.uid}
                    onClose={() => setShowNewLeadModal(false)}
                    onCreated={handleLeadCreated}
                />
            )}
        </div>
    );
}
