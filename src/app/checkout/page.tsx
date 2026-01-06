"use client";

import { useEffect, useState, Suspense, useRef } from "react";
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

    // Cache for Mercado Pago preferences to avoid re-fetching
    const preferenceCache = useRef<Record<string, string>>({});

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

    // Create Mercado Pago preference (Current selection)
    useEffect(() => {
        if (!planId || paymentMethod !== 'mercadopago') return;

        // Wait for auth to initialize
        if (authLoading) return;

        if (!currentUser?.uid) {
            setError("Debes iniciar sesión para continuar");
            return;
        }

        const cacheKey = `${planId}-${billing}-${currentUser.uid}`;
        if (preferenceCache.current[cacheKey]) {
            setPreferenceId(preferenceCache.current[cacheKey]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const createPreference = async () => {
            try {
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
                    preferenceCache.current[cacheKey] = data.preference_id;
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

    // Prefetch alternate billing cycle preference
    useEffect(() => {
        if (!planId || !currentUser?.uid || authLoading) return;

        const prefetchAlternate = async () => {
            const alternateBilling = billing === 'monthly' ? 'yearly' : 'monthly';
            const cacheKey = `${planId}-${alternateBilling}-${currentUser.uid}`;

            // If already cached, skip
            if (preferenceCache.current[cacheKey]) return;

            try {
                const response = await fetch("/api/payments/create-preference", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        planId,
                        billing: alternateBilling,
                        userId: currentUser.uid
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.preference_id) {
                        // Store in cache silently
                        preferenceCache.current[cacheKey] = data.preference_id;
                        console.log(`Prefetched ${alternateBilling} preference`);
                    }
                }
            } catch (err) {
                // Silently fail prefetch
                console.warn("Prefetch failed", err);
            }
        };

        // Small delay to prioritize main fetch
        const timer = setTimeout(prefetchAlternate, 1000);
        return () => clearTimeout(timer);
    }, [planId, billing, currentUser, authLoading]);

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
        <div className="min-h-screen bg-gray-50 py-12 px-4 md:px-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <Link href="/precios" className="text-sm text-gray-500 hover:text-gray-900 mb-2 inline-block">
                            ← Volver a planes
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Finalizar Suscripción</h1>
                        <p className="text-gray-500 mt-1">Revisá tu plan y completá el pago</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* LEFT COLUMN - CONTEXT (User + Plan Details) */}
                    <div className="lg:col-span-7 space-y-6">
                        {planData && (
                            <>
                                {/* 1. User Details */}
                                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold text-gray-900">Tus Datos</h2>
                                        <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                                            Verificado
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                            {currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : (currentUser?.email ? currentUser.email[0].toUpperCase() : 'U')}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900 leading-tight">
                                                {currentUser?.displayName || "Usuario"}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {currentUser?.email}
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                {/* 2. Plan Features (Moved from Right) */}
                                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalle del Plan</h2>

                                    <div className="mb-6 pb-6 border-b border-gray-100">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">{planData.name}</h3>
                                                <p className="text-gray-500 mt-1">{planData.description}</p>
                                            </div>
                                            <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                                                {billing === 'monthly' ? 'Mensual' : 'Anual'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Incluye</h4>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {/* Standard Features */}
                                            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                                                <div className="p-1 bg-green-100 rounded-full">
                                                    <Check className="w-4 h-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">Propiedades</p>
                                                    <p className="text-sm text-gray-500">
                                                        {planData.limits.properties === 'unlimited' ? 'Ilimitadas' : `${planData.limits.properties} activas`}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                                                <div className="p-1 bg-green-100 rounded-full">
                                                    <Check className="w-4 h-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">Usuarios</p>
                                                    <p className="text-sm text-gray-500">
                                                        {planData.limits.users === 'unlimited' ? 'Ilimitados' : `${planData.limits.users} miembros`}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Decorative Extra Features just to fill space comfortably */}
                                            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                                                <div className="p-1 bg-green-100 rounded-full">
                                                    <Check className="w-4 h-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">Soporte</p>
                                                    <p className="text-sm text-gray-500">Prioritario 24/7</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                                                <div className="p-1 bg-green-100 rounded-full">
                                                    <Check className="w-4 h-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">Actualizaciones</p>
                                                    <p className="text-sm text-gray-500">Automáticas</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </>
                        )}
                    </div>

                    {/* RIGHT COLUMN - CONTROL CENTER (Sticky) */}
                    <div className="lg:col-span-5">
                        {planData && (
                            <div className="sticky top-8 space-y-4">
                                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                    <div className="p-6 space-y-6">

                                        {/* 1. Billing Cycle Toggle */}
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700 mb-3 block">Período de facturación</p>
                                            <div className="flex p-1 bg-gray-100 rounded-xl">
                                                <button
                                                    onClick={() => setBilling('monthly')}
                                                    className={`flex-1 py-3 px-4 rounded-lg text-base font-bold transition-all ${billing === 'monthly'
                                                        ? 'bg-white text-gray-900 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-900'
                                                        }`}
                                                >
                                                    Mensual
                                                </button>
                                                <button
                                                    onClick={() => setBilling('yearly')}
                                                    className={`flex-1 py-3 px-4 rounded-lg text-base font-bold transition-all flex items-center justify-center gap-2 ${billing === 'yearly'
                                                        ? 'bg-white text-gray-900 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-900'
                                                        }`}
                                                >
                                                    Anual
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-extrabold bg-green-100 text-green-700 border border-green-200">
                                                        -17%
                                                    </span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* 2. Price Display */}
                                        <div className="text-center py-4 bg-gray-50 rounded-xl border border-gray-100 dashed">
                                            <p className="text-sm text-gray-500 mb-1">Total a pagar ahora</p>
                                            <p className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-baseline justify-center gap-1">
                                                {formatPrice(getPrice())}
                                                <span className="text-lg text-gray-400 font-medium">
                                                    /{billing === 'monthly' ? 'mes' : 'año'}
                                                </span>
                                            </p>
                                            {billing === 'yearly' && (
                                                <div className="mt-2 inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
                                                    <span>🎉</span>
                                                    Ahorrás un 17% (2 meses off)
                                                </div>
                                            )}
                                        </div>

                                        {/* 3. Payment Method Selector */}
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700 mb-3">Tu método de pago</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => setPaymentMethod('mercadopago')}
                                                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center ${paymentMethod === 'mercadopago'
                                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                                        }`}
                                                >
                                                    <CreditCard className="w-5 h-5 mb-1" />
                                                    <span className="text-xs font-bold">Mercado Pago</span>
                                                </button>

                                                <button
                                                    onClick={() => setPaymentMethod('transfer')}
                                                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center ${paymentMethod === 'transfer'
                                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                                        }`}
                                                >
                                                    <Building2 className="w-5 h-5 mb-1" />
                                                    <span className="text-xs font-bold">Transferencia</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* 4. Payment Action Area */}
                                        <div className="pt-2 border-t border-gray-100">
                                            {paymentMethod === 'mercadopago' ? (
                                                <div className="mt-4">
                                                    {loading ? (
                                                        <button disabled className="w-full py-4 bg-gray-100 text-gray-400 rounded-xl font-bold flex items-center justify-center gap-2">
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            Cargando...
                                                        </button>
                                                    ) : error ? (
                                                        <div className="text-center p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                                                            {error}
                                                        </div>
                                                    ) : preferenceId ? (
                                                        <div className="animate-in fade-in zoom-in-95 duration-300">
                                                            <PaymentWallet preferenceId={preferenceId} />
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <div className="mt-4 space-y-4">
                                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm">
                                                        <p className="font-semibold text-blue-900 mb-2">Datos para transferir:</p>
                                                        <div className="space-y-1 text-gray-700">
                                                            <div className="flex justify-between">
                                                                <span>CBU:</span>
                                                                <span className="font-mono font-medium">0720086188000037816940</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Alias:</span>
                                                                <span className="font-bold text-indigo-600">FACU.FEDE.ROJO</span>
                                                            </div>
                                                            <div className="flex justify-between mt-2 pt-2 border-t border-blue-100">
                                                                <span>Banco:</span>
                                                                <span>Santander</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <a
                                                        href="https://wa.me/5491124000769?text=Hola!%20Realicé%20una%20transferencia%20para%20el%20plan%20de%20suscripción.%20Adjunto%20el%20comprobante."
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                                                    >
                                                        <span>Enviar Comprobante</span>
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        {/* Security Footer */}
                                        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 mt-2">
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                Pago Encriptado SSL
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
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
