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
            abierto: 'bg-blue-100 text-blue-700',
            en_progreso: 'bg-yellow-100 text-yellow-700',
            esperando_respuesta: 'bg-purple-100 text-purple-700',
            resuelto: 'bg-green-100 text-green-700',
            cerrado: 'bg-gray-100 text-gray-700',
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
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
            baja: 'text-gray-600',
            media: 'text-blue-600',
            alta: 'text-orange-600',
            urgente: 'text-red-600',
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

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-gray-500">Cargando tickets...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mesa de Ayuda</h1>
                    <p className="text-gray-500">Soporte técnico y asistencia</p>
                </div>
                <Link
                    href="/dashboard/soporte/nuevo"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Ticket
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Tickets Abiertos</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {tickets.filter(t => t.status === 'abierto' || t.status === 'en_progreso').length}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Resueltos</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {tickets.filter(t => t.status === 'resuelto').length}
                            </p>
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
                            <MessageSquare className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tickets Grid */}
            {tickets.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No tienes tickets</h3>
                        <p className="mt-1">Crea un nuevo ticket para obtener ayuda con la plataforma.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow relative group flex flex-col justify-between h-full cursor-pointer"
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
                                        <div className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                            {getCategoryLabel(ticket.category)}
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1" title={ticket.title}>{ticket.title}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">{ticket.description}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{new Date(ticket.createdAt).toLocaleDateString('es-AR')}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MessageSquare className="w-3.5 h-3.5" />
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
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
