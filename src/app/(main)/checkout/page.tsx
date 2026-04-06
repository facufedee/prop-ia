"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Check, CreditCard, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/infrastructure/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

type Billing = 'monthly' | 'quarterly' | 'yearly';
type PaymentMethod = 'mercadopago' | 'transfer';

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const planId = searchParams.get("plan");
    const billingParam = searchParams.get("billing") as Billing | null;

    const [currentUser, setCurrentUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [isPendingPayment, setIsPendingPayment] = useState(false);
    const [submittingPayment, setSubmittingPayment] = useState(false);

    const [loading, setLoading] = useState(true);
    const [planData, setPlanData] = useState<any>(null);
    const [billing, setBilling] = useState<Billing>(billingParam || 'monthly');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mercadopago');

    // Suscripción activa y crédito por prorrata
    const [currentSubscription, setCurrentSubscription] = useState<any>(null);
    const [prorationCredit, setProrationCredit] = useState(0);

    // MP state
    const [mpInitPoint, setMpInitPoint] = useState<string | null>(null);
    const [mpLoading, setMpLoading] = useState(false);
    const [mpError, setMpError] = useState<string | null>(null);
    const preferenceCache = useRef<Record<string, string>>({});


    // Auth listener + fetch active subscription
    useEffect(() => {
        if (!auth) { setAuthLoading(false); return; }
        const unsub = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists() && userDoc.data().pendingPaymentApproval) {
                        setIsPendingPayment(true);
                    }
                } catch {}

                // Fetch active subscription for proration
                try {
                    const { subscriptionService } = await import("@/infrastructure/services/subscriptionService");
                    const sub = await subscriptionService.getUserSubscription(user.uid);
                    if (sub && sub.status === 'active') {
                        setCurrentSubscription(sub);
                    }
                } catch {}
            }
            setAuthLoading(false);
        });
        return () => unsub();
    }, []);

    // Fetch plan data
    useEffect(() => {
        if (!planId) return;
        const fetchPlan = async () => {
            try {
                const { subscriptionService } = await import("@/infrastructure/services/subscriptionService");
                const plan = await subscriptionService.getPlanById(planId);
                setPlanData(plan);
            } catch (err) {
                console.error("Error fetching plan:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlan();
    }, [planId]);

    // Calcular crédito por días no usados de la suscripción actual
    useEffect(() => {
        if (!currentSubscription || !planData) { setProrationCredit(0); return; }
        // No aplicar crédito si es el mismo plan
        if (currentSubscription.planId === planId) { setProrationCredit(0); return; }

        const now = new Date();
        const end = currentSubscription.endDate instanceof Date
            ? currentSubscription.endDate
            : currentSubscription.endDate?.toDate?.() || new Date();
        const start = currentSubscription.startDate instanceof Date
            ? currentSubscription.startDate
            : currentSubscription.startDate?.toDate?.() || new Date();

        if (now >= end) { setProrationCredit(0); return; }

        const totalMs = end.getTime() - start.getTime();
        const remainingMs = end.getTime() - now.getTime();
        if (totalMs <= 0) { setProrationCredit(0); return; }

        const credit = Math.round((remainingMs / totalMs) * (currentSubscription.amount || 0));
        setProrationCredit(Math.max(0, credit));
    }, [currentSubscription, planId, planData]);

    // Create MP preference when method = mercadopago
    useEffect(() => {
        if (paymentMethod !== 'mercadopago' || !planId || !currentUser?.uid || !planData) return;

        const cacheKey = `${planId}-${billing}-${prorationCredit}`;
        if (preferenceCache.current[cacheKey]) {
            setMpInitPoint(preferenceCache.current[cacheKey]);
            return;
        }

        setMpLoading(true);
        setMpError(null);
        setMpInitPoint(null);

        (async () => {
            try {
                const token = await currentUser.getIdToken();
                const res = await fetch('/api/payments/create-preference', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ planId, billing, creditAmount: prorationCredit }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
                const url: string | undefined = data.checkout_url;
                if (url) {
                    preferenceCache.current[cacheKey] = url;
                    setMpInitPoint(url);
                } else {
                    setMpError("No se pudo inicializar el pago. Intentá con transferencia.");
                }
            } catch (err: any) {
                console.error('❌ create-preference error:', err.message);
                setMpError(`Error: ${err.message}`);
            } finally {
                setMpLoading(false);
            }
        })();
    }, [paymentMethod, planId, billing, currentUser?.uid, planData, prorationCredit]);

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);

    const getFinalPrice = () => Math.max(getPrice() - prorationCredit, 1);

    const getQuarterlyPrice = () => {
        if (!planData) return 0;
        return planData.price.quarterly ?? Math.round(planData.price.yearly / 4);
    };

    const getPrice = () => {
        if (!planData) return 0;
        if (billing === 'yearly') return planData.price.yearly;
        if (billing === 'quarterly') return getQuarterlyPrice();
        return planData.price.monthly;
    };

    const getMonthlyEquivalent = () => {
        if (!planData) return 0;
        if (billing === 'quarterly') return Math.round(getQuarterlyPrice() / 3);
        if (billing === 'yearly') return Math.round(planData.price.yearly / 12);
        return planData.price.monthly;
    };

    const getSavingsLabel = () => {
        if (!planData) return null;
        const monthly = planData.price.monthly;
        if (billing === 'quarterly') {
            const saving = Math.round((1 - getMonthlyEquivalent() / monthly) * 100);
            return saving > 0 ? `Ahorrás ${saving}% vs mensual` : null;
        }
        if (billing === 'yearly') {
            const saving = Math.round((1 - getMonthlyEquivalent() / monthly) * 100);
            return saving > 0 ? `Ahorrás ${saving}% — equivale a 2 meses gratis` : null;
        }
        return null;
    };

    const handleTransferSubmit = async () => {
        if (!currentUser?.uid) return;
        try {
            setSubmittingPayment(true);
            const { subscriptionService } = await import("@/infrastructure/services/subscriptionService");
            await subscriptionService.setPendingPaymentApproval(currentUser.uid, true);

            const { notificationService } = await import("@/infrastructure/services/notificationService");
            await notificationService.createNotification(
                "Nuevo Comprobante de Pago",
                `El usuario ${currentUser.email || 'desconocido'} ha enviado un comprobante y aguarda aprobación.`,
                "warning",
                "Administrador",
                `/dashboard/gestion-plataforma/${currentUser.uid}`
            );

            try {
                await fetch('/api/notifications/trigger', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event: 'newPayment',
                        data: { uid: currentUser.uid, email: currentUser.email, planId, billing },
                        subject: 'Nuevo comprobante de pago enviado',
                        message: `El usuario <strong>${currentUser.email}</strong> envió comprobante y aguarda aprobación.`
                    })
                });
            } catch {}

            setIsPendingPayment(true);
            window.open("https://wa.me/5491123889745?text=Hola!%20Realicé%20una%20transferencia%20para%20el%20plan%20de%20suscripción.%20Adjunto%20el%20comprobante.", "_blank");
            router.push("/dashboard");
        } catch (error) {
            console.error("Error setting pending payment:", error);
        } finally {
            setSubmittingPayment(false);
        }
    };

    if (!planId) {
        return (
            <div className="text-center py-20">
                <p>Plan no especificado.</p>
                <Link href="/precios" className="text-indigo-600 hover:underline">Volver a planes</Link>
            </div>
        );
    }

    const billingOptions: { value: Billing; label: string; badge?: string }[] = [
        { value: 'monthly', label: 'Mensual' },
        { value: 'quarterly', label: '3 Meses', badge: 'Popular' },
        { value: 'yearly', label: 'Anual', badge: '-17%' },
    ];

    const savingsLabel = getSavingsLabel();

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 md:px-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <Link href="/precios" className="text-sm text-gray-500 hover:text-gray-900 mb-2 inline-block">
                        ← Volver a planes
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Finalizar Suscripción</h1>
                    <p className="text-gray-500 mt-1">Revisá tu plan y completá el pago</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">

                    {/* LEFT — Plan details */}
                    <div className="lg:col-span-7 space-y-6">
                        {planData && (
                            <>
                                {/* User */}
                                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold text-gray-900">Tus Datos</h2>
                                        {currentUser && (
                                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                                                Verificado
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                            {currentUser?.displayName?.[0]?.toUpperCase() ?? currentUser?.email?.[0]?.toUpperCase() ?? 'U'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{currentUser?.displayName || "Usuario"}</p>
                                            <p className="text-sm text-gray-500">{currentUser?.email}</p>
                                        </div>
                                    </div>
                                </section>

                                {/* Plan */}
                                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalle del Plan</h2>
                                    <div className="mb-6 pb-6 border-b border-gray-100">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">{planData.name}</h3>
                                                <p className="text-gray-500 mt-1">{planData.description}</p>
                                            </div>
                                            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                                                {billing === 'monthly' ? 'Mensual' : billing === 'quarterly' ? '3 Meses' : 'Anual'}
                                            </span>
                                        </div>
                                    </div>
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Incluye</h4>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {[
                                            { label: 'Propiedades', value: planData.limits.properties === 'unlimited' ? 'Ilimitadas' : `${planData.limits.properties} activas` },
                                            { label: 'Usuarios', value: planData.limits.users === 'unlimited' ? 'Ilimitados' : `${planData.limits.users} miembros` },
                                            { label: 'Soporte', value: 'Prioritario 24/7' },
                                            { label: 'Actualizaciones', value: 'Automáticas' },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                                                <div className="p-1 bg-green-100 rounded-full flex-shrink-0">
                                                    <Check className="w-4 h-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{label}</p>
                                                    <p className="text-sm text-gray-500">{value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </>
                        )}
                    </div>

                    {/* RIGHT — Payment */}
                    <div className="lg:col-span-5">
                        {isPendingPayment ? (
                            <div className="bg-green-50 rounded-2xl shadow-xl border border-green-200 p-8 text-center space-y-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                    <Check className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-green-900">Pago en verificación</h3>
                                <p className="text-green-800 font-medium">
                                    Estamos habilitando tu cuenta con el plan elegido.
                                </p>
                                <p className="text-sm text-green-700">
                                    Te avisamos por aquí y por WhatsApp en menos de 10 minutos.
                                </p>
                            </div>
                        ) : planData && (
                            <div className="sticky top-8 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                <div className="p-6 space-y-6">

                                    {/* 1. Billing period */}
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-3">Período de facturación</p>
                                        <div className="flex p-1 bg-gray-100 rounded-xl gap-1">
                                            {billingOptions.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => { setBilling(opt.value); setMpInitPoint(null); }}
                                                    className={`flex-1 py-2.5 px-2 rounded-lg text-sm font-bold transition-all flex flex-col items-center gap-0.5 ${billing === opt.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                                                >
                                                    {opt.label}
                                                    {opt.badge && (
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${opt.value === 'quarterly' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                                                            {opt.badge}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 2. Price */}
                                    <div className="py-4 bg-gray-50 rounded-xl border border-gray-100 px-4 space-y-2">
                                        {prorationCredit > 0 ? (
                                            <>
                                                <div className="flex justify-between text-sm text-gray-500">
                                                    <span>Precio del plan</span>
                                                    <span>{formatPrice(getPrice())}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-green-700 font-semibold">
                                                    <span>Crédito por días no usados</span>
                                                    <span>− {formatPrice(prorationCredit)}</span>
                                                </div>
                                                <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                                                    <p className="text-xs text-gray-400">Total a pagar</p>
                                                    <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{formatPrice(getFinalPrice())}</p>
                                                </div>
                                                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800 leading-relaxed">
                                                    Tu suscripción actual tiene días sin usar. Ese valor se descuenta automáticamente del nuevo plan — solo pagás la diferencia.
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-xs text-gray-400 text-center">Total a pagar</p>
                                                <p className="text-4xl font-extrabold text-gray-900 tracking-tight text-center">
                                                    {formatPrice(getPrice())}
                                                </p>
                                                <p className="text-sm text-gray-400 text-center">
                                                    {billing === 'monthly' && 'por mes'}
                                                    {billing === 'quarterly' && `por 3 meses · ${formatPrice(getMonthlyEquivalent())}/mes`}
                                                    {billing === 'yearly' && `por año · ${formatPrice(getMonthlyEquivalent())}/mes`}
                                                </p>
                                                {savingsLabel && (
                                                    <div className="flex justify-center">
                                                        <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
                                                            🎉 {savingsLabel}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* 3. Payment method selector */}
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-3">Método de pago</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => setPaymentMethod('mercadopago')}
                                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${paymentMethod === 'mercadopago' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                            >
                                                <CreditCard className="w-5 h-5" />
                                                Tarjeta / MP
                                            </button>
                                            <button
                                                onClick={() => setPaymentMethod('transfer')}
                                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${paymentMethod === 'transfer' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                            >
                                                <ArrowRightLeft className="w-5 h-5" />
                                                Transferencia
                                            </button>
                                        </div>
                                    </div>

                                    {/* 4. Payment form */}
                                    <div className="pt-2 border-t border-gray-100">
                                        {paymentMethod === 'mercadopago' ? (
                                            <div className="space-y-4">
                                                {authLoading && (
                                                    <div className="flex items-center justify-center py-8 gap-3 text-sm text-gray-500">
                                                        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                                                        Verificando sesión...
                                                    </div>
                                                )}
                                                {!authLoading && !currentUser && (
                                                    <div className="text-center py-4 space-y-3">
                                                        <p className="text-sm text-gray-500">Necesitás iniciar sesión para continuar.</p>
                                                        <Link href={`/login?redirect=/checkout?plan=${planId}&billing=${billing}`} className="inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500 transition-colors">
                                                            Iniciar sesión
                                                        </Link>
                                                    </div>
                                                )}
                                                {!authLoading && currentUser && mpLoading && (
                                                    <div className="flex items-center justify-center py-8 gap-3 text-sm text-gray-500">
                                                        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                                                        Preparando el pago...
                                                    </div>
                                                )}
                                                {!authLoading && currentUser && mpError && (
                                                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">
                                                        {mpError}
                                                    </div>
                                                )}
                                                {!authLoading && currentUser && !mpLoading && !mpError && mpInitPoint && (
                                                    <>
                                                        <p className="text-sm text-gray-500 text-center">
                                                            Vas a ser redirigido al sitio seguro de Mercado Pago para completar el pago.
                                                        </p>
                                                        <a
                                                            href={mpInitPoint}
                                                            className="w-full py-3.5 bg-[#009ee3] hover:bg-[#007eb5] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                                                        >
                                                            <CreditCard className="w-5 h-5" />
                                                            Pagar con Mercado Pago
                                                        </a>
                                                        <p className="text-xs text-gray-400 text-center">
                                                            Podés pagar con tarjeta, débito o dinero en cuenta de MP
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm">
                                                    <p className="font-semibold text-blue-900 mb-2">Datos para transferir:</p>
                                                    <div className="space-y-1 text-gray-700">
                                                        <div className="flex justify-between">
                                                            <span>CUIL:</span>
                                                            <span className="font-mono font-medium">20-35163401-5</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Alias:</span>
                                                            <span className="font-bold text-indigo-600">ZETAPROP</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Monto:</span>
                                                            <span className="font-bold text-gray-900">{formatPrice(getPrice())}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-500 text-center">
                                                    Después de transferir, hacé clic abajo y envianos el comprobante por WhatsApp.
                                                </p>
                                                <button
                                                    onClick={handleTransferSubmit}
                                                    disabled={submittingPayment}
                                                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                                                >
                                                    {submittingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Comprobante por WhatsApp'}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                        Pago protegido con cifrado SSL
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
