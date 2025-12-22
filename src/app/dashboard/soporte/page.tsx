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

            {/* Tickets List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mensajes</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {tickets.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No tienes tickets. Crea uno para obtener ayuda.
                                    </td>
                                </tr>
                            ) : (
                                tickets.map((ticket) => (
                                    <tr
                                        key={ticket.id}
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => router.push(`/dashboard/soporte/${ticket.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{ticket.title}</div>
                                            <div className="text-xs text-gray-500 line-clamp-1">{ticket.description}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {getCategoryLabel(ticket.category)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                                                {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                                                {getStatusLabel(ticket.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {ticket.messagesCount}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(ticket.createdAt).toLocaleDateString('es-AR')}
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
