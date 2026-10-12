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
            ? "Este enlace de baja ya no es válido. Usá el enlace que figura en un correo reciente de Zeta Prop o escribinos a zetaprop.com.ar@gmail.com y te damos de baja."
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
        <main className="s-util s-util--center">
            <section className="s-util-card" aria-live="polite">
                {status === 'loading' && (
                    <>
                        <div className="s-util-mark">
                            <Loader2 className="animate-spin" aria-hidden="true" />
                        </div>
                        <h1 className="s-util-title">Procesando...</h1>
                        <p className="s-util-text">Estamos actualizando tus preferencias de comunicación.</p>
                    </>
                )}

                {status === 'confirm' && (
                    <>
                        <div className="s-util-mark">
                            <Mail aria-hidden="true" />
                        </div>
                        <h1 className="s-util-title">¿Confirmás la baja?</h1>
                        <p className="s-util-text">
                            Vas a dejar de recibir correos de marketing y novedades de <strong>Zeta Prop</strong>.
                        </p>
                        <div className="s-util-actions">
                            <button
                                type="button"
                                onClick={handleUnsubscribe}
                                className="s-auth-submit"
                            >
                                Confirmar baja
                            </button>
                            <Link href="/" className="s-util-link">
                                Mantener suscripción
                            </Link>
                        </div>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="s-util-mark s-util-mark--positive">
                            <CheckCircle2 aria-hidden="true" />
                        </div>
                        <h1 className="s-util-title">Suscripción cancelada</h1>
                        <p className="s-util-text">
                            Listo. Ya no vas a recibir más correos de marketing de Zeta Prop. Lamentamos verte partir, pero respetamos tu decisión.
                        </p>
                        <div className="s-util-actions">
                            <Link href="/" className="s-auth-submit">
                                Volver al inicio
                            </Link>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="s-util-mark s-util-mark--danger">
                            <XCircle aria-hidden="true" />
                        </div>
                        <h1 className="s-util-title">Ups, hubo un problema</h1>
                        <p className="s-util-text s-util-text--danger">
                            {errorMsg}
                        </p>
                        <div className="s-util-actions">
                            <Link href="/" className="s-util-link">
                                Volver al inicio
                            </Link>
                        </div>
                    </>
                )}
            </section>
        </main>
    );
}

export default function UnsubscribePage() {
    return (
        <Suspense fallback={
            <div className="s-util-loading">
                <Loader2 className="animate-spin" aria-label="Cargando" />
            </div>
        }>
            <UnsubscribeContent />
        </Suspense>
    );
}
