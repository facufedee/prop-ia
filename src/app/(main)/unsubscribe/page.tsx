"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

function UnsubscribeContent() {
    const searchParams = useSearchParams();
    const userId = searchParams.get("u");
    const token = searchParams.get("t");
    // Legacy links (`?email=`) are unsigned, so they can no longer unsubscribe anyone.
    const legacyEmail = searchParams.get("email");
    const [requestStatus, setRequestStatus] = useState<'loading' | 'confirm' | 'success' | 'error'>('confirm');
    const [requestError, setRequestError] = useState("");

    let linkError: string | null = null;
    if (!userId || !token) {
        linkError = legacyEmail
            ? "Este enlace de baja ya no es válido. Usá el enlace que figura en un correo reciente de Zeta Prop o escribinos a contacto@zetaprop.com.ar y te damos de baja."
            : "El enlace de baja está incompleto. Usá el enlace que figura en un correo reciente de Zeta Prop.";
    }
    const status = linkError ? 'error' : requestStatus;
    const errorMsg = linkError ?? requestError;

    const handleUnsubscribe = async () => {
        if (!userId || !token) return;
        setRequestStatus('loading');

        try {
            const res = await fetch("/api/newsletter/unsubscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ u: userId, t: token }),
            });

            if (res.ok) {
                setRequestStatus('success');
                return;
            }

            setRequestStatus('error');
            setRequestError(
                res.status === 403 || res.status === 400
                    ? "El enlace de baja no es válido o expiró. Usá el enlace de un correo reciente de Zeta Prop."
                    : "Ocurrió un error al procesar tu solicitud. Por favor intentá de nuevo más tarde."
            );
        } catch (error) {
            console.error("Unsubscribe error:", error);
            setRequestStatus('error');
            setRequestError("Ocurrió un error al procesar tu solicitud. Por favor intentá de nuevo más tarde.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 text-center">
                <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Mail className="w-8 h-8" />
                    </div>
                </div>

                {status === 'loading' && (
                    <div className="space-y-4">
                        <div className="flex justify-center">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Procesando...</h2>
                        <p className="text-gray-500">Estamos actualizando tus preferencias de comunicación.</p>
                    </div>
                )}

                {status === 'confirm' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900">¿Confirmás la baja?</h2>
                        <p className="text-gray-500 leading-relaxed">
                            Vas a dejar de recibir correos de marketing y novedades de <span className="font-semibold text-gray-900">Zeta Prop</span>.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleUnsubscribe}
                                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition-all shadow-md shadow-indigo-200"
                            >
                                Confirmar baja
                            </button>
                            <Link
                                href="/"
                                className="w-full py-3.5 bg-white hover:bg-gray-50 text-gray-600 font-semibold rounded-2xl border border-gray-200 transition-all"
                            >
                                Mantener suscripción
                            </Link>
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Suscripción cancelada</h2>
                        <p className="text-gray-500 leading-relaxed">
                            Listo. Ya no vas a recibir más correos de marketing de Zeta Prop. Lamentamos verte partir, pero respetamos tu decisión.
                        </p>
                        <Link
                            href="/"
                            className="inline-block w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-2xl transition-all shadow-md mt-4"
                        >
                            Volver al inicio
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600">
                                <XCircle className="w-10 h-10" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Ups, hubo un problema</h2>
                        <p className="text-red-500 leading-relaxed font-medium">
                            {errorMsg}
                        </p>
                        <Link
                            href="/"
                            className="inline-block w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-all"
                        >
                            Volver al inicio
                        </Link>
                    </div>
                )}
            </div>

            <p className="mt-8 text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} Zeta Prop. Todos los derechos reservados.
            </p>
        </div>
    );
}

export default function UnsubscribePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        }>
            <UnsubscribeContent />
        </Suspense>
    );
}
