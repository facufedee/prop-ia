import Link from "next/link";
import { Check } from "lucide-react";

const formatPrice = (value: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(value);

const plans = [
    {
        name: "Prueba Gratis",
        price: null,
        priceLabel: "Gratis por 7 días",
        desc: "Para conocer la plataforma sin compromiso.",
        features: ["Acceso completo por 7 días", "Sin tarjeta de crédito", "Cancelá cuando quieras"],
        cta: "Empezar gratis",
        href: "/register",
        popular: false,
    },
    {
        name: "Profesional",
        price: 49000,
        priceLabel: null,
        desc: "Para inmobiliarias que gestionan su cartera todos los días.",
        features: ["Propiedades ilimitadas", "Tasaciones ilimitadas", "CRM integrado", "Publicación multiplataforma"],
        cta: "Elegir Profesional",
        href: "/precios",
        popular: true,
    },
    {
        name: "Empresarial",
        price: 79000,
        priceLabel: null,
        desc: "Para equipos y agencias con varias sucursales.",
        features: ["Todo lo de Profesional", "Usuarios del equipo", "Reportes avanzados", "Automatizaciones"],
        cta: "Elegir Empresarial",
        href: "/precios",
        popular: false,
    },
];

export function Pricing() {
    return (
        <section id="pricing" className="py-14 sm:py-20 lg:py-24 bg-white px-5 sm:px-6 scroll-mt-20">
            <div className="max-w-2xl mx-auto text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900">Planes que crecen con vos</h2>
                <p className="text-gray-600 mt-2">Elegí el plan que mejor se adapta a tu inmobiliaria. Precios en pesos argentinos.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto items-start">
                {plans.map((p) => (
                    <div
                        key={p.name}
                        className={`relative rounded-2xl p-8 flex flex-col h-full ${p.popular
                            ? "bg-white border-2 border-indigo-600 shadow-xl shadow-indigo-100 md:-translate-y-2"
                            : "bg-white border border-gray-200"
                            }`}
                    >
                        {p.popular && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full">
                                Más elegido
                            </span>
                        )}

                        <h3 className="text-xl font-bold text-gray-900 mb-1">{p.name}</h3>
                        <p className="text-gray-500 text-sm mb-6 min-h-[40px]">{p.desc}</p>

                        <div className="mb-6">
                            {p.price === null ? (
                                <p className="text-2xl font-extrabold text-gray-900">{p.priceLabel}</p>
                            ) : (
                                <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                    {formatPrice(p.price)}
                                    <span className="text-base font-medium text-gray-400"> /mes</span>
                                </p>
                            )}
                        </div>

                        <ul className="text-gray-700 space-y-3 mb-8 flex-1">
                            {p.features.map((f) => (
                                <li key={f} className="flex items-start gap-2.5 text-sm">
                                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                                    {f}
                                </li>
                            ))}
                        </ul>

                        <Link
                            href={p.href}
                            className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-colors ${p.popular
                                ? "bg-indigo-600 text-white hover:bg-indigo-500"
                                : "bg-white text-gray-900 border border-gray-300 hover:border-indigo-400 hover:text-indigo-700"
                                }`}
                        >
                            {p.cta}
                        </Link>
                    </div>
                ))}
            </div>
        </section>
    );
}
