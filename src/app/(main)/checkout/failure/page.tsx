"use client";

import { XCircle } from "lucide-react";
import Link from "next/link";

export default function CheckoutFailurePage() {
    return (
        <main className="s-util s-util--center">
            <section className="s-util-card" aria-labelledby="checkout-failure-title">
                <div className="s-util-mark s-util-mark--danger">
                    <XCircle aria-hidden="true" />
                </div>

                <h1 id="checkout-failure-title" className="s-util-title">
                    Pago Rechazado
                </h1>

                <p className="s-util-text">
                    No pudimos procesar tu pago. Por favor, intentá nuevamente o probá con otro método de pago.
                </p>

                <div className="s-util-actions">
                    <Link href="/precios" className="s-auth-submit">
                        Intentar Nuevamente
                    </Link>

                    <Link href="/contacto" className="s-util-link">
                        Contactar Soporte
                    </Link>
                </div>
            </section>
        </main>
    );
}
