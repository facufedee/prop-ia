"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { app, auth } from "@/infrastructure/firebase/client";
import { ticketsService } from "@/infrastructure/services/ticketsService";
import { Ticket } from "@/domain/models/Ticket";
import { Plus, MessageSquare, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function SoportePage() {
    const router = useRouter();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        if (!auth?.currentUser) return;

        try {
            const data = await ticketsService.getUserTickets(auth.currentUser.uid);
            setTickets(data);
        } catch (error) {
            console.error("Error fetching tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors = {
            abierto: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
            en_progreso: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
            esperando_respuesta: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
            resuelto: 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]',
            cerrado: 'bg-[var(--color-paper-3)] text-[var(--color-ink-2)]',
        };
        return colors[status as keyof typeof colors] || 'bg-[var(--color-paper-3)] text-[var(--color-ink-2)]';
    };

    const getStatusLabel = (status: string) => {
        const labels = {
            abierto: 'Abierto',
            en_progreso: 'En Progreso',
            esperando_respuesta: 'Esperando Respuesta',
            resuelto: 'Resuelto',
            cerrado: 'Cerrado',
        };
        return labels[status as keyof typeof labels] || status;
    };

    const getPriorityColor = (priority: string) => {
        const colors = {
            baja: 'text-[var(--color-ink-2)]',
            media: 'text-[var(--color-accent)]',
            alta: 'text-[var(--color-warning)]',
            urgente: 'text-[var(--color-danger)]',
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

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-[var(--color-muted)]">Cargando tickets...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">Mesa de Ayuda</h1>
                    <p className="text-[var(--color-muted)]">Soporte técnico y asistencia</p>
                </div>
                <Link
                    href="/dashboard/soporte/nuevo"
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-lg hover:bg-[var(--color-ink-2)] transition-colors"
                >
                    <Plus strokeWidth={1.5} className="w-5 h-5" />
                    Nuevo Ticket
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[var(--color-muted)]">Tickets Abiertos</p>
                            <p className="text-2xl font-bold text-[var(--color-ink)] mt-1">
                                {tickets.filter(t => t.status === 'abierto' || t.status === 'en_progreso').length}
                            </p>
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
                            <p className="text-2xl font-bold text-[var(--color-ink)] mt-1">
                                {tickets.filter(t => t.status === 'resuelto').length}
                            </p>
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
                            <MessageSquare strokeWidth={1.5} className="w-6 h-6 text-[var(--color-muted)]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tickets Grid */}
            {tickets.length === 0 ? (
                <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-12 text-center text-[var(--color-muted)]">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-[var(--color-paper)] rounded-full flex items-center justify-center mb-4">
                            <MessageSquare strokeWidth={1.5} className="w-8 h-8 text-[var(--color-neutral)]" />
                        </div>
                        <h3 className="text-lg font-medium text-[var(--color-ink)]">No tienes tickets</h3>
                        <p className="mt-1">Crea un nuevo ticket para obtener ayuda con la plataforma.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-5 shadow-sm hover:shadow-md transition-shadow relative group flex flex-col justify-between h-full cursor-pointer"
                            onClick={() => router.push(`/dashboard/soporte/${ticket.id}`)}
                        >
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(ticket.status)} border-transparent bg-opacity-10`} style={{
                                        // Specific tweak if colors are strictly bg/text classes without border
                                        // Using the existing helper which returns bg and text classes.
                                    }}>
                                        {getStatusLabel(ticket.status)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs font-medium text-[var(--color-muted)] bg-[var(--color-paper)] px-2 py-1 rounded-md border border-[var(--color-rule-2)]">
                                            {getCategoryLabel(ticket.category)}
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h3 className="font-semibold text-[var(--color-ink)] mb-1 line-clamp-1" title={ticket.title}>{ticket.title}</h3>
                                    <p className="text-sm text-[var(--color-muted)] line-clamp-2 min-h-[40px]">{ticket.description}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[var(--color-rule-2)] flex items-center justify-between">
                                <div className="flex items-center gap-4 text-xs text-[var(--color-muted)]">
                                    <div className="flex items-center gap-1">
                                        <Clock strokeWidth={1.5} className="w-3.5 h-3.5" />
                                        <span>{new Date(ticket.createdAt).toLocaleDateString('es-AR')}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MessageSquare strokeWidth={1.5} className="w-3.5 h-3.5" />
                                        <span>{ticket.messagesCount}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
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
