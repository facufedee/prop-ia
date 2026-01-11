"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function CheckoutSuccessPage() {
    const router = useRouter();

    useEffect(() => {
        // Optional: Track successful payment
        console.log("✅ Payment successful!");
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    ¡Pago Exitoso!
                </h1>

                <p className="text-gray-600 mb-6">
                    Tu suscripción ha sido activada correctamente. Ya podés comenzar a disfrutar de todas las funcionalidades de tu plan.
                </p>

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

                <p className="text-xs text-gray-400 mt-6">
                    Recibirás un email de confirmación en breve
                </p>
            </div>
        </div>
    );
}
