"use client";

import { useEffect, useState } from "react";
import { contactService } from "@/infrastructure/services/contactService";
import { ContactMessage } from "@/domain/models/ContactMessage";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Mail, Phone, Building, MessageSquare, CheckCircle, Clock } from "lucide-react";

export default function AdminMessagesPage() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMessages = async () => {
        try {
            const data = await contactService.getMessages();
            setMessages(data);
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const handleMarkAsRead = async (id: string) => {
        try {
            await contactService.markAsRead(id);
            // Update local state primarily for UI feedback
            setMessages(prev => prev.map(msg =>
                msg.id === id ? { ...msg, read: true } : msg
            ));
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mensajes de Contacto</h1>
                    <p className="text-gray-500">Administra las consultas recibidas desde la landing page.</p>
                </div>
            </header>

            <div className="grid gap-6">
                {messages.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay mensajes</h3>
                        <p className="text-gray-500">Aún no has recibido consultas a través del formulario.</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`bg-white rounded-xl shadow-sm border p-6 transition-all ${!msg.read ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-100'
                                }`}
                        >
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Info Column */}
                                <div className="md:w-1/3 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${!msg.read ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                                        <p className="text-sm text-gray-500">
                                            {msg.createdAt ? format(msg.createdAt, "d 'de' MMMM, yyyy - HH:mm", { locale: es }) : 'Fecha desconocida'}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-lg">{msg.name}</h3>
                                        <div className="flex items-center gap-2 text-gray-600 mt-1">
                                            <Mail className="w-4 h-4" />
                                            <a href={`mailto:${msg.email}`} className="hover:text-indigo-600 hover:underline">
                                                {msg.email}
                                            </a>
                                        </div>
                                        {msg.phone && (
                                            <div className="flex items-center gap-2 text-gray-600 mt-1">
                                                <Phone className="w-4 h-4" />
                                                <a href={`tel:${msg.phone}`} className="hover:text-indigo-600 hover:underline">
                                                    {msg.phone}
                                                </a>
                                            </div>
                                        )}
                                        {msg.company && (
                                            <div className="flex items-center gap-2 text-gray-600 mt-1">
                                                <Building className="w-4 h-4" />
                                                <span>{msg.company}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Message Column */}
                                <div className="flex-1 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {msg.message}
                                    </p>
                                </div>

                                {/* Actions Column */}
                                <div className="md:w-32 flex flex-col justify-center items-end gap-3 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                                    {!msg.read ? (
                                        <button
                                            onClick={() => msg.id && handleMarkAsRead(msg.id)}
                                            className="px-4 py-2 bg-white border border-indigo-200 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-50 transition-colors w-full flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Marcar Leído
                                        </button>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            Leído
                                        </span>
                                    )}

                                    <a
                                        href={`mailto:${msg.email}?subject=Re: Consulta PROP-IA`}
                                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors w-full flex items-center justify-center gap-2"
                                    >
                                        <Mail className="w-4 h-4" />
                                        Responder
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
