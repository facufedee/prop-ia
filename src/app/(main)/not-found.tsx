'use client';

import Link from 'next/link';
import { Home, MoveLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
            <div className="space-y-6 max-w-lg mx-auto">
                {/* Main Error */}
                <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    404
                </h1>

                {/* Message */}
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Página no encontrada
                    </h2>
                    <p className="text-gray-500 text-lg">
                        Lo sentimos, no pudimos encontrar la página que estás buscando. Puede que haya sido movida o eliminada.
                    </p>
                </div>

                {/* Illustrations/Decorative elements could go here */}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 group"
                    >
                        <Home className="w-5 h-5 mr-2" />
                        Volver al inicio
                    </Link>

                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors group"
                    >
                        <MoveLeft className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
                        Regresar
                    </button>
                </div>
            </div>
        </div>
    );
}
