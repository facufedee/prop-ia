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
        <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto p-4 md:p-6 gap-6">
            {/* Header / Ticket Info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/soporte" className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-500">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
                            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full tracking-wide ${getStatusColor(ticket.status)}`}>
                                {ticket.status.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                {getPriorityIcon(ticket.priority)}
                                <span className="capitalize">{ticket.priority}</span>
                            </span>
                            <span>•</span>
                            <span>#{ticket.id.slice(0, 8)}</span>
                        </div>
                    </div>
                </div>

                {/* Collapsible description or extra info could go here */}
                {ticket.description && (
                    <div className="text-sm text-gray-600 max-w-lg bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 md:text-right">
                        "{ticket.description}"
                    </div>
                )}
            </div>

            {/* Chat Content */}
            <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col relative">
                {/* Chat Header styled like reference */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <Bot size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Soporte ZetaProp</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                <span className="text-xs text-gray-500">En línea</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-xs text-gray-400">
                        Iniciado el {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                    {messages.map((msg) => {
                        const isMe = msg.userId === auth?.currentUser?.uid;
                        return (
                            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex max-w-[75%] md:max-w-[60%] gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar */}
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm border border-white ${msg.isAdmin ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-600'
                                        }`}>
                                        {msg.isAdmin ? <Bot size={14} /> : <div className="text-xs font-bold">{msg.userName.charAt(0)}</div>}
                                    </div>

                                    {/* Bubble */}
                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`px-5 py-3 shadow-sm text-sm relative ${isMe
                                                ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none'
                                                : 'bg-white text-gray-800 rounded-2xl rounded-tl-none border border-gray-100'
                                            }`}>
                                            {msg.message}
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-1 px-1">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100">
                    {ticket.status === 'cerrado' || ticket.status === 'resuelto' ? (
                        <div className="flex flex-col items-center justify-center py-4 text-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                <CheckCircle className="text-gray-400 w-5 h-5" />
                            </div>
                            <p className="text-gray-500 text-sm font-medium">Este ticket ha sido finalizado</p>
                            <p className="text-gray-400 text-xs">No se pueden enviar más mensajes en esta conversación.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSendMessage} className="relative flex items-center gap-3 max-w-4xl mx-auto">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Escribe un mensaje..."
                                    className="w-full pl-5 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                    disabled={sending}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    {/* Placeholder icons for attachments/emoji - non-functional but aesthetic */}
                                    {/* <button type="button" className="text-gray-400 hover:text-gray-600"><Paperclip size={18} /></button> */}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={sending || !newMessage.trim()}
                                className={`w-11 h-11 flex items-center justify-center rounded-full shadow-md transition-all transform hover:scale-105 ${!newMessage.trim()
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                            >
                                <Send size={18} className={sending ? 'animate-pulse' : 'ml-0.5'} />
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
