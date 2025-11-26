"use client";

import { useState } from "react";
import { Send, Bot, User, MoreVertical, Plus, MessageSquare, Search, Paperclip, Mic } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "assistant";
  content: string;
  time: string;
}

interface ChatSession {
  id: string;
  title: string;
  date: string;
  preview: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "assistant",
      content: "¡Hola! Soy el asistente virtual de Prop-IA. ¿En qué puedo ayudarte hoy? Puedo asistirte con tasaciones, redacción de descripciones o consultas legales.",
      time: "10:00 AM"
    }
  ]);
  const [input, setInput] = useState("");
  const [activeChat, setActiveChat] = useState("1");

  const chats: ChatSession[] = [
    { id: "1", title: "Nueva Consulta", date: "Hoy", preview: "Asistencia general" },
    { id: "2", title: "Tasación Palermo", date: "Ayer", preview: "Análisis de mercado..." },
    { id: "3", title: "Descripción Venta", date: "22 Nov", preview: "Generar texto para..." },
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      content: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: crypto.randomUUID(),
        sender: "assistant",
        content: "Entendido. Como soy una demo, no puedo procesar esa solicitud real todavía, pero pronto estaré conectado a nuestros workflows de IA para ayudarte automáticamente.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] w-full bg-white border rounded-2xl shadow-sm overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b">
          <button className="w-full bg-black text-white flex items-center justify-center gap-2 py-3 rounded-xl hover:bg-gray-800 transition font-medium">
            <Plus className="w-5 h-5" /> Nuevo Chat
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
            />
          </div>

          <div className="space-y-2">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={`w-full text-left p-3 rounded-xl transition-all ${activeChat === chat.id
                    ? "bg-white shadow-sm border border-gray-200"
                    : "hover:bg-gray-200/50"
                  }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-medium text-sm ${activeChat === chat.id ? "text-black" : "text-gray-700"}`}>
                    {chat.title}
                  </span>
                  <span className="text-xs text-gray-400">{chat.date}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{chat.preview}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="h-16 border-b flex items-center justify-between px-6 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Asistente Prop-IA</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs text-green-600 font-medium">En línea</span>
              </div>
            </div>
          </div>
          <button className="text-gray-400 hover:text-black">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 max-w-3xl ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
                }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === "user" ? "bg-gray-200" : "bg-black text-white"
                }`}>
                {msg.sender === "user" ? <User className="w-5 h-5 text-gray-600" /> : <Bot className="w-5 h-5" />}
              </div>

              <div className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.sender === "user"
                      ? "bg-black text-white rounded-tr-none"
                      : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                    }`}
                >
                  {msg.content}
                </div>
                <span className="text-xs text-gray-400 mt-1 px-1">
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-white">
          <div className="max-w-4xl mx-auto relative flex items-center gap-2 bg-gray-50 border rounded-2xl p-2 pr-2 focus-within:ring-2 focus-within:ring-black focus-within:bg-white transition-all shadow-sm">
            <button className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition">
              <Paperclip className="w-5 h-5" />
            </button>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Escribe tu mensaje aquí..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-400"
            />

            {input.trim() ? (
              <button
                onClick={handleSend}
                className="p-2 bg-black text-white rounded-xl hover:bg-gray-800 transition shadow-md"
              >
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition">
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">
            La IA puede cometer errores. Verifica la información importante.
          </p>
        </div>
      </div>
    </div>
  );
}
