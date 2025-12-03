"use client";

import { useEffect, useState } from "react";
import { app, db, auth } from "@/infrastructure/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
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

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({
        totalProperties: 0,
        totalTasaciones: 0,
        totalLeads: 0,
        totalValue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/login");
                return;
            }
            setUser(currentUser);

            if (db) {
                try {
                    await fetchStats(currentUser.uid);
                } catch (error) {
                    console.error("Error fetching stats:", error);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const fetchStats = async (userId: string) => {
        if (!db) return;

        try {
            // Properties
            const propsQuery = query(collection(db, "properties"), where("userId", "==", userId));
            const propsSnapshot = await getDocs(propsQuery);
            const totalProps = propsSnapshot.size;

            // Calculate total value
            let totalVal = 0;
            propsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.price) totalVal += Number(data.price);
            });

            // Tasaciones (mock for now or real if collection exists)
            // const tasacionesQuery = query(collection(db, "tasaciones"), where("userId", "==", userId));
            // const tasacionesSnapshot = await getDocs(tasacionesQuery);

            setStats({
                totalProperties: totalProps,
                totalTasaciones: 34, // Mock
                totalLeads: 12, // Mock
                totalValue: totalVal
            });
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        }
    };

    const formatCurrency = (value: number) => {
        if (value >= 1000000) {
            return `USD ${(value / 1000000).toFixed(1)}M`;
        }
        return `USD ${(value / 1000).toFixed(0)}k`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Hola, {user?.displayName?.split(' ')[0] || 'Agente'} 👋
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Aquí está el resumen de tu inmobiliaria hoy
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                        <ArrowDownRight size={16} />
                        Descargar Reporte
                    </button>
                    <Link
                        href="/dashboard/propiedades/nueva"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
                    >
                        <Plus size={16} />
                        Nueva Propiedad
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <Building2 size={20} />
                        </div>
                        <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            <ArrowUpRight size={12} className="mr-1" /> +12%
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.totalProperties}</h3>
                    <p className="text-sm text-gray-500 mt-1">Propiedades Totales</p>
                    <p className="text-xs text-gray-400 mt-2">0 activas</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 rounded-xl text-green-600">
                            <BarChart3 size={20} />
                        </div>
                        <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            <ArrowUpRight size={12} className="mr-1" /> +5%
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.totalTasaciones}</h3>
                    <p className="text-sm text-gray-500 mt-1">Tasaciones</p>
                    <p className="text-xs text-gray-400 mt-2">Este mes</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                            <Users size={20} />
                        </div>
                        <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            <ArrowUpRight size={12} className="mr-1" /> +3
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.totalLeads}</h3>
                    <p className="text-sm text-gray-500 mt-1">Leads Nuevos</p>
                    <p className="text-xs text-gray-400 mt-2">Hoy</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
                            <DollarSign size={20} />
                        </div>
                        <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            <ArrowUpRight size={12} className="mr-1" /> +8%
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</h3>
                    <p className="text-sm text-gray-500 mt-1">Valor Total</p>
                    <p className="text-xs text-gray-400 mt-2">Cartera cerrada</p>
                </div>
            </div>

            {/* Quick Actions */}
            <h2 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Link href="/dashboard/propiedades/nueva" className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors flex flex-col items-center justify-center text-center gap-2 group">
                    <div className="p-2 bg-white rounded-lg text-indigo-600 group-hover:scale-110 transition-transform">
                        <Plus size={20} />
                    </div>
                    <span className="text-sm font-medium text-indigo-900">Nueva Propiedad</span>
                </Link>
                <Link href="/dashboard/tasacion" className="p-4 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors flex flex-col items-center justify-center text-center gap-2 group">
                    <div className="p-2 bg-white rounded-lg text-green-600 group-hover:scale-110 transition-transform">
                        <BarChart3 size={20} />
                    </div>
                    <span className="text-sm font-medium text-green-900">Tasar Propiedad</span>
                </Link>
                <Link href="/dashboard/leads" className="p-4 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors flex flex-col items-center justify-center text-center gap-2 group">
                    <div className="p-2 bg-white rounded-lg text-blue-600 group-hover:scale-110 transition-transform">
                        <MessageSquare size={20} />
                    </div>
                    <span className="text-sm font-medium text-blue-900">Ver Leads</span>
                </Link>
                <Link href="/dashboard/calendario" className="p-4 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors flex flex-col items-center justify-center text-center gap-2 group">
                    <div className="p-2 bg-white rounded-lg text-purple-600 group-hover:scale-110 transition-transform">
                        <Calendar size={20} />
                    </div>
                    <span className="text-sm font-medium text-purple-900">Calendario</span>
                </Link>
            </div>

            {/* Recent Activity & Upcoming */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Actividad del Mes</h2>
                        <select className="text-sm border-gray-200 rounded-lg text-gray-500">
                            <option>Últimos 30 días</option>
                            <option>Este año</option>
                        </select>
                    </div>
                    <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                        <div className="text-center">
                            <p>Gráfico de actividad</p>
                            <p className="text-xs mt-1">Propiedades y tasaciones</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Actividad Reciente</h2>
                    <div className="space-y-6">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <Home size={18} className="text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Nueva propiedad agregada</p>
                                    <p className="text-xs text-gray-500">Av. Libertador 1234</p>
                                    <p className="text-xs text-gray-400 mt-1">Hace 2 horas</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}