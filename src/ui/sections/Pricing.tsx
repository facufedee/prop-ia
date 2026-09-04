"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import type { Plan } from "@/domain/models/Subscription";

const formatPrice = (value: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(value);

function PriceCardSkeleton() {
    return (
        <div className="l-price-card l-price-card--skeleton" aria-hidden="true">
            <div className="l-price-card__skel" style={{ width: "60%", height: "1.25rem", marginBottom: "0.5rem" }} />
            <div className="l-price-card__skel" style={{ width: "90%", height: "2.6em", marginBottom: "1rem" }} />
            <div className="l-price-card__skel" style={{ width: "50%", height: "2rem", marginBottom: "1.5rem" }} />
            <div className="l-price-card__skel" style={{ width: "100%", height: "8rem" }} />
        </div>
    );
}

export function Pricing() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    // Same data source as /precios (subscriptionService -> Firestore "plans"
    // collection) so editing a plan in Configuración > Suscripciones updates
    // every place the pricing module is shown, including this section.
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const { subscriptionService } = await import("@/infrastructure/services/subscriptionService");
                const fetched = await subscriptionService.getAllPlans();
                setPlans(fetched.sort((a, b) => a.price.monthly - b.price.monthly));
            } catch (error) {
                console.error("Failed to load plans", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    return (
        <section id="pricing" className="l-section l-section--tight scroll-mt-20">
            <div className="l-container">
                <div className="l-section__head" style={{ marginInline: "auto", textAlign: "center", maxWidth: "36rem" }}>
                    <h2 className="l-section__title">Planes que crecen con vos</h2>
                    <p className="l-section__lede" style={{ marginInline: "auto" }}>
                        Elegí el plan que mejor se adapta a tu inmobiliaria. Precios en pesos argentinos.
                    </p>
                    <p className="l-pricing__trust">
                        <ShieldCheck size={16} />
                        14 días gratis, sin tarjeta de crédito
                    </p>
                </div>

                {loading ? (
                    <div className="l-pricing">
                        <PriceCardSkeleton />
                        <PriceCardSkeleton />
                        <PriceCardSkeleton />
                    </div>
                ) : plans.length === 0 ? (
                    <p className="l-pricing__footnote">
                        No hay planes disponibles en este momento. <Link href="/contacto">Contactanos</Link> para más información.
                    </p>
                ) : (
                    <>
                        <div className="l-pricing">
                            {plans.map((plan, i) => (
                                <div
                                    key={plan.id}
                                    className={`l-price-card l-reveal ${plan.popular ? "l-price-card--popular" : ""}`}
                                    style={{ ["--i" as string]: i }}
                                >
                                    {plan.popular && <span className="l-price-card__badge">Más elegido</span>}

                                    <h3 className="l-price-card__name">{plan.name}</h3>
                                    <p className="l-price-card__desc">{plan.description}</p>

                                    <div className="l-price-card__price">
                                        <span className="l-price-card__amount">{formatPrice(plan.price.monthly)}</span>
                                        <span className="l-price-card__period">/mes</span>
                                    </div>

                                    <ul className="l-price-card__features">
                                        {(Array.isArray(plan.features) ? plan.features.slice(0, 5) : []).map((f) => (
                                            <li key={f}>
                                                <Check size={15} />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    <Link href="/precios" className="l-price-card__cta">
                                        Elegir {plan.name}
                                    </Link>
                                </div>
                            ))}
                        </div>
                        <p className="l-pricing__footnote">
                            <Link href="/precios">Ver comparación completa de planes →</Link>
                        </p>
                    </>
                )}
            </div>
        </section>
    );
}
