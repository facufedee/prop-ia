"use client";

import { useEffect, useState } from "react";
import { app, db } from "@/infrastructure/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import {
    Home,
    TrendingUp,
    Users,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Building2,
    Calendar,
    Eye,
    MessageSquare,
    BarChart3,
    Plus
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const auth = getAuth(app);

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({
        totalProperties: 0,
        activeProperties: 0,
        totalEstimations: 34,
        newLeads: 12,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
                    const propertiesRef = collection(db, "properties");
                    const qTotal = query(propertiesRef, where("userId", "==", currentUser.uid));
                    const qActive = query(propertiesRef, where("userId", "==", currentUser.uid), where("status", "==", "active"));

                    const [snapshotTotal, snapshotActive] = await Promise.all([
                        getDocs(qTotal),
                        getDocs(qActive)
                    ]);

                    setStats({
                        totalProperties: snapshotTotal.size,
                        activeProperties: snapshotActive.size,
                        totalEstimations: 34,
                        newLeads: 12,
                    });
                } catch (error) {
                    console.error("Error fetching dashboard stats:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-500">Cargando dashboard...</div>
            </div>
        );
    }

    const statCards = [
        {
            title: "Propiedades Totales",
            value: stats.totalProperties,
            change: "+12%",
            changeType: "positive",
            icon: Building2,
            color: "blue",
            subtitle: `${stats.activeProperties} activas`,
        },
        {
            title: "Tasaciones",
            value: stats.totalEstimations,
            change: "+5%",
            changeType: "positive",
            icon: BarChart3,
            color: "green",
            subtitle: "Este mes",
        },
        {
            title: "Leads Nuevos",
            value: stats.newLeads,
            change: "+3",
            changeType: "positive",
            icon: Users,
            color: "purple",
            subtitle: "Hoy",
        },
        {
            title: "Valor Total",
            value: "USD 2.4M",
            change: "+8%",
            changeType: "positive",
            icon: DollarSign,
            color: "orange",
            subtitle: "Cartera cerrada",
        },
    ];

    const quickActions = [
        { label: "Nueva Propiedad", icon: Plus, href: "/dashboard/propiedades/nueva", color: "indigo" },
        { label: "Tasar Propiedad", icon: BarChart3, href: "/dashboard/tasacion", color: "green" },
        { label: "Ver Leads", icon: MessageSquare, href: "/dashboard/leads", color: "blue" },
        { label: "Calendario", icon: Calendar, href: "/dashboard/calendario", color: "purple" },
    ];

    const recentActivity = [
        { type: "property", title: "Nueva propiedad agregada", subtitle: "Av. Libertador 1234", time: "Hace 2 horas", icon: Home },
        { type: "lead", title: "Nuevo lead recibido", subtitle: "Juan Pérez - Interesado en Palermo", time: "Hace 3 horas", icon: Users },
        { type: "estimation", title: "Tasación completada", subtitle: "Depto 2 amb - $120.000", time: "Hace 5 horas", icon: BarChart3 },
        { type: "visit", title: "Visita agendada", subtitle: "Mañana 15:00 hs", time: "Hace 1 día", icon: Calendar },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Hola, {user?.displayName || user?.email?.split('@')[0] || 'Usuario'} 👋
                    </h1>
                    <p className="text-gray-500 mt-1">Aquí está el resumen de tu inmobiliaria hoy</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all hover:shadow-sm">
                        📊 Descargar Reporte
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/propiedades/nueva')}
                        className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-sm font-medium hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Propiedad
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, idx) => {
                    const Icon = stat.icon;
                    const colorClasses = {
                        blue: 'bg-blue-50 text-blue-600',
                        green: 'bg-green-50 text-green-600',
                        purple: 'bg-purple-50 text-purple-600',
                        orange: 'bg-orange-50 text-orange-600',
                    };

                    return (
                        <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all hover:border-gray-200">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-medium ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {stat.changeType === 'positive' ? (
                                        <ArrowUpRight className="w-4 h-4" />
                                    ) : (
                                        <ArrowDownRight className="w-4 h-4" />
                                    )}
                                    {stat.change}
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                            <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                            <p className="text-xs text-gray-400">{stat.subtitle}</p>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {quickActions.map((action, idx) => {
                        const Icon = action.icon;
                        const colorClasses = {
                            indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
                            green: 'bg-green-50 text-green-600 hover:bg-green-100',
                            blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
                            purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
                        };

                        return (
                            <Link
                                key={idx}
                                href={action.href}
                                className={`p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-all flex flex-col items-center gap-3 text-center ${colorClasses[action.color as keyof typeof colorClasses]
                                    }`}
                            >
                                <Icon className="w-8 h-8" />
                                <span className="font-medium text-sm">{action.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Activity & Chart */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Actividad del Mes</h3>
                            <p className="text-sm text-gray-500">Propiedades y tasaciones</p>
                        </div>
                        <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                            <option>Últimos 30 días</option>
                            <option>Últimos 7 días</option>
                            <option>Este mes</option>
                        </select>
                    </div>

                    {/* Simple Bar Chart Placeholder */}
                    <div className="h-64 flex items-end justify-between gap-2">
                        {[40, 65, 45, 80, 55, 70, 60, 85, 50, 75, 65, 90].map((height, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                <div
                                    className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg hover:from-indigo-600 hover:to-indigo-500 transition-all cursor-pointer"
                                    style={{ height: `${height}%` }}
                                />
                                <span className="text-xs text-gray-400">{idx + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
                    <div className="space-y-4">
                        {recentActivity.map((activity, idx) => {
                            const Icon = activity.icon;
                            return (
                                <div key={idx} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                    <div className="p-2 bg-gray-50 rounded-lg h-fit">
                                        <Icon className="w-4 h-4 text-gray-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                                        <p className="text-xs text-gray-500 truncate">{activity.subtitle}</p>
                                        <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <Link
                        href="/dashboard/bitacora"
                        className="block text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-4 pt-4 border-t border-gray-100"
                    >
                        Ver toda la actividad →
                    </Link>
                </div>
            </div>
        </div>
    );
}