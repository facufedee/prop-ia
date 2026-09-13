"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { db, auth } from "@/infrastructure/firebase/client";
import { collection, query, where, getDocs, getDoc, doc, orderBy, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { leadsService } from "@/infrastructure/services/leadsService";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { visitasService } from "@/infrastructure/services/visitasService";
import { Lead } from "@/domain/models/Lead";
import { Alquiler } from "@/domain/models/Alquiler";
import { Visita, VisitaEstado } from "@/domain/models/Visita";
import { MiniCalendar } from "@/ui/components/dashboard/MiniCalendar";
import { isSameMonth, addDays, format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import {
    Home,
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
    Camera,
    CreditCard,
    Globe,
    Newspaper,
    Instagram,
    Linkedin,
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

interface BlogPostSummary {
    id: string;
    title: string;
    slug: string;
    imageUrl: string;
    category: string;
    createdAt: Date | null;
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
        upcomingVisitas: [] as Visita[],
        visitaEventDates: [] as Date[],
    });
    const [loading, setLoading] = useState(true);
    const [blogPosts, setBlogPosts] = useState<BlogPostSummary[]>([]);

    // Data that does NOT depend on the selected branch (leads, alquileres, subscription,
    // inquilinos, propietarios) — fetched once per user session instead of on every
    // branch switch, since it was previously being re-read from Firestore in full on
    // each change even though only the properties count actually varies by branch.
    const [baseData, setBaseData] = useState<{
        leads: Lead[];
        alquileres: Alquiler[];
        visitas: Visita[];
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

    useEffect(() => {
        fetchBlogPosts();
    }, []);

    const fetchBlogPosts = async () => {
        if (!db) return;
        try {
            // Single equality filter + client-side sort, same pattern used across the
            // app, to avoid requiring a composite index for (published + createdAt).
            const q = query(collection(db, "blog_posts"), where("published", "==", true));
            const snap = await getDocs(q);
            const posts = snap.docs
                .map((docSnap) => {
                    const d = docSnap.data();
                    const createdAt = d.createdAt?.toDate ? d.createdAt.toDate() : (d.createdAt ?? null);
                    return {
                        id: docSnap.id,
                        title: d.title ?? "",
                        slug: d.slug ?? "",
                        imageUrl: d.imageUrl ?? "",
                        category: d.category ?? "",
                        createdAt,
                    } satisfies BlogPostSummary;
                })
                .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
                .slice(0, 5);
            setBlogPosts(posts);
        } catch (error) {
            console.error("Error fetching blog posts:", error);
        }
    };

    const fetchBaseData = async (userId: string) => {
        if (!db) return;
        try {
            const subQuery = query(collection(db, "subscriptions"), where("userId", "==", userId), where("status", "==", "active"), orderBy("createdAt", "desc"));
            const inquilinosQuery = query(collection(db, "inquilinos"), where("userId", "==", userId));
            const propietariosQuery = query(collection(db, "propietarios"), where("userId", "==", userId));

            const [leads, alquileres, visitas, subSnapshot, inquilinosSnap, propietariosSnap] = await Promise.all([
                leadsService.getLeads(userId),
                alquileresService.getAlquileres(userId),
                visitasService.getVisitas(userId),
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
                visitas,
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
            const { leads, alquileres, visitas, subDocData, planData, totalClientes } = baseSnapshot;

            const propertyIds = new Set(propsSnapshot.docs.map(d => d.id));

            const filteredLeads = branchId === 'all' ? leads : leads.filter(l => l.propertyId && propertyIds.has(l.propertyId));
            const filteredAlquileres = branchId === 'all' ? alquileres : alquileres.filter(a => propertyIds.has(a.propiedadId));
            const filteredVisitas = branchId === 'all' ? visitas : visitas.filter(v => propertyIds.has(v.propiedadId));

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

            const activeVisitaEstados: VisitaEstado[] = ['programada', 'confirmada'];
            const upcomingVisitas = filteredVisitas
                .filter(v => activeVisitaEstados.includes(v.estado) && v.fechaHora >= now)
                .sort((a, b) => a.fechaHora.getTime() - b.fechaHora.getTime())
                .slice(0, 4);
            const visitaEventDates = filteredVisitas
                .filter(v => activeVisitaEstados.includes(v.estado))
                .map(v => v.fechaHora);

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
                upcomingVisitas,
                visitaEventDates,
            });
            setLoading(false);
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);

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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* ─── COLUMNA PRINCIPAL ─────────────────────────────────── */}
                <div className="lg:col-span-8 space-y-8">

                {/* ─── 2. MÓDULO DE PROPIEDADES ─────────────────────────── */}
                <section>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-indigo-100 rounded-lg"><Building2 size={18} className="text-indigo-600" /></div>
                        <h2 className="text-xl font-bold text-gray-900">Módulo de Propiedades</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {/* Status properties (2 cols) */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col justify-between relative overflow-hidden group hover:border-indigo-200 transition-colors">
                            <div className="flex justify-between items-start mb-5 relative z-10">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Inventario Activo</p>
                                    <p className="text-4xl font-extrabold text-gray-900 tracking-tight">{stats.totalProperties}</p>
                                </div>
                                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                    <CheckCircle2 size={14} /> Saludable
                                </span>
                            </div>

                            <div className="space-y-2 relative z-10">
                                <div className="flex justify-between text-sm font-semibold">
                                    <span className="text-gray-500">Límite del Plan {stats.subscription?.planTier || 'Actual'}</span>
                                    <span className="text-indigo-600 font-bold">{renderLimit(stats.totalProperties, propertiesLimit)}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                                    <div
                                        className="h-full rounded-full bg-indigo-500 transition-all duration-1000 ease-out relative overflow-hidden"
                                        style={{ width: typeof propertiesLimit === 'number' ? `${Math.min((stats.totalProperties / propertiesLimit) * 100, 100)}%` : '20%' }}
                                    ></div>
                                </div>
                            </div>
                            <Building2 size={110} className="absolute -right-6 -bottom-6 text-indigo-50 opacity-40 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
                        </div>

                        {/* Quick Add (1 col) */}
                        <div className="lg:col-span-1 bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-200 shadow-sm p-2.5 flex flex-col gap-2.5">
                            <Link href="/dashboard/propiedades/nueva" className="flex-1 flex flex-col items-center justify-center p-4 bg-white hover:bg-indigo-50/50 rounded-xl transition-all border border-dashed border-gray-300 hover:border-indigo-400 group relative overflow-hidden">
                                <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-2.5 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-indigo-500/20 transition-all relative z-10">
                                    <Plus size={20} strokeWidth={2.5} />
                                </div>
                                <span className="text-[13px] font-bold text-gray-800 relative z-10">Cargar propiedad</span>
                            </Link>
                            <Link href="/dashboard/propiedades" className="py-2.5 px-4 text-center text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition flex items-center justify-center gap-2 relative">
                                Ir al inventario <ArrowRight size={14} />
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
                        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col justify-center relative overflow-hidden group hover:border-emerald-200 transition-colors">
                            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center mb-5 relative z-10 group-hover:scale-110 transition-transform">
                                <Key size={20} className="text-emerald-600" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">{stats.activeRentals}</p>
                                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">Contratos Activos</p>
                            </div>
                            <Link href="/dashboard/alquileres" className="absolute inset-0 z-20"></Link>
                            <div className="mt-5 pt-3 border-t border-gray-200 relative z-10 flex items-center justify-between pointer-events-none">
                                <span className="text-xs font-bold text-emerald-600">Ver contratos</span>
                                <ChevronRight size={16} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <Key size={100} className="absolute -right-6 -top-6 text-emerald-50 opacity-30 group-hover:rotate-12 transition-transform duration-500 pointer-events-none" />
                        </div>

                        {/* Próximos Vencimientos (2 cols) */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col relative">
                            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <Calendar size={16} className="text-orange-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-[14px]">Próximos Vencimientos</h3>
                                        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">Siguientes 10 días</p>
                                    </div>
                                </div>
                                {stats.proximosVencimientos.length > 0 && (
                                    <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full border border-orange-200 shadow-sm">
                                        {stats.proximosVencimientos.length} PENDIENTES
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 divide-y divide-gray-50 min-h-[150px]">
                                {stats.proximosVencimientos.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center">
                                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3 border border-green-100 shadow-sm">
                                            <CheckCircle2 size={24} className="text-green-500" />
                                        </div>
                                        <p className="text-[14px] font-bold text-gray-800">Sin vencimientos próximos</p>
                                        <p className="text-[12px] font-medium text-gray-400 mt-1">Todo al día en tus cobranzas 🎉</p>
                                    </div>
                                ) : (
                                    stats.proximosVencimientos.map((v, i) => (
                                        <Link
                                            key={`${v.alquilerId}-${i}`}
                                            href={`/dashboard/alquileres?id=${v.alquilerId}`}
                                            className="flex items-center gap-3 px-5 py-3 hover:bg-orange-50/30 transition-colors group"
                                        >
                                            <div className={`p-2 rounded-lg flex-shrink-0 shadow-sm border ${v.estado === 'vencido' ? 'bg-red-50 border-red-100' : 'bg-white border-gray-200'}`}>
                                                {v.estado === 'vencido' ? (
                                                    <AlertTriangle size={16} className="text-red-500" />
                                                ) : (
                                                    <Clock size={16} className={v.diasRestantes <= 3 ? "text-orange-500" : "text-gray-400"} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-bold text-gray-900 truncate">{v.direccion}</p>
                                                <p className="text-[11px] font-medium text-gray-500 truncate text-emerald-700/80">{v.nombreInquilino}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-[13px] font-black text-gray-900">{formatCurrency(v.monto)}</p>
                                                <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${v.estado === 'vencido' ? 'text-red-500' : v.diasRestantes <= 3 ? 'text-orange-600' : 'text-gray-400'}`}>
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

                </div>
                {/* ─── SIDEBAR: AGENDA DE VISITAS ────────────────────────── */}
                <div className="lg:col-span-4 space-y-5">
                    {/* Spacer invisible para alinear el calendario con las tarjetas de la columna principal (que arrancan debajo de un título de sección) */}
                    <div className="hidden lg:flex items-center gap-3 mb-5 invisible" aria-hidden="true">
                        <div className="p-2 rounded-lg"><Calendar size={18} /></div>
                        <h2 className="text-xl font-bold">Agenda</h2>
                    </div>

                    <MiniCalendar eventDates={stats.visitaEventDates} />

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Calendar size={16} className="text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-[14px]">Próximas Visitas</h3>
                                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">Agendadas y confirmadas</p>
                                </div>
                            </div>
                            <Link href="/dashboard/calendario" className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                                Ver <ArrowRight size={13} />
                            </Link>
                        </div>

                        <div className="flex-1 divide-y divide-gray-50 min-h-[120px]">
                            {stats.upcomingVisitas.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center">
                                    <Link
                                        href="/dashboard/calendario/nueva"
                                        className="inline-flex items-center gap-2 text-[13px] font-bold text-white bg-orange-500 hover:bg-orange-600 px-4 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
                                    >
                                        <Plus size={15} /> Agenda tu visita
                                    </Link>
                                </div>
                            ) : (
                                stats.upcomingVisitas.map((v) => (
                                    <Link
                                        key={v.id}
                                        href={`/dashboard/calendario/${v.id}`}
                                        className="flex items-center gap-3 px-5 py-3 hover:bg-orange-50/30 transition-colors group"
                                    >
                                        <div className="p-2 rounded-lg bg-orange-50 border border-orange-100 flex-shrink-0">
                                            <Clock size={16} className="text-orange-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-bold text-gray-900 truncate">{v.propiedadDireccion}</p>
                                            <p className="text-[11px] font-medium text-gray-500 truncate">{v.clienteNombre}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-[12px] font-black text-gray-900">{format(v.fechaHora, "d MMM", { locale: es })}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">{format(v.fechaHora, "HH:mm")}</p>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
                </div>

                {/* ─── 4. MÓDULO DE CLIENTES Y LEADS ────────────────────── */}
                <section>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-blue-100 rounded-lg"><Users size={18} className="text-blue-600" /></div>
                        <h2 className="text-xl font-bold text-gray-900">Módulo de Clientes & Leads</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {/* KPI Clientes (1 col) */}
                        <Link href="/dashboard/clientes" className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-row items-center gap-4 hover:-translate-y-1 hover:shadow-lg hover:border-violet-200 hover:shadow-violet-500/10 transition-all group overflow-hidden relative">
                            <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 transition-colors z-10 border border-violet-100 shadow-sm">
                                <UserCheck size={20} className="text-violet-600" />
                            </div>
                            <div className="z-10">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Todos</p>
                                <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{renderLimit(stats.totalClientes, clientsLimit)}</p>
                            </div>
                            <UserCheck size={70} className="absolute -right-4 -bottom-4 text-violet-50 opacity-40 group-hover:rotate-6 transition-transform z-0 pointer-events-none" />
                        </Link>

                        {/* Nuevas Consultas (2 cols) */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <MessageSquare size={16} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-[14px]">Nuevas Consultas</h3>
                                        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">Leads entrantes</p>
                                    </div>
                                </div>
                                {stats.totalLeads > 0 && (
                                    <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2.5 py-1 rounded-full border border-blue-200 shadow-sm">
                                        {stats.totalLeads} LEADS
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 divide-y divide-gray-50 min-h-[150px]">
                                {stats.recentLeads.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center">
                                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3 border border-blue-100 shadow-sm">
                                            <MessageSquare size={22} className="text-blue-400" />
                                        </div>
                                        <p className="text-[14px] font-bold text-gray-800">Bandeja limpia</p>
                                        <p className="text-[12px] font-medium text-gray-400 mt-1">Acá van a llegar las consultas de los clientes interesados</p>
                                    </div>
                                ) : (
                                    stats.recentLeads.map((lead: any) => (
                                        <Link
                                            key={lead.id}
                                            href={`/dashboard/leads?id=${lead.id}`}
                                            className="flex items-center gap-3.5 px-5 py-3 hover:bg-blue-50/30 transition-colors group"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-700 font-black text-[13px] shadow-sm">
                                                {lead.nombre?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-[13px] font-bold text-gray-900 truncate">{lead.nombre}</p>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md flex-shrink-0 border ${lead.estado === 'nuevo' ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' :
                                                        lead.estado === 'contactado' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            'bg-gray-50 text-gray-600 border-gray-200'
                                                        }`}>
                                                        {lead.estado}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[12px] font-medium text-gray-500 truncate">{lead.propertyTitle || 'Consulta general por sistema'}</p>
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full flex-shrink-0"></span>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex-shrink-0">
                                                        {lead.createdAt?.seconds
                                                            ? format(new Date(lead.createdAt.seconds * 1000), 'dd/MM')
                                                            : format(new Date(lead.createdAt), 'dd/MM')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── 5. ÚLTIMAS NOVEDADES DEL BLOG ────────────────────── */}
                <section>
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-pink-100 rounded-lg"><Newspaper size={18} className="text-pink-600" /></div>
                            <h2 className="text-xl font-bold text-gray-900">Últimas Novedades</h2>
                        </div>
                        <Link href="/blog" target="_blank" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 whitespace-nowrap">
                            Ver más <ArrowRight size={13} />
                        </Link>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {blogPosts.length === 0 ? (
                            <div className="flex-shrink-0 w-full bg-white rounded-2xl border border-gray-200 shadow-sm py-8 px-4 text-center">
                                <p className="text-[13px] font-medium text-gray-400">Todavía no hay artículos publicados</p>
                            </div>
                        ) : (
                            blogPosts.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/blog/${post.slug}`}
                                    target="_blank"
                                    className="flex-shrink-0 w-64 snap-start bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:border-pink-300 hover:shadow-md transition-all group"
                                >
                                    <div className="h-32 bg-gray-100 relative overflow-hidden">
                                        {post.imageUrl ? (
                                            <Image src={post.imageUrl} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="256px" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <Newspaper size={28} />
                                            </div>
                                        )}
                                        {post.category && (
                                            <span className="absolute top-2.5 left-2.5 text-[9px] font-black uppercase tracking-widest text-pink-700 bg-white/90 px-2 py-1 rounded-full shadow-sm">{post.category}</span>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <p className="text-[13px] font-bold text-gray-900 leading-snug line-clamp-2">{post.title}</p>
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-600 mt-2 group-hover:gap-1.5 transition-all">
                                            Leer más <ArrowRight size={12} />
                                        </span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </section>

                {/* ─── BANNER DE REDES SOCIALES ─────────────────────────── */}
                <div className="relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 rounded-2xl p-7 overflow-hidden shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                    <div className="relative z-10">
                        <span className="inline-block px-2.5 py-1 mb-2 text-[9px] font-bold uppercase tracking-widest text-indigo-200 bg-white/10 rounded-full border border-white/20 backdrop-blur-md">
                            Comunidad
                        </span>
                        <h3 className="text-xl font-extrabold text-white tracking-tight mb-1">Seguinos en redes</h3>
                        <p className="text-indigo-200 text-[13px] font-medium leading-relaxed max-w-md">Novedades del mercado, tips para inmobiliarias y todo lo nuevo de Zeta Prop, primero ahí.</p>
                    </div>
                    <div className="relative z-10 flex items-center gap-3 flex-shrink-0">
                        <a
                            href="https://www.instagram.com/zeta_prop"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 bg-white hover:bg-indigo-50 text-indigo-900 font-bold px-5 py-3 rounded-xl transition-all shadow-lg hover:-translate-y-0.5 active:scale-95 text-sm"
                        >
                            <Instagram size={18} /> Instagram
                        </a>
                        <a
                            href="https://www.linkedin.com/company/zetaprop"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3 rounded-xl border border-white/20 backdrop-blur-md transition-all hover:-translate-y-0.5 active:scale-95 text-sm"
                        >
                            <Linkedin size={18} /> LinkedIn
                        </a>
                    </div>
                    <div className="absolute -right-8 -bottom-10 opacity-10 pointer-events-none">
                        <Instagram size={180} className="text-white" strokeWidth={1} />
                    </div>
                </div>

                {/* ─── 6. SUSCRIPCIÓN ───────────────────────────────────── */}
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

                {/* ─── 8. DESCUBRÍ MÁS FUNCIONES ────────────────────────── */}
                <section>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-gray-100 rounded-lg"><GraduationCap size={18} className="text-gray-600" /></div>
                        <h2 className="text-xl font-bold text-gray-900">Descubrí más funciones</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        <Link href="/dashboard/propiedades" className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col h-full">
                            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-indigo-100 transition-all">
                                <Home size={18} className="text-indigo-600" />
                            </div>
                            <h3 className="text-[13px] font-bold text-gray-900 mb-1">Gestión de Inventario</h3>
                            <p className="text-[12px] text-gray-500 font-medium leading-relaxed">Publicá y administrá tus propiedades, subí fotos de alta calidad y ubicá todo en el mapa.</p>
                        </Link>

                        <Link href="/dashboard/leads" className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group flex flex-col h-full">
                            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                                <MessageSquare size={18} className="text-blue-600" />
                            </div>
                            <h3 className="text-[13px] font-bold text-gray-900 mb-1">CRM y Clientes</h3>
                            <p className="text-[12px] text-gray-500 font-medium leading-relaxed">Respondé consultas, seguí tus ventas paso a paso y no pierdas ningún contacto potencial.</p>
                        </Link>

                        <Link href="/dashboard/alquileres" className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group flex flex-col h-full">
                            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-100 transition-all">
                                <Key size={18} className="text-emerald-600" />
                            </div>
                            <h3 className="text-[13px] font-bold text-gray-900 mb-1">Alquileres y Cobros</h3>
                            <p className="text-[12px] text-gray-500 font-medium leading-relaxed">Controlá vencimientos, generá contratos automáticos y administrá los pagos mensuales.</p>
                        </Link>

                        <Link href="/dashboard/mi-sitio" className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:border-violet-300 hover:shadow-md transition-all group flex flex-col h-full">
                            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-violet-100 transition-all">
                                <Globe size={18} className="text-violet-600" />
                            </div>
                            <h3 className="text-[13px] font-bold text-gray-900 mb-1">Tu Inmobiliaria Web</h3>
                            <p className="text-[12px] text-gray-500 font-medium leading-relaxed">Personalizá tu propia página web pública para que tus clientes vean tu catálogo y tu marca.</p>
                        </Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
