"use client";

import { useEffect, useState } from "react";
import StatCard from "@/ui/components/cards/StatCard";
import { Home, Calculator, Building2, TrendingUp } from "lucide-react";
import QuickActions from "@/ui/components/dashboard/QuickActions";
import LastEstimations from "@/ui/components/dashboard/LastEstimations";
import EstimationChart from "@/ui/components/dashboard/EstimationChart";
import { auth, db } from "@/infrastructure/firebase/client";
import { collection, query, where, getDocs, getCountFromServer } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({
        totalProperties: 0,
        activeProperties: 0,
        totalEstimations: 0, // Placeholder for now as we don't have estimations collection yet
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
                    // Fetch Properties Stats
                    const propertiesRef = collection(db, "properties");
                    const qTotal = query(propertiesRef, where("userId", "==", currentUser.uid));
                    const qActive = query(propertiesRef, where("userId", "==", currentUser.uid), where("status", "==", "active"));

                    const [snapshotTotal, snapshotActive] = await Promise.all([
                        getDocs(qTotal), // using getDocs to count for now, getCountFromServer is better but might need index
                        getDocs(qActive)
                    ]);

                    setStats({
                        totalProperties: snapshotTotal.size,
                        activeProperties: snapshotActive.size,
                        totalEstimations: 34, // Mock data for now
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
        return <div className="p-6 flex items-center justify-center min-h-[400px]">Cargando dashboard...</div>;
    }

    return (
        <div className="p-6 flex flex-col gap-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hola, {user?.displayName || 'Agente'}</h1>
                    <p className="text-gray-500">Bienvenido a tu panel de control de Prop-IA.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                        Descargar Reporte
                    </button>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                        + Nueva Propiedad
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Propiedades"
                    value={stats.totalProperties}
                    icon={<Home className="w-5 h-5" />}
                    trend="+12% vs mes anterior"
                    trendUp={true}
                />
                <StatCard
                    title="Tasaciones"
                    value={stats.totalEstimations}
                    icon={<Calculator className="w-5 h-5" />}
                    trend="+5% vs mes anterior"
                    trendUp={true}
                />
                <StatCard
                    title="Activas"
                    value={stats.activeProperties}
                    icon={<Building2 className="w-5 h-5" />}
                    trend="85% del total"
                    trendUp={true}
                />
                <StatCard
                    title="Leads Nuevos"
                    value={12}
                    icon={<TrendingUp className="w-5 h-5" />}
                    trend="+3 hoy"
                    trendUp={true}
                />
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
                <QuickActions />
            </div>

            {/* Charts & Activity Section */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <EstimationChart />
                </div>
                <div className="lg:col-span-1">
                    <LastEstimations />
                </div>
            </div>
        </div>
    );
}