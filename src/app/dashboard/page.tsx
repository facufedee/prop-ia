"use client";

import { useEffect, useState } from "react";
import { app, db, auth } from "@/infrastructure/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { leadsService } from "@/infrastructure/services/leadsService";
import { auditLogService } from "@/infrastructure/services/auditLogService";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { AuditLog } from "@/domain/models/AuditLog";
import { Alquiler } from "@/domain/models/Alquiler";
import { isSameMonth, parseISO } from "date-fns";
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

import { useBranchContext } from "@/infrastructure/context/BranchContext";

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const { selectedBranchId } = useBranchContext();
    const [stats, setStats] = useState({
        totalProperties: 0,
        totalAlquileres: 0,
        activeRentals: 0,
        totalLeads: 0,
        honorariosMonth: 0,
        recentActivity: [] as AuditLog[]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/login");
                return;
            }
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (user) {
            fetchStats(user.uid, selectedBranchId);
        } else if (!auth?.currentUser && !loading) {
            // Handle case where user isn't set yet but might be effectively logged out or loading
        }
        // When user is set, we fetch. selectedBranchId change also triggers fetch.
    }, [user, selectedBranchId]);

    const fetchStats = async (userId: string, branchId: string) => {
        if (!db) return;

        try {
            // 1. Properties Query - Filter by branch if needed
            let propsQuery = query(collection(db, "properties"), where("userId", "==", userId));
            if (branchId !== 'all') {
                propsQuery = query(propsQuery, where("branchId", "==", branchId));
            }

            // Run all queries
            const [propsSnapshot, leads, recentLogsData, alquileres] = await Promise.all([
                getDocs(propsQuery),
                leadsService.getLeads(userId),
                auditLogService.getLogs("default-org-id", { userId }, 10),
                alquileresService.getAlquileres(userId)
            ]);

            // Capture valid Property IDs for this branch
            const propertyIds = new Set(propsSnapshot.docs.map(d => d.id));

            // 2. Leads - Filter by Property ownership
            const filteredLeads = branchId === 'all'
                ? leads
                : leads.filter(l => l.propertyId && propertyIds.has(l.propertyId));

            // 3. Alquileres - Filter by Property ownership
            const filteredAlquileres = branchId === 'all'
                ? alquileres
                : alquileres.filter(a => propertyIds.has(a.propiedadId));


            // Calculate Alquileres Stats (using filtered list)
            const activeRentals = filteredAlquileres.filter(a => a.estado === 'activo').length;

            // Calculate Honorarios for Current Month (using filtered list)
            const now = new Date();
            let honorariosMonth = 0;

            filteredAlquileres.forEach(alquiler => {
                alquiler.historialPagos.forEach(pago => {
                    // Check if paid in current month
                    const fechaPago = pago.fechaPago ? new Date(pago.fechaPago) : null;
                    if (pago.estado === 'pagado' && fechaPago && isSameMonth(fechaPago, now)) {

                        // Priority 1: Desglose explícito
                        if (pago.desglose?.honorarios) {
                            honorariosMonth += pago.desglose.honorarios;
                        }
                        // Priority 2: Fallback calculation
                        else {
                            if (alquiler.honorariosTipo === 'fijo' && alquiler.honorariosValor) {
                                honorariosMonth += alquiler.honorariosValor;
                            } else if (alquiler.honorariosTipo === 'porcentaje' && alquiler.honorariosValor) {
                                // Default to applying % on base rent if total breakdown missing, or total amount
                                const baseAmount = pago.montoAlquiler || pago.monto;
                                honorariosMonth += baseAmount * (alquiler.honorariosValor / 100);
                            }
                        }
                    }
                });
            });

            setStats({
                totalProperties: propsSnapshot.size,
                totalAlquileres: filteredAlquileres.length,
                activeRentals,
                totalLeads: filteredLeads.length,
                honorariosMonth,
                recentActivity: recentLogsData.logs
            });
            setLoading(false); // Ensure loading is off after fetch
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
                <div className="text-center space-y-6">
                    {/* Custom loading image */}
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 rounded-2xl blur-3xl opacity-30 animate-pulse" />
                            <img
                                src="/assets/img/loading.png"
                                alt="Cargando PROP-IA"
                                className="relative h-20 w-auto animate-pulse"
                            />
                        </div>
                    </div>

                    {/* Loading dots animation */}
                    <div className="flex justify-center gap-2">
                        <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>

                    <p className="text-sm text-gray-500 font-medium">Cargando dashboard...</p>
                </div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Link href="/dashboard/propiedades" className="group">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all md:hover:scale-[1.02] cursor-pointer h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-100 transition-colors">
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
                </Link>

                <Link href="/dashboard/alquileres" className="group">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all md:hover:scale-[1.02] cursor-pointer h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-green-50 rounded-xl text-green-600 group-hover:bg-green-100 transition-colors">
                                <Home size={20} />
                            </div>
                            <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                <ArrowUpRight size={12} className="mr-1" /> Activos
                            </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-bold text-gray-900">{stats.activeRentals}</h3>
                            <span className="text-sm text-gray-400">/ {stats.totalAlquileres}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Alquileres</p>
                        <p className="text-xs text-gray-400 mt-2">En curso</p>
                    </div>
                </Link>

                <Link href="/dashboard/finanzas" className="group">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all md:hover:scale-[1.02] cursor-pointer h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                <DollarSign size={20} />
                            </div>
                            <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                <TrendingUp size={12} className="mr-1" /> Mes actual
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.honorariosMonth)}</h3>
                        <p className="text-sm text-gray-500 mt-1">Ingresos Honorarios</p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Ver detalles <ArrowUpRight size={12} />
                        </div>
                    </div>
                </Link>
            </div>

            {/* Quick Actions */}
            <h2 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Link href="/dashboard/propiedades/nueva" className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors flex flex-col items-center justify-center text-center gap-2 group">
                    <div className="p-2 bg-white rounded-lg text-indigo-600 group-hover:scale-110 transition-transform">
                        <Plus size={20} />
                    </div>
                    <span className="text-sm font-medium text-indigo-900">Nueva Propiedad</span>
                </Link>
                <Link href="/dashboard/alquileres/nuevo" className="p-4 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors flex flex-col items-center justify-center text-center gap-2 group">
                    <div className="p-2 bg-white rounded-lg text-green-600 group-hover:scale-110 transition-transform">
                        <Home size={20} />
                    </div>
                    <span className="text-sm font-medium text-green-900">Nuevo Alquiler</span>
                </Link>
                <Link href="/dashboard/tasacion" className="p-4 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors flex flex-col items-center justify-center text-center gap-2 group">
                    <div className="p-2 bg-white rounded-lg text-purple-600 group-hover:scale-110 transition-transform">
                        <BarChart3 size={20} />
                    </div>
                    <span className="text-sm font-medium text-purple-900">Tasar Propiedad</span>
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
                        {stats.recentActivity.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No hay actividad reciente.</p>
                        ) : (
                            stats.recentActivity.map((log) => (
                                <div key={log.id} className="flex gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                                        ${log.level === 'error' ? 'bg-red-100 text-red-600' :
                                            log.level === 'warning' ? 'bg-orange-100 text-orange-600' :
                                                log.level === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {/* Simple icon logic based on module */}
                                        {log.module === 'Propiedades' ? <Home size={18} /> :
                                            log.module === 'Alquileres' ? <Building2 size={18} /> :
                                                log.module === 'Tasaciones' ? <BarChart3 size={18} /> :
                                                    log.module === 'Visitas' ? <Calendar size={18} /> :
                                                        <TrendingUp size={18} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{log.description}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-gray-500 capitalize">{log.module.toLowerCase()}</span>
                                            <span className="text-gray-300">•</span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}