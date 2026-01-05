"use client";

import { Clock } from "lucide-react";
import Link from "next/link";

export default function CheckoutPendingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-12 h-12 text-yellow-600" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Pago Pendiente
                </h1>

                <p className="text-gray-600 mb-6">
                    Tu pago está siendo procesado. Te notificaremos cuando se confirme la transacción.
                </p>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-yellow-800">
                        💡 Esto puede tardar algunos minutos. Recibirás un email cuando tu suscripción esté activa.
                    </p>
                </div>

                <div className="space-y-3">
                    <Link
                        href="/dashboard"
                        className="block w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                    >
                        Ir al Dashboard
                    </Link>

                    <Link
                        href="/precios"
                        className="block w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                        Ver Planes
                    </Link>
                </div>
            </div>
        </div>
    );
}
