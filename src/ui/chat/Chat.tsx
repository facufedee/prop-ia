"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    Send, Bot, User, Plus, Sparkles, MessageSquare,
    Home, DollarSign, BookOpen, Phone, HelpCircle, X
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { useAuth } from "@/ui/context/AuthContext";
import { auth } from "@/infrastructure/firebase/client";

interface Message {
    id: string;
    sender: "user" | "assistant";
    content: string;
    time: string;
}

const WELCOME_MESSAGE: Message = {
    id: "welcome",
    sender: "assistant",
    content: "¡Hola! Soy el asistente de **Zeta Prop**. Puedo ayudarte con información sobre la plataforma, planes, precios, funcionalidades y más.\n\n¿En qué puedo ayudarte hoy?",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

const QUICK_PROMPTS = [
    { icon: DollarSign, label: "Ver planes y precios", prompt: "¿Cuáles son los planes y precios disponibles?" },
    { icon: Home, label: "Funcionalidades", prompt: "¿Qué módulos y funcionalidades tiene Zeta Prop?" },
    { icon: BookOpen, label: "Últimas noticias", prompt: "¿Cuáles son las últimas noticias del blog?" },
    { icon: Phone, label: "Contacto y soporte", prompt: "¿Cómo puedo contactar al soporte?" },
];

export default function Chat() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const getAuthToken = useCallback(async (): Promise<string | null> => {
        if (!auth?.currentUser) return null;
        try {
            return await auth.currentUser.getIdToken();
        } catch {
            return null;
        }
    }, []);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || loading) return;

        const userMessage: Message = {
            id: crypto.randomUUID(),
            sender: "user",
            content: text.trim(),
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const token = await getAuthToken();
            if (!token) throw new Error("No autenticado");

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                }),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || "Error del servidor");
            }

            const data = await response.json();

            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    sender: "assistant",
                    content: data.content || "No pude generar una respuesta.",
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
            ]);
        } catch (error: any) {
            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    sender: "assistant",
                    content: "Lo siento, tuve un problema al procesar tu consulta. Por favor intentá de nuevo.",
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
            ]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [loading, messages, getAuthToken]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const handleNewChat = () => {
        setMessages([{
            ...WELCOME_MESSAGE,
            id: crypto.randomUUID(),
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }]);
        setInput("");
        inputRef.current?.focus();
    };

    const showQuickPrompts = messages.length === 1;

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900 text-lg leading-tight">Asistente Zeta Prop</h1>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs text-green-600 font-medium">En línea · Powered by Gemini</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleNewChat}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nueva conversación
                </button>
            </div>

            {/* Chat container */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
                        >
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                msg.sender === "user"
                                    ? "bg-gray-900"
                                    : "bg-indigo-600"
                            }`}>
                                {msg.sender === "user"
                                    ? <User className="w-4 h-4 text-white" />
                                    : <Bot className="w-4 h-4 text-white" />
                                }
                            </div>

                            {/* Bubble */}
                            <div className={`flex flex-col max-w-[75%] ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                    msg.sender === "user"
                                        ? "bg-gray-900 text-white rounded-tr-sm"
                                        : "bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm"
                                }`}>
                                    {msg.sender === "assistant" ? (
                                        <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-gray-900 prose-a:text-indigo-600">
                                            <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <span className="whitespace-pre-wrap">{msg.content}</span>
                                    )}
                                </div>
                                <span className="text-[11px] text-gray-400 mt-1 px-1">{msg.time}</span>
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {loading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                                <div className="flex gap-1 items-center h-4">
                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Quick prompts — only on fresh chat */}
                {showQuickPrompts && (
                    <div className="px-6 pb-4">
                        <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wide">Consultas frecuentes</p>
                        <div className="grid grid-cols-2 gap-2">
                            {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                                <button
                                    key={label}
                                    onClick={() => sendMessage(prompt)}
                                    disabled={loading}
                                    className="flex items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-100 hover:border-indigo-200 rounded-xl transition-all disabled:opacity-50"
                                >
                                    <Icon className="w-4 h-4 flex-shrink-0 text-indigo-500" />
                                    <span className="font-medium leading-tight">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input */}
                <div className="border-t border-gray-100 p-4">
                    <form onSubmit={handleSubmit} className="flex items-end gap-3">
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    // Auto-resize
                                    e.target.style.height = "auto";
                                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder={loading ? "El asistente está escribiendo..." : "Escribí tu consulta..."}
                                disabled={loading}
                                rows={1}
                                className="w-full resize-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all disabled:opacity-50 overflow-hidden"
                                style={{ minHeight: "44px", maxHeight: "120px" }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="w-11 h-11 flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-xl flex items-center justify-center transition-colors shadow-sm disabled:shadow-none"
                        >
                            {loading
                                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                : <Send className="w-4 h-4" />
                            }
                        </button>
                    </form>
                    <p className="text-center text-[11px] text-gray-400 mt-2">
                        El asistente puede cometer errores. Verificá la información importante.
                    </p>
                </div>
            </div>
        </div>
    );
}
