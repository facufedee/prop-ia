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
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-slide-up">
            <div className="max-w-7xl mx-auto bg-white/95 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-6 md:flex md:items-center md:justify-between gap-6">

                <div className="flex gap-4 items-start md:items-center flex-1">
                    <div className="bg-blue-100 p-3 rounded-full hidden sm:block">
                        <Cookie className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            Valoramos tu privacidad
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Utilizamos cookies propias y de terceros para mejorar tu experiencia, analizar el tráfico y personalizar contenido.
                            Puedes leer nuestra <Link href="/cookies" className="text-blue-600 hover:underline font-medium">Política de Cookies</Link>.
                        </p>
                    </div>
                </div>

                <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-3 min-w-fit">
                    <button
                        onClick={handleReject}
                        className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                    >
                        Rechazar Todo
                    </button>
                    <button
                        onClick={handleAccept}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Aceptar Todo
                    </button>
                </div>
            </div>
        </div>
    );
}
