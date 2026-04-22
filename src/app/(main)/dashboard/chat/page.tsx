import { Metadata } from "next";
import Chat from "@/ui/chat/Chat";

export const metadata: Metadata = {
    title: "Chat IA | Zeta Prop",
    description: "Asistente virtual de Zeta Prop. Consultá sobre planes, funcionalidades, precios y más.",
};

export default function ChatPage() {
    return (
        <div className="p-4 md:p-6">
            <Chat />
        </div>
    );
}
