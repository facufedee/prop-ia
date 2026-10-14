"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { app, auth } from "@/infrastructure/firebase/client";
import { ticketsService } from "@/infrastructure/services/ticketsService";
import { auditLogService } from "@/infrastructure/services/auditLogService";
import { Ticket, TicketStatus, TicketCategory, TicketPriority } from "@/domain/models/Ticket";
import { Filter, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";

export default function TicketeraPage() {
    const router = useRouter();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: "",
        category: "",
        priority: "",
    });

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        if (!auth?.currentUser) return;

        try {
            const data = await ticketsService.getAllTickets();
            setTickets(data);
        } catch (error) {
            console.error("Error fetching tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = async () => {
        if (!auth?.currentUser) return;

        try {
            setLoading(true);
            const data = await ticketsService.filterTickets({
                status: filters.status as TicketStatus || undefined,
                category: filters.category as TicketCategory || undefined,
                priority: filters.priority as TicketPriority || undefined,
            });
            setTickets(data);
        } catch (error) {
            console.error("Error filtering tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
        try {
            await ticketsService.updateStatus(ticketId, newStatus);
            setTickets(prev => prev.map(t =>
                t.id === ticketId ? { ...t, status: newStatus } : t
            ));

            // Log Status Update
            const ticket = tickets.find(t => t.id === ticketId);
            if (ticket && auth?.currentUser) {
                await auditLogService.logTicket(
                    auth.currentUser.uid,
                    auth.currentUser.email || '',
                    auth.currentUser.displayName || 'Usuario',
                    'ticket_status_update',
                    ticketId,
                    ticket.title,
                    "default-org-id",
                    { oldStatus: ticket.status, newStatus: newStatus }
                );
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Error al actualizar el estado");
        }
    };

    const getStatusColor = (status: string) => {
        const colors = {
            abierto: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[var(--color-accent)]/30',
            en_progreso: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[var(--color-warning)]/30',
            esperando_respuesta: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[var(--color-accent)]/30',
            resuelto: 'bg-[var(--color-positive-soft)] text-[var(--color-positive)] border-[var(--color-positive)]/30',
            cerrado: 'bg-[var(--color-paper-3)] text-[var(--color-ink-2)] border-[var(--color-rule)]',
        };
        return colors[status as keyof typeof colors] || 'bg-[var(--color-paper-3)] text-[var(--color-ink-2)]';
    };

    const getPriorityColor = (priority: string) => {
        const colors = {
            baja: 'text-[var(--color-ink-2)]',
            media: 'text-[var(--color-accent)]',
            alta: 'text-[var(--color-warning)]',
            urgente: 'text-[var(--color-danger)] font-bold',
        };
        return colors[priority as keyof typeof colors] || 'text-[var(--color-ink-2)]';
    };

    const getCategoryLabel = (category: string) => {
        const labels = {
            soporte_tecnico: 'Soporte Técnico',
            mejora: 'Mejora',
            bug: 'Bug',
            consulta: 'Consulta',
            administrativo: 'Administrativo',
            otro: 'Otro',
        };
        return labels[category as keyof typeof labels] || category;
    };

    const abiertos = tickets.filter(t => t.status === 'abierto').length;
    const enProgreso = tickets.filter(t => t.status === 'en_progreso').length;
    const resueltos = tickets.filter(t => t.status === 'resuelto').length;

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-[var(--color-muted)]">Cargando ticketera...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">Ticketera - Gestión de Soporte</h1>
                <p className="text-[var(--color-muted)]">Panel de administración de tickets</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[var(--color-muted)]">Abiertos</p>
                            <p className="text-2xl font-bold text-[var(--color-accent)] mt-1">{abiertos}</p>
                        </div>
                        <div className="p-3 bg-[var(--color-paper-3)] rounded-full">
                            <AlertCircle strokeWidth={1.5} className="w-6 h-6 text-[var(--color-muted)]" />
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[var(--color-muted)]">En Progreso</p>
                            <p className="text-2xl font-bold text-[var(--color-warning)] mt-1">{enProgreso}</p>
                        </div>
                        <div className="p-3 bg-[var(--color-paper-3)] rounded-full">
                            <Clock strokeWidth={1.5} className="w-6 h-6 text-[var(--color-muted)]" />
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[var(--color-muted)]">Resueltos</p>
                            <p className="text-2xl font-bold text-[var(--color-positive)] mt-1">{resueltos}</p>
                        </div>
                        <div className="p-3 bg-[var(--color-paper-3)] rounded-full">
                            <CheckCircle strokeWidth={1.5} className="w-6 h-6 text-[var(--color-muted)]" />
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[var(--color-muted)]">Total</p>
                            <p className="text-2xl font-bold text-[var(--color-ink)] mt-1">{tickets.length}</p>
                        </div>
                        <div className="p-3 bg-[var(--color-paper-3)] rounded-full">
                            <XCircle strokeWidth={1.5} className="w-6 h-6 text-[var(--color-muted)]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Filter strokeWidth={1.5} className="w-5 h-5 text-[var(--color-ink-2)]" />
                    <h3 className="font-semibold text-[var(--color-ink)]">Filtros</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <select
                        className="p-2 border border-[var(--color-rule)] rounded-lg text-sm text-[var(--color-ink)]"
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                        <option value="">Todos los estados</option>
                        <option value="abierto">Abierto</option>
                        <option value="en_progreso">En Progreso</option>
                        <option value="esperando_respuesta">Esperando Respuesta</option>
                        <option value="resuelto">Resuelto</option>
                        <option value="cerrado">Cerrado</option>
                    </select>

                    <select
                        className="p-2 border border-[var(--color-rule)] rounded-lg text-sm text-[var(--color-ink)]"
                        value={filters.category}
                        onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    >
                        <option value="">Todas las categorías</option>
                        <option value="soporte_tecnico">Soporte Técnico</option>
                        <option value="mejora">Mejora</option>
                        <option value="bug">Bug</option>
                        <option value="consulta">Consulta</option>
                        <option value="administrativo">Administrativo</option>
                        <option value="otro">Otro</option>
                    </select>

                    <select
                        className="p-2 border border-[var(--color-rule)] rounded-lg text-sm text-[var(--color-ink)]"
                        value={filters.priority}
                        onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                    >
                        <option value="">Todas las prioridades</option>
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                    </select>

                    <button
                        onClick={applyFilters}
                        className="px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-lg hover:bg-[var(--color-ink-2)] text-sm"
                    >
                        Aplicar Filtros
                    </button>
                </div>
            </div>

            {/* Tickets Grid */}
            {tickets.length === 0 ? (
                <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-12 text-center text-[var(--color-muted)]">
                    <p>No hay tickets encontrados con los filtros actuales.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full group"
                        >
                            <div onClick={() => router.push(`/dashboard/soporte/${ticket.id}`)} className="cursor-pointer">
                                {/* Header: Status and Priority */}
                                <div className="flex justify-between items-start mb-3">
                                    <select
                                        className={`text-xs font-semibold rounded-full px-2 py-1 border outline-none cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(ticket.status)}`}
                                        value={ticket.status}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            handleStatusChange(ticket.id, e.target.value as TicketStatus)
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <option value="abierto">Abierto</option>
                                        <option value="en_progreso">En Progreso</option>
                                        <option value="esperando_respuesta">Esperando Respuesta</option>
                                        <option value="resuelto">Resuelto</option>
                                        <option value="cerrado">Cerrado</option>
                                    </select>

                                    <span className={`text-xs font-bold ${getPriorityColor(ticket.priority)}`}>
                                        {ticket.priority.toUpperCase()}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-[var(--color-ink)] line-clamp-1" title={ticket.title}>{ticket.title}</h3>
                                    </div>
                                    <div className="text-xs text-[var(--color-muted)] mb-2 font-medium flex items-center gap-1">
                                        <span>{ticket.userName}</span>
                                        <span className="text-[var(--color-neutral)]">•</span>
                                        <span>{ticket.organizationName || 'Sin Org'}</span>
                                    </div>
                                    <p className="text-sm text-[var(--color-ink-2)] line-clamp-2 min-h-[40px]">{ticket.description}</p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="pt-4 border-t border-[var(--color-rule-2)] flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <div className="text-xs text-[var(--color-muted)] bg-[var(--color-paper)] px-2 py-0.5 rounded border border-[var(--color-rule-2)] w-fit">
                                        {getCategoryLabel(ticket.category)}
                                    </div>
                                    <div className="text-xs text-[var(--color-neutral)] mt-1">
                                        {new Date(ticket.createdAt).toLocaleDateString('es-AR')}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/dashboard/soporte/${ticket.id}`);
                                        }}
                                        className="p-1.5 text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] rounded-lg transition-colors"
                                        title="Ver Detalles"
                                    >
                                        <CheckCircle strokeWidth={1.5} className="w-4 h-4" /> {/* Reuse existing import or generic icon */}
                                    </button>
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (confirm("¿Estás seguro de eliminar este ticket?")) {
                                                try {
                                                    await ticketsService.deleteTicket(ticket.id);
                                                    setTickets(prev => prev.filter(t => t.id !== ticket.id));
                                                } catch (error) {
                                                    console.error(error);
                                                    alert("Error al eliminar");
                                                }
                                            }
                                        }}
                                        className="p-1.5 text-[var(--color-neutral)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] rounded-lg transition-colors"
                                        title="Eliminar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
