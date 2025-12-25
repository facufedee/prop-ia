"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Zap, Building2, Rocket } from "lucide-react";

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
                } else {
                    // Fallback to empty or keep loading false to show "No plans"
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
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
    }

    // Default fallback if no plans in DB (optional, but good for dev)
    const effectivePlans = plans.length > 0 ? plans : [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
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
                    <div className="inline-flex items-center bg-white rounded-full p-1 shadow-md">
                        <button
                            onClick={() => setBillingPeriod('monthly')}
                            className={`px-6 py-2 rounded-full transition-all ${billingPeriod === 'monthly'
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Mensual
                        </button>
                        <button
                            onClick={() => setBillingPeriod('yearly')}
                            className={`px-6 py-2 rounded-full transition-all relative ${billingPeriod === 'yearly'
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Anual
                            {getDiscount() && (
                                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {getDiscount()}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Plans Grid */}
                {effectivePlans.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p>No hay planes disponibles en este momento.</p>
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
                                    className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-transform hover:scale-105 ${plan.popular ? 'ring-2 ring-indigo-600' : ''
                                        }`}
                                >
                                    {plan.popular && (
                                        <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                                            MÁS POPULAR
                                        </div>
                                    )}

                                    <div className="p-8">
                                        {/* Icon */}
                                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                                            <Icon className="w-6 h-6 text-indigo-600" />
                                        </div>

                                        {/* Plan Name */}
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                        <p className="text-gray-600 mb-6">{plan.description}</p>

                                        {/* Price */}
                                        <div className="mb-6">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-bold text-gray-900">
                                                    {formatPrice(pricePerMonth)}
                                                </span>
                                                <span className="text-gray-600">/mes</span>
                                            </div>
                                            {billingPeriod === 'yearly' && price > 0 && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Facturado {formatPrice(price)} anualmente
                                                </p>
                                            )}
                                        </div>

                                        {/* CTA Button */}
                                        <button
                                            onClick={() => router.push(`/checkout?plan=${plan.id}&billing=${billingPeriod}`)}
                                            className={`w-full py-3 rounded-lg font-semibold transition-colors mb-6 ${plan.popular
                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                                }`}
                                        >
                                            {plan.price.monthly === 0 ? 'Comenzar Gratis' : 'Contratar Plan'}
                                        </button>

                                        {/* Features */}
                                        <ul className="space-y-3">
                                            {plan.features.map((feature: any, idx: number) => (
                                                <li key={idx} className="flex items-start gap-3">
                                                    <Check
                                                        className={`w-5 h-5 mt-0.5 flex-shrink-0 ${feature.included ? 'text-green-500' : 'text-gray-300'
                                                            }`}
                                                    />
                                                    <span
                                                        className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'
                                                            }`}
                                                    >
                                                        {feature.name}
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
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        ¿Necesitás algo personalizado?
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Contactanos para planes empresariales a medida con funcionalidades específicas
                    </p>
                    <button className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                        Contactar Ventas
                    </button>
                </div>
            </div>
        </div>
    );
}
