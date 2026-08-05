"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/infrastructure/firebase/client";
import { collection, query, where, getDocs, getDoc, doc, orderBy } from "firebase/firestore";
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
    Camera,
    CreditCard,
    Globe,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/ui/context/AuthContext";
import { useBranchContext } from "@/infrastructure/context/BranchContext";
import { AnnouncementBanner } from "@/ui/components/dashboard/AnnouncementBanner";

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

    // Data that does NOT depend on the selected branch (leads, alquileres, subscription,
    // inquilinos, propietarios) — fetched once per user session instead of on every
    // branch switch, since it was previously being re-read from Firestore in full on
    // each change even though only the properties count actually varies by branch.
    const [baseData, setBaseData] = useState<{
        leads: Lead[];
        alquileres: Alquiler[];
        subDocData: any;
        planData: any;
        totalClientes: number;
    } | null>(null);

    useEffect(() => {
        if (!auth) { setLoading(false); return; }
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) { router.push("/login"); return; }
            setUser(u);
        });
        return () => unsub();
    }, [router]);

    useEffect(() => {
        if (user) fetchBaseData(user.uid);
    }, [user]);

    useEffect(() => {
        if (user && baseData) computeStats(user.uid, selectedBranchId, baseData);
    }, [user, selectedBranchId, baseData]);

    const fetchBaseData = async (userId: string) => {
        if (!db) return;
        try {
            const subQuery = query(collection(db, "subscriptions"), where("userId", "==", userId), where("status", "==", "active"), orderBy("createdAt", "desc"));
            const inquilinosQuery = query(collection(db, "inquilinos"), where("userId", "==", userId));
            const propietariosQuery = query(collection(db, "propietarios"), where("userId", "==", userId));

            const [leads, alquileres, subSnapshot, inquilinosSnap, propietariosSnap] = await Promise.all([
                leadsService.getLeads(userId),
                alquileresService.getAlquileres(userId),
                getDocs(subQuery),
                getDocs(inquilinosQuery),
                getDocs(propietariosQuery),
            ]);

            let planData = null;
            const rawSub = !subSnapshot.empty ? subSnapshot.docs[0].data() : null;
            const subDocData: any = rawSub ? {
                ...rawSub,
                endDate: rawSub.endDate?.toDate ? rawSub.endDate.toDate() : rawSub.endDate,
                startDate: rawSub.startDate?.toDate ? rawSub.startDate.toDate() : rawSub.startDate,
            } : null;
            if (subDocData?.planId) {
                const planSnap = await getDoc(doc(db, "plans", subDocData.planId));
                if (planSnap.exists()) {
                    planData = planSnap.data();
                } else if (subDocData?.planTier) {
                    const qPlan = query(collection(db, "plans"), where("tier", "==", subDocData.planTier));
                    const planSnaps = await getDocs(qPlan);
                    if (!planSnaps.empty) planData = planSnaps.docs[0].data();
                }
            } else if (subDocData?.planTier) {
                const qPlan = query(collection(db, "plans"), where("tier", "==", subDocData.planTier));
                const planSnaps = await getDocs(qPlan);
                if (!planSnaps.empty) planData = planSnaps.docs[0].data();
            }

            setBaseData({
                leads,
                alquileres,
                subDocData,
                planData,
                totalClientes: inquilinosSnap.size + propietariosSnap.size,
            });
        } catch (error) {
            console.error("Error fetching dashboard base data:", error);
            setLoading(false);
        }
    };

    const computeStats = async (userId: string, branchId: string, baseSnapshot: NonNullable<typeof baseData>) => {
        if (!db) return;
        try {
            let propsQuery = query(collection(db, "properties"), where("userId", "==", userId));
            if (branchId !== 'all') propsQuery = query(propsQuery, where("branchId", "==", branchId));

            const propsSnapshot = await getDocs(propsQuery);
            const { leads, alquileres, subDocData, planData, totalClientes } = baseSnapshot;

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

            setStats({
                totalProperties: propsSnapshot.size,
                totalAlquileres: filteredAlquileres.length,
                activeRentals,
                totalLeads: filteredLeads.length,
                honorariosMonth,
                recentLeads,
                proximosVencimientos: proximosVencimientos.slice(0, 5),
                totalClientes,
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
        fallbackPropertiesLimit = 50;
        fallbackClientsLimit = 50;
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
            <div className="max-w-7xl mx-auto space-y-8 pb-10">
                <AnnouncementBanner />

                {/* ─── 1. BANNER DE BIENVENIDA Y GUÍA ─────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
                    {/* Tarjeta de Bienvenida */}
                    <div className="lg:col-span-5 relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 rounded-3xl p-8 overflow-hidden shadow-xl shadow-indigo-900/20 flex flex-col justify-between">
                        <div className="relative z-10">
                            <span className="inline-block px-3 py-1 mb-4 text-[10px] font-bold uppercase tracking-widest text-indigo-200 bg-white/10 rounded-full border border-white/20 backdrop-blur-md">
                                Inicio
                            </span>
                            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-3">
                                {getGreeting()}, {user?.displayName?.split(' ')[0] || 'Colega'} 👋
                            </h1>
                            <p className="text-indigo-200 text-sm font-medium leading-relaxed mb-6">
                                Estás en tu ecosistema inmobiliario digital. Diseñado para optimizar tu tiempo, ya seas profesional, inmobiliaria o un particular gestionando sus alquileres.
                            </p>
                        </div>
                        <div className="relative z-10 flex gap-3">
                            <Link href="/dashboard/propiedades/nueva" className="bg-white hover:bg-indigo-50 text-indigo-900 font-bold px-5 py-3 rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2 text-sm flex-1 justify-center">
                                <Plus size={18} /> Cargar Propiedad
                            </Link>
                        </div>
                        <div className="absolute -right-10 top-0 bottom-0 w-2/3 opacity-20 pointer-events-none flex items-center justify-end">
                            <Building2 size={240} className="text-white rotate-12" strokeWidth={0.5} />
                        </div>
                    </div>

                    {/* Guía de Funcionalidades */}
                    <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link href="/dashboard/propiedades" className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col h-full">
                            <div className="w-11 h-11 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-100 transition-all">
                                <Home size={22} className="text-indigo-600" />
                            </div>
                            <h3 className="text-[15px] font-bold text-gray-900 mb-1.5">Gestión de Inventario</h3>
                            <p className="text-[13px] text-gray-500 font-medium leading-relaxed">Publicá y administrá tus propiedades, subí fotos de alta calidad y ubicá todo en el mapa.</p>
                        </Link>
                        
                        <Link href="/dashboard/leads" className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group flex flex-col h-full">
                            <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                                <MessageSquare size={22} className="text-blue-600" />
                            </div>
                            <h3 className="text-[15px] font-bold text-gray-900 mb-1.5">CRM y Clientes</h3>
                            <p className="text-[13px] text-gray-500 font-medium leading-relaxed">Respondé consultas, seguí tus ventas paso a paso y no pierdas ningún contacto potencial.</p>
                        </Link>
                        
                        <Link href="/dashboard/alquileres" className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group flex flex-col h-full">
                            <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-emerald-100 transition-all">
                                <Key size={22} className="text-emerald-600" />
                            </div>
                            <h3 className="text-[15px] font-bold text-gray-900 mb-1.5">Alquileres y Cobros</h3>
                            <p className="text-[13px] text-gray-500 font-medium leading-relaxed">Controlá vencimientos, generá contratos automáticos y administrá los pagos mensuales.</p>
                        </Link>
                        
                        <Link href="/dashboard/mi-sitio" className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:border-violet-300 hover:shadow-md transition-all group flex flex-col h-full">
                            <div className="w-11 h-11 bg-violet-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-violet-100 transition-all">
                                <Globe size={22} className="text-violet-600" />
                            </div>
                            <h3 className="text-[15px] font-bold text-gray-900 mb-1.5">Tu Inmobiliaria Web</h3>
                            <p className="text-[13px] text-gray-500 font-medium leading-relaxed">Personalizá tu propia página web pública para que tus clientes vean tu catálogo y tu marca.</p>
                        </Link>
                    </div>
                </div>

                {/* ─── 2. SUSCRIPCIÓN ───────────────────────────────────── */}
                {stats.subscription && (
                    <div className="bg-white rounded-2xl border border-violet-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-violet-100">
                                <CreditCard size={20} className="text-violet-600" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-extrabold text-gray-900">{stats.plan?.name || `Plan ${stats.subscription.planTier}`}</p>
                                    <span className="bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-green-200">Activa</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {stats.subscription.billingPeriod === 'monthly' ? 'Mensual' :
                                     stats.subscription.billingPeriod === 'quarterly' ? 'Trimestral' : 'Anual'}
                                    {stats.subscription.amount ? ` · ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(stats.subscription.amount)}` : ''}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 sm:gap-8">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vence el</p>
                                <p className="font-extrabold text-gray-900 text-sm mt-0.5">
                                    {stats.subscription.endDate instanceof Date
                                        ? format(stats.subscription.endDate, "d MMM yyyy", { locale: es })
                                        : '—'}
                                </p>
                            </div>
                            <Link href="/precios" className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 whitespace-nowrap">
                                Cambiar plan <ArrowRight size={13} />
                            </Link>
                        </div>
                    </div>
                )}

                {/* ─── 3. MÓDULO DE PROPIEDADES ─────────────────────────── */}
                <section>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-indigo-100 rounded-lg"><Building2 size={18} className="text-indigo-600" /></div>
                        <h2 className="text-xl font-bold text-gray-900">Módulo de Propiedades</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {/* Status properties (2 cols) */}
                        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col justify-between relative overflow-hidden group hover:border-indigo-200 transition-colors">
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Inventario Activo</p>
                                    <p className="text-6xl font-extrabold text-gray-900 tracking-tight">{stats.totalProperties}</p>
                                </div>
                                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                    <CheckCircle2 size={14} /> Saludable
                                </span>
                            </div>

                            <div className="space-y-3 relative z-10">
                                <div className="flex justify-between text-sm font-semibold">
                                    <span className="text-gray-500">Límite del Plan {stats.subscription?.planTier || 'Actual'}</span>
                                    <span className="text-indigo-600 font-bold">{renderLimit(stats.totalProperties, propertiesLimit)}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                                    <div
                                        className="h-full rounded-full bg-indigo-500 transition-all duration-1000 ease-out relative overflow-hidden"
                                        style={{ width: typeof propertiesLimit === 'number' ? `${Math.min((stats.totalProperties / propertiesLimit) * 100, 100)}%` : '20%' }}
                                    ></div>
                                </div>
                            </div>
                            <Building2 size={160} className="absolute -right-8 -bottom-8 text-indigo-50 opacity-40 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
                        </div>

                        {/* Quick Add (1 col) */}
                        <div className="lg:col-span-1 bg-gradient-to-b from-gray-50 to-white rounded-3xl border border-gray-100 shadow-sm p-3 flex flex-col gap-3">
                            <Link href="/dashboard/propiedades/nueva" className="flex-1 flex flex-col items-center justify-center p-6 bg-white hover:bg-indigo-50/50 rounded-2xl transition-all border border-dashed border-gray-300 hover:border-indigo-400 group relative overflow-hidden">
                                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-indigo-500/20 transition-all relative z-10">
                                    <Plus size={28} strokeWidth={2.5} />
                                </div>
                                <span className="text-[15px] font-bold text-gray-800 relative z-10">Cargar propiedad</span>
                            </Link>
                            <Link href="/dashboard/propiedades" className="py-4 px-4 text-center text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-2xl transition flex items-center justify-center gap-2 relative">
                                Ir al inventario <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ─── 3. MÓDULO DE ALQUILERES ──────────────────────────── */}
                <section>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-emerald-100 rounded-lg"><Key size={18} className="text-emerald-600" /></div>
                        <h2 className="text-xl font-bold text-gray-900">Módulo de Alquileres</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {/* KPI Alquileres (1 col) */}
                        <div className="lg:col-span-1 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col justify-center relative overflow-hidden group hover:border-emerald-200 transition-colors">
                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8 relative z-10 group-hover:scale-110 transition-transform">
                                <Key size={26} className="text-emerald-600" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-5xl font-extrabold text-gray-900 tracking-tight mb-2">{stats.activeRentals}</p>
                                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">Contratos Activos</p>
                            </div>
                            <Link href="/dashboard/alquileres" className="absolute inset-0 z-20"></Link>
                            <div className="mt-8 pt-5 border-t border-gray-100 relative z-10 flex items-center justify-between pointer-events-none">
                                <span className="text-xs font-bold text-emerald-600">Ver contratos</span>
                                <ChevronRight size={16} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <Key size={140} className="absolute -right-8 -top-8 text-emerald-50 opacity-30 group-hover:rotate-12 transition-transform duration-500 pointer-events-none" />
                        </div>

                        {/* Próximos Vencimientos (2 cols) */}
                        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col relative">
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-orange-100 rounded-xl">
                                        <Calendar size={20} className="text-orange-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-[15px]">Próximos Vencimientos</h3>
                                        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-widest mt-0.5">Siguientes 10 días</p>
                                    </div>
                                </div>
                                {stats.proximosVencimientos.length > 0 && (
                                    <span className="text-[11px] font-black bg-orange-100 text-orange-600 px-3 py-1 rounded-full border border-orange-200 shadow-sm">
                                        {stats.proximosVencimientos.length} PENDIENTES
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 divide-y divide-gray-50 min-h-[220px]">
                                {stats.proximosVencimientos.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full py-10 px-4 text-center">
                                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 border border-green-100 shadow-sm">
                                            <CheckCircle2 size={32} className="text-green-500" />
                                        </div>
                                        <p className="text-[16px] font-bold text-gray-800">Sin vencimientos próximos</p>
                                        <p className="text-[13px] font-medium text-gray-400 mt-1">Todo al día en tus cobranzas 🎉</p>
                                    </div>
                                ) : (
                                    stats.proximosVencimientos.map((v, i) => (
                                        <Link
                                            key={`${v.alquilerId}-${i}`}
                                            href={`/dashboard/alquileres?id=${v.alquilerId}`}
                                            className="flex items-center gap-4 px-6 py-4.5 hover:bg-orange-50/30 transition-colors group"
                                        >
                                            <div className={`p-3 rounded-xl flex-shrink-0 shadow-sm border ${v.estado === 'vencido' ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
                                                {v.estado === 'vencido' ? (
                                                    <AlertTriangle size={20} className="text-red-500" />
                                                ) : (
                                                    <Clock size={20} className={v.diasRestantes <= 3 ? "text-orange-500" : "text-gray-400"} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[15px] font-bold text-gray-900 truncate mb-1">{v.direccion}</p>
                                                <p className="text-xs font-medium text-gray-500 truncate text-emerald-700/80">{v.nombreInquilino}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-[16px] font-black text-gray-900">{formatCurrency(v.monto)}</p>
                                                <p className={`text-[11px] font-bold uppercase tracking-wider mt-1.5 ${v.estado === 'vencido' ? 'text-red-500' : v.diasRestantes <= 3 ? 'text-orange-600' : 'text-gray-400'}`}>
                                                    {v.estado === 'vencido' ? `Venció hace ${Math.abs(v.diasRestantes)}d` : v.diasRestantes === 0 ? 'Hoy' : `En ${v.diasRestantes}d`}
                                                </p>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── 4. MÓDULO DE CLIENTES Y LEADS ────────────────────── */}
                <section>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-blue-100 rounded-lg"><Users size={18} className="text-blue-600" /></div>
                        <h2 className="text-xl font-bold text-gray-900">Módulo de Clientes & Leads</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {/* KPI Clientes (1 col) */}
                        <div className="lg:col-span-1 flex flex-col gap-5">
                            {/* Clientes Card */}
                            <Link href="/dashboard/clientes" className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-row items-center gap-6 hover:-translate-y-1 hover:shadow-lg hover:border-violet-200 hover:shadow-violet-500/10 transition-all group overflow-hidden relative">
                                <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 transition-colors z-10 border border-violet-100 shadow-sm">
                                    <UserCheck size={30} className="text-violet-600" />
                                </div>
                                <div className="z-10">
                                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Todos</p>
                                    <p className="text-4xl font-extrabold text-gray-900 tracking-tight">{renderLimit(stats.totalClientes, clientsLimit)}</p>
                                </div>
                                <UserCheck size={100} className="absolute -right-6 -bottom-6 text-violet-50 opacity-40 group-hover:rotate-6 transition-transform z-0 pointer-events-none" />
                            </Link>

                            {/* Tip del dia */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-100/50 shadow-sm p-7 flex-1 relative overflow-hidden group">
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-1.5 bg-amber-200/50 rounded-lg">
                                            <Star size={16} className="text-amber-600 fill-amber-600" />
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-widest text-amber-700">Tip Inmobiliario</span>
                                    </div>
                                    <p className="text-[14px] font-bold text-gray-800 leading-relaxed mb-6">
                                        ¿Sabías que responder a un contacto en los <strong className="text-amber-700">primeros 5 minutos</strong> aumenta un 80% tus chances de concretar una visita?
                                    </p>
                                    <div className="mt-auto">
                                        <Link href="/dashboard/leads" className="inline-flex items-center gap-2.5 text-[13px] font-bold text-white bg-gray-900 hover:bg-black px-5 py-3 rounded-xl shadow-md transition-all active:scale-95 group-hover:shadow-xl w-max">
                                            <MessageSquare size={16} /> Responder Consultas
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Nuevas Consultas (2 cols) */}
                        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-100 rounded-xl">
                                        <MessageSquare size={20} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-[15px]">Nuevas Consultas</h3>
                                        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-widest mt-0.5">Leads entrantes</p>
                                    </div>
                                </div>
                                {stats.totalLeads > 0 && (
                                    <span className="text-[11px] font-black bg-blue-100 text-blue-600 px-3 py-1 rounded-full border border-blue-200 shadow-sm">
                                        {stats.totalLeads} LEADS
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 divide-y divide-gray-50 min-h-[220px]">
                                {stats.recentLeads.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full py-10 px-4 text-center">
                                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100 shadow-sm">
                                            <MessageSquare size={28} className="text-blue-400" />
                                        </div>
                                        <p className="text-[16px] font-bold text-gray-800">Bandeja limpia</p>
                                        <p className="text-[13px] font-medium text-gray-400 mt-1">Acá van a llegar las consultas de los clientes interesados</p>
                                    </div>
                                ) : (
                                    stats.recentLeads.map((lead: any) => (
                                        <Link
                                            key={lead.id}
                                            href={`/dashboard/leads?id=${lead.id}`}
                                            className="flex items-center gap-5 px-6 py-4.5 hover:bg-blue-50/30 transition-colors group"
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-700 font-black text-[17px] shadow-sm">
                                                {lead.nombre?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1.5">
                                                    <p className="text-[15px] font-bold text-gray-900 truncate">{lead.nombre}</p>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md flex-shrink-0 border ${lead.estado === 'nuevo' ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' :
                                                        lead.estado === 'contactado' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            'bg-gray-50 text-gray-600 border-gray-200'
                                                        }`}>
                                                        {lead.estado}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-[13px] font-medium text-gray-500 truncate">{lead.propertyTitle || 'Consulta general por sistema'}</p>
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex-shrink-0">
                                                        {lead.createdAt?.seconds
                                                            ? format(new Date(lead.createdAt.seconds * 1000), 'dd/MM')
                                                            : format(new Date(lead.createdAt), 'dd/MM')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── 6. MÓDULO FINANCIERO & SOPORTE ───────────────────── */}
                <section>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-amber-100 rounded-lg"><DollarSign size={18} className="text-amber-600" /></div>
                        <h2 className="text-xl font-bold text-gray-900">Módulo Financiero</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {/* Comisiones Anchas (2 Cols) */}
                        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-3xl shadow-xl shadow-indigo-900/10 p-8 text-white relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <div className="flex items-center gap-2.5 mb-2">
                                        <div className="p-1.5 bg-indigo-800/50 rounded-lg">
                                            <TrendingUp size={18} className="text-indigo-300" />
                                        </div>
                                        <p className="text-indigo-200 font-bold text-[12px] uppercase tracking-widest">Facturación del Mes</p>
                                    </div>
                                    <p className="text-6xl font-extrabold tracking-tight mt-3">{formatCurrency(stats.honorariosMonth)}</p>
                                </div>
                                <div className="mt-10 flex justify-between items-end">
                                    <Link href="/dashboard/finanzas" className="bg-white/10 hover:bg-white/20 transition-all border border-white/20 backdrop-blur-md px-6 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2 active:scale-95 shadow-lg shadow-black/10">
                                        Ver reporte completo <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </div>
                            <div className="absolute -right-10 -bottom-10 pointer-events-none opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700">
                                <DollarSign size={240} />
                            </div>
                        </div>

                        {/* Accesos rápidos (1 col) */}
                        <div className="lg:col-span-1 bg-white rounded-3xl border border-gray-100 shadow-sm p-7 flex flex-col justify-center">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5">Herramientas Rápidas</h3>
                            <div className="space-y-3">
                                {QUICK_ACTIONS.filter(a => !a.permission || userPermissions.includes(a.permission)).map((action, i) => {
                                    const colorMap: Record<string, { bg: string; icon: string; hover: string }> = {
                                        indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", hover: "hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10" },
                                        emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", hover: "hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10" },
                                        violet: { bg: "bg-violet-50", icon: "text-violet-600", hover: "hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/10" },
                                        amber: { bg: "bg-amber-50", icon: "text-amber-600", hover: "hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10" },
                                    };
                                    const c = colorMap[action.color];
                                    return (
                                        <Link
                                            key={i}
                                            href={action.href}
                                            className={`flex items-center gap-4 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all group ${c.hover}`}
                                        >
                                            <div className={`p-2.5 ${c.bg} rounded-xl group-hover:scale-110 transition-transform shadow-sm`}>
                                                <action.icon size={18} className={c.icon} />
                                            </div>
                                            <span className="text-[14px] font-bold text-gray-800">{action.label}</span>
                                            <ChevronRight size={16} className="text-gray-300 ml-auto group-hover:text-gray-800 transition-colors" />
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}