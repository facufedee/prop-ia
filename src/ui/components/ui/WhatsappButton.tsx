"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const WA_HREF = 'https://wa.me/5491123889745';
const NUDGE_DELAY_MS = 4000;
const NUDGE_DISMISSED_KEY = 'wa-nudge-dismissed';

function readDismissed(): boolean {
    try {
        return window.sessionStorage.getItem(NUDGE_DISMISSED_KEY) === '1';
    } catch {
        return false;
    }
}

function persistDismissed() {
    try {
        window.sessionStorage.setItem(NUDGE_DISMISSED_KEY, '1');
    } catch {
        // Storage unavailable (private mode, blocked site data): dismissal lasts until reload.
    }
}

const WhatsappButton = () => {
    const pathname = usePathname();
    const [nudgeVisible, setNudgeVisible] = useState(false);

    useEffect(() => {
        if (readDismissed()) return;
        // Wait for the cookie banner to be answered so the label never covers it.
        if (!document.cookie.split('; ').some((c) => c.startsWith('cookie_consent='))) return;
        const timer = window.setTimeout(() => setNudgeVisible(true), NUDGE_DELAY_MS);
        return () => window.clearTimeout(timer);
    }, []);

    // Only show on public landing pages — hide in dashboard and property detail pages
    if (pathname?.startsWith('/dashboard')) return null;
    if (pathname?.startsWith('/propiedades/')) return null;

    // /busqueda has a centered floating "Ver mapa" bar on mobile; keep the label off it there.
    const hideNudgeOnMobile = pathname?.startsWith('/busqueda') ?? false;

    const dismiss = () => {
        setNudgeVisible(false);
        persistDismissed();
    };

    return (
        <div className="s-wa">
            {nudgeVisible && (
                <div className={`s-wa__nudge${hideNudgeOnMobile ? ' s-wa__nudge--desktop-only' : ''}`}>
                    <a href={WA_HREF} target="_blank" rel="noopener noreferrer" className="s-wa__nudge-link">
                        <span className="s-wa__nudge-long">¿Dudas? Escribinos por WhatsApp</span>
                        <span className="s-wa__nudge-short">¿Dudas? Escribinos</span>
                    </a>
                    <button type="button" className="s-wa__close" onClick={dismiss} aria-label="Cerrar mensaje de WhatsApp">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                    </button>
                </div>
            )}
            <a
                href={WA_HREF}
                target="_blank" rel="noopener noreferrer"
                className={`s-wa__fab relative flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:bg-[#20bd5a] hover:scale-110 transition-all duration-300${nudgeVisible ? ' s-wa__fab--pulse' : ''}`}
                aria-label="Chatear en WhatsApp"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
            </a>
        </div>
    );
};

export default WhatsappButton;
