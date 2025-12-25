"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { app, auth } from "@/infrastructure/firebase/client";
import { Check, CreditCard, Building, User, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const planId = searchParams.get('plan');
    const initialBilling = searchParams.get('billing') as 'monthly' | 'yearly' || 'monthly';

    const [loading, setLoading] = useState(true);
    const [planLoading, setPlanLoading] = useState(true);
    const [billing, setBilling] = useState<'monthly' | 'yearly'>(initialBilling);
    const [selectedPlan, setSelectedPlan] = useState<any>(null); // Plan type
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        cuit: "",
        address: "",
    });

    useEffect(() => {
        const fetchPlan = async () => {
            if (!planId) {
                setPlanLoading(false);
                return;
            }
            try {
                // Dynamically import or standard import - assuming standard is fine but for consistency with previous step
                const { subscriptionService } = await import("@/infrastructure/services/subscriptionService");
                const plan = await subscriptionService.getPlanById(planId);
                setSelectedPlan(plan);
            } catch (error) {
                console.error("Error fetching plan:", error);
            } finally {
                setPlanLoading(false);
            }
        };

        fetchPlan();
    }, [planId]);

    const price = selectedPlan ? (billing === 'yearly' ? selectedPlan.price.yearly : selectedPlan.price.monthly) : 0;

    useEffect(() => {
        if (auth?.currentUser) {
            setFormData(prev => ({
                ...prev,
                email: auth?.currentUser?.email || '',
                name: auth?.currentUser?.displayName || '',
            }));
        }
    }, []);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'transfer'>('mercadopago');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth?.currentUser || !selectedPlan) return;

        setLoading(true);

        if (paymentMethod === 'transfer') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            alert(`¡Solicitud registrada!\n\nPor favor enviá el comprobante de transferencia a administracion@prop-ia.com.ar para activar tu cuenta.\n\nTe hemos enviado un correo con estos datos.`);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/payments/create-preference", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planId,
                    planName: selectedPlan.name,
                    price,
                    billing,
                    user: formData
                }),
            });

            const data = await response.json();

            if (data.init_point) {
                window.location.href = data.init_point;
            } else {
                throw new Error("No se pudo iniciar el pago");
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al procesar el pago. Por favor intentá nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    if (planLoading) {
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
    }

    if (!selectedPlan) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Plan no encontrado</h2>
                    <Link href="/catalogo" className="text-indigo-600 hover:text-indigo-700">
                        Volver al catálogo
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <Link href="/catalogo" className="text-indigo-600 hover:text-indigo-700 text-sm">
                        ← Volver al catálogo
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Form */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Información de Facturación</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre Completo *
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email *
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Te enviaremos la factura y los datos de acceso a este correo.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Teléfono *
                                </label>
                                <input
                                    type="tel"
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Empresa / Inmobiliaria
                                </label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    CUIT (Opcional)
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="20-12345678-9"
                                    value={formData.cuit}
                                    onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Dirección
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            {/* Payment Method Selector */}
                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900">Método de Pago</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('mercadopago')}
                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 active:scale-[0.98] text-left ${paymentMethod === 'mercadopago'
                                            ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === 'mercadopago' ? 'border-indigo-600' : 'border-gray-300'
                                            }`}>
                                            {paymentMethod === 'mercadopago' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                                        </div>
                                        <div>
                                            <span className="block font-medium text-gray-900">Mercado Pago</span>
                                            <span className="block text-xs text-gray-500">Tarjeta, Débito, Efectivo</span>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('transfer')}
                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 active:scale-[0.98] text-left ${paymentMethod === 'transfer'
                                            ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === 'transfer' ? 'border-indigo-600' : 'border-gray-300'
                                            }`}>
                                            {paymentMethod === 'transfer' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                                        </div>
                                        <div>
                                            <span className="block font-medium text-gray-900">Transferencia</span>
                                            <span className="block text-xs text-gray-500">Manual (Demora 24hs)</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {
                                paymentMethod === 'mercadopago' && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 animate-in fade-in slide-in-from-top-2">
                                        <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                        <div className="text-sm text-blue-800">
                                            <p className="font-medium mb-1">Activación Inmediata</p>
                                            <p>
                                                Tu suscripción se activará automáticamente apenas se procese el pago.
                                            </p>
                                        </div>
                                    </div>
                                )
                            }

                            {
                                paymentMethod === 'transfer' && (
                                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-orange-100 rounded-lg">
                                                <Building className="w-5 h-5 text-orange-700" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">Datos Bancarios</h4>
                                                <p className="text-sm text-gray-600 mt-1">Realizá la transferencia a la siguiente cuenta:</p>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-lg p-4 text-sm space-y-2 border border-orange-100 shadow-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Banco</span>
                                                <span className="font-medium text-gray-900">Santander</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Tipo</span>
                                                <span className="font-medium text-gray-900">Caja de Ahorro en Pesos</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Cuenta</span>
                                                <span className="font-medium text-gray-900 font-mono">086-378169/4</span>
                                            </div>
                                            <div className="grid grid-cols-[auto_1fr] gap-4 pt-2 border-t border-gray-100 mt-2">
                                                <span className="text-gray-500">CBU</span>
                                                <span className="font-bold text-gray-900 font-mono text-right break-all">0720086188000037816940</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Titular</span>
                                                <span className="font-medium text-gray-900 text-right">FLORES ZAMORANO FACUNDO FEDERICO</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">CUIT</span>
                                                <span className="font-medium text-gray-900">20351634015</span>
                                            </div>
                                        </div>

                                        <div className="text-sm text-orange-800 bg-orange-100/50 p-3 rounded-lg border border-orange-100">
                                            <p className="font-semibold mb-1">⚠️ Importante</p>
                                            <p className="mb-2">La activación puede demorar hasta 24hs hábiles.</p>
                                            <p>
                                                Enviá el comprobante a: <strong className="select-all">administracion@prop-ia.com.ar</strong>
                                            </p>
                                        </div>
                                    </div>
                                )
                            }

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 text-white rounded-lg font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 ${paymentMethod === 'transfer'
                                    ? 'bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200 hover:shadow-xl'
                                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:shadow-xl'
                                    }`}
                            >
                                {paymentMethod === 'transfer' ? (
                                    <>
                                        <Mail className="w-5 h-5" />
                                        {loading ? 'Procesando...' : 'Confirmar y Ver Datos'}
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-5 h-5" />
                                        {loading ? 'Procesando...' : price === 0 ? 'Activar Plan Gratis' : 'Ir a Pagar con MercadoPago'}
                                    </>
                                )}
                            </button>
                        </form >
                    </div >

                    {/* Right: Summary */}
                    < div >
                        <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Resumen del Pedido</h3>

                            <div className="space-y-6 mb-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Plan</span>
                                    <span className="font-semibold text-gray-900">{selectedPlan.name}</span>
                                </div>

                                {/* Billing Toggle */}
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Ciclo de facturación</span>
                                        {billing === 'yearly' && (
                                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                                                Ahorrás 17%
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex bg-white rounded-lg p-1 border border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => setBilling('monthly')}
                                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${billing === 'monthly'
                                                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            Mensual
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBilling('yearly')}
                                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${billing === 'yearly'
                                                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            Anual
                                        </button>
                                    </div>
                                    {billing === 'monthly' && (
                                        <p className="text-xs text-indigo-600 mt-2 text-center cursor-pointer hover:underline" onClick={() => setBilling('yearly')}>
                                            Pasate al plan anual y ahorrá un 17%
                                        </p>
                                    )}
                                </div>

                                {billing === 'yearly' && price > 0 && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                                            <Check className="w-4 h-4" />
                                            Estás ahorrando {formatPrice(selectedPlan.price.monthly * 12 - selectedPlan.price.yearly)} al año
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-200 pt-4 mb-6">
                                <h4 className="font-semibold text-gray-900 mb-3">Incluye:</h4>
                                <ul className="space-y-2">
                                    {selectedPlan.features.map((feature: any, idx: number) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm text-gray-700">
                                                {typeof feature === 'string' ? feature : feature.name}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="text-gray-900">{formatPrice(price)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-gray-600">IVA (21%)</span>
                                    <span className="text-gray-900">{formatPrice(price * 0.21)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xl font-bold">
                                    <span>Total</span>
                                    <span className="text-indigo-600">{formatPrice(price * 1.21)}</span>
                                </div>
                                {billing === 'yearly' && (
                                    <p className="text-sm text-gray-500 mt-2 text-right">
                                        Equivale a {formatPrice((price * 1.21) / 12)}/mes
                                    </p>
                                )}
                            </div>
                        </div>
                    </div >
                </div >
            </div >
        </div >
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>}>
            <CheckoutContent />
        </Suspense>
    );
}
