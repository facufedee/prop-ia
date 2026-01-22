"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, User, Bot } from "lucide-react";

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'agent';
    timestamp: number;
}

export default function BubbleChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessionId, setSessionId] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize Session ID
        let startId = localStorage.getItem("chat_session_id");
        if (!startId) {
            startId = 'guest_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem("chat_session_id", startId);
        }
        setSessionId(startId);

        // Load initial messages (Mock for now, normally would fetch from API)
        const savedMessages = localStorage.getItem(`chat_history_${startId}`);
        if (savedMessages) {
            setMessages(JSON.parse(savedMessages));
        } else {
            setMessages([
                {
                    id: 'welcome',
                    text: '¡Hola! 👋 Soy Facundo. ¿En qué puedo ayudarte hoy?',
                    sender: 'agent',
                    timestamp: Date.now()
                }
            ]);
        }
    }, []);

    useEffect(() => {
        if (sessionId) {
            localStorage.setItem(`chat_history_${sessionId}`, JSON.stringify(messages));
            scrollToBottom();
        }
    }, [messages, sessionId]);

    // Polling for new messages (Simple version)
    useEffect(() => {
        if (!isOpen || !sessionId) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/chat/sync?sessionId=${sessionId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.messages && data.messages.length > messages.length) {
                        // Merge logic could be better, simplified here
                        // We assume backend returns full history or we check IDs
                        // For now, let's just implement the SEND part robustly first.
                        // This polling is a placeholder for the "Receive" part.
                    }
                }
            } catch (e) {
                // Silent error
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [isOpen, sessionId, messages.length]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!message.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: message,
            sender: 'user',
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setMessage("");
        setIsTyping(true); // Simulate "sending" state

        try {
            const res = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    text: userMsg.text
                })
            });

            if (!res.ok) {
                throw new Error("Failed to send");
            }

            // Simulate quick ack (Real reply comes from WhatsApp later)
            setIsTyping(false);

        } catch (error) {
            console.error(error);
            setIsTyping(false);
            // Optionally add error indicator
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className="w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-indigo-600 p-4 flex items-center justify-between text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                                {/* Facundo's Avatar Mock */}
                                <span className="font-bold">F</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Facundo Zeta</h3>
                                <p className="text-xs text-indigo-100 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    En línea
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.sender === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'
                                        }`}
                                >
                                    {msg.text}
                                    <p className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-indigo-200' : 'text-gray-400'
                                        }`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Escribe un mensaje..."
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!message.trim()}
                                className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 text-center mt-2">
                            Respondemos vía WhatsApp
                        </p>
                    </form>
                </div>
            )}

            {/* Float Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-300 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 group"
            >
                {isOpen ? <X size={28} /> : <MessageCircle size={28} className="group-hover:animate-pulse" />}
            </button>
        </div>
    );
}
