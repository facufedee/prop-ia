"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

type Result = { status: "success" } | { status: "error"; message: string };

const GENERIC_ERROR = "No pudimos confirmar tu suscripción. Por favor intentá de nuevo más tarde.";

function errorFor(status: number): string {
    if (status === 400 || status === 403 || status === 404) {
        return "El enlace de confirmación no es válido. Suscribite de nuevo desde el pie de página de Zeta Prop.";
    }
    if (status === 409) {
        return "Este correo se dio de baja del newsletter. Si querés volver a recibirlo, suscribite de nuevo desde el pie de página.";
    }
    return GENERIC_ERROR;
}

function ConfirmContent() {
    const searchParams = useSearchParams();
    const subscriberId = searchParams.get("s");
    const token = searchParams.get("t");
    const [result, setResult] = useState<Result | null>(null);

    useEffect(() => {
        if (!subscriberId || !token) return;
        let cancelled = false;

        // Confirming is idempotent, so a repeated effect run (Strict Mode) is harmless.
        fetch("/api/newsletter/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ s: subscriberId, t: token }),
        })
            .then((res) => {
                if (cancelled) return;
                setResult(res.ok ? { status: "success" } : { status: "error", message: errorFor(res.status) });
            })
            .catch((error) => {
                console.error("Newsletter confirm error:", error);
                if (!cancelled) setResult({ status: "error", message: GENERIC_ERROR });
            });

        return () => {
            cancelled = true;
        };
    }, [subscriberId, token]);

    const view: Result | { status: "loading" } =
        !subscriberId || !token
            ? { status: "error", message: "El enlace de confirmación está incompleto. Usá el enlace del correo que te enviamos." }
            : result ?? { status: "loading" };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 text-center">
                <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Mail className="w-8 h-8" />
                    </div>
                </div>

                {view.status === "loading" && (
                    <div className="space-y-4">
                        <div className="flex justify-center">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Confirmando...</h2>
                        <p className="text-gray-500">Estamos confirmando tu suscripción al newsletter.</p>
                    </div>
                )}

                {view.status === "success" && (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">¡Suscripción confirmada!</h2>
                        <p className="text-gray-500 leading-relaxed">
                            Te vamos a mandar las próximas notas del blog.
                        </p>
                        <Link
                            href="/blog"
                            className="inline-block w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-2xl transition-all shadow-md mt-4"
                        >
                            Ir al blog
                        </Link>
                    </div>
                )}

                {view.status === "error" && (
                    <div className="space-y-6">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600">
                                <XCircle className="w-10 h-10" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Ups, hubo un problema</h2>
                        <p className="text-red-500 leading-relaxed font-medium">{view.message}</p>
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

export default function NewsletterConfirmPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
            }
        >
            <ConfirmContent />
        </Suspense>
    );
}
