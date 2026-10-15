"use client";

import { useEffect, useState } from "react";
import { contactService } from "@/infrastructure/services/contactService";
import { ContactMessage } from "@/domain/models/ContactMessage";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Mail, Phone, Building, MessageSquare, CheckCircle, Clock, Trash2 } from "lucide-react";

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

    const handleDelete = async (id: string) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este mensaje? Esta acción no se puede deshacer.")) {
            return;
        }

        try {
            await contactService.deleteMessage(id);
            setMessages(prev => prev.filter(msg => msg.id !== id));
        } catch (error) {
            console.error("Error deleting message:", error);
            alert("Error al eliminar el mensaje");
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="w-8 h-8 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">Mensajes de Contacto</h1>
                    <p className="text-[var(--color-muted)]">Administra las consultas recibidas desde la landing page.</p>
                </div>
            </header>

            <div className="grid gap-6">
                {messages.length === 0 ? (
                    <div className="bg-[var(--color-paper-2)] rounded-xl shadow-sm border border-[var(--color-rule-2)] p-12 text-center">
                        <MessageSquare strokeWidth={1.5} className="w-12 h-12 text-[var(--color-neutral)] mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-[var(--color-ink)] mb-2">No hay mensajes</h3>
                        <p className="text-[var(--color-muted)]">Aún no has recibido consultas a través del formulario.</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`bg-[var(--color-paper-2)] rounded-xl shadow-sm border p-6 transition-all ${!msg.read ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent)]/7' : 'border-[var(--color-rule-2)]'
                                }`}
                        >
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Info Column */}
                                <div className="md:w-1/3 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${!msg.read ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-paper-4)]'}`} />
                                        <p className="text-sm text-[var(--color-muted)]">
                                            {msg.createdAt ? format(msg.createdAt, "d 'de' MMMM, yyyy - HH:mm", { locale: es }) : 'Fecha desconocida'}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-[var(--color-ink)] text-lg">{msg.name}</h3>
                                        <div className="flex items-center gap-2 text-[var(--color-ink-2)] mt-1">
                                            <Mail strokeWidth={1.5} className="w-4 h-4" />
                                            <a href={`mailto:${msg.email}`} className="hover:text-[var(--color-accent-2)] hover:underline">
                                                {msg.email}
                                            </a>
                                        </div>
                                        {msg.phone && (
                                            <div className="flex items-center gap-2 text-[var(--color-ink-2)] mt-1">
                                                <Phone strokeWidth={1.5} className="w-4 h-4" />
                                                <a href={`tel:${msg.phone}`} className="hover:text-[var(--color-accent-2)] hover:underline">
                                                    {msg.phone}
                                                </a>
                                            </div>
                                        )}
                                        {msg.company && (
                                            <div className="flex items-center gap-2 text-[var(--color-ink-2)] mt-1">
                                                <Building strokeWidth={1.5} className="w-4 h-4" />
                                                <span>{msg.company}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Message Column */}
                                <div className="flex-1 border-t md:border-t-0 md:border-l border-[var(--color-rule-2)] pt-4 md:pt-0 md:pl-6">
                                    <p className="text-[var(--color-ink-2)] whitespace-pre-wrap leading-relaxed">
                                        {msg.message}
                                    </p>
                                </div>

                                {/* Actions Column */}
                                <div className="md:w-32 flex flex-col justify-center items-end gap-3 border-t md:border-t-0 md:border-l border-[var(--color-rule-2)] pt-4 md:pt-0 md:pl-6">
                                    {!msg.read ? (
                                        <button
                                            onClick={() => msg.id && handleMarkAsRead(msg.id)}
                                            className="px-4 py-2 bg-[var(--color-paper-2)] border border-[var(--color-accent)]/30 text-[var(--color-accent)] text-sm font-medium rounded-lg hover:bg-[var(--color-accent-soft)] transition-colors w-full flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle strokeWidth={1.5} className="w-4 h-4" />
                                            Marcar Leído
                                        </button>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-paper-3)] text-[var(--color-ink-2)] text-xs font-medium rounded-full">
                                            <CheckCircle strokeWidth={1.5} className="w-3.5 h-3.5" />
                                            Leído
                                        </span>
                                    )}

                                    <a
                                        href={`mailto:${msg.email}?subject=Re: Consulta Zeta Prop`}
                                        className="px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] text-sm font-medium rounded-lg hover:bg-[var(--color-ink-2)] transition-colors w-full flex items-center justify-center gap-2"
                                    >
                                        <Mail strokeWidth={1.5} className="w-4 h-4" />
                                        Responder
                                    </a>

                                    <button
                                        onClick={() => msg.id && handleDelete(msg.id)}
                                        className="px-4 py-2 bg-[var(--color-paper-2)] border border-[var(--color-danger)]/30 text-[var(--color-danger)] text-sm font-medium rounded-lg hover:bg-[var(--color-danger-soft)] transition-colors w-full flex items-center justify-center gap-2"
                                    >
                                        <Trash2 strokeWidth={1.5} className="w-4 h-4" />
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
