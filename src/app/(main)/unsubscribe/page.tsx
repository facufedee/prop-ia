"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/infrastructure/firebase/client";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

function UnsubscribeContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email");
    const [status, setStatus] = useState<'loading' | 'confirm' | 'success' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (!email) {
            setStatus('error');
            setErrorMsg("No se proporcionó un correo electrónico válido.");
            return;
        }
        setStatus('confirm');
    }, [email]);

    const handleUnsubscribe = async () => {
        if (!email || !db) return;
        setStatus('loading');

        try {
            const q = query(collection(db, "users"), where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setStatus('error');
                setErrorMsg("No encontramos una cuenta asociada a este correo.");
                return;
            }

            // Update all users found with this email (usually just one)
            const promises = querySnapshot.docs.map(userDoc =>
                updateDoc(doc(db, "users", userDoc.id), {
                    unsubscribedMarketing: true,
                    unsubscribedAt: new Date().toISOString()
                })
            );

            await Promise.all(promises);
            setStatus('success');
        } catch (error) {
            console.error("Unsubscribe error:", error);
            setStatus('error');
            setErrorMsg("Ocurrió un error al procesar tu solicitud. Por favor intenta de nuevo más tarde.");
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
                        <h2 className="text-2xl font-bold text-gray-900">¿Confirmas la baja?</h2>
                        <p className="text-gray-500 leading-relaxed">
                            Vas a dejar de recibir correos de marketing y novedades de <span className="font-semibold text-gray-900">Zeta Prop</span> para la dirección <span className="font-medium text-indigo-600 break-all">{email}</span>.
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
                            Listo. Ya no recibirás más correos de marketing en <span className="font-medium text-gray-900">{email}</span>. Lamentamos verte partir, pero respetamos tu decisión.
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
