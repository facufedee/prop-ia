"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useChat } from "ai/react";
import { Send, X, BarChart3, Home, DollarSign, PlusCircle, CreditCard, HelpCircle, MessageSquare, Globe, ChevronLeft, ChevronRight, Lightbulb, LightbulbOff } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { auth } from "@/infrastructure/firebase/client";
import { useAuth } from "@/ui/context/AuthContext";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { buildPendingSummary, formatPendingGreeting } from "@/lib/financial/pendingSummary";
import { CapybaraAvatar, setAssistantTipsHidden, useAssistantTipsHidden } from "@/ui/components/assistant/CapybaraAssistant";

// Capi opens on its own once per browser session (desktop only, to not cover the
// screen on phones). Closing it keeps it closed for the rest of the session.
const AUTO_OPENED_KEY = "zp-chat-auto-opened";

const shouldAutoOpen = () => {
    try {
        return !window.sessionStorage.getItem(AUTO_OPENED_KEY) && window.matchMedia("(min-width: 640px)").matches;
    } catch {
        return false;
    }
};

const markAutoOpened = () => {
    try {
        window.sessionStorage.setItem(AUTO_OPENED_KEY, "1");
    } catch {
        // Storage unavailable: worst case Capi opens again on the next load.
    }
};

const QUICK_PROMPTS = [
    { icon: Home, label: "Mis propiedades", prompt: "¿Cuántas propiedades activas tengo?" },
    { icon: PlusCircle, label: "Cargar propiedad", prompt: "¿Cómo cargo una propiedad?" },
    { icon: CreditCard, label: "Cobrar alquiler", prompt: "¿Cómo cobro un alquiler?" },
    { icon: MessageSquare, label: "Ver consultas", prompt: "¿Dónde veo las consultas de los clientes?" },
    { icon: Globe, label: "Mi sitio web", prompt: "¿Cómo configuro mi página web pública?" },
    { icon: BarChart3, label: "Estadísticas", prompt: "Resumen de mis estadísticas" },
    { icon: DollarSign, label: "Ver planes", prompt: "Planes y precios" },
    { icon: HelpCircle, label: "Soporte", prompt: "Necesito ayuda o soporte" },
];

export default function ChatPanel() {
    const [isOpen, setIsOpen] = useState(shouldAutoOpen);
    const [pendingCount, setPendingCount] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chipsRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const tipsHidden = useAssistantTipsHidden();

    const { messages, input, handleInputChange, handleSubmit, isLoading, append, error, setMessages } = useChat({
        api: "/api/chat",
        fetch: async (url, init) => {
            const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
            return fetch(url as string, {
                ...(init as RequestInit),
                headers: {
                    ...(init as RequestInit)?.headers,
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
        },
        initialMessages: [
            {
                id: "welcome",
                role: "assistant",
                content: "¡Hola! Soy **Capi** 🦫 tu asistente de Zeta Prop. ¿En qué te puedo ayudar?",
            },
        ],
        onError: (err) => console.error("[useChat] error:", err),
    });

    useEffect(() => {
        if (isOpen) markAutoOpened();
    }, [isOpen]);

    // Greet with what the user has pending (overdue, due this week, to settle, increases).
    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        alquileresService.getAlquileres(user.uid)
            .then(contracts => {
                if (cancelled) return;
                const summary = buildPendingSummary(contracts);
                setPendingCount(summary.total);
                setMessages(current => current.length <= 1
                    ? [{ id: "welcome", role: "assistant", content: formatPendingGreeting(summary) }]
                    : current);
            })
            .catch(err => console.error("[ChatPanel] pending summary failed:", err));
        return () => {
            cancelled = true;
        };
    }, [user, setMessages]);

    const scrollChips = (direction: 1 | -1) => chipsRef.current?.scrollBy({ left: direction * 160, behavior: "smooth" });

    useEffect(() => {
        if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, [messages, isLoading, isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (input.trim() && !isLoading) handleSubmit(e as any);
        }
    };

    return (
        <>
            {/* Floating button area */}
            {!isOpen && (
                <div className="fixed bottom-6 right-6 z-[9998] flex items-end gap-3">
                    {/* Tooltip Bubble (hidden on very small screens so it doesn't overlap content) */}
                    <div
                        onClick={() => setIsOpen(true)}
                        className="mb-2 px-4 py-2.5 bg-[var(--color-paper-2)] text-[var(--color-ink)] text-sm font-medium rounded-2xl rounded-br-sm shadow-xl border border-[var(--color-rule)] cursor-pointer hover:bg-[var(--color-paper-3)] transition-colors animate-in fade-in slide-in-from-bottom-2 duration-500 hidden sm:flex items-center gap-2"
                    >
                        <span>{pendingCount > 0 ? `Tenés ${pendingCount} ${pendingCount === 1 ? "pendiente" : "pendientes"}` : "¡Hola! ¿Te ayudo?"}</span>
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)]/30 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--color-accent)]"></span>
                        </span>
                    </div>

                    <button
                        onClick={() => setIsOpen(true)}
                        className="relative w-16 h-16 bg-[var(--color-paper-2)] border border-[var(--color-accent)]/40 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                        aria-label={pendingCount > 0 ? `Abrir a Capi: ${pendingCount} pendientes` : "Abrir a Capi, el asistente"}
                    >
                        {pendingCount > 0 && (
                            <>
                                <span className="absolute inset-0 rounded-full ring-2 ring-[var(--color-accent)]/60 animate-ping" aria-hidden="true" />
                                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[var(--color-accent)] text-[var(--color-paper)] text-[11px] font-bold flex items-center justify-center" aria-hidden="true">
                                    {pendingCount}
                                </span>
                            </>
                        )}
                        <CapybaraAvatar size={48} attention />
                    </button>
                </div>
            )}

            {/* Floating chat window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-[9998] w-[350px] sm:w-[380px] h-[560px] max-h-[85vh] flex flex-col bg-[var(--color-paper-2)] rounded-2xl shadow-2xl border border-[var(--color-rule-2)] overflow-hidden animate-in slide-in-from-bottom-4 duration-200">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 bg-[var(--color-paper-2)] border-b border-[var(--color-rule)]">
                        <div className="flex items-center gap-2">
                            <CapybaraAvatar size={34} waving />
                            <div>
                                <p className="text-sm font-semibold text-[var(--color-ink)] leading-tight">Capi · Asistente IA</p>
                                <p className="text-[10px] text-[var(--color-muted)] flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-[var(--color-positive)] rounded-full animate-pulse" />
                                    Zeta Prop
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                        <button
                            onClick={() => setAssistantTipsHidden(!tipsHidden)}
                            className="p-1.5 hover:bg-[var(--color-paper-3)] rounded-lg transition-colors text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                            aria-label={tipsHidden ? "Mostrar los consejos de Capi en las pantallas" : "Ocultar los consejos de Capi en las pantallas"}
                            title={tipsHidden ? "Mostrar consejos en pantalla" : "Ocultar consejos en pantalla"}
                        >
                            {tipsHidden ? <LightbulbOff strokeWidth={1.5} className="w-4 h-4" /> : <Lightbulb strokeWidth={1.5} className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 hover:bg-[var(--color-paper-3)] rounded-lg transition-colors text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                            aria-label="Cerrar asistente"
                        >
                            <X strokeWidth={1.5} className="w-4 h-4" />
                        </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[var(--color-paper)]">
                        {messages.map((msg) => {
                            if (msg.role !== "user" && msg.role !== "assistant") return null;
                            if (!msg.content) return null;
                            const isUser = msg.role === "user";
                            return (
                                <div key={msg.id} className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                                    {!isUser && (
                                        <div className="flex-shrink-0 mt-0.5">
                                            <CapybaraAvatar size={26} />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                                            isUser
                                                ? "bg-[var(--color-ink)] text-[var(--color-paper)] rounded-tr-sm"
                                                : "bg-[var(--color-paper-2)] border border-[var(--color-rule-2)] text-[var(--color-ink)] rounded-tl-sm shadow-sm"
                                        }`}
                                    >
                                        {isUser ? (
                                            <span className="whitespace-pre-wrap">{msg.content}</span>
                                        ) : (
                                            <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:my-1.5 prose-strong:text-[var(--color-ink)] prose-a:text-[var(--color-accent)] prose-pre:text-xs">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkBreaks]}
                                                    components={{
                                                        a: ({ href, children }) => href?.startsWith("/")
                                                            ? <Link href={href} onClick={() => setIsOpen(false)}>{children}</Link>
                                                            : <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {isLoading && (
                            <div className="flex gap-2 justify-start">
                                <div className="flex-shrink-0 mt-0.5">
                                    <CapybaraAvatar size={26} />
                                </div>
                                <div className="bg-[var(--color-paper-2)] border border-[var(--color-rule-2)] rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm">
                                    <div className="flex gap-1 items-center h-3">
                                        <span className="w-1.5 h-1.5 bg-[var(--color-neutral)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-1.5 h-1.5 bg-[var(--color-neutral)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-1.5 h-1.5 bg-[var(--color-neutral)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        {error && (
                            <div className="mx-3 px-3 py-2 bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/30 rounded-xl text-xs text-[var(--color-danger)]">
                                Error al procesar. Intentá de nuevo.
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick prompts (Always visible, horizontal scroll) */}
                    <div className="relative px-8 py-2 bg-[var(--color-paper-2)] border-t border-[var(--color-rule-2)] flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => scrollChips(-1)}
                            className="absolute left-1 top-1/2 -translate-y-1/2 p-1 rounded-full text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]"
                            aria-label="Ver opciones anteriores"
                        >
                            <ChevronLeft strokeWidth={1.5} className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollChips(1)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]"
                            aria-label="Ver más opciones"
                        >
                            <ChevronRight strokeWidth={1.5} className="w-4 h-4" />
                        </button>
                        <div
                            ref={chipsRef}
                            onWheel={(e) => {
                                // Mouse wheels only scroll vertically: turn that into horizontal scroll.
                                if (chipsRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) chipsRef.current.scrollLeft += e.deltaY;
                            }}
                            className="flex overflow-x-auto gap-2 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                        >
                            {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                                <button
                                    key={label}
                                    onClick={() => append({ role: "user", content: prompt })}
                                    disabled={isLoading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 whitespace-nowrap text-[11px] font-bold text-[var(--color-ink-2)] bg-[var(--color-paper-3)] hover:bg-[var(--color-paper-4)] border border-[var(--color-rule)] rounded-full transition-all disabled:opacity-50 flex-shrink-0"
                                >
                                    <Icon strokeWidth={1.5} className="w-3.5 h-3.5 flex-shrink-0 text-[var(--color-muted)]" />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input */}
                    <div className="border-t border-[var(--color-rule-2)] p-3 bg-[var(--color-paper-2)] flex-shrink-0">
                        <form onSubmit={handleSubmit} className="flex items-end gap-2">
                            <textarea
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder={isLoading ? "Respondiendo..." : "Consultá algo..."}
                                disabled={isLoading}
                                rows={1}
                                className="flex-1 resize-none bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl px-3 py-2 text-sm text-[var(--color-ink)] placeholder-[var(--color-neutral)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-transparent focus:bg-[var(--color-paper-2)] transition-all disabled:opacity-50 overflow-hidden"
                                style={{ minHeight: "38px", maxHeight: "96px" }}
                                onInput={(e) => {
                                    const el = e.currentTarget;
                                    el.style.height = "auto";
                                    el.style.height = Math.min(el.scrollHeight, 96) + "px";
                                }}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="w-9 h-9 flex-shrink-0 bg-[var(--color-ink)] hover:bg-[var(--color-ink-2)] disabled:bg-[var(--color-paper-4)] text-[var(--color-paper)] disabled:text-[var(--color-neutral)] rounded-xl flex items-center justify-center transition-colors"
                            >
                                {isLoading ? (
                                    <div className="w-3.5 h-3.5 border-2 border-[var(--color-paper-2)]/40 border-t-[var(--color-paper-2)] rounded-full animate-spin" />
                                ) : (
                                    <Send strokeWidth={1.5} className="w-3.5 h-3.5" />
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
