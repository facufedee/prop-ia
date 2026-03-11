"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/infrastructure/firebase/client";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { leadsService } from "@/infrastructure/services/leadsService";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { Lead } from "@/domain/models/Lead";
import { Alquiler } from "@/domain/models/Alquiler";
import { isSameMonth, addDays, format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import {
    Home,
    TrendingUp,
    Users,
    DollarSign,
    ArrowUpRight,
    Building2,
    Calendar,
    MessageSquare,
    Plus,
    GraduationCap,
    Key,
    ArrowRight,
    Clock,
    AlertTriangle,
    CheckCircle2,
    PlayCircle,
    ChevronRight,
    UserCheck,
    BarChart3,
    Calculator,
    Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/ui/context/AuthContext";
import { useBranchContext } from "@/infrastructure/context/BranchContext";

interface VencimientoProximo {
    alquilerId: string;
    direccion: string;
    nombreInquilino: string;
    monto: number;
    fechaVencimiento: Date;
    diasRestantes: number;
    estado: 'pendiente' | 'vencido';
}

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
        recentLeads: [] as Lead[],
        proximosVencimientos: [] as VencimientoProximo[],
        totalClientes: 0,
        subscription: null as any,
        plan: null as any,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) { setLoading(false); return; }
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) { router.push("/login"); return; }
            setUser(u);
        });
        return () => unsub();
    }, [router]);

    useEffect(() => {
        if (user) fetchStats(user.uid, selectedBranchId);
    }, [user, selectedBranchId]);

    const fetchStats = async (userId: string, branchId: string) => {
        if (!db) return;
        try {
            let propsQuery = query(collection(db, "properties"), where("userId", "==", userId));
            if (branchId !== 'all') propsQuery = query(propsQuery, where("branchId", "==", branchId));

            const subQuery = query(collection(db, "subscriptions"), where("userId", "==", userId));
            const inquilinosQuery = query(collection(db, "inquilinos"), where("userId", "==", userId));
            const propietariosQuery = query(collection(db, "propietarios"), where("userId", "==", userId));

            const [propsSnapshot, leads, alquileres, subSnapshot, inquilinosSnap, propietariosSnap] = await Promise.all([
                getDocs(propsQuery),
                leadsService.getLeads(userId),
                alquileresService.getAlquileres(userId),
                getDocs(subQuery),
                getDocs(inquilinosQuery),
                getDocs(propietariosQuery),
            ]);

            const propertyIds = new Set(propsSnapshot.docs.map(d => d.id));

            const filteredLeads = branchId === 'all' ? leads : leads.filter(l => l.propertyId && propertyIds.has(l.propertyId));
            const filteredAlquileres = branchId === 'all' ? alquileres : alquileres.filter(a => propertyIds.has(a.propiedadId));

            const activeRentals = filteredAlquileres.filter(a => a.estado === 'activo').length;

            // Honorarios del mes
            const now = new Date();
            let honorariosMonth = 0;
            filteredAlquileres.forEach(alquiler => {
                alquiler.historialPagos.forEach(pago => {
                    const fechaPago = pago.fechaPago ? new Date(pago.fechaPago) : null;
                    if (pago.estado === 'pagado' && fechaPago && isSameMonth(fechaPago, now)) {
                        if (pago.desglose?.honorarios) {
                            honorariosMonth += pago.desglose.honorarios;
                        } else if (alquiler.honorariosTipo === 'fijo' && alquiler.honorariosValor) {
                            honorariosMonth += alquiler.honorariosValor;
                        } else if (alquiler.honorariosTipo === 'porcentaje' && alquiler.honorariosValor) {
                            const base = pago.montoAlquiler || pago.monto;
                            honorariosMonth += base * (alquiler.honorariosValor / 100);
                        }
                    }
                });
            });

            // Próximos vencimientos (pendientes en los próximos 10 días o vencidos hace menos de 5)
            const proximosVencimientos: VencimientoProximo[] = [];
            const ventanaFutura = addDays(now, 10);
            const ventanaPasada = addDays(now, -5);

            filteredAlquileres
                .filter(a => a.estado === 'activo')
                .forEach(alquiler => {
                    alquiler.historialPagos.forEach(pago => {
                        if (pago.estado !== 'pendiente' && pago.estado !== 'vencido') return;
                        const fechaVenc = pago.fechaVencimiento ? new Date(pago.fechaVencimiento) : null;
                        if (!fechaVenc) return;
                        if (fechaVenc >= ventanaPasada && fechaVenc <= ventanaFutura) {
                            const dias = differenceInDays(fechaVenc, now);
                            proximosVencimientos.push({
                                alquilerId: alquiler.id,
                                direccion: alquiler.direccion,
                                nombreInquilino: alquiler.nombreInquilino,
                                monto: pago.monto,
                                fechaVencimiento: fechaVenc,
                                diasRestantes: dias,
                                estado: dias < 0 ? 'vencido' : 'pendiente',
                            });
                        }
                    });
                });

            proximosVencimientos.sort((a, b) => a.diasRestantes - b.diasRestantes);

            const recentLeads = filteredLeads
                .sort((a, b) => {
                    const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any)?.seconds * 1000;
                    const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any)?.seconds * 1000;
                    return dateB - dateA;
                })
                .slice(0, 5);

            let planData = null;
            const subDocData = !subSnapshot.empty ? subSnapshot.docs[0].data() : null;
            if (subDocData?.planId) {
                const planSnap = await getDoc(doc(db, "plans", subDocData.planId));
                if (planSnap.exists()) {
                    planData = planSnap.data();
                } else if (subDocData?.planTier) {
                    // Fallback to querying by tier if the specific ID wasn't found
                    const qPlan = query(collection(db, "plans"), where("tier", "==", subDocData.planTier));
                    const planSnaps = await getDocs(qPlan);
                    if (!planSnaps.empty) {
                        planData = planSnaps.docs[0].data();
                    }
                }
            } else if (subDocData?.planTier) {
                const qPlan = query(collection(db, "plans"), where("tier", "==", subDocData.planTier));
                const planSnaps = await getDocs(qPlan);
                if (!planSnaps.empty) {
                    planData = planSnaps.docs[0].data();
                }
            }

            setStats({
                totalProperties: propsSnapshot.size,
                totalAlquileres: filteredAlquileres.length,
                activeRentals,
                totalLeads: filteredLeads.length,
                honorariosMonth,
                recentLeads,
                proximosVencimientos: proximosVencimientos.slice(0, 5),
                totalClientes: inquilinosSnap.size + propietariosSnap.size,
                subscription: subDocData,
                plan: planData,
            });
            setLoading(false);
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "¡Buenos días";
        if (hour < 19) return "¡Buenas tardes";
        return "¡Buenas noches";
    };

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

    const TUTORIALS = [
        { title: "Cómo cargar tu primera propiedad", duration: "3 min", href: "/dashboard/tutoriales", icon: Home, color: "indigo" },
        { title: "Registrar un alquiler paso a paso", duration: "5 min", href: "/dashboard/tutoriales", icon: Key, color: "emerald" },
        { title: "Gestión de cobros y honorarios", duration: "4 min", href: "/dashboard/tutoriales", icon: DollarSign, color: "violet" },
        { title: "Cómo usar el CRM de Leads", duration: "3 min", href: "/dashboard/tutoriales", icon: MessageSquare, color: "orange" },
    ];

    const QUICK_ACTIONS = [
        { label: "Nueva Propiedad", icon: Building2, href: "/dashboard/propiedades/nueva", color: "indigo", permission: "/dashboard/propiedades" },
        { label: "Nuevo Alquiler", icon: Key, href: "/dashboard/alquileres/nuevo", color: "emerald", permission: "/dashboard/alquileres" },
        { label: "Nueva Tasación", icon: Calculator, href: "/dashboard/tasacion", color: "violet", permission: "/dashboard/tasacion" },
        { label: "Ver Reportes", icon: BarChart3, href: "/dashboard/finanzas", color: "amber", permission: "/dashboard/finanzas" },
    ];
    
    // Limits logic
    let fallbackPropertiesLimit: number | null = null;
    let fallbackClientsLimit: number | null = null;
    
    if (stats.subscription) {
        const tier = stats.subscription.planTier?.toLowerCase() || '';
        if (tier === 'basic') {
            fallbackPropertiesLimit = 50;
            fallbackClientsLimit = 999999; 
        } else if (tier === 'professional' || tier === 'pro') {
            fallbackPropertiesLimit = 150;
            fallbackClientsLimit = 999999;
        } else if (tier === 'enterprise') {
            fallbackPropertiesLimit = 500;
            fallbackClientsLimit = 999999;
        } else {
            fallbackPropertiesLimit = 50; 
            fallbackClientsLimit = 999999;
        }
    } else {
        // Cliente Free limits
        fallbackPropertiesLimit = 10;
        fallbackClientsLimit = 10;
    }

    const propertiesLimit = stats.plan?.limits?.properties ?? fallbackPropertiesLimit;
    const clientsLimit = stats.plan?.limits?.clients ?? fallbackClientsLimit;
    
    const renderLimit = (current: number, limitObj: any) => {
        if (limitObj === undefined || limitObj === null) return current.toString();
        if (limitObj === 'unlimited' || (typeof limitObj === 'number' && limitObj > 900000)) {
             return `${current} / ∞`;
        }
        return `${current} / ${limitObj}`;
    };

    return (
        <div className="min-h-screen bg-[#F8F9FC] p-5 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ─── HEADER ──────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                            {getGreeting()}, {user?.displayName?.split(' ')[0] || 'Colega'}! 👋
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                            {stats.subscription && (
                                <span className="ml-2 text-indigo-600 font-medium capitalize">· Plan {stats.subscription.planTier}</span>
                            )}
                        </p>
                    </div>
                    <Link
                        href="/dashboard/propiedades/nueva"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 font-medium text-sm"
                    >
                        <Plus size={18} />
                        Nueva Propiedad
                    </Link>
                </div>

                {/* ─── KPI CARDS (4 columnas) ───────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Propiedades */}
                    <Link
                        href="/dashboard/propiedades"
                        className={`group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 hover:-translate-y-0.5 ${!userPermissions.includes('/dashboard/propiedades') ? 'pointer-events-none opacity-70' : ''}`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2.5 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                                <Building2 size={22} className="text-indigo-600" />
                            </div>
                            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                                <ArrowUpRight size={11} />
                                Activas
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl font-bold text-gray-900">{renderLimit(stats.totalProperties, propertiesLimit)}</p>
                            <p className="text-sm text-gray-500 font-medium">Propiedades</p>
                        </div>
                        <div className="mt-3 flex items-center gap-1 text-xs text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Ver propiedades <ChevronRight size={12} />
                        </div>
                    </Link>

                    {/* Alquileres */}
                    <Link
                        href="/dashboard/alquileres"
                        className={`group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 hover:-translate-y-0.5 ${!userPermissions.includes('/dashboard/alquileres') ? 'pointer-events-none opacity-70' : ''}`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2.5 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                                <Key size={22} className="text-emerald-600" />
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                                <ArrowUpRight size={11} />
                                Activos
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl font-bold text-gray-900">{renderLimit(stats.activeRentals, propertiesLimit)}</p>
                            <p className="text-sm text-gray-500 font-medium">Alquileres</p>
                        </div>
                        <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Ver alquileres <ChevronRight size={12} />
                        </div>
                    </Link>

                    {/* Clientes */}
                    <Link
                        href="/dashboard/clientes"
                        className={`group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-violet-200 transition-all duration-200 hover:-translate-y-0.5 ${!userPermissions.includes('/dashboard/clientes') ? 'pointer-events-none opacity-70' : ''}`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2.5 bg-violet-50 rounded-xl group-hover:bg-violet-100 transition-colors">
                                <UserCheck size={22} className="text-violet-600" />
                            </div>
                            <span className="text-[11px] font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                                <ArrowUpRight size={11} />
                                Total
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl font-bold text-gray-900">{renderLimit(stats.totalClientes, clientsLimit)}</p>
                            <p className="text-sm text-gray-500 font-medium">Clientes</p>
                        </div>
                        <div className="mt-3 flex items-center gap-1 text-xs text-violet-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Ver clientes <ChevronRight size={12} />
                        </div>
                    </Link>

                    {/* Comisiones */}
                    <Link
                        href="/dashboard/finanzas"
                        className={`group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-200 hover:-translate-y-0.5 ${!userPermissions.includes('/dashboard/finanzas') ? 'pointer-events-none opacity-70' : ''}`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2.5 bg-amber-50 rounded-xl group-hover:bg-amber-100 transition-colors">
                                <TrendingUp size={22} className="text-amber-600" />
                            </div>
                            <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                                Este mes
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-gray-900 leading-tight">{formatCurrency(stats.honorariosMonth)}</p>
                            <p className="text-sm text-gray-500 font-medium">Comisiones</p>
                        </div>
                        <div className="mt-3 flex items-center gap-1 text-xs text-amber-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Ver finanzas <ChevronRight size={12} />
                        </div>
                    </Link>
                </div>

                {/* ─── FILA PRINCIPAL (3 columnas) ─────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* PRÓXIMOS VENCIMIENTOS */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-orange-50 rounded-lg">
                                    <Calendar size={18} className="text-orange-500" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-900 text-sm">Próximos Vencimientos</h2>
                                    <p className="text-xs text-gray-400">Próximos 10 días</p>
                                </div>
                            </div>
                            {stats.proximosVencimientos.length > 0 && (
                                <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                                    {stats.proximosVencimientos.length}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 divide-y divide-gray-50">
                            {stats.proximosVencimientos.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                                        <CheckCircle2 size={24} className="text-green-500" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-700">Sin vencimientos próximos</p>
                                    <p className="text-xs text-gray-400 mt-1">Todo al día 🎉</p>
                                </div>
                            ) : (
                                stats.proximosVencimientos.map((v, i) => (
                                    <Link
                                        key={`${v.alquilerId}-${i}`}
                                        href={`/dashboard/alquileres?id=${v.alquilerId}`}
                                        className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                                    >
                                        <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${v.estado === 'vencido' ? 'bg-red-50' : v.diasRestantes <= 3 ? 'bg-orange-50' : 'bg-yellow-50'}`}>
                                            {v.estado === 'vencido' ? (
                                                <AlertTriangle size={14} className="text-red-500" />
                                            ) : (
                                                <Clock size={14} className={v.diasRestantes <= 3 ? "text-orange-500" : "text-yellow-500"} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{v.direccion}</p>
                                            <p className="text-xs text-gray-400 truncate">{v.nombreInquilino}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-bold text-gray-900">{formatCurrency(v.monto)}</p>
                                            <p className={`text-xs font-medium ${v.estado === 'vencido' ? 'text-red-500' : v.diasRestantes <= 3 ? 'text-orange-500' : 'text-gray-400'}`}>
                                                {v.estado === 'vencido' ? `Venció hace ${Math.abs(v.diasRestantes)}d` : v.diasRestantes === 0 ? 'Hoy' : `En ${v.diasRestantes}d`}
                                            </p>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>

                        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                            <Link href="/dashboard/alquileres" className="flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                                Ver todos los alquileres <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>

                    {/* NUEVAS CONSULTAS */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <MessageSquare size={18} className="text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-900 text-sm">Nuevas Consultas</h2>
                                    <p className="text-xs text-gray-400">Últimas recibidas</p>
                                </div>
                            </div>
                            {stats.totalLeads > 0 && (
                                <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                                    {stats.totalLeads}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 divide-y divide-gray-50">
                            {stats.recentLeads.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                                        <MessageSquare size={24} className="text-blue-300" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-700">Sin consultas aún</p>
                                    <p className="text-xs text-gray-400 mt-1">Las consultas de tus propiedades aparecerán aquí</p>
                                </div>
                            ) : (
                                stats.recentLeads.map((lead: any) => (
                                    <Link
                                        key={lead.id}
                                        href={`/dashboard/leads?id=${lead.id}`}
                                        className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold text-sm">
                                            {lead.nombre?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-gray-900 truncate">{lead.nombre}</p>
                                                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                                    lead.estado === 'nuevo' ? 'bg-green-100 text-green-700' :
                                                    lead.estado === 'contactado' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {lead.estado}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 truncate mt-0.5">{lead.propertyTitle || 'Consulta general'}</p>
                                        </div>
                                        <p className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">
                                            {lead.createdAt?.seconds
                                                ? format(new Date(lead.createdAt.seconds * 1000), 'dd/MM')
                                                : format(new Date(lead.createdAt), 'dd/MM')}
                                        </p>
                                    </Link>
                                ))
                            )}
                        </div>

                        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                            <Link href="/dashboard/leads" className="flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                                Ver todas las consultas <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>

                    {/* TUTORIALES */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-violet-50 rounded-lg">
                                    <GraduationCap size={18} className="text-violet-500" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-900 text-sm">Tutoriales</h2>
                                    <p className="text-xs text-gray-400">Aprendé a usar la plataforma</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 divide-y divide-gray-50">
                            {TUTORIALS.map((t, i) => {
                                const colorMap: Record<string, string> = {
                                    indigo: "bg-indigo-50 text-indigo-600",
                                    emerald: "bg-emerald-50 text-emerald-600",
                                    violet: "bg-violet-50 text-violet-600",
                                    orange: "bg-orange-50 text-orange-600",
                                };
                                return (
                                    <Link key={i} href={t.href} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                                        <div className={`p-2 rounded-lg flex-shrink-0 ${colorMap[t.color]}`}>
                                            <t.icon size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 leading-tight">{t.title}</p>
                                            <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                                                <PlayCircle size={11} />
                                                {t.duration}
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                            <Link href="/dashboard/tutoriales" className="flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                                Ver todos los tutoriales <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ─── ACCESOS RÁPIDOS ──────────────────────────────────── */}
                <div>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Accesos Rápidos</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {QUICK_ACTIONS.filter(a => !a.permission || userPermissions.includes(a.permission)).map((action, i) => {
                            const colorMap: Record<string, { bg: string; icon: string; hover: string }> = {
                                indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", hover: "hover:bg-indigo-100 hover:border-indigo-200" },
                                emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", hover: "hover:bg-emerald-100 hover:border-emerald-200" },
                                violet: { bg: "bg-violet-50", icon: "text-violet-600", hover: "hover:bg-violet-100 hover:border-violet-200" },
                                amber: { bg: "bg-amber-50", icon: "text-amber-600", hover: "hover:bg-amber-100 hover:border-amber-200" },
                            };
                            const c = colorMap[action.color];
                            return (
                                <Link
                                    key={i}
                                    href={action.href}
                                    className={`flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm ${c.hover} transition-all group`}
                                >
                                    <div className={`p-2.5 ${c.bg} rounded-lg group-hover:scale-110 transition-transform`}>
                                        <action.icon size={18} className={c.icon} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{action.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}