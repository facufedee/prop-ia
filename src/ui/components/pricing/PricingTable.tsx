"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Zap, Building2, Rocket, X } from "lucide-react";
// @ts-ignore
import { Plan } from "@/domain/models/Subscription";

// Helper for feature labels
const FEATURE_LABELS: Record<string, string> = {
    rentals_management: "Gestión de Alquileres",
    properties_publishing: "Publicación en Portales",
    whatsapp_bot: "Bot WhatsApp IA",
    automatic_agenda: "Agenda Automática",
    automatic_notifications: "Notificaciones Auto",
    online_valuations: "Tasador Online",
    tenant_portal: "Portal de Inquilinos",
    custom_branding: "Marca Propia (White Label)",
    multi_branch: "Multi-Sucursal"
};

export default function PricingTable() {
    const router = useRouter();
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
    const [plans, setPlans] = useState<any[]>([]); // Using any for flexibility or import Plan interface
    const [loading, setLoading] = useState(true);

    const iconMap: Record<string, any> = {
        Zap,
        Building2,
        Rocket,
        // Add defaults or fallback
    };

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                // Dynamically import to avoid server/client issues if needed, or just standard import
                const { subscriptionService } = await import("@/infrastructure/services/subscriptionService");
                const fetchedPlans = await subscriptionService.getAllPlans();

                // Sort by price
                const sorted = fetchedPlans.sort((a, b) => a.price.monthly - b.price.monthly);

                if (sorted.length > 0) {
                    setPlans(sorted);
                }
            } catch (error) {
                console.error("Failed to load plans", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
    }, []);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const getDiscount = () => {
        return billingPeriod === 'yearly' ? '17% OFF' : null;
    };

    if (loading) {
        return <div className="min-h-[400px] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
    }

    // Default fallback if no plans in DB (optional, but good for dev)
    const effectivePlans = plans.length > 0 ? plans : [];

    return (
        <div className="pt-32 pb-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Planes y Precios
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Elegí el plan perfecto para tu inmobiliaria
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center bg-white rounded-full p-1 shadow-md border border-gray-100">
                        <button
                            onClick={() => setBillingPeriod('monthly')}
                            className={`px-6 py-2 rounded-full transition-all font-medium ${billingPeriod === 'monthly'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Mensual
                        </button>
                        <button
                            onClick={() => setBillingPeriod('yearly')}
                            className={`px-6 py-2 rounded-full transition-all relative font-medium ${billingPeriod === 'yearly'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Anual
                            {getDiscount() && (
                                <span className="absolute -top-3 -right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-bounce">
                                    {getDiscount()}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Plans Grid */}
                {effectivePlans.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
                        <p className="text-lg">No hay planes disponibles en este momento.</p>
                        <p className="text-sm text-gray-400 mt-2">Contacta al administrador para configurar los planes.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        {effectivePlans.map((plan) => {
                            // Map icon string to component, default to Zap
                            const Icon = (plan.icon && iconMap[plan.icon]) ? iconMap[plan.icon] : Zap;
                            const price = billingPeriod === 'monthly' ? plan.price.monthly : plan.price.yearly;
                            const pricePerMonth = billingPeriod === 'yearly' ? price / 12 : price;

                            return (
                                <div
                                    key={plan.id}
                                    className={`relative bg-white rounded-3xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col ${plan.popular ? 'ring-2 ring-indigo-600 scale-[1.02] md:scale-105 z-10' : 'border border-gray-100'
                                        }`}
                                >
                                    {plan.popular && (
                                        <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-bl-xl shadow-sm z-20">
                                            MÁS POPULAR
                                        </div>
                                    )}

                                    <div className="p-8 flex-1 flex flex-col">
                                        {/* Icon */}
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${plan.tier === 'enterprise' ? 'bg-purple-100 text-purple-600' : plan.tier === 'professional' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'}`}>
                                            <Icon className="w-7 h-7" />
                                        </div>

                                        {/* Plan Name */}
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                        <p className="text-gray-500 text-sm mb-6 leading-relaxed min-h-[40px]">{plan.description}</p>

                                        {/* Price */}
                                        <div className="mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-bold text-gray-900 tracking-tight">
                                                    {formatPrice(pricePerMonth)}
                                                </span>
                                                <span className="text-gray-500 font-medium text-sm">/mes</span>
                                            </div>
                                            {billingPeriod === 'yearly' && price > 0 && (
                                                <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                    Facturado {formatPrice(price)} al año
                                                </p>
                                            )}
                                        </div>

                                        {/* CTA Button */}
                                        <button
                                            onClick={() => router.push(`/checkout?plan=${plan.id}&billing=${billingPeriod}`)}
                                            className={`w-full py-4 rounded-xl font-bold transition-all mb-8 shadow-sm ${plan.popular
                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200'
                                                : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-900 hover:bg-gray-50'
                                                }`}
                                        >
                                            {plan.price.monthly === 0 ? 'Comenzar Gratis' : 'Elegir Plan'}
                                        </button>

                                        {/* Divider */}
                                        <div className="border-t border-gray-100 pt-6 mb-4">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">INCLUYE</p>

                                            {/* Limits Summary */}
                                            <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-6 text-sm">
                                                <LimitItem label="Propiedades" value={plan.limits.properties} />
                                                <LimitItem label="Usuarios" value={plan.limits.users} />
                                                <LimitItem label="Clientes" value={plan.limits.clients} />
                                                <LimitItem label="Tasaciones" value={plan.limits.tasaciones} />
                                            </div>
                                        </div>

                                        {/* Features List */}
                                        <ul className="space-y-3 mt-auto">
                                            {Object.entries(plan.features || {}).map(([key, included]) => (
                                                <li key={key} className={`flex items-start gap-3 ${!included ? 'opacity-40 grayscale' : ''}`}>
                                                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${included ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-300'}`}>
                                                        {included ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                                    </div>
                                                    <span className={`text-sm ${included ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                                                        {FEATURE_LABELS[key] || key}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* FAQ or Additional Info */}
                <div className="bg-gradient-to-r from-gray-900 to-indigo-900 rounded-3xl shadow-xl p-8 md:p-12 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                        </svg>
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-2xl md:text-3xl font-bold mb-4">
                            ¿Necesitás una solución a medida?
                        </h3>
                        <p className="text-indigo-200 mb-8 max-w-2xl mx-auto text-lg">
                            Para grandes redes inmobiliarias o franquicias, ofrecemos planes Enterprise con API dedicada, soporte prioritario 24/7 y funcionalidades exclusivas.
                        </p>
                        <button
                            onClick={() => router.push('/contacto')}
                            className="px-8 py-3 bg-white text-indigo-900 rounded-xl hover:bg-indigo-50 transition-colors font-bold shadow-lg"
                        >
                            Contactar Ventas
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LimitItem({ label, value }: { label: string, value: number | 'unlimited' }) {
    if (value === 0) return null; // Don't show if 0? Or show as 0.

    return (
        <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            <span className="text-gray-600">
                {value === 'unlimited' ? 'Ilimitados' : value}
                <span className="text-gray-400 font-normal ml-1">{label}</span>
            </span>
        </div>
    )
}
