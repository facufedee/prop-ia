"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Zap, Building2, Rocket, ChevronDown, ArrowRight, Shield, CreditCard, RefreshCw } from "lucide-react";

const TRUST_PILLS = [
    { icon: Shield, label: "14 días gratis" },
    { icon: CreditCard, label: "Sin tarjeta de crédito" },
    { icon: RefreshCw, label: "Cancelá cuando quieras" },
];

const FAQS = [
    {
        q: "¿Puedo cambiar de plan en cualquier momento?",
        a: "Sí. Podés hacer upgrade o downgrade de tu plan en cualquier momento desde el panel de configuración. Los cambios se aplican de forma inmediata y el cobro se prorratea según los días restantes del período.",
    },
    {
        q: "¿Qué pasa cuando termina la prueba gratuita de 14 días?",
        a: "Al finalizar la prueba, tu cuenta pasa a modo lectura: podés ver todo pero no agregar nuevos datos. No se te cobra nada automáticamente. Elegís el plan que mejor se adapte y continuás donde lo dejaste.",
    },
    {
        q: "¿Necesito tarjeta de crédito para registrarme?",
        a: "No. El registro y los 14 días de prueba son completamente gratis y no requieren ningún método de pago. Solo pedimos email y contraseña.",
    },
    {
        q: "¿Qué métodos de pago aceptan?",
        a: "Aceptamos todas las tarjetas de crédito y débito (Visa, Mastercard, American Express), transferencia bancaria y MercadoPago.",
    },
    {
        q: "¿Funciona para inmobiliarias con varias sucursales?",
        a: "Sí. Los planes Profesional y Enterprise incluyen gestión multisucursal, lo que te permite administrar propiedades, agentes y reportes por sucursal desde una única cuenta.",
    },
    {
        q: "¿Puedo importar mi cartera de propiedades existente?",
        a: "Sí. Ofrecemos importación masiva desde Excel/CSV y también integración con los principales portales inmobiliarios de Argentina.",
    },
    {
        q: "¿El soporte está incluido en todos los planes?",
        a: "Todos los planes incluyen soporte por email. El plan Profesional suma soporte prioritario por WhatsApp, y el Enterprise cuenta con un ejecutivo de cuenta dedicado.",
    },
];

const iconMap: Record<string, any> = { Zap, Building2, Rocket };

function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-gray-100 last:border-0">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between gap-4 py-5 text-left group"
                aria-expanded={open}
            >
                <span className="text-base font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                    {q}
                </span>
                <ChevronDown
                    className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-indigo-500" : ""}`}
                />
            </button>
            <div className={`overflow-hidden transition-all duration-200 ${open ? "max-h-64 pb-5" : "max-h-0"}`}>
                <p className="text-gray-600 text-sm leading-relaxed">{a}</p>
            </div>
        </div>
    );
}

function LimitItem({ label, value }: { label: string; value: number | "unlimited" }) {
    if (value === 0) return null;
    return (
        <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
            <span className="text-sm font-semibold text-gray-800">
                {value === "unlimited" ? "Ilimitados" : value}
                <span className="text-sm text-gray-500 font-normal ml-1">{label}</span>
            </span>
        </div>
    );
}

function PlanSkeleton() {
    return (
        <div className="flex flex-col md:flex-row justify-center items-stretch gap-6 lg:gap-8 max-w-5xl mx-auto">
            {[0, 1, 2].map((i) => (
                <div key={i} className={`bg-white rounded-3xl border border-gray-100 p-8 w-full md:w-[340px] shrink-0 animate-pulse ${i === 1 ? "ring-2 ring-indigo-200" : ""}`}>
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 mb-6" />
                    <div className="h-6 bg-gray-100 rounded w-2/3 mb-3" />
                    <div className="h-4 bg-gray-100 rounded w-full mb-1" />
                    <div className="h-4 bg-gray-100 rounded w-4/5 mb-8" />
                    <div className="h-16 bg-gray-100 rounded-2xl mb-8" />
                    <div className="h-12 bg-gray-100 rounded-xl mb-8" />
                    <div className="space-y-3">
                        {[0, 1, 2, 3, 4].map((j) => (
                            <div key={j} className="h-4 bg-gray-100 rounded w-full" />
                        ))}
                    </div>
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

    const formatPrice = (price: number) =>
        new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(price);

    const tierColors: Record<string, { bg: string; text: string; ring: string }> = {
        starter:      { bg: "bg-emerald-50",  text: "text-emerald-600",  ring: "ring-emerald-200" },
        professional: { bg: "bg-indigo-50",   text: "text-indigo-600",   ring: "ring-indigo-200" },
        enterprise:   { bg: "bg-purple-50",   text: "text-purple-600",   ring: "ring-purple-200" },
    };

    return (
        <div className="bg-gray-50/50">

            {/* ── Hero ── */}
            <section className="relative overflow-hidden pt-32 pb-24 px-5 sm:px-6 bg-[#080810]">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-[#080810] to-purple-950/60 pointer-events-none" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-3xl mx-auto text-center relative z-10">
                    <span className="inline-block px-4 py-1.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full text-sm font-semibold mb-6">
                        PLANES Y PRECIOS
                    </span>
                    <h1 className="text-4xl sm:text-6xl font-extrabold mb-6 leading-tight text-white">
                        Invertí en tu inmobiliaria,{" "}
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                            no en software caro
                        </span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
                        Elegí el plan que acompaña el tamaño de tu negocio. Sin costos ocultos, sin contratos a largo plazo.
                    </p>

                    {/* Trust pills */}
                    <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
                        {TRUST_PILLS.map(({ icon: Icon, label }) => (
                            <div key={label} className="flex items-center gap-2 text-sm text-indigo-200 bg-white/5 border border-white/10 rounded-full px-4 py-2 shadow-sm">
                                <Icon className="w-4 h-4 text-indigo-400 shrink-0" />
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Billing toggle */}
                    <div className="inline-flex items-center bg-white/5 rounded-full p-1 shadow-sm border border-white/10">
                        <button
                            onClick={() => setBillingPeriod("monthly")}
                            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${billingPeriod === "monthly" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:text-white"}`}
                        >
                            Mensual
                        </button>
                        <button
                            onClick={() => setBillingPeriod("yearly")}
                            className={`relative px-6 py-2 rounded-full text-sm font-semibold transition-all ${billingPeriod === "yearly" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:text-white"}`}
                        >
                            Anual
                            <span className={`absolute -top-3 -right-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm transition-all ${billingPeriod === "yearly" ? "bg-emerald-400 text-white" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"}`}>
                                -17%
                            </span>
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Plans ── */}
            <section className="px-5 sm:px-6 pb-16">
                <div className="max-w-7xl mx-auto">
                    {loading ? (
                        <PlanSkeleton />
                    ) : plans.length === 0 ? (
                        <div className="text-center py-20 text-gray-500 bg-white rounded-3xl border border-dashed border-gray-300 max-w-2xl mx-auto">
                            <p className="text-lg font-medium">No hay planes disponibles en este momento.</p>
                            <p className="text-sm text-gray-400 mt-2">Contactanos para más información.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row justify-center items-stretch gap-6 lg:gap-8 max-w-5xl mx-auto">
                            {plans.map((plan) => {
                                const Icon = (plan.icon && iconMap[plan.icon]) ? iconMap[plan.icon] : Zap;
                                const price = billingPeriod === "monthly" ? plan.price.monthly : plan.price.yearly;
                                const pricePerMonth = billingPeriod === "yearly" && price > 0 ? price / 12 : price;
                                const colors = tierColors[plan.tier] ?? tierColors.starter;
                                const isFree = plan.price.monthly === 0;

                                return (
                                    <div
                                        key={plan.id}
                                        className={`relative bg-white rounded-3xl overflow-hidden flex flex-col w-full md:w-[340px] shrink-0 transition-all duration-300 hover:-translate-y-1 ${
                                            plan.popular
                                                ? "shadow-2xl shadow-indigo-100 ring-2 ring-indigo-600 md:scale-[1.03] z-10"
                                                : "shadow-md hover:shadow-xl border border-gray-100"
                                        }`}
                                    >
                                        {/* Gradient top bar */}
                                        <div className={`h-1.5 w-full ${plan.popular ? "bg-gradient-to-r from-indigo-500 to-purple-500" : "bg-gradient-to-r from-gray-200 to-gray-100"}`} />

                                        {plan.popular && (
                                            <div className="absolute top-5 right-5 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-wide shadow">
                                                MÁS POPULAR
                                            </div>
                                        )}

                                        <div className="p-8 flex flex-col flex-1">
                                            {/* Icon + name */}
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${colors.bg} ${colors.text}`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h2>
                                            <p className="text-sm text-gray-500 leading-relaxed mb-6 min-h-[40px]">{plan.description}</p>

                                            {/* Price block */}
                                            <div className={`rounded-2xl p-5 mb-6 ${plan.popular ? "bg-indigo-50 border border-indigo-100" : "bg-gray-50 border border-gray-100"}`}>
                                                {isFree ? (
                                                    <p className="text-3xl font-extrabold text-gray-900">Gratis</p>
                                                ) : (
                                                    <>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                                                {formatPrice(pricePerMonth)}
                                                            </span>
                                                            <span className="text-gray-400 text-sm font-medium">/mes</span>
                                                        </div>
                                                        {billingPeriod === "yearly" && (
                                                            <p className="text-xs text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                                Facturado {formatPrice(price)}/año · Ahorrás {formatPrice(plan.price.monthly * 12 - price)}
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {/* CTA */}
                                            <button
                                                onClick={() => router.push(isFree ? "/register" : `/checkout?plan=${plan.id}&billing=${billingPeriod}`)}
                                                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all mb-6 flex items-center justify-center gap-2 group ${
                                                    plan.popular
                                                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200"
                                                        : "bg-white text-gray-900 border-2 border-gray-200 hover:border-indigo-400 hover:text-indigo-700"
                                                }`}
                                            >
                                                {isFree ? "Comenzar gratis" : "Elegir este plan"}
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                            </button>

                                            {/* Limits */}
                                            <div className="flex flex-wrap gap-x-5 gap-y-2 pb-5 border-b border-gray-100 mb-5">
                                                <LimitItem label="propiedades" value={plan.limits.properties} />
                                                <LimitItem label="usuarios" value={plan.limits.users} />
                                            </div>

                                            {/* Features */}
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Incluye</p>
                                            <ul className="space-y-3 flex-1">
                                                {Array.isArray(plan.features) ? plan.features.map((feature: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-3">
                                                        <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${plan.popular ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-500"}`}>
                                                            <Check className="w-2.5 h-2.5" />
                                                        </div>
                                                        <span className="text-sm text-gray-600">{feature}</span>
                                                    </li>
                                                )) : (
                                                    <li className="text-sm text-gray-400 italic">Sin características definidas.</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* ── FAQ ── */}
            <section className="py-16 px-5 sm:px-6 bg-white border-t border-gray-100">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="inline-block px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold mb-5">
                            PREGUNTAS FRECUENTES
                        </span>
                        <h2 className="text-3xl font-bold text-gray-900">Todo lo que querés saber</h2>
                        <p className="text-gray-500 mt-3">Si no encontrás lo que buscás, escribinos al chat o por WhatsApp.</p>
                    </div>
                    <div className="bg-gray-50 rounded-3xl border border-gray-100 px-6 sm:px-8 divide-y divide-gray-100">
                        {FAQS.map((faq) => (
                            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Enterprise CTA ── */}
            <section className="py-16 px-5 sm:px-6 bg-[#070710]">
                <div className="max-w-4xl mx-auto">
                    {/* Dot grid */}
                    <div
                        className="absolute pointer-events-none inset-0 opacity-30"
                        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
                    />
                    <div className="relative bg-gradient-to-br from-indigo-900/60 to-purple-900/40 rounded-3xl border border-white/10 p-10 md:p-14 text-center overflow-hidden">
                        {/* Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-indigo-600/20 blur-[80px] pointer-events-none" />

                        <div className="relative z-10">
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
                                style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(129,140,248,0.3)", color: "#a5b4fc" }}>
                                Enterprise
                            </span>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
                                ¿Tenés una{" "}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                                    red grande o franquicia?
                                </span>
                            </h2>
                            <p className="text-indigo-200/80 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
                                Diseñamos una solución a medida con API dedicada, integraciones personalizadas, SLA garantizado y soporte 24/7.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button
                                    onClick={() => router.push("/contacto")}
                                    className="group flex items-center gap-2 px-8 py-4 bg-white text-indigo-900 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-xl shadow-black/20"
                                >
                                    Hablar con ventas
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                                <button
                                    onClick={() => router.push("/contacto")}
                                    className="text-indigo-300 hover:text-white text-sm font-medium transition-colors"
                                >
                                    o escribinos por WhatsApp →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
