"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { app, db, auth } from "@/infrastructure/firebase/client";
import { getDoc, doc } from "firebase/firestore";
import { ticketsService } from "@/infrastructure/services/ticketsService";
import { auditLogService } from "@/infrastructure/services/auditLogService";
import { TicketCategory, TicketPriority } from "@/domain/models/Ticket";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NuevoTicketPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "soporte_tecnico" as TicketCategory,
        priority: "media" as TicketPriority,
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth?.currentUser || !db) return;

        try {
            setLoading(true);

            // Get user data
            const userDoc = await getDoc(doc(db, "users", auth.currentUser?.uid || ''));
            const userData = userDoc.data();

            await ticketsService.createTicket({
                userId: auth.currentUser?.uid || '',
                userEmail: auth.currentUser?.email || '',
                userName: userData?.displayName || auth.currentUser?.email || 'Usuario',
                organizationId: auth.currentUser?.uid || '',
                organizationName: userData?.agencyName || 'Mi Inmobiliaria',
                title: formData.title,
                description: formData.description,
                category: formData.category,
                priority: formData.priority,
                status: 'abierto',
            });

            // Log Ticket Creation
            if (auth.currentUser) {
                await auditLogService.logTicket(
                    auth.currentUser.uid,
                    auth.currentUser.email || '',
                    userData?.displayName || auth.currentUser.email || 'Usuario',
                    'ticket_create',
                    'ticket-id-placeholder',
                    formData.title,
                    "default-org-id",
                    { category: formData.category, priority: formData.priority }
                );
            }

            router.push("/dashboard/soporte");
        } catch (error) {
            console.error("Error creating ticket:", error);
            alert("Error al crear el ticket");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <Link
                    href="/dashboard/soporte"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Volver a tickets
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Nuevo Ticket de Soporte</h1>
                <p className="text-gray-500">Describe tu problema o solicitud</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título *
                    </label>
                    <input
                        type="text"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Resumen breve del problema"
                        value={formData.title}
                        onChange={(e) => handleChange("title", e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción *
                    </label>
                    <textarea
                        required
                        rows={6}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Describe detalladamente tu problema o solicitud..."
                        value={formData.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Categoría *
                        </label>
                        <select
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                            value={formData.category}
                            onChange={(e) => handleChange("category", e.target.value)}
                        >
                            <option value="soporte_tecnico">Soporte Técnico</option>
                            <option value="mejora">Solicitud de Mejora</option>
                            <option value="bug">Reporte de Bug</option>
                            <option value="consulta">Consulta</option>
                            <option value="administrativo">Administrativo</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Prioridad *
                        </label>
                        <select
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                            value={formData.priority}
                            onChange={(e) => handleChange("priority", e.target.value)}
                        >
                            <option value="baja">Baja</option>
                            <option value="media">Media</option>
                            <option value="alta">Alta</option>
                            <option value="urgente">Urgente</option>
                        </select>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Consejos</h4>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li>Sé específico en la descripción del problema</li>
                        <li>Incluye pasos para reproducir el error si es un bug</li>
                        <li>Menciona qué navegador y dispositivo estás usando</li>
                        <li>Nuestro equipo responderá en menos de 24 horas</li>
                    </ul>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                    <Link
                        href="/dashboard/soporte"
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? "Creando..." : "Crear Ticket"}
                    </button>
                </div>
            </form>
        </div>
    );
}
