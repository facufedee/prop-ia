"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Check, CreditCard, ArrowRightLeft, ArrowLeft } from "lucide-react";
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
            <main className="s-util s-util--center">
                <section className="s-util-card">
                    <h1 className="s-util-title">Plan no especificado.</h1>
                    <div className="s-util-actions">
                        <Link href="/precios" className="s-util-link">Volver a planes</Link>
                    </div>
                </section>
            </main>
        );
    }

    const billingOptions: { value: Billing; label: string; badge?: string }[] = [
        { value: 'monthly', label: 'Mensual' },
        { value: 'quarterly', label: '3 Meses', badge: 'Popular' },
        { value: 'yearly', label: 'Anual', badge: '-17%' },
    ];

    const savingsLabel = getSavingsLabel();

    return (
        <main className="s-util">
            <div className="s-checkout">
                <header className="s-checkout__head">
                    <Link href="/precios" className="s-util-link">
                        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                        Volver a planes
                    </Link>
                    <h1 className="s-page-title">Finalizar Suscripción</h1>
                    <p className="s-page-lede">Revisá tu plan y completá el pago</p>
                </header>

                <div className="s-checkout__grid">

                    {/* LEFT — Plan details */}
                    <div className="s-checkout__main">
                        {planData && (
                            <>
                                {/* User */}
                                <section className="s-checkout__panel">
                                    <div className="s-checkout__row">
                                        <h2 className="s-checkout__h2">Tus Datos</h2>
                                        {currentUser && (
                                            <span className="s-checkout__badge s-checkout__badge--positive">
                                                Verificado
                                            </span>
                                        )}
                                    </div>
                                    <div className="s-checkout__user">
                                        <div className="s-checkout__avatar" aria-hidden="true">
                                            {currentUser?.displayName?.[0]?.toUpperCase() ?? currentUser?.email?.[0]?.toUpperCase() ?? 'U'}
                                        </div>
                                        <div>
                                            <p className="s-checkout__user-name">{currentUser?.displayName || "Usuario"}</p>
                                            <p className="s-checkout__user-mail">{currentUser?.email}</p>
                                        </div>
                                    </div>
                                </section>

                                {/* Plan */}
                                <section className="s-checkout__panel">
                                    <h2 className="s-checkout__h2 s-checkout__row">Detalle del Plan</h2>
                                    <div className="s-checkout__row s-checkout__row--plan">
                                        <div>
                                            <h3 className="s-checkout__plan-name">{planData.name}</h3>
                                            <p className="s-checkout__plan-desc">{planData.description}</p>
                                        </div>
                                        <span className="s-checkout__badge">
                                            {billing === 'monthly' ? 'Mensual' : billing === 'quarterly' ? '3 Meses' : 'Anual'}
                                        </span>
                                    </div>
                                    <h4 className="s-checkout__eyebrow">Incluye</h4>
                                    <div className="s-checkout__features">
                                        {[
                                            { label: 'Propiedades', value: planData.limits.properties === 'unlimited' ? 'Ilimitadas' : `${planData.limits.properties} activas` },
                                            { label: 'Usuarios', value: planData.limits.users === 'unlimited' ? 'Ilimitados' : `${planData.limits.users} miembros` },
                                            { label: 'Soporte', value: 'Prioritario 24/7' },
                                            { label: 'Actualizaciones', value: 'Automáticas' },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="s-checkout__feature">
                                                <span className="s-checkout__check" aria-hidden="true">
                                                    <Check />
                                                </span>
                                                <div>
                                                    <p className="s-checkout__feature-label">{label}</p>
                                                    <p className="s-checkout__feature-value">{value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </>
                        )}
                    </div>

                    {/* RIGHT — Payment */}
                    <div className="s-checkout__aside">
                        {isPendingPayment ? (
                            <div className="s-checkout__panel s-checkout__panel--center">
                                <div className="s-util-mark s-util-mark--positive">
                                    <Check aria-hidden="true" />
                                </div>
                                <h3 className="s-util-title">Pago en verificación</h3>
                                <p className="s-util-text">
                                    Estamos habilitando tu cuenta con el plan elegido.
                                </p>
                                <p className="s-util-text">
                                    Te avisamos por aquí y por WhatsApp en menos de 10 minutos.
                                </p>
                            </div>
                        ) : planData && (
                            <div className="s-checkout__panel">

                                {/* 1. Billing period */}
                                <div className="s-checkout__block">
                                    <p className="s-checkout__label">Período de facturación</p>
                                    <div className="s-checkout__seg">
                                        {billingOptions.map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                aria-pressed={billing === opt.value}
                                                onClick={() => { setBilling(opt.value); setMpInitPoint(null); }}
                                                className={`s-checkout__seg-btn ${billing === opt.value ? 'is-active' : ''}`}
                                            >
                                                {opt.label}
                                                {opt.badge && (
                                                    <span className={`s-checkout__seg-badge ${opt.value === 'quarterly' ? '' : 's-checkout__seg-badge--positive'}`}>
                                                        {opt.badge}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 2. Price */}
                                <div className="s-checkout__block">
                                    {prorationCredit > 0 ? (
                                        <div className="s-checkout__price">
                                            <div className="s-checkout__line">
                                                <span>Precio del plan</span>
                                                <span>{formatPrice(getPrice())}</span>
                                            </div>
                                            <div className="s-checkout__line s-checkout__line--credit">
                                                <span>Crédito por días no usados</span>
                                                <span>− {formatPrice(prorationCredit)}</span>
                                            </div>
                                            <div className="s-checkout__total">
                                                <p className="s-checkout__caption">Total a pagar</p>
                                                <p className="s-checkout__amount">{formatPrice(getFinalPrice())}</p>
                                            </div>
                                            <div className="s-checkout__credit-note">
                                                Tu suscripción actual tiene días sin usar. Ese valor se descuenta automáticamente del nuevo plan — solo pagás la diferencia.
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="s-checkout__price s-checkout__price--center">
                                            <p className="s-checkout__caption">Total a pagar</p>
                                            <p className="s-checkout__amount">
                                                {formatPrice(getPrice())}
                                            </p>
                                            <p className="s-checkout__per">
                                                {billing === 'monthly' && 'por mes'}
                                                {billing === 'quarterly' && `por 3 meses · ${formatPrice(getMonthlyEquivalent())}/mes`}
                                                {billing === 'yearly' && `por año · ${formatPrice(getMonthlyEquivalent())}/mes`}
                                            </p>
                                            {savingsLabel && (
                                                <span className="s-checkout__saving">
                                                    {savingsLabel}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* 3. Payment method selector */}
                                <div className="s-checkout__block">
                                    <p className="s-checkout__label">Método de pago</p>
                                    <div className="s-checkout__methods">
                                        <button
                                            type="button"
                                            aria-pressed={paymentMethod === 'mercadopago'}
                                            onClick={() => setPaymentMethod('mercadopago')}
                                            className={`s-checkout__method ${paymentMethod === 'mercadopago' ? 'is-active' : ''}`}
                                        >
                                            <CreditCard aria-hidden="true" />
                                            Tarjeta / MP
                                        </button>
                                        <button
                                            type="button"
                                            aria-pressed={paymentMethod === 'transfer'}
                                            onClick={() => setPaymentMethod('transfer')}
                                            className={`s-checkout__method ${paymentMethod === 'transfer' ? 'is-active' : ''}`}
                                        >
                                            <ArrowRightLeft aria-hidden="true" />
                                            Transferencia
                                        </button>
                                    </div>
                                </div>

                                {/* 4. Payment form */}
                                <div className="s-checkout__pay">
                                    {paymentMethod === 'mercadopago' ? (
                                        <>
                                            {authLoading && (
                                                <div className="s-checkout__wait">
                                                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                                                    Verificando sesión...
                                                </div>
                                            )}
                                            {!authLoading && !currentUser && (
                                                <div className="s-checkout__login">
                                                    <p className="s-checkout__hint">Necesitás iniciar sesión para continuar.</p>
                                                    <Link href={`/login?redirect=/checkout?plan=${planId}&billing=${billing}`} className="s-auth-submit">
                                                        Iniciar sesión
                                                    </Link>
                                                </div>
                                            )}
                                            {!authLoading && currentUser && mpLoading && (
                                                <div className="s-checkout__wait">
                                                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                                                    Preparando el pago...
                                                </div>
                                            )}
                                            {!authLoading && currentUser && mpError && (
                                                <p className="s-auth-alert" role="alert">
                                                    {mpError}
                                                </p>
                                            )}
                                            {!authLoading && currentUser && !mpLoading && !mpError && mpInitPoint && (
                                                <>
                                                    <p className="s-checkout__hint">
                                                        Vas a ser redirigido al sitio seguro de Mercado Pago para completar el pago.
                                                    </p>
                                                    <a
                                                        href={mpInitPoint}
                                                        className="s-auth-submit"
                                                    >
                                                        <CreditCard className="w-5 h-5" aria-hidden="true" />
                                                        Pagar con Mercado Pago
                                                    </a>
                                                    <p className="s-checkout__hint s-checkout__hint--fine">
                                                        Podés pagar con tarjeta, débito o dinero en cuenta de MP
                                                    </p>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div className="s-checkout__transfer">
                                                <p className="s-checkout__transfer-title">Datos para transferir:</p>
                                                <dl>
                                                    <div>
                                                        <dt>CUIL:</dt>
                                                        <dd className="s-checkout__mono">20-35163401-5</dd>
                                                    </div>
                                                    <div>
                                                        <dt>Alias:</dt>
                                                        <dd className="s-checkout__alias">ZETAPROP</dd>
                                                    </div>
                                                    <div>
                                                        <dt>Monto:</dt>
                                                        <dd>{formatPrice(getPrice())}</dd>
                                                    </div>
                                                </dl>
                                            </div>
                                            <p className="s-checkout__hint">
                                                Después de transferir, hacé clic abajo y envianos el comprobante por WhatsApp.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={handleTransferSubmit}
                                                disabled={submittingPayment}
                                                className="s-auth-submit"
                                            >
                                                {submittingPayment ? <Loader2 className="w-5 h-5 animate-spin" aria-label="Enviando" /> : 'Enviar Comprobante por WhatsApp'}
                                            </button>
                                        </>
                                    )}
                                </div>

                                <p className="s-checkout__secure">
                                    Pago protegido con cifrado SSL
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="s-util-loading"><Loader2 className="animate-spin" aria-label="Cargando" /></div>}>
            <CheckoutContent />
        </Suspense>
    );
}
