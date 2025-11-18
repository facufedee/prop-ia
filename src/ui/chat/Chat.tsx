"use client";

import { useState } from "react";
import { Card, CardContent } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Button } from "@/ui/components/button";

interface Message {
  id: string;
  sender: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      content: input,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
  };

  return (
    <Card className="w-full max-w-xl mx-auto h-[600px] flex flex-col">
      <CardContent className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-2xl max-w-[75%] shadow-sm ${
              msg.sender === "user"
                ? "bg-blue-600 text-white ml-auto"
                : "bg-gray-200 text-black"
            }`}
          >
            {msg.content}
          </div>
        ))}
      </CardContent>

      <div className="p-4 flex gap-2 border-t">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          className="flex-1"
        />
        <Button onClick={handleSend}>Enviar</Button>
      </div>
    </Card>
  );
}
