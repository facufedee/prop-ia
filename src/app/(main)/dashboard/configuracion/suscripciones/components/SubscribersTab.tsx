"use client";

import { useEffect, useState } from "react";
import { Loader2, Calendar, CreditCard, Clock, User, CheckCircle, XCircle, AlertCircle, RefreshCw, TrendingUp, Bell } from "lucide-react";
import { subscriptionService } from "@/infrastructure/services/subscriptionService";
import { Subscription } from "@/domain/models/Subscription";

interface SubscriberWithPlan extends Subscription {
    planName?: string;
    planTierDisplay?: string;
}

export default function SubscribersTab() {
    const [subscriptions, setSubscriptions] = useState<SubscriberWithPlan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSubscriptions = async () => {
            try {
                const subs = await subscriptionService.getAllSubscriptions();
                const plans = await subscriptionService.getAllPlans();
                const planMap = new Map(plans.map(p => [p.id, p]));

                const enrichedSubs = subs.map(sub => ({
                    ...sub,
                    planName: planMap.get(sub.planId)?.name || "Plan Desconocido",
                    planTierDisplay: planMap.get(sub.planId)?.tier || sub.planTier,
                }));

                setSubscriptions(enrichedSubs);
            } catch (error) {
                console.error("Error loading subscriptions:", error);
            } finally {
                setLoading(false);
            }
        };

        loadSubscriptions();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle size={12} /> Activo
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <XCircle size={12} /> Cancelado
                    </span>
                );
            case 'expired':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        <XCircle size={12} /> Expirado
                    </span>
                );
            case 'trial':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        <AlertCircle size={12} /> Prueba
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {status}
                    </span>
                );
        }
    };

    const getDaysRemaining = (endDate: Date) => {
        const now = new Date();
        const diff = endDate.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const formatDate = (date: Date | undefined) => {
        if (!date) return '-';
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatCurrency = (amount: number, currency: string = 'ARS') => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Calculate KPIs
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
    const expiringSoon = subscriptions.filter(s => {
        const days = getDaysRemaining(s.endDate);
        return s.status === 'active' && days > 0 && days <= 7;
    });
    const totalRevenue = subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + (s.amount || 0), 0);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (subscriptions.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay suscriptores aún.</p>
                <p className="text-sm text-gray-400 mt-1">Los usuarios aparecerán aquí cuando se suscriban a un plan.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Alert for Expiring Soon */}
            {expiringSoon.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <Bell className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                        <p className="font-medium text-amber-800">
                            {expiringSoon.length} suscripción{expiringSoon.length > 1 ? 'es' : ''} por vencer en los próximos 7 días
                        </p>
                        <p className="text-sm text-amber-600 mt-1">
                            Contacta a estos usuarios para renovar su suscripción.
                        </p>
                    </div>
                </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{subscriptions.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-500">Activos</p>
                    <p className="text-2xl font-bold text-green-600">{activeSubscriptions.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50">
                    <p className="text-sm text-amber-600">Por Vencer</p>
                    <p className="text-2xl font-bold text-amber-600">{expiringSoon.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-500">Mensuales</p>
                    <p className="text-2xl font-bold text-indigo-600">{subscriptions.filter(s => s.billingPeriod === 'monthly').length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-500">Anuales</p>
                    <p className="text-2xl font-bold text-purple-600">{subscriptions.filter(s => s.billingPeriod === 'yearly').length}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl text-white">
                    <p className="text-sm text-green-100 flex items-center gap-1">
                        <TrendingUp size={14} /> Ingresos Activos
                    </p>
                    <p className="text-xl font-bold">{formatCurrency(totalRevenue)}</p>
                </div>
            </div>

            {/* Subscriber Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subscriptions.map((sub) => {
                    const daysRemaining = getDaysRemaining(sub.endDate);
                    const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;

                    return (
                        <div
                            key={sub.id}
                            className={`bg-white rounded-xl border p-5 hover:shadow-md transition-shadow ${isExpiringSoon ? 'border-amber-300 bg-amber-50/50' : 'border-gray-200'}`}
                        >
                            {/* Expiring Soon Badge */}
                            {isExpiringSoon && (
                                <div className="mb-3 -mt-1 -mx-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-700">
                                        <RefreshCw size={12} /> Renovación próxima
                                    </span>
                                </div>
                            )}

                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                        {sub.userId.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 text-sm truncate max-w-[150px]" title={sub.userId}>
                                            {sub.userId.slice(0, 12)}...
                                        </p>
                                        <p className="text-xs text-gray-500">{sub.planName}</p>
                                    </div>
                                </div>
                                {getStatusBadge(sub.status)}
                            </div>

                            {/* KPIs Grid */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <CreditCard size={14} className="text-gray-400" />
                                    <span>{formatCurrency(sub.amount, sub.currency)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Clock size={14} className="text-gray-400" />
                                    <span className="capitalize">{sub.billingPeriod === 'monthly' ? 'Mensual' : 'Anual'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar size={14} className="text-gray-400" />
                                    <span title="Inicio">{formatDate(sub.startDate)}</span>
                                </div>
                                <div className={`flex items-center gap-2 ${daysRemaining <= 0 ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-gray-600'}`}>
                                    <Calendar size={14} className={daysRemaining <= 0 ? 'text-red-400' : isExpiringSoon ? 'text-amber-400' : 'text-gray-400'} />
                                    <span title="Vencimiento">{formatDate(sub.endDate)}</span>
                                </div>
                            </div>

                            {/* Next Payment Date */}
                            {sub.nextPaymentDate && (
                                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                                    <RefreshCw size={12} />
                                    <span>Próx. Renovación: <strong className="text-gray-700">{formatDate(sub.nextPaymentDate)}</strong></span>
                                </div>
                            )}

                            {/* Days Remaining Footer */}
                            <div className={`mt-3 pt-3 border-t text-center text-sm font-medium ${daysRemaining <= 0 ? 'text-red-600 border-red-200' : isExpiringSoon ? 'text-amber-600 border-amber-200' : 'text-gray-500 border-gray-100'}`}>
                                {daysRemaining <= 0 ? (
                                    <span>Expirado hace {Math.abs(daysRemaining)} días</span>
                                ) : (
                                    <span>{daysRemaining} días restantes</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
