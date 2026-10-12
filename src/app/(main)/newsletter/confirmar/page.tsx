"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

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
        <main className="s-util s-util--center">
            <section className="s-util-card" aria-live="polite">
                {view.status === "loading" && (
                    <>
                        <div className="s-util-mark">
                            <Loader2 className="animate-spin" aria-hidden="true" />
                        </div>
                        <h1 className="s-util-title">Confirmando...</h1>
                        <p className="s-util-text">Estamos confirmando tu suscripción al newsletter.</p>
                    </>
                )}

                {view.status === "success" && (
                    <>
                        <div className="s-util-mark s-util-mark--positive">
                            <CheckCircle2 aria-hidden="true" />
                        </div>
                        <h1 className="s-util-title">¡Suscripción confirmada!</h1>
                        <p className="s-util-text">
                            Te vamos a mandar las próximas notas del blog.
                        </p>
                        <div className="s-util-actions">
                            <Link href="/blog" className="s-auth-submit">
                                Ir al blog
                            </Link>
                        </div>
                    </>
                )}

                {view.status === "error" && (
                    <>
                        <div className="s-util-mark s-util-mark--danger">
                            <XCircle aria-hidden="true" />
                        </div>
                        <h1 className="s-util-title">Ups, hubo un problema</h1>
                        <p className="s-util-text s-util-text--danger">{view.message}</p>
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

export default function NewsletterConfirmPage() {
    return (
        <Suspense
            fallback={
                <div className="s-util-loading">
                    <Loader2 className="animate-spin" aria-label="Cargando" />
                </div>
            }
        >
            <ConfirmContent />
        </Suspense>
    );
}
