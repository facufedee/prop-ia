"use client";

import { XCircle } from "lucide-react";
import Link from "next/link";

export default function CheckoutFailurePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-12 h-12 text-red-600" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Pago Rechazado
                </h1>

                <p className="text-gray-600 mb-6">
                    No pudimos procesar tu pago. Por favor, intentá nuevamente o probá con otro método de pago.
                </p>

                <div className="space-y-3">
                    <Link
                        href="/precios"
                        className="block w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                    >
                        Intentar Nuevamente
                    </Link>

                    <Link
                        href="/contacto"
                        className="block w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                        Contactar Soporte
                    </Link>
                </div>
            </div>
        </div>
    );
}
