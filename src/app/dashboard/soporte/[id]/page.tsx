"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { app, auth } from "@/infrastructure/firebase/client";
import { ticketsService } from "@/infrastructure/services/ticketsService";
import { Ticket, TicketMessage } from "@/domain/models/Ticket";
import { ArrowLeft, Send, User, Bot, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function TicketDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);



    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!id) return;

        setLoading(true);

        // Suscripción al ticket
        const unsubTicket = ticketsService.subscribeToTicket(id, (updatedTicket) => {
            setTicket(updatedTicket);
            setLoading(false);
        });

        // Suscripción a mensajes
        const unsubMessages = ticketsService.subscribeToMessages(id, (updatedMessages) => {
            setMessages(updatedMessages);
        });

        return () => {
            unsubTicket();
            unsubMessages();
        };
    }, [id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !auth?.currentUser || !ticket) return;

        setSending(true);
        try {
            setNewMessage("");

            await ticketsService.addMessage({
                ticketId: ticket.id,
                userId: auth.currentUser.uid,
                userName: auth.currentUser.displayName || "Usuario",
                userEmail: auth.currentUser.email || "",
                message: newMessage,
                isAdmin: false,
                // isSystem: false // Remove if not in model
            });


        } catch (error) {
            console.error("Error sending message:", error);
            // Revert optimistic update if needed, but for now just logging
        } finally {
            setSending(false);
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

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgente': return <AlertTriangle className="w-4 h-4 text-red-500" />;
            case 'alta': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
            default: return <Clock className="w-4 h-4 text-gray-400" />;
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-gray-500">Cargando ticket...</div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="text-gray-500">No se encontró el ticket.</div>
                <Link href="/dashboard/soporte" className="text-indigo-600 hover:underline">
                    Volver a soporte
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className="mb-6">
                <Link href="/dashboard/soporte" className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-4 transition-colors">
                    <ArrowLeft size={18} />
                    <span>Volver a mis tickets</span>
                </Link>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold text-gray-900">#{ticket.id.slice(0, 8)}: {ticket.title}</h1>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                                    {ticket.status.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                            <p className="text-gray-600">{ticket.description}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                            {getPriorityIcon(ticket.priority)}
                            <span className="capitalize">Prioridad {ticket.priority}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* System creation message */}
                    <div className="flex justify-center">
                        <div className="bg-gray-50 text-gray-500 text-xs px-3 py-1 rounded-full border border-gray-100">
                            Ticket creado el {new Date(ticket.createdAt).toLocaleString()}
                        </div>
                    </div>

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex gap-3 ${msg.userId === auth?.currentUser?.uid ? 'flex-row-reverse' : ''}`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.isAdmin ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {msg.isAdmin ? <Bot size={16} /> : <User size={16} />}
                            </div>

                            <div className={`max-w-[80%] rounded-2xl p-4 ${msg.userId === auth?.currentUser?.uid
                                ? 'bg-indigo-600 text-white rounded-tr-sm'
                                : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                                }`}>
                                <div className="text-sm">{msg.message}</div>
                                <div className={`text-[10px] mt-1 opacity-70 ${msg.userId === auth?.currentUser?.uid ? 'text-indigo-100' : 'text-gray-500'
                                    }`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                    {ticket.status === 'cerrado' || ticket.status === 'resuelto' ? (
                        <div className="text-center p-2 text-gray-500 text-sm flex items-center justify-center gap-2">
                            <CheckCircle size={16} />
                            Este ticket ha sido resuelto o cerrado. No se pueden enviar más mensajes.
                        </div>
                    ) : (
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Escribe tu mensaje..."
                                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                disabled={sending}
                            />
                            <button
                                type="submit"
                                disabled={sending || !newMessage.trim()}
                                className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
