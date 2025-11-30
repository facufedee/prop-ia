"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/infrastructure/firebase/client";
import { Check, CreditCard, Building, User } from "lucide-react";
import Link from "next/link";

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const planId = searchParams.get('plan');
    const billing = searchParams.get('billing') as 'monthly' | 'yearly';

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        cuit: "",
        address: "",
    });

    const plans: Record<string, any> = {
        free: {
            name: 'Gratis',
            price: { monthly: 0, yearly: 0 },
            features: ['5 propiedades', '10 tasaciones/mes', '1 usuario', '1GB storage'],
        },
        professional: {
            name: 'Profesional',
            price: { monthly: 29900, yearly: 299000 },
            features: ['50 propiedades', 'Tasaciones ilimitadas', '3 usuarios', '50GB storage', 'Soporte prioritario'],
        },
        enterprise: {
            name: 'Empresarial',
            price: { monthly: 79900, yearly: 799000 },
            features: ['Propiedades ilimitadas', 'Todo ilimitado', 'Usuarios ilimitados', 'API access', 'White-label'],
        },
    };

    const selectedPlan = planId ? plans[planId] : null;
    const price = selectedPlan ? (billing === 'yearly' ? selectedPlan.price.yearly : selectedPlan.price.monthly) : 0;

    useEffect(() => {
        if (auth.currentUser) {
            setFormData(prev => ({
                ...prev,
                email: auth.currentUser?.email || '',
                name: auth.currentUser?.displayName || '',
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser || !selectedPlan) return;

        setLoading(true);

        try {
            // Aquí integraremos MercadoPago
            // Por ahora, solo simulamos el proceso

            alert('¡Suscripción creada! (Integración de pago pendiente)');
            router.push('/dashboard');
        } catch (error) {
            console.error('Error:', error);
            alert('Error al procesar el pago');
        } finally {
            setLoading(false);
        }
    };

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
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
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

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    <strong>Nota:</strong> El pago se procesará de forma segura a través de MercadoPago.
                                    Recibirás un email de confirmación una vez completada la transacción.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <CreditCard className="w-5 h-5" />
                                {loading ? 'Procesando...' : price === 0 ? 'Activar Plan Gratis' : 'Proceder al Pago'}
                            </button>
                        </form>
                    </div>

                    {/* Right: Summary */}
                    <div>
                        <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Resumen del Pedido</h3>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Plan</span>
                                    <span className="font-semibold text-gray-900">{selectedPlan.name}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Facturación</span>
                                    <span className="font-semibold text-gray-900">
                                        {billing === 'yearly' ? 'Anual' : 'Mensual'}
                                    </span>
                                </div>

                                {billing === 'yearly' && price > 0 && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <p className="text-sm text-green-800 font-medium">
                                            ✓ Ahorrás 17% con facturación anual
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-200 pt-4 mb-6">
                                <h4 className="font-semibold text-gray-900 mb-3">Incluye:</h4>
                                <ul className="space-y-2">
                                    {selectedPlan.features.map((feature: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm text-gray-700">{feature}</span>
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
                                    <p className="text-sm text-gray-500 mt-2">
                                        {formatPrice((price * 1.21) / 12)}/mes
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>}>
            <CheckoutContent />
        </Suspense>
    );
}
