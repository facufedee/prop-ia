"use client";

import { useEffect, useState, useCallback } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Loader2, Search, Inbox, MessageSquare, CheckCircle2, Archive, LayoutGrid, List, Plus } from "lucide-react";
import { auth } from "@/infrastructure/firebase/client";
import { leadsService } from "@/infrastructure/services/leadsService";
import { Lead, LeadEstado } from "@/domain/models/Lead";
import { useAuth } from "@/ui/context/AuthContext";
import KanbanColumn from "./components/KanbanColumn";
import LeadCard from "./components/LeadCard";
import { toast } from "sonner";

// ─── Column Definitions ──────────────────────────────────────────────────────
type ColumnKey = "nuevas" | "respondidas" | "finalizadas";

const COLUMNS: {
    id: ColumnKey;
    title: string;
    subtitle: string;
    icon: any;
    color: string;
    headerBg: string;
    columnBg: string;
    states: LeadEstado[];
    // When a card is dropped here, set this estado
    targetEstado: LeadEstado;
}[] = [
        {
            id: "nuevas",
            title: "Nueva Consulta",
            subtitle: "Leads sin responder",
            icon: Inbox,
            color: "bg-indigo-100 text-indigo-600",
            headerBg: "bg-indigo-50/60",
            columnBg: "bg-gray-50/70",
            states: ["nuevo", "leido"],
            targetEstado: "nuevo",
        },
        {
            id: "respondidas",
            title: "Respondida / Seguir",
            subtitle: "En contacto o negociación",
            icon: MessageSquare,
            color: "bg-amber-100 text-amber-600",
            headerBg: "bg-amber-50/60",
            columnBg: "bg-gray-50/70",
            states: ["contactado", "respondido", "calificado"],
            targetEstado: "respondido",
        },
        {
            id: "finalizadas",
            title: "Finalizadas",
            subtitle: "Cerradas, convertidas o descartadas",
            icon: CheckCircle2,
            color: "bg-emerald-100 text-emerald-600",
            headerBg: "bg-emerald-50/60",
            columnBg: "bg-gray-50/70",
            states: ["convertido", "finalizado", "descartado"],
            targetEstado: "finalizado",
        },
    ];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getColumnForLead = (lead: Lead): ColumnKey => {
    for (const col of COLUMNS) {
        if (col.states.includes(lead.estado)) return col.id;
    }
    return "nuevas";
};

// ─── Page ────────────────────────────────────────────────────────────────────
export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
    const { userRole } = useAuth();

    // ── Fetch ────────────────────────────────────────────────────────────────
    const fetchLeads = useCallback(async () => {
        if (!auth?.currentUser) return;
        try {
            setLoading(true);
            let data: Lead[] =
                userRole?.name === "Super Admin"
                    ? await leadsService.getLeads("SYSTEM_ZETA_PROP")
                    : await leadsService.getLeads(auth.currentUser.uid);
            data = data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            setLeads(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [userRole]);

    useEffect(() => { fetchLeads(); }, [fetchLeads]);

    // ── Search Filter ────────────────────────────────────────────────────────
    const filteredLeads = leads.filter((l) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
            (l.nombre && l.nombre.toLowerCase().includes(term)) ||
            (l.email && l.email.toLowerCase().includes(term)) ||
            (l.propertyTitle && l.propertyTitle.toLowerCase().includes(term)) ||
            (l.telefono && l.telefono.includes(term))
        );
    });

    // ── Split leads into columns ─────────────────────────────────────────────
    const columnLeads = (colId: ColumnKey) =>
        filteredLeads.filter((l) => getColumnForLead(l) === colId);

    // ── Drag & Drop ──────────────────────────────────────────────────────────
    const handleDragEnd = async (result: DropResult) => {
        const { draggableId, destination, source } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const destCol = COLUMNS.find((c) => c.id === destination.droppableId);
        if (!destCol) return;

        const newEstado = destCol.targetEstado;

        // Optimistic update
        setLeads((prev) =>
            prev.map((l) => (l.id === draggableId ? { ...l, estado: newEstado } : l))
        );

        try {
            await leadsService.updateLead(draggableId, { estado: newEstado });
            toast.success(`Movido a "${destCol.title}"`);
        } catch (err) {
            console.error(err);
            toast.error("Error al mover la consulta");
            fetchLeads(); // Revert
        }
    };

    // ── Status / Delete helpers ───────────────────────────────────────────────
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

    // ── Render ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-gray-500 flex items-center gap-2">
                    <Loader2 className="animate-spin" /> Cargando consultas...
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-0">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Leads y Consultas</h1>
                    <p className="text-gray-500 text-sm">
                        {leads.length} consultas en total &middot; Arrastrá las tarjetas para cambiar el estado
                    </p>
                </div>

                {/* View toggle */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setViewMode("kanban")}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${viewMode === "kanban" ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            <LayoutGrid size={14} /> Tablero
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${viewMode === "list" ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            <List size={14} /> Lista
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Search Bar ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-3 mb-5 shadow-sm flex items-center gap-3">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0 ml-1" />
                <input
                    type="text"
                    placeholder="Buscar por nombre, email, teléfono o propiedad..."
                    className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm("")}
                        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100"
                    >
                        Limpiar
                    </button>
                )}
                {/* Stats pills */}
                <div className="hidden md:flex items-center gap-2">
                    {COLUMNS.map((col) => (
                        <div key={col.id} className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${col.color}`}>
                            <col.icon size={11} />
                            {columnLeads(col.id).length}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Kanban Board ── */}
            {viewMode === "kanban" ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex gap-4 overflow-x-auto pb-6 flex-1 items-start">
                        {COLUMNS.map((col) => (
                            <KanbanColumn
                                key={col.id}
                                id={col.id}
                                title={col.title}
                                subtitle={col.subtitle}
                                icon={col.icon}
                                color={col.color}
                                headerBg={col.headerBg}
                                columnBg={col.columnBg}
                                leads={columnLeads(col.id)}
                                onDelete={handleDelete}
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                    </div>
                </DragDropContext>
            ) : (
                /* ── List View (kept as fallback) ── */
                <>
                    {filteredLeads.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No se encontraron consultas</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredLeads.map((lead) => (
                                <LeadCard
                                    key={lead.id}
                                    lead={lead}
                                    onStatusChange={handleStatusChange}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
