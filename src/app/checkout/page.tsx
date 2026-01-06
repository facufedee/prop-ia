"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PaymentWallet from "@/ui/components/pricing/PaymentWallet";
import { Loader2, CreditCard, Building2, Check } from "lucide-react";
import Link from "next/link";
import { auth } from "@/infrastructure/firebase/client";
import { onAuthStateChanged } from "firebase/auth";

function CheckoutContent() {
    const searchParams = useSearchParams();
    const planId = searchParams.get("plan");
    const billingParam = searchParams.get("billing"); // monthly | yearly
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);

    const [preferenceId, setPreferenceId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [planData, setPlanData] = useState<any>(null);
    const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'transfer'>('mercadopago');
    const [billing, setBilling] = useState<'monthly' | 'yearly'>(billingParam as 'monthly' | 'yearly' || 'monthly');

    // Listen to auth state
    useEffect(() => {
        if (!auth) {
            setAuthLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Fetch plan data
    useEffect(() => {
        if (!planId) return;

        const fetchPlanData = async () => {
            try {
                const { subscriptionService } = await import("@/infrastructure/services/subscriptionService");
                const plan = await subscriptionService.getPlanById(planId);
                setPlanData(plan);
            } catch (err) {
                console.error("Error fetching plan:", err);
            }
        };

        fetchPlanData();
    }, [planId]);

    // Create Mercado Pago preference
    useEffect(() => {
        if (!planId || paymentMethod !== 'mercadopago') return;

        // Wait for auth to initialize
        if (authLoading) return;

        setLoading(true);
        const createPreference = async () => {
            try {
                if (!currentUser?.uid) {
                    setError("Debes iniciar sesión para continuar");
                    setLoading(false);
                    return;
                }

                // Clear any previous errors
                setError(null);

                const response = await fetch("/api/payments/create-preference", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        planId,
                        billing,
                        userId: currentUser.uid
                    })
                });

                if (!response.ok) throw new Error("Error creating payment preference");

                const data = await response.json();
                if (data.preference_id) {
                    setPreferenceId(data.preference_id);
                }
            } catch (err) {
                console.error(err);
                setError("No se pudo iniciar el pago. Intenta nuevamente.");
            } finally {
                setLoading(false);
            }
        };

        createPreference();
    }, [planId, billing, paymentMethod, authLoading, currentUser]);

    // Format price
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const getPrice = () => {
        if (!planData) return 0;
        return billing === 'monthly' ? planData.price.monthly : planData.price.yearly;
    };

    const getPricePerMonth = () => {
        const price = getPrice();
        return billing === 'yearly' ? price / 12 : price;
    };

    if (!planId) {
        return (
            <div className="text-center py-20">
                <p>Plan no especificado.</p>
                <Link href="/precios" className="text-indigo-600 hover:underline">
                    Volver a planes
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
                        <h1 className="text-3xl font-bold mb-2">Checkout Seguro</h1>
                        <p className="text-indigo-100">Completá tu suscripción de forma segura</p>
                    </div>

                    <div className="p-8">
                        {/* Plan Details */}
                        {planData && (
                            <div className="mb-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Check className="w-5 h-5 text-indigo-600" />
                                    Resumen de tu plan
                                </h2>

                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Plan seleccionado</p>
                                        <p className="text-xl font-bold text-gray-900">{planData.name}</p>
                                        <p className="text-sm text-gray-600 mt-1">{planData.description}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Precio</p>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-3xl font-bold text-indigo-600">
                                                {formatPrice(getPricePerMonth())}
                                            </p>
                                            <span className="text-gray-500">/mes</span>
                                        </div>
                                        {billing === 'yearly' && (
                                            <p className="text-sm text-green-600 font-medium mt-1">
                                                💰 Facturado {formatPrice(getPrice())} al año
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-2 capitalize">
                                            Facturación: {billing === 'monthly' ? 'Mensual' : 'Anual'}
                                        </p>
                                    </div>
                                </div>

                                {/* Billing Period Toggle - Inside Plan Summary */}
                                <div className="mb-4 pb-4 border-b border-indigo-200">
                                    <p className="text-sm font-semibold text-gray-700 mb-3">Período de facturación</p>
                                    <div className="inline-flex items-center bg-white rounded-xl p-1 shadow-sm border border-indigo-200">
                                        <button
                                            onClick={() => setBilling('monthly')}
                                            className={`px-6 py-2.5 rounded-lg transition-all font-medium text-sm ${billing === 'monthly'
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                        >
                                            Mensual
                                        </button>
                                        <button
                                            onClick={() => setBilling('yearly')}
                                            className={`px-6 py-2.5 rounded-lg transition-all relative font-medium text-sm ${billing === 'yearly'
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                        >
                                            Anual
                                            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                17% OFF
                                            </span>
                                        </button>
                                    </div>
                                    {billing === 'yearly' && (
                                        <p className="text-sm text-green-600 font-medium mt-2 flex items-center gap-1">
                                            <span>🎉</span>
                                            ¡Ahorrás 2 meses! Pagás 10 y usás 12
                                        </p>
                                    )}
                                </div>

                                {/* Plan Features Preview */}
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Incluye:</p>
                                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                                        <div className="flex items-center gap-1">
                                            <Check className="w-4 h-4 text-green-600" />
                                            <span>{planData.limits.properties === 'unlimited' ? 'Propiedades ilimitadas' : `${planData.limits.properties} propiedades`}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Check className="w-4 h-4 text-green-600" />
                                            <span>{planData.limits.users === 'unlimited' ? 'Usuarios ilimitados' : `${planData.limits.users} usuarios`}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment Method Selection */}
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Método de pago</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => setPaymentMethod('mercadopago')}
                                    className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'mercadopago'
                                        ? 'border-indigo-600 bg-indigo-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <CreditCard className={`w-5 h-5 ${paymentMethod === 'mercadopago' ? 'text-indigo-600' : 'text-gray-400'}`} />
                                        <div className="text-left">
                                            <p className="font-semibold text-gray-900">Mercado Pago</p>
                                            <p className="text-xs text-gray-500">Tarjeta, débito o efectivo</p>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setPaymentMethod('transfer')}
                                    className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'transfer'
                                        ? 'border-indigo-600 bg-indigo-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Building2 className={`w-5 h-5 ${paymentMethod === 'transfer' ? 'text-indigo-600' : 'text-gray-400'}`} />
                                        <div className="text-left">
                                            <p className="font-semibold text-gray-900">Transferencia</p>
                                            <p className="text-xs text-gray-500">Bancaria o billetera virtual</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Payment Content */}
                        {paymentMethod === 'mercadopago' ? (
                            <div className="mt-8">
                                {loading && (
                                    <div className="flex flex-col items-center justify-center py-10">
                                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                                        <p className="text-sm text-gray-500">Preparando pago...</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center mb-6">
                                        {error}
                                    </div>
                                )}

                                {preferenceId && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <PaymentWallet preferenceId={preferenceId} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                    Datos para transferencia
                                </h3>

                                <div className="grid md:grid-cols-2 gap-4 mb-6">
                                    {/* Left Column */}
                                    <div className="space-y-4">
                                        <div className="bg-white p-4 rounded-xl border border-blue-100">
                                            <p className="text-xs text-gray-500 mb-1">Titular</p>
                                            <p className="font-semibold text-gray-900">Facundo Federico Flores Zamorano</p>
                                            <p className="text-xs text-gray-500 mt-1">CUIT: 20-35163401-5</p>
                                        </div>

                                        <div className="bg-white p-4 rounded-xl border border-blue-100">
                                            <p className="text-xs text-gray-500 mb-1">Banco</p>
                                            <p className="font-semibold text-gray-900">Santander</p>
                                            <p className="text-xs text-gray-500 mt-1">Cuenta única</p>
                                        </div>

                                        <div className="bg-white p-4 rounded-xl border border-blue-100">
                                            <p className="text-xs text-gray-500 mb-1">Sucursal</p>
                                            <p className="font-semibold text-gray-900">086 - ALTO DEL TALAR</p>
                                            <p className="text-xs text-gray-500 mt-1">Cuenta: 086-378169/4</p>
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-4">
                                        <div className="bg-white p-4 rounded-xl border border-blue-100">
                                            <p className="text-xs text-gray-500 mb-1">CBU</p>
                                            <p className="font-mono font-semibold text-gray-900 text-sm">0720086188000037816940</p>
                                        </div>

                                        <div className="bg-white p-4 rounded-xl border border-blue-100">
                                            <p className="text-xs text-gray-500 mb-1">Alias</p>
                                            <p className="font-mono font-semibold text-indigo-600 text-lg">FACU.FEDE.ROJO</p>
                                        </div>

                                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-200">
                                            <p className="text-xs text-gray-500 mb-1">Monto a transferir</p>
                                            <p className="text-3xl font-bold text-indigo-600">
                                                {planData && formatPrice(getPrice())}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                                    <p className="text-sm font-semibold text-yellow-900 mb-2">📋 Instrucciones:</p>
                                    <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                                        <li>Realizá la transferencia por el monto indicado</li>
                                        <li>Enviá el comprobante por WhatsApp al +54 9 11 2400 0769</li>
                                        <li>Incluí tu email registrado en el mensaje</li>
                                        <li>Tu suscripción se activará en 24-48hs hábiles</li>
                                    </ol>
                                </div>

                                <a
                                    href="https://wa.me/5491124000769?text=Hola!%20Realicé%20una%20transferencia%20para%20el%20plan%20de%20suscripción.%20Adjunto%20el%20comprobante."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full py-4 bg-green-600 text-white text-center rounded-xl font-bold hover:bg-green-700 transition-colors"
                                >
                                    📱 Enviar comprobante por WhatsApp
                                </a>
                            </div>
                        )}

                        {/* Back Link */}
                        <div className="mt-8 text-center">
                            <Link href="/precios" className="text-sm text-gray-400 hover:text-gray-600">
                                ← Volver a planes
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <CheckoutContent />
        </Suspense>
    );
}
