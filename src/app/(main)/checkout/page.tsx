"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PaymentBrick from "@/ui/components/pricing/PaymentBrick";
import { Loader2, CreditCard, Building2, Check } from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/infrastructure/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const planId = searchParams.get("plan");
    const billingParam = searchParams.get("billing"); // monthly | yearly
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [isPendingPayment, setIsPendingPayment] = useState(false);
    const [submittingPayment, setSubmittingPayment] = useState(false);

    const [preferenceId, setPreferenceId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [planData, setPlanData] = useState<any>(null);
    const [paymentMethod, setPaymentMethod] = useState<'transfer'>('transfer');
    const [billing, setBilling] = useState<'monthly' | 'yearly'>(billingParam as 'monthly' | 'yearly' || 'monthly');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [mpConfig, setMpConfig] = useState<{ publicKey: string | null; activeMode: string | null }>({
        publicKey: null,
        activeMode: null
    });

    // Fetch public MP config
    useEffect(() => {
        fetch('/api/config/mercadopago/public')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setMpConfig(data);
                }
            })
            .catch(err => console.error("Error loading public MP config:", err));
    }, []);

    // Cache for Mercado Pago preferences to avoid re-fetching
    const preferenceCache = useRef<Record<string, string>>({});

    // Listen to auth state and fetch user details
    useEffect(() => {
        if (!auth) {
            setAuthLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists() && userDoc.data().pendingPaymentApproval) {
                        setIsPendingPayment(true);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            }
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

    // MP disabled: direct transfer only

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
                                        {currentUser && (
                                            <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                                                Verificado
                                            </div>
                                        )}
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
                        {isPendingPayment ? (
                            <div className="sticky top-8 space-y-4">
                                <div className="bg-green-50 rounded-2xl shadow-xl border border-green-200 overflow-hidden">
                                    <div className="p-8 space-y-6 text-center">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Check className="w-8 h-8 text-green-600" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-green-900">Pago en verificación</h3>
                                        <p className="text-green-800 font-medium">
                                            Estamos trabajando para habilitarle el sistema con las características solicitadas.
                                        </p>
                                        <p className="text-sm text-green-700">
                                            Le avisaremos por aquí y por WhatsApp una vez que esté finalizado (como mucho en 10 minutos ya podrá volver a acceder y usar el sistema).
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : planData && (
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

                                        {/* 3. Payment Method (Transfer Only) */}
                                        <div className="pt-2 border-t border-gray-100">
                                            <div className="mt-4 space-y-4">
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
                                                    </div>
                                                </div>

                                                <p className="text-sm text-gray-600 font-medium text-center">
                                                    Recordá enviar el comprobante de pago para habilitar tu cuenta.
                                                </p>

                                                <button
                                                    onClick={async () => {
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

                                                            // Email notification to Facundo via Resend
                                                            try {
                                                                await fetch('/api/notifications/trigger', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({
                                                                        event: 'newPayment',
                                                                        data: {
                                                                            uid: currentUser.uid,
                                                                            email: currentUser.email,
                                                                            planId,
                                                                            billing,
                                                                        },
                                                                        subject: 'Nuevo comprobante de pago enviado',
                                                                        message: `El usuario <strong>${currentUser.email || 'desconocido'}</strong> hizo clic en "Enviar comprobante" en el checkout y aguarda aprobación del pago.`
                                                                    })
                                                                });
                                                            } catch (e) {
                                                                console.error('Failed to trigger payment email notification', e);
                                                            }

                                                            setIsPendingPayment(true);
                                                            window.open("https://wa.me/5491123889745?text=Hola!%20Realicé%20una%20transferencia%20para%20el%20plan%20de%20suscripción.%20Adjunto%20el%20comprobante.", "_blank");
                                                            router.push("/dashboard");
                                                        } catch (error) {
                                                            console.error("Error setting pending payment:", error);
                                                        } finally {
                                                            setSubmittingPayment(false);
                                                        }
                                                    }}
                                                    disabled={submittingPayment}
                                                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                                                >
                                                    {submittingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Enviar Comprobante</span>}
                                                </button>
                                            </div>
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
