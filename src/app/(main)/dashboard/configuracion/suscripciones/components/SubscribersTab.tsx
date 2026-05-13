"use client";

import { useEffect, useState } from "react";
import { Loader2, Calendar, CreditCard, Clock, User, CheckCircle, XCircle, AlertCircle, RefreshCw, TrendingUp, Bell, Trash2 } from "lucide-react";
import { subscriptionService } from "@/infrastructure/services/subscriptionService";
import { adminService } from "@/infrastructure/services/adminService";
import { Subscription } from "@/domain/models/Subscription";

interface SubscriberWithPlan extends Subscription {
    planName?: string;
    planTierDisplay?: string;
    userName?: string;
    userEmail?: string;
}

export default function SubscribersTab() {
    const [subscriptions, setSubscriptions] = useState<SubscriberWithPlan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSubscriptions = async () => {
            try {
                const [subs, plans, users] = await Promise.all([
                    subscriptionService.getAllSubscriptions(),
                    subscriptionService.getAllPlans(),
                    adminService.getAllUsers()
                ]);

                const planMap = new Map(plans.map(p => [p.id, p]));
                const userMap = new Map(users.map(u => [u.uid, u]));

                const enrichedSubs = subs.map(sub => {
                    const matchedUser = userMap.get(sub.userId);
                    return {
                        ...sub,
                        userName: matchedUser?.displayName || "Sin nombre",
                        userEmail: matchedUser?.email || "Sin email",
                        planName: planMap.get(sub.planId)?.name || "Plan Desconocido",
                        planTierDisplay: planMap.get(sub.planId)?.tier || sub.planTier,
                    };
                });

                setSubscriptions(enrichedSubs);
            } catch (error) {
                console.error("Error loading subscriptions:", error);
            } finally {
                setLoading(false);
            }
        };

        loadSubscriptions();
    }, []);

    const handleDeleteSubscription = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta suscripción? El usuario perderá el acceso a las funciones del plan.")) {
            return;
        }

        try {
            setLoading(true);
            await subscriptionService.deleteSubscription(id);
            setSubscriptions(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            console.error("Error deleting subscription:", error);
            alert("Hubo un error al eliminar la suscripción.");
            setLoading(false);
        }
    };

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

            {/* Subscriber Lists */}
            <div className="space-y-8">
                {/* Active Subscriptions */}
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CheckCircle className="text-green-500" size={20} />
                        Suscripciones Activas
                    </h3>
                    {activeSubscriptions.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {activeSubscriptions.map((sub) => {
                                const daysRemaining = getDaysRemaining(sub.endDate);
                                const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;

                                return (
                                    <div
                                        key={sub.id}
                                        className={`flex flex-col md:flex-row md:items-center justify-between p-4 bg-white rounded-xl border hover:shadow-sm transition-shadow gap-4 ${isExpiringSoon ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'}`}
                                    >
                                        {/* User Info */}
                                        <div className="flex items-center gap-4 md:w-1/3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                                {(sub.userName && sub.userName !== "Sin nombre") ? sub.userName.slice(0, 2).toUpperCase() : (sub.userEmail && sub.userEmail !== "Sin email" ? sub.userEmail.slice(0, 2).toUpperCase() : sub.userId.slice(0, 2).toUpperCase())}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-gray-900 text-sm truncate" title={sub.userEmail && sub.userEmail !== "Sin email" ? sub.userEmail : sub.userId}>
                                                    {sub.userEmail && sub.userEmail !== "Sin email" ? sub.userEmail : sub.userId.slice(0, 12) + "..."}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {sub.planName} • {sub.userName && sub.userName !== "Sin nombre" ? sub.userName : "Usuario"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* KPIs Grid */}
                                        <div className="flex gap-4 md:gap-8 text-sm md:flex-1 justify-start md:justify-center flex-wrap">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <CreditCard size={14} className="text-gray-400" />
                                                <span className="w-16">{formatCurrency(sub.amount, sub.currency)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Clock size={14} className="text-gray-400" />
                                                <span className="capitalize w-16">{sub.billingPeriod === 'monthly' ? 'Mensual' : 'Anual'}</span>
                                            </div>
                                            <div className={`flex flex-col items-start md:items-center gap-1 ${daysRemaining <= 0 ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-gray-600'}`}>
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={14} className="text-gray-400" />
                                                    <span title="Vencimiento" className="text-xs font-semibold">{formatDate(sub.endDate)}</span>
                                                </div>
                                                <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full mt-1">
                                                    {daysRemaining <= 0 ? `Expirado hace ${Math.abs(daysRemaining)} días` : `${daysRemaining} días rest.`}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status & Actions */}
                                        <div className="flex items-center justify-between md:justify-end gap-4 md:w-1/4 border-t md:border-none pt-3 md:pt-0 border-gray-100">
                                            {getStatusBadge(sub.status)}
                                            <button
                                                onClick={() => handleDeleteSubscription(sub.id)}
                                                className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg flex items-center gap-1 transition-colors"
                                                title="Eliminar suscripción del sistema"
                                            >
                                                <Trash2 size={16} /> <span className="md:hidden">Eliminar</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg border border-dashed">No hay suscripciones activas.</p>
                    )}
                </div>

                {/* Inactive Subscriptions */}
                {subscriptions.filter(s => s.status !== 'active').length > 0 && (
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <XCircle className="text-gray-400" size={20} />
                            Suscripciones Inactivas o Expiradas
                        </h3>
                        <div className="flex flex-col gap-3 opacity-75 hover:opacity-100 transition-opacity">
                            {subscriptions.filter(s => s.status !== 'active').map((sub) => {
                                const daysRemaining = getDaysRemaining(sub.endDate);

                                return (
                                    <div
                                        key={sub.id}
                                        className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 gap-4 grayscale"
                                    >
                                        {/* User Info */}
                                        <div className="flex items-center gap-4 md:w-1/3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold shrink-0">
                                                {(sub.userName && sub.userName !== "Sin nombre") ? sub.userName.slice(0, 2).toUpperCase() : (sub.userEmail && sub.userEmail !== "Sin email" ? sub.userEmail.slice(0, 2).toUpperCase() : sub.userId.slice(0, 2).toUpperCase())}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-gray-900 text-sm truncate" title={sub.userEmail && sub.userEmail !== "Sin email" ? sub.userEmail : sub.userId}>
                                                    {sub.userEmail && sub.userEmail !== "Sin email" ? sub.userEmail : sub.userId.slice(0, 12) + "..."}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {sub.planName} • {sub.userName && sub.userName !== "Sin nombre" ? sub.userName : "Usuario"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* KPIs Grid */}
                                        <div className="flex gap-4 md:gap-8 text-sm md:flex-1 justify-start md:justify-center flex-wrap">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <CreditCard size={14} />
                                                <span className="w-16">{formatCurrency(sub.amount, sub.currency)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Clock size={14} />
                                                <span className="capitalize w-16">{sub.billingPeriod === 'monthly' ? 'Mensual' : 'Anual'}</span>
                                            </div>
                                            <div className="flex flex-col items-start md:items-center gap-1 text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    <span title="Vencimiento" className="text-xs font-semibold">{formatDate(sub.endDate)}</span>
                                                </div>
                                                <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded-full mt-1">
                                                    {daysRemaining <= 0 ? `Expirado hace ${Math.abs(daysRemaining)} días` : `${daysRemaining} días rest.`}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status & Actions */}
                                        <div className="flex items-center justify-between md:justify-end gap-4 md:w-1/4 border-t md:border-none pt-3 md:pt-0 border-gray-200">
                                            {getStatusBadge(sub.status)}
                                            <button
                                                onClick={() => handleDeleteSubscription(sub.id)}
                                                className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg flex items-center gap-1 transition-colors"
                                                title="Eliminar suscripción del sistema"
                                            >
                                                <Trash2 size={16} /> <span className="md:hidden">Eliminar</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
