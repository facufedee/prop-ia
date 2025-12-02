"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { app } from "@/infrastructure/firebase/client";
import { getAuth } from "firebase/auth";

const auth = getAuth(app);
import { ticketsService } from "@/infrastructure/services/ticketsService";
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
        if (!auth.currentUser) return;

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
        if (!auth.currentUser) return;

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
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Error al actualizar el estado");
        }
    };

    const getStatusColor = (status: string) => {
        const colors = {
            abierto: 'bg-blue-100 text-blue-700 border-blue-200',
            en_progreso: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            esperando_respuesta: 'bg-purple-100 text-purple-700 border-purple-200',
            resuelto: 'bg-green-100 text-green-700 border-green-200',
            cerrado: 'bg-gray-100 text-gray-700 border-gray-200',
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
    };

    const getPriorityColor = (priority: string) => {
        const colors = {
            baja: 'text-gray-600',
            media: 'text-blue-600',
            alta: 'text-orange-600',
            urgente: 'text-red-600 font-bold',
        };
        return colors[priority as keyof typeof colors] || 'text-gray-600';
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
                <div className="text-gray-500">Cargando ticketera...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Ticketera - Gestión de Soporte</h1>
                <p className="text-gray-500">Panel de administración de tickets</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Abiertos</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">{abiertos}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">En Progreso</p>
                            <p className="text-2xl font-bold text-yellow-600 mt-1">{enProgreso}</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Resueltos</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{resueltos}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{tickets.length}</p>
                        </div>
                        <div className="p-3 bg-indigo-100 rounded-lg">
                            <XCircle className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Filtros</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <select
                        className="p-2 border border-gray-300 rounded-lg text-sm"
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
                        className="p-2 border border-gray-300 rounded-lg text-sm"
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
                        className="p-2 border border-gray-300 rounded-lg text-sm"
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
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                    >
                        Aplicar Filtros
                    </button>
                </div>
            </div>

            {/* Tickets Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mensajes</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {tickets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No hay tickets
                                    </td>
                                </tr>
                            ) : (
                                tickets.map((ticket) => (
                                    <tr
                                        key={ticket.id}
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => router.push(`/dashboard/soporte/${ticket.id}`)}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-gray-900">{ticket.title}</div>
                                            <div className="text-xs text-gray-500 line-clamp-1">{ticket.description}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-gray-900">{ticket.userName}</div>
                                            <div className="text-xs text-gray-500">{ticket.organizationName}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {getCategoryLabel(ticket.category)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                                                {ticket.priority.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            <select
                                                className={`text-xs font-medium rounded-full px-3 py-1 border ${getStatusColor(ticket.status)}`}
                                                value={ticket.status}
                                                onChange={(e) => handleStatusChange(ticket.id, e.target.value as TicketStatus)}
                                            >
                                                <option value="abierto">Abierto</option>
                                                <option value="en_progreso">En Progreso</option>
                                                <option value="esperando_respuesta">Esperando Respuesta</option>
                                                <option value="resuelto">Resuelto</option>
                                                <option value="cerrado">Cerrado</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {ticket.messagesCount}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/dashboard/soporte/${ticket.id}`);
                                                }}
                                                className="text-sm text-indigo-600 hover:text-indigo-800"
                                            >
                                                Ver Detalle
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
