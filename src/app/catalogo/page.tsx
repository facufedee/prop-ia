"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Zap, Building2, Rocket } from "lucide-react";

export default function CatalogoPage() {
    const router = useRouter();
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

    const plans = [
        {
            id: 'free',
            name: 'Gratis',
            tier: 'free',
            description: 'Perfecto para empezar',
            icon: Zap,
            price: {
                monthly: 0,
                yearly: 0,
            },
            features: [
                { name: 'Hasta 5 propiedades', included: true },
                { name: '10 tasaciones por mes', included: true },
                { name: '1 usuario', included: true },
                { name: '1GB de almacenamiento', included: true },
                { name: 'Soporte por email', included: true },
                { name: 'Publicación manual', included: true },
                { name: 'Chat Prop-IA básico', included: false },
                { name: 'API access', included: false },
                { name: 'Reportes avanzados', included: false },
            ],
            popular: false,
        },
        {
            id: 'professional',
            name: 'Profesional',
            tier: 'professional',
            description: 'Para agentes y pequeñas inmobiliarias',
            icon: Building2,
            price: {
                monthly: 29900,
                yearly: 299000,
            },
            features: [
                { name: 'Hasta 50 propiedades', included: true },
                { name: 'Tasaciones ilimitadas', included: true },
                { name: 'Hasta 3 usuarios', included: true },
                { name: '50GB de almacenamiento', included: true },
                { name: 'Soporte prioritario', included: true },
                { name: 'Publicación automática', included: true },
                { name: '500 créditos IA/mes', included: true },
                { name: 'Reportes avanzados', included: true },
                { name: 'API access', included: false },
            ],
            popular: true,
        },
        {
            id: 'enterprise',
            name: 'Empresarial',
            tier: 'enterprise',
            description: 'Para grandes inmobiliarias',
            icon: Rocket,
            price: {
                monthly: 79900,
                yearly: 799000,
            },
            features: [
                { name: 'Propiedades ilimitadas', included: true },
                { name: 'Tasaciones ilimitadas', included: true },
                { name: 'Usuarios ilimitados', included: true },
                { name: 'Almacenamiento ilimitado', included: true },
                { name: 'Soporte 24/7', included: true },
                { name: 'Publicación automática', included: true },
                { name: 'Créditos IA ilimitados', included: true },
                { name: 'Reportes avanzados', included: true },
                { name: 'API access completo', included: true },
                { name: 'White-label', included: true },
                { name: 'Onboarding personalizado', included: true },
            ],
            popular: false,
        },
    ];

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {plans.map((plan) => {
                        const Icon = plan.icon;
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
                                        {plan.features.map((feature, idx) => (
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
