"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { app, auth } from "@/infrastructure/firebase/client";
import { ticketsService } from "@/infrastructure/services/ticketsService";
import { Ticket, TicketMessage } from "@/domain/models/Ticket";
import { ArrowLeft, Send, User, Headset, CheckCircle, Clock, AlertTriangle } from "lucide-react";
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
            abierto: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
            en_progreso: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
            esperando_respuesta: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
            resuelto: 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]',
            cerrado: 'bg-[var(--color-paper-3)] text-[var(--color-ink-2)]',
        };
        return colors[status as keyof typeof colors] || 'bg-[var(--color-paper-3)] text-[var(--color-ink-2)]';
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgente': return <AlertTriangle strokeWidth={1.5} className="w-4 h-4 text-[var(--color-danger)]" />;
            case 'alta': return <AlertTriangle strokeWidth={1.5} className="w-4 h-4 text-[var(--color-warning)]" />;
            default: return <Clock strokeWidth={1.5} className="w-4 h-4 text-[var(--color-neutral)]" />;
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-[var(--color-muted)]">Cargando ticket...</div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="text-[var(--color-muted)]">No se encontró el ticket.</div>
                <Link href="/dashboard/soporte" className="text-[var(--color-accent)] hover:underline">
                    Volver a soporte
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto p-4 md:p-6 gap-6">
            {/* Header / Ticket Info */}
            <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule-2)] shadow-sm p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/soporte" className="p-2 hover:bg-[var(--color-paper-3)] rounded-full transition-colors text-[var(--color-muted)]">
                        <ArrowLeft strokeWidth={1.5} size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="font-heading text-xl font-bold text-[var(--color-ink)]">{ticket.title}</h1>
                            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full tracking-wide ${getStatusColor(ticket.status)}`}>
                                {ticket.status.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-[var(--color-muted)]">
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
                    <div className="text-sm text-[var(--color-ink-2)] max-w-lg bg-[var(--color-paper)] px-4 py-2 rounded-lg border border-[var(--color-rule-2)] md:text-right">
                        "{ticket.description}"
                    </div>
                )}
            </div>

            {/* Chat Content */}
            <div className="flex-1 bg-[var(--color-paper-2)] rounded-3xl shadow-sm border border-[var(--color-rule-2)] overflow-hidden flex flex-col relative">
                {/* Chat Header styled like reference */}
                <div className="p-4 border-b border-[var(--color-rule-2)] flex justify-between items-center bg-[var(--color-paper-2)] z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-paper-3)] flex items-center justify-center text-[var(--color-muted)]">
                            <Headset strokeWidth={1.5} size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-[var(--color-ink)]">Soporte ZetaProp</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[var(--color-positive)]"></span>
                                <span className="text-xs text-[var(--color-muted)]">En línea</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-xs text-[var(--color-neutral)]">
                        Iniciado el {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[var(--color-paper)]/50">
                    {messages.map((msg) => {
                        const isMe = msg.userId === auth?.currentUser?.uid;
                        return (
                            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex max-w-[75%] md:max-w-[60%] gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar */}
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm border border-[var(--color-paper-2)] ${msg.isAdmin ? 'bg-[var(--color-paper-3)] text-[var(--color-ink-2)]' : 'bg-[var(--color-paper-4)] text-[var(--color-ink-2)]'
                                        }`}>
                                        {msg.isAdmin ? <span className="text-[9px] font-bold">ZP</span> : <div className="text-xs font-bold">{msg.userName.charAt(0)}</div>}
                                    </div>

                                    {/* Bubble */}
                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`px-5 py-3 shadow-sm text-sm relative ${isMe
                                                ? 'bg-[var(--color-ink)] text-[var(--color-paper)] rounded-2xl rounded-tr-none'
                                                : 'bg-[var(--color-paper-2)] text-[var(--color-ink)] rounded-2xl rounded-tl-none border border-[var(--color-rule-2)]'
                                            }`}>
                                            {msg.message}
                                        </div>
                                        <span className="text-[10px] text-[var(--color-neutral)] mt-1 px-1">
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
                <div className="p-4 bg-[var(--color-paper-2)] border-t border-[var(--color-rule-2)]">
                    {ticket.status === 'cerrado' || ticket.status === 'resuelto' ? (
                        <div className="flex flex-col items-center justify-center py-4 text-center">
                            <div className="w-10 h-10 bg-[var(--color-paper-3)] rounded-full flex items-center justify-center mb-2">
                                <CheckCircle strokeWidth={1.5} className="text-[var(--color-neutral)] w-5 h-5" />
                            </div>
                            <p className="text-[var(--color-muted)] text-sm font-medium">Este ticket ha sido finalizado</p>
                            <p className="text-[var(--color-neutral)] text-xs">No se pueden enviar más mensajes en esta conversación.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSendMessage} className="relative flex items-center gap-3 max-w-4xl mx-auto">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Escribe un mensaje..."
                                    className="w-full pl-5 pr-12 py-3.5 bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] transition-all text-sm"
                                    disabled={sending}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    {/* Placeholder icons for attachments/emoji - non-functional but aesthetic */}
                                    {/* <button type="button" className="text-[var(--color-neutral)] hover:text-[var(--color-ink-2)]"><Paperclip size={18} /></button> */}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={sending || !newMessage.trim()}
                                className={`w-11 h-11 flex items-center justify-center rounded-full shadow-md transition-all transform hover:scale-105 ${!newMessage.trim()
                                        ? 'bg-[var(--color-paper-4)] text-[var(--color-neutral)] cursor-not-allowed'
                                        : 'bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-ink-2)]'
                                    }`}
                            >
                                <Send strokeWidth={1.5} size={18} className={sending ? 'animate-pulse' : 'ml-0.5'} />
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
