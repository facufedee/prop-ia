"use client";

import { Clock } from "lucide-react";
import Link from "next/link";

export default function CheckoutPendingPage() {
    return (
        <main className="s-util s-util--center">
            <section className="s-util-card" aria-labelledby="checkout-pending-title">
                <div className="s-util-mark s-util-mark--warning">
                    <Clock aria-hidden="true" />
                </div>

                <h1 id="checkout-pending-title" className="s-util-title">
                    Pago Pendiente
                </h1>

                <p className="s-util-text">
                    Tu pago está siendo procesado. Te notificaremos cuando se confirme la transacción.
                </p>

                <div className="s-util-note s-util-note--warning">
                    <p>
                        Esto puede tardar algunos minutos. Recibirás un email cuando tu suscripción esté activa.
                    </p>
                </div>

                <div className="s-util-actions">
                    <Link href="/dashboard" className="s-auth-submit">
                        Ir al Dashboard
                    </Link>

                    <Link href="/precios" className="s-util-link">
                        Ver Planes
                    </Link>
                </div>
            </section>
        </main>
    );
}
