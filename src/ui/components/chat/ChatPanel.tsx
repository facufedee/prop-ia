"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "ai/react";
import { Bot, Send, X, Minimize2, BarChart3, Home, FileText, DollarSign, PlusCircle, CreditCard, HelpCircle, MessageSquare, Globe } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { auth } from "@/infrastructure/firebase/client";

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
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { messages, input, handleInputChange, handleSubmit, isLoading, append, error } = useChat({
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
                content: "¡Hola! Soy tu asistente de Zeta Prop. ¿En qué te puedo ayudar?",
            },
        ],
        onError: (err) => console.error("[useChat] error:", err),
    });

    const showQuickPrompts = messages.length <= 1;

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
                        className="mb-2 px-4 py-2.5 bg-white text-indigo-700 text-sm font-medium rounded-2xl rounded-br-sm shadow-xl border border-indigo-100 cursor-pointer hover:bg-indigo-50 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-500 hidden sm:flex items-center gap-2"
                    >
                        <span>¡Hola! ¿Te ayudo?</span>
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                        </span>
                    </div>

                    <button
                        onClick={() => setIsOpen(true)}
                        className="relative w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl shadow-indigo-600/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                        aria-label="Abrir asistente IA"
                    >
                        <div className="absolute inset-0 rounded-full border-2 border-indigo-400 animate-ping opacity-20"></div>
                        <Bot className="w-6 h-6" />
                    </button>
                </div>
            )}

            {/* Floating chat window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-[9998] w-[350px] sm:w-[380px] h-[560px] max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white leading-tight">Asistente IA</p>
                                <p className="text-[10px] text-indigo-200 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                    Zeta Prop
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                            aria-label="Cerrar asistente"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                        {messages.map((msg) => {
                            if (msg.role !== "user" && msg.role !== "assistant") return null;
                            if (!msg.content) return null;
                            const isUser = msg.role === "user";
                            return (
                                <div key={msg.id} className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                                    {!isUser && (
                                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-1">
                                            <Bot className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                                            isUser
                                                ? "bg-gray-900 text-white rounded-tr-sm"
                                                : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm"
                                        }`}
                                    >
                                        {isUser ? (
                                            <span className="whitespace-pre-wrap">{msg.content}</span>
                                        ) : (
                                            <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:my-1.5 prose-strong:text-gray-900 prose-a:text-indigo-600 prose-pre:text-xs">
                                                <ReactMarkdown remarkPlugins={[remarkBreaks]}>
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
                                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-1">
                                    <Bot className="w-3.5 h-3.5 text-white" />
                                </div>
                                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm">
                                    <div className="flex gap-1 items-center h-3">
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        {error && (
                            <div className="mx-3 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                                Error al procesar. Intentá de nuevo.
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick prompts (Always visible, horizontal scroll) */}
                    <div className="px-3 py-2 bg-white border-t border-gray-100 flex-shrink-0">
                        <div className="flex overflow-x-auto gap-2 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                                <button
                                    key={label}
                                    onClick={() => append({ role: "user", content: prompt })}
                                    disabled={isLoading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 whitespace-nowrap text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-full transition-all disabled:opacity-50 flex-shrink-0"
                                >
                                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input */}
                    <div className="border-t border-gray-100 p-3 bg-white flex-shrink-0">
                        <form onSubmit={handleSubmit} className="flex items-end gap-2">
                            <textarea
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder={isLoading ? "Respondiendo..." : "Consultá algo..."}
                                disabled={isLoading}
                                rows={1}
                                className="flex-1 resize-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all disabled:opacity-50 overflow-hidden"
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
                                className="w-9 h-9 flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-xl flex items-center justify-center transition-colors"
                            >
                                {isLoading ? (
                                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Send className="w-3.5 h-3.5" />
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
