"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ArrowRight, Shield, CreditCard, RefreshCw } from "lucide-react";
import { PRICING_FAQS } from "./pricingFaqs";

const TRUST_PILLS = [
    { icon: Shield, label: "14 días gratis" },
    { icon: CreditCard, label: "Sin tarjeta de crédito" },
    { icon: RefreshCw, label: "Sin débito automático" },
];

function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="s-faq-item">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="s-faq-item__button"
                aria-expanded={open}
            >
                <span>{q}</span>
                <ChevronDown className="s-faq-item__icon" size={20} aria-hidden="true" />
            </button>
            <div className={`overflow-hidden transition-all duration-200 ${open ? "max-h-64" : "max-h-0"}`}>
                <p className="s-faq-item__answer">{a}</p>
            </div>
        </div>
    );
}

function LimitItem({ label, value }: { label: string; value: number | "unlimited" }) {
    if (value === 0) return null;
    return (
        <span>
            <strong>{value === "unlimited" ? "Ilimitados" : value}</strong> {label}
        </span>
    );
}

function PlanSkeleton() {
    return (
        <div className="l-pricing" aria-hidden="true">
            {[0, 1, 2].map((i) => (
                <div key={i} className="l-price-card l-price-card--skeleton">
                    <div className="l-price-card__skel" style={{ width: "60%", height: "1.25rem", marginBottom: "0.5rem" }} />
                    <div className="l-price-card__skel" style={{ width: "90%", height: "2.6em", marginBottom: "1rem" }} />
                    <div className="l-price-card__skel" style={{ width: "50%", height: "2rem", marginBottom: "1.5rem" }} />
                    <div className="l-price-card__skel" style={{ width: "100%", height: "2.75rem", marginBottom: "1.5rem" }} />
                    <div className="l-price-card__skel" style={{ width: "100%", height: "8rem" }} />
                </div>
            ))}
        </div>
    );
}

export default function PricingTable() {
    const router = useRouter();
    const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const { subscriptionService } = await import("@/infrastructure/services/subscriptionService");
                const fetchedPlans = await subscriptionService.getAllPlans();
                const sorted = fetchedPlans.sort((a: any, b: any) => a.price.monthly - b.price.monthly);
                if (sorted.length > 0) setPlans(sorted);
            } catch (error) {
                console.error("Failed to load plans", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    // Yearly badge is derived from plan prices (same formula as checkout) and
    // hidden when no plan is actually cheaper on yearly billing.
    const maxYearlyDiscount = plans.reduce((max, plan) => {
        const monthly = plan.price?.monthly ?? 0;
        const yearly = plan.price?.yearly ?? 0;
        if (monthly <= 0 || yearly <= 0) return max;
        return Math.max(max, Math.round((1 - yearly / (monthly * 12)) * 100));
    }, 0);

    const formatPrice = (price: number) =>
        new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(price);

    return (
        <main className="flex-1">

            {/* ── Page header ── */}
            <section className="l-section s-page-head" aria-labelledby="precios-title">
                <div className="l-container">
                    <div className="s-page-head__inner">
                        <p className="l-eyebrow">PLANES Y PRECIOS</p>
                        <h1 id="precios-title" className="s-page-title">
                            Invertí en tu inmobiliaria, no en software caro
                        </h1>
                        <p className="s-page-lede">
                            Elegí el plan que acompaña el tamaño de tu negocio. Sin costos ocultos, sin contratos a largo plazo.
                        </p>

                        {/* Trust points */}
                        <ul className="s-trust">
                            {TRUST_PILLS.map(({ icon: Icon, label }) => (
                                <li key={label}>
                                    <Icon size={16} aria-hidden="true" />
                                    {label}
                                </li>
                            ))}
                        </ul>

                        {/* Billing toggle */}
                        <div className="s-toggle" role="group" aria-label="Período de facturación">
                            <button
                                type="button"
                                onClick={() => setBillingPeriod("monthly")}
                                className="s-toggle__option"
                                aria-pressed={billingPeriod === "monthly"}
                            >
                                Mensual
                            </button>
                            <button
                                type="button"
                                onClick={() => setBillingPeriod("yearly")}
                                className="s-toggle__option"
                                aria-pressed={billingPeriod === "yearly"}
                            >
                                Anual
                                {maxYearlyDiscount > 0 && (
                                    <span className="s-toggle__save">-{maxYearlyDiscount}%</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Plans ── */}
            <section className="l-section l-section--tight" aria-label="Planes">
                <div className="l-container">
                    {loading ? (
                        <PlanSkeleton />
                    ) : plans.length === 0 ? (
                        <div className="s-card s-card--quiet">
                            <p className="s-card__title">No hay planes disponibles en este momento.</p>
                            <p className="s-card__body">Contactanos para más información.</p>
                        </div>
                    ) : (
                        <div className="l-pricing">
                            {plans.map((plan) => {
                                const price = billingPeriod === "monthly" ? plan.price.monthly : plan.price.yearly;
                                const pricePerMonth = billingPeriod === "yearly" && price > 0 ? price / 12 : price;
                                const isFree = plan.price.monthly === 0;

                                return (
                                    <div
                                        key={plan.id}
                                        className={`l-price-card ${plan.popular ? "l-price-card--popular" : ""}`}
                                    >
                                        {plan.popular && <span className="l-price-card__badge">MÁS POPULAR</span>}

                                        <h2 className="l-price-card__name">{plan.name}</h2>
                                        <p className="l-price-card__desc">{plan.description}</p>

                                        {/* Price block */}
                                        {isFree ? (
                                            <div className="l-price-card__price">
                                                <span className="s-price-free">Gratis</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="l-price-card__price">
                                                    <span className="l-price-card__amount">{formatPrice(pricePerMonth)}</span>
                                                    <span className="l-price-card__period">/mes</span>
                                                </div>
                                                {billingPeriod === "yearly" && price > 0 && (
                                                    <p className="s-price-billed">
                                                        Facturado {formatPrice(price)}/año
                                                        {plan.price.monthly * 12 - price > 0 && ` · Ahorrás ${formatPrice(plan.price.monthly * 12 - price)}`}
                                                    </p>
                                                )}
                                            </>
                                        )}

                                        {/* CTA */}
                                        <button
                                            type="button"
                                            onClick={() => router.push(isFree ? "/register" : `/checkout?plan=${plan.id}&billing=${billingPeriod}`)}
                                            className="l-price-card__cta s-price-cta"
                                        >
                                            {isFree ? "Comenzar gratis" : "Elegir este plan"}
                                            <ArrowRight size={16} aria-hidden="true" />
                                        </button>

                                        {/* Limits */}
                                        <div className="s-price-limits">
                                            <LimitItem label="propiedades" value={plan.limits.properties} />
                                            <LimitItem label="usuarios" value={plan.limits.users} />
                                        </div>

                                        {/* Features */}
                                        <p className="s-label">Incluye</p>
                                        <ul className="l-price-card__features">
                                            {Array.isArray(plan.features) ? plan.features.map((feature: string, i: number) => (
                                                <li key={i}>
                                                    <Check size={15} aria-hidden="true" />
                                                    {feature}
                                                </li>
                                            )) : (
                                                <li>Sin características definidas.</li>
                                            )}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* ── FAQ ── */}
            <section className="l-section l-section--tight" aria-labelledby="precios-faq-title">
                <div className="l-container l-faq">
                    <div>
                        <p className="l-eyebrow">PREGUNTAS FRECUENTES</p>
                        <h2 id="precios-faq-title" className="l-section__title">Todo lo que querés saber</h2>
                        <p className="l-section__lede">Si no encontrás lo que buscás, escribinos al chat o por WhatsApp.</p>
                    </div>
                    <div className="s-faq-list">
                        {PRICING_FAQS.map((faq) => (
                            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Enterprise CTA ── */}
            <section className="l-section l-section--tight" aria-labelledby="enterprise-title">
                <div className="l-container l-cta-band">
                    <span className="l-eyebrow">Enterprise</span>
                    <h2 id="enterprise-title">¿Tenés una red grande o franquicia?</h2>
                    <p>
                        Si tenés varias oficinas o un equipo grande, escribinos y vemos juntos qué plan y qué configuración de sucursales, usuarios y roles te conviene.
                    </p>
                    <div className="l-hero__ctas">
                        <button
                            type="button"
                            onClick={() => router.push("/contacto")}
                            className="l-btn l-btn--primary s-btn-reset"
                        >
                            Hablar con ventas
                            <span className="l-btn__icon" aria-hidden="true">
                                <ArrowRight size={16} />
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push("/contacto")}
                            className="l-link-arrow s-btn-reset s-link-btn"
                        >
                            o escribinos por WhatsApp →
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}
