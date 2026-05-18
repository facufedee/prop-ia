"use client";

import { MessageCircle } from "lucide-react";
import { Site } from "@/domain/models/Site";
import { trackContact } from "@/lib/trackContact";

export default function SiteWhatsAppFloat({ site }: { site: Site }) {
    if (!site.whatsapp || !site.whatsappFloat) return null;

    const number = site.whatsapp.replace(/\D/g, "");
    const message = encodeURIComponent(`Hola ${site.nombre}! Me gustaría hacer una consulta.`);
    const href = `https://wa.me/${number}?text=${message}`;

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackContact({ userId: site.userId, origen: "click-whatsapp" })}
            aria-label="Contactar por WhatsApp"
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 group"
        >
            {/* Tooltip */}
            <span className="hidden sm:block max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out whitespace-nowrap bg-white text-gray-800 text-sm font-semibold px-4 py-2 rounded-full shadow-lg border border-gray-100 opacity-0 group-hover:opacity-100">
                ¡Escribinos!
            </span>
            {/* Button */}
            <div className="w-14 h-14 bg-[#25D366] hover:bg-[#1fb354] text-white rounded-full flex items-center justify-center shadow-xl shadow-green-200 transition-all hover:scale-110 active:scale-95 relative">
                <MessageCircle className="w-7 h-7" />
                {/* Pulse ring */}
                <span className="absolute inset-0 rounded-full animate-ping bg-[#25D366] opacity-25" />
            </div>
        </a>
    );
}
