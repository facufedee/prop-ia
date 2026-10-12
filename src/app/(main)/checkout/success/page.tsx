"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function CheckoutSuccessContent() {
    const searchParams = useSearchParams();
    const paymentId = searchParams.get("payment_id");

    useEffect(() => {
        // Ping webhook manually in case of localhost or delayed MP Webhooks
        if (paymentId) {
            console.log("Verifying payment directly...", paymentId);
            fetch('/api/webhooks/mercadopago', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'payment', data: { id: paymentId } })
            }).then(res => res.json())
                .then(data => console.log("Direct Validation Result:", data))
                .catch(e => console.error("Error verifying payment sync", e));
        }
    }, [paymentId]);

    return (
        <main className="s-util s-util--center">
            <section className="s-util-card" aria-labelledby="checkout-success-title">
                <div className="s-util-mark s-util-mark--positive">
                    <CheckCircle aria-hidden="true" />
                </div>

                <h1 id="checkout-success-title" className="s-util-title">
                    ¡Pago Exitoso!
                </h1>

                <p className="s-util-text">
                    Tu suscripción ha sido activada correctamente. Ya podés comenzar a disfrutar de todas las funcionalidades de tu plan.
                </p>

                <div className="s-util-actions">
                    <Link href="/dashboard" className="s-auth-submit">
                        Ir al Dashboard
                    </Link>

                    <Link href="/precios" className="s-util-link">
                        Ver Planes
                    </Link>
                </div>

                <p className="s-util-fine">
                    Recibirás un email de confirmación en breve
                </p>
            </section>
        </main>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={<div className="s-util-loading"><Loader2 className="animate-spin" aria-label="Cargando" /></div>}>
            <CheckoutSuccessContent />
        </Suspense>
    );
}
