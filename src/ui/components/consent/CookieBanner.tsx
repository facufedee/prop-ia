'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { X, Cookie } from 'lucide-react';

export default function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if consent cookie exists
        const consent = Cookies.get('cookie_consent');
        if (!consent) {
            // Small delay for animation effect
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        Cookies.set('cookie_consent', 'accepted', { expires: 365 }); // Expires in 1 year
        setIsVisible(false);
        // Here we would initialize analytics/pixels if we had them
    };

    const handleReject = () => {
        Cookies.set('cookie_consent', 'rejected', { expires: 365 });
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 p-0 animate-slide-up max-w-[400px] w-full">
            <div className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-2xl rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Cookie className="w-5 h-5 text-blue-600" />
                        Configuración de Cookies
                    </h3>
                    <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <p className="text-gray-600 text-xs leading-relaxed mb-5">
                    Utilizamos cookies propias y de terceros para mejorar tu experiencia y analizar el tráfico.
                    <Link href="/cookies" className="text-blue-600 hover:underline font-medium ml-1">
                        Ver Política
                    </Link>.
                </p>

                <div className="flex gap-2 justify-end">
                    <button
                        onClick={handleReject}
                        className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                        Rechazar
                    </button>
                    <button
                        onClick={handleAccept}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition-all"
                    >
                        Aceptar todo
                    </button>
                </div>
            </div>
        </div>
    );
}
