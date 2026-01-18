"use client";

import { useEffect, useState } from "react";
import { app, db, auth } from "@/infrastructure/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { leadsService } from "@/infrastructure/services/leadsService";
import { auditLogService } from "@/infrastructure/services/auditLogService";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { AuditLog } from "@/domain/models/AuditLog";
import { isSameMonth, format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Home,
    TrendingUp,
    Users,
    DollarSign,
    ArrowUpRight,
    Building2,
    Calendar,
    BarChart3,
    Plus,
    Sparkles,
    Search,
    Bell,
    CheckCircle2,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/ui/context/AuthContext";
import { useBranchContext } from "@/infrastructure/context/BranchContext";
import OnboardingOverlay from "@/ui/components/onboarding/OnboardingOverlay";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
    const router = useRouter();
    const { userRole, userPermissions } = useAuth();
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
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        if (!loading && stats.totalProperties === 0) {
            const hasSeenOnboarding = localStorage.getItem("hasSeenPropertyOnboarding");
            if (!hasSeenOnboarding) {
                setTimeout(() => setShowOnboarding(true), 1000);
            }
        }
    }, [loading, stats.totalProperties]);

    const handleOnboardingDismiss = () => {
        setShowOnboarding(false);
        localStorage.setItem("hasSeenPropertyOnboarding", "true");
    };

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
        }
    }, [user, selectedBranchId]);

    const fetchStats = async (userId: string, branchId: string) => {
        if (!db) return;

        try {
            let propsQuery = query(collection(db, "properties"), where("userId", "==", userId));
            if (branchId !== 'all') {
                propsQuery = query(propsQuery, where("branchId", "==", branchId));
            }

            const [propsSnapshot, leads, recentLogsData, alquileres] = await Promise.all([
                getDocs(propsQuery),
                leadsService.getLeads(userId),
                auditLogService.getLogs("default-org-id", { userId }, 10),
                alquileresService.getAlquileres(userId)
            ]);

            const propertyIds = new Set(propsSnapshot.docs.map(d => d.id));

            const filteredLeads = branchId === 'all'
                ? leads
                : leads.filter(l => l.propertyId && propertyIds.has(l.propertyId));

            const filteredAlquileres = branchId === 'all'
                ? alquileres
                : alquileres.filter(a => propertyIds.has(a.propiedadId));

            const activeRentals = filteredAlquileres.filter(a => a.estado === 'activo').length;

            const now = new Date();
            let honorariosMonth = 0;

            filteredAlquileres.forEach(alquiler => {
                alquiler.historialPagos.forEach(pago => {
                    const fechaPago = pago.fechaPago ? new Date(pago.fechaPago) : null;
                    if (pago.estado === 'pagado' && fechaPago && isSameMonth(fechaPago, now)) {
                        if (pago.desglose?.honorarios) {
                            honorariosMonth += pago.desglose.honorarios;
                        } else {
                            if (alquiler.honorariosTipo === 'fijo' && alquiler.honorariosValor) {
                                honorariosMonth += alquiler.honorariosValor;
                            } else if (alquiler.honorariosTipo === 'porcentaje' && alquiler.honorariosValor) {
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
            setLoading(false);
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
    };

    // Chart Data (Mocking trend for visual appeal or processing logs)
    const chartData = [
        { name: 'Lun', value: 400 },
        { name: 'Mar', value: 300 },
        { name: 'Mie', value: 550 },
        { name: 'Jue', value: 450 },
        { name: 'Vie', value: 650 },
        { name: 'Sab', value: 400 },
        { name: 'Dom', value: 300 },
    ];

    if (loading) {
        return (
            <div className="fixed inset-0 bg-gray-50 z-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium">Cargando tu inmobiliaria...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Professional Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Hola, {user?.displayName?.split(' ')[0] || 'Colega'}
                    </h1>
                    <p className="text-gray-500 mt-1 first-letter:capitalize">
                        {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                        <Search size={18} className="text-gray-400 mr-2" />
                        <input type="text" placeholder="Buscar..." className="text-sm bg-transparent outline-none text-gray-600 w-40" />
                    </div>
                    <button className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-indigo-600 hover:border-indigo-100 transition shadow-sm relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    <Link
                        id="new-property-btn"
                        href="/dashboard/propiedades/nueva"
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-all shadow-lg hover:shadow-gray-900/20 font-medium"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Nueva Propiedad</span>
                    </Link>
                </div>
            </div>

            {/* Premium Status Banner */}
            {userRole?.name === "Cliente Free" && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 to-violet-900 text-white shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/30 border border-indigo-400/30 text-indigo-100 text-xs font-bold uppercase tracking-wide">
                                    Plan Gratuito
                                </span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                                Lleva tu inmobiliaria al siguiente nivel
                            </h3>
                            <p className="text-indigo-100 max-w-xl text-sm leading-relaxed">
                                Desbloquea gestión ilimitada, automatización de leads con IA y herramientas avanzadas de marketing.
                            </p>
                        </div>
                        <Link
                            href="/precios"
                            className="flex-shrink-0 px-6 py-3 bg-white text-indigo-900 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg flex items-center gap-2"
                        >
                            <Sparkles size={18} className="text-indigo-600" />
                            Ver Planes PRO
                        </Link>
                    </div>
                </div>
            )}

            <OnboardingOverlay
                targetId="new-property-btn"
                show={showOnboarding}
                onDismiss={handleOnboardingDismiss}
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {userPermissions.includes('/dashboard/propiedades') ? (
                    <Link href="/dashboard/propiedades" className="group">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all md:hover:scale-[1.02] cursor-pointer h-full relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-100 transition-colors">
                                    <Building2 size={28} />
                                </div>
                                {userRole?.name === "Cliente Free" ? (
                                    <span className={`flex items-center text-xs font-bold px-3 py-1.5 rounded-full ${stats.totalProperties >= 10 ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                        Plan Gratuito
                                    </span>
                                ) : (
                                    <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                        <ArrowUpRight size={12} className="mr-1" /> Activas
                                    </span>
                                )}
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                                        {stats.totalProperties}
                                    </h3>
                                    {userRole?.name === "Cliente Free" && (
                                        <span className="text-xl text-gray-400 font-medium">/ 10</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-2 font-medium">Propiedades Totales</p>

                                {userRole?.name === "Cliente Free" && (
                                    <div className="mt-4 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${stats.totalProperties >= 10 ? 'bg-red-500' : 'bg-indigo-500'}`}
                                            style={{ width: `${Math.min((stats.totalProperties / 10) * 100, 100)}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                ) : (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full opacity-75">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-gray-50 rounded-xl text-gray-400">
                                <Building2 size={24} />
                            </div>
                        </div>
                        <h3 className="text-4xl font-bold text-gray-900">{stats.totalProperties}</h3>
                        <p className="text-sm text-gray-500 mt-1">Propiedades Totales</p>
                    </div>
                )}

                {userPermissions.includes('/dashboard/alquileres') ? (
                    <Link href="/dashboard/alquileres" className="group">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all md:hover:scale-[1.02] cursor-pointer h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                                    <Users size={24} />
                                </div>
                                <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                    <ArrowUpRight size={12} className="mr-1" /> Activos
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-bold text-gray-900">{stats.activeRentals}</h3>
                                <span className="text-sm text-gray-400">/ {stats.totalAlquileres}</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Alquileres</p>
                            <p className="text-xs text-gray-400 mt-2">En curso</p>
                        </div>
                    </Link>
                ) : (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full opacity-75">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-gray-50 rounded-xl text-gray-400">
                                <Users size={24} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-gray-900">{stats.activeRentals}</h3>
                            <span className="text-sm text-gray-400">/ {stats.totalAlquileres}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Alquileres</p>
                    </div>
                )}

                {userPermissions.includes('/dashboard/finanzas') ? (
                    <Link href="/dashboard/finanzas" className="group">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all md:hover:scale-[1.02] cursor-pointer h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                    <DollarSign size={24} />
                                </div>
                                <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                    <TrendingUp size={12} className="mr-1" /> Mes actual
                                </span>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900">{formatCurrency(stats.honorariosMonth)}</h3>
                            <p className="text-sm text-gray-500 mt-1">Ingresos Honorarios</p>
                            <div className="flex items-center gap-1 mt-2 text-xs text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                Ver detalles <ArrowUpRight size={12} />
                            </div>
                        </div>
                    </Link>
                ) : (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full opacity-75">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-gray-50 rounded-xl text-gray-400">
                                <DollarSign size={24} />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{formatCurrency(stats.honorariosMonth)}</h3>
                        <p className="text-sm text-gray-500 mt-1">Ingresos Honorarios</p>
                    </div>
                )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Chart & Activity */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Activity Chart or Welcome Banner */}
                    {stats.totalProperties === 0 ? (
                        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 rounded-2xl shadow-lg p-8 text-white relative overflow-hidden ring-1 ring-white/10">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold mb-3">¡Bienvenido a tu Dashboard! 🚀</h2>
                                <p className="text-indigo-100 mb-6 max-w-lg leading-relaxed text-sm md:text-base">
                                    Aquí verás métricas clave sobre el rendimiento de tu inmobiliaria.
                                    Para comenzar a ver datos interesantes, cargá tu primera propiedad y empezá a gestionar tu cartera.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <Link href="/dashboard/propiedades/nueva" className="px-5 py-2.5 bg-white text-indigo-900 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-md flex items-center gap-2 text-sm">
                                        <Plus size={18} />
                                        Cargar Propiedad
                                    </Link>
                                    <Link href="/dashboard/tutoriales" className="px-5 py-2.5 bg-white/10 text-white border border-white/20 rounded-xl font-medium hover:bg-white/20 transition-all flex items-center gap-2 text-sm backdrop-blur-sm">
                                        <Search size={18} />
                                        Ver Tutoriales
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold text-gray-900">Rendimiento</h2>
                                <button className="text-sm text-indigo-600 font-medium hover:underline">Ver reporte</button>
                            </div>
                            <div className="h-[300px] w-full flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                <BarChart3 size={48} className="mb-3 opacity-20" />
                                <p className="text-sm font-medium">Recopilando datos de actividad...</p>
                                <p className="text-xs text-center max-w-xs mt-1 opacity-70">
                                    Las métricas de rendimiento estarán disponibles pronto basado en tus leads y visitas.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions Grid */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Accesos Directos</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {userPermissions.includes('/dashboard/propiedades') && (
                                <Link href="/dashboard/propiedades/nueva" className="p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all group group text-center flex flex-col items-center justify-center gap-3">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full group-hover:scale-110 transition-transform">
                                        <Home size={20} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Crear Propiedad</span>
                                </Link>
                            )}

                            {userPermissions.includes('/dashboard/alquileres') && (
                                <Link href="/dashboard/alquileres" className="p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all group text-center flex flex-col items-center justify-center gap-3">
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full group-hover:scale-110 transition-transform">
                                        <DollarSign size={20} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Registrar Cobro</span>
                                </Link>
                            )}

                            {userPermissions.includes('/dashboard/tasacion') && (
                                <Link href="/dashboard/tasacion" className="p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all group text-center flex flex-col items-center justify-center gap-3">
                                    <div className="p-3 bg-purple-50 text-purple-600 rounded-full group-hover:scale-110 transition-transform">
                                        <BarChart3 size={20} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Nueva Tasación</span>
                                </Link>
                            )}

                            {userPermissions.includes('/dashboard/clientes') && (
                                <Link href="/dashboard/clientes" className="p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all group text-center flex flex-col items-center justify-center gap-3">
                                    <div className="p-3 bg-orange-50 text-orange-600 rounded-full group-hover:scale-110 transition-transform">
                                        <Users size={20} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Alta Cliente</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Recent Activity */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">Actividad Reciente</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            {stats.recentActivity.length > 0 ? (
                                stats.recentActivity.map((log, i) => (
                                    <div key={log.id} className="relative pl-6 pb-6 last:pb-0">
                                        {/* Timeline line */}
                                        {i !== stats.recentActivity.length - 1 && (
                                            <div className="absolute left-[11px] top-2 bottom-0 w-0.5 bg-gray-100"></div>
                                        )}
                                        {/* Timeline dot */}
                                        <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10
                                            ${log.level === 'error' ? 'bg-red-100' :
                                                log.level === 'warning' ? 'bg-orange-100' :
                                                    'bg-indigo-100'}`}>
                                            <div className={`w-2 h-2 rounded-full ${log.level === 'error' ? 'bg-red-500' :
                                                log.level === 'warning' ? 'bg-orange-500' :
                                                    'bg-indigo-500'
                                                }`}></div>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-900 font-medium leading-none mb-1.5">{log.action}</p>
                                            <p className="text-xs text-gray-500 leading-snug mb-2">{log.description}</p>
                                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide bg-gray-50 px-1.5 py-0.5 rounded">
                                                {format(new Date(log.timestamp), 'HH:mm')} • {log.module}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10">
                                    <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-gray-50 text-gray-400 mb-3">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <p className="text-sm text-gray-500">No hay actividad reciente.</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100">
                            <Link href="/dashboard/bitacora" className="flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 w-full py-2 hover:bg-indigo-50 rounded-lg transition-colors">
                                Ver historial completo <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}