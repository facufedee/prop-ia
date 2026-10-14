"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { db, auth } from "@/infrastructure/firebase/client";
import { collection, query, where, getDocs, getDoc, doc, orderBy } from "firebase/firestore";
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
    Plus,
    ArrowRight,
    CheckCircle2,
    ChevronRight,
    Newspaper,
    Instagram,
    Linkedin,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
            <div className="min-h-screen bg-[var(--color-paper)] flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 border-2 border-[var(--color-rule)] border-t-[var(--color-accent)] rounded-full animate-spin mb-4"></div>
                    <p className="text-[var(--color-muted)] text-sm font-medium font-sans">Cargando tu inmobiliaria...</p>
                </div>
            </div>
        );
    }

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
        <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                <AnnouncementBanner />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* ─── COLUMNA PRINCIPAL ─────────────────────────────────── */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* ─── 2. MÓDULO DE PROPIEDADES ─────────────────────────── */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold font-heading text-[var(--color-ink)] tracking-tight">
                                    Propiedades
                                </h2>
                                <Link
                                    href="/dashboard/propiedades"
                                    className="text-xs font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-2)] flex items-center gap-1 transition-colors"
                                >
                                    Ver catálogo <ChevronRight size={14} strokeWidth={1.5} />
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Status properties (2 cols) */}
                                <div className="sm:col-span-2 bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] hover:border-[var(--color-neutral)] p-6 flex flex-col justify-between transition-all">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-widest mb-1.5">Inventario Activo</p>
                                            <p className="text-4xl font-extrabold font-heading text-[var(--color-ink)] tracking-tight">{stats.totalProperties}</p>
                                        </div>
                                        <span className="bg-[var(--color-positive-soft)] text-[var(--color-positive)] border border-[var(--color-positive)]/30 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                                            <CheckCircle2 size={13} strokeWidth={1.5} /> Al día
                                        </span>
                                    </div>

                                    <div className="space-y-2.5 pt-4 border-t border-[var(--color-rule)]">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span className="text-[var(--color-muted)]">Límite del Plan {stats.subscription?.planTier || 'Actual'}</span>
                                            <span className="text-[var(--color-accent)] font-bold">{renderLimit(stats.totalProperties, propertiesLimit)}</span>
                                        </div>
                                        <div className="w-full bg-[var(--color-paper-3)] rounded-full h-2 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-700 ease-out"
                                                style={{ width: typeof propertiesLimit === 'number' ? `${Math.min((stats.totalProperties / propertiesLimit) * 100, 100)}%` : '20%' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Add (1 col) */}
                                <div className="sm:col-span-1 bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] p-4 flex flex-col justify-between">
                                    <Link
                                        href="/dashboard/propiedades/nueva"
                                        className="flex-1 flex flex-col items-center justify-center p-6 bg-[var(--color-paper-3)] hover:bg-[var(--color-paper-4)] rounded-xl border border-dashed border-[var(--color-neutral)] hover:border-[var(--color-accent)]/50 transition-all group text-center"
                                    >
                                        <Plus size={20} strokeWidth={1.5} className="mb-3 text-[var(--color-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
                                        <span className="text-xs font-bold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">
                                            Cargar propiedad
                                        </span>
                                    </Link>
                                </div>
                            </div>
                        </section>

                        {/* ─── 3. MÓDULO DE ALQUILERES ──────────────────────────── */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold font-heading text-[var(--color-ink)] tracking-tight">
                                    Alquileres & Cobranzas
                                </h2>
                                <Link
                                    href="/dashboard/alquileres"
                                    className="text-xs font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-2)] flex items-center gap-1 transition-colors"
                                >
                                    Ver todos <ChevronRight size={14} strokeWidth={1.5} />
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* KPI Alquileres (1 col) */}
                                <Link
                                    href="/dashboard/alquileres"
                                    className="sm:col-span-1 bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] hover:border-[var(--color-neutral)] p-6 flex flex-col justify-between transition-all group"
                                >
                                    <div>
                                        <p className="text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-widest mb-1.5">Contratos Activos</p>
                                        <p className="text-4xl font-extrabold font-heading text-[var(--color-ink)] tracking-tight mb-1">{stats.activeRentals}</p>
                                    </div>
                                    <div className="pt-4 border-t border-[var(--color-rule)] flex items-center justify-between">
                                        <span className="text-xs font-semibold text-[var(--color-accent)] group-hover:text-[var(--color-accent-2)]">Panel de alquileres</span>
                                        <ChevronRight size={14} strokeWidth={1.5} className="text-[var(--color-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-1 transition-all" />
                                    </div>
                                </Link>

                                {/* Próximos Vencimientos (2 cols) */}
                                <div className="sm:col-span-2 bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] overflow-hidden flex flex-col">
                                    <div className="px-5 py-3.5 border-b border-[var(--color-rule)] flex items-center justify-between bg-[var(--color-paper)]">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold font-heading text-[var(--color-ink)] text-xs uppercase tracking-wider">Próximos Vencimientos</h3>
                                        </div>
                                        {stats.proximosVencimientos.length > 0 && (
                                            <span className="text-[10px] font-bold bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/25 px-2.5 py-0.5 rounded-full">
                                                {stats.proximosVencimientos.length} PENDIENTES
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 divide-y divide-[var(--color-rule-2)] min-h-[140px]">
                                        {stats.proximosVencimientos.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center">
                                                <p className="text-xs font-semibold text-[var(--color-muted)]">Sin vencimientos próximos</p>
                                                <p className="text-[11px] text-[var(--color-neutral)] mt-0.5">Todas tus cobranzas están al día</p>
                                            </div>
                                        ) : (
                                            stats.proximosVencimientos.map((v, i) => (
                                                <Link
                                                    key={`${v.alquilerId}-${i}`}
                                                    href={`/dashboard/alquileres?id=${v.alquilerId}`}
                                                    className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--color-paper-3)] transition-colors group"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-[var(--color-ink)] truncate group-hover:text-[var(--color-accent)] transition-colors">{v.direccion}</p>
                                                        <p className="text-[11px] text-[var(--color-muted)] truncate">{v.nombreInquilino}</p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-xs font-bold font-heading text-[var(--color-ink)]">{formatCurrency(v.monto)}</p>
                                                        <p className={`text-[10px] font-semibold mt-0.5 ${v.estado === 'vencido' ? 'text-[var(--color-danger)]' : v.diasRestantes <= 3 ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`}>
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
                        <MiniCalendar eventDates={stats.visitaEventDates} />

                        <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] overflow-hidden flex flex-col">
                            <div className="px-5 py-3.5 border-b border-[var(--color-rule)] flex items-center justify-between bg-[var(--color-paper)]">
                                <h3 className="font-bold font-heading text-[var(--color-ink)] text-xs uppercase tracking-wider">Próximas Visitas</h3>
                                <Link href="/dashboard/calendario" className="text-xs font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-2)] flex items-center gap-1">
                                    Ver <ChevronRight size={13} strokeWidth={1.5} />
                                </Link>
                            </div>

                            <div className="flex-1 divide-y divide-[var(--color-rule-2)] min-h-[120px]">
                                {stats.upcomingVisitas.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center">
                                        <p className="text-xs text-[var(--color-muted)] mb-3">No hay visitas programadas</p>
                                        <Link
                                            href="/dashboard/calendario/nueva"
                                            className="inline-flex items-center gap-2 text-xs font-bold text-[var(--color-paper)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-2)] px-4 py-2 rounded-full transition-all active:scale-95"
                                        >
                                            <Plus size={14} strokeWidth={1.5} /> Agendar visita
                                        </Link>
                                    </div>
                                ) : (
                                    stats.upcomingVisitas.map((v) => (
                                        <Link
                                            key={v.id}
                                            href={`/dashboard/calendario/${v.id}`}
                                            className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--color-paper-3)] transition-colors group"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-[var(--color-ink)] truncate group-hover:text-[var(--color-accent)] transition-colors">{v.propiedadDireccion}</p>
                                                <p className="text-[11px] text-[var(--color-muted)] truncate">{v.clienteNombre}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-xs font-bold text-[var(--color-ink)]">{format(v.fechaHora, "d MMM", { locale: es })}</p>
                                                <p className="text-[10px] text-[var(--color-muted)] uppercase">{format(v.fechaHora, "HH:mm")}</p>
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
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold font-heading text-[var(--color-ink)] tracking-tight">
                            Clientes & Consultas
                        </h2>
                        <Link
                            href="/dashboard/leads"
                            className="text-xs font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-2)] flex items-center gap-1 transition-colors"
                        >
                            Ver CRM <ChevronRight size={14} strokeWidth={1.5} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* KPI Clientes (1 col) */}
                        <Link
                            href="/dashboard/clientes"
                            className="sm:col-span-1 bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] hover:border-[var(--color-neutral)] p-6 flex flex-col justify-between transition-all group"
                        >
                            <div>
                                <p className="text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-widest mb-1.5">Clientes Totales</p>
                                <p className="text-3xl font-extrabold font-heading text-[var(--color-ink)] tracking-tight mb-1">{renderLimit(stats.totalClientes, clientsLimit)}</p>
                            </div>
                            <div className="pt-4 border-t border-[var(--color-rule)] flex items-center justify-between">
                                <span className="text-xs font-semibold text-[var(--color-accent)] group-hover:text-[var(--color-accent-2)]">Directorio de contactos</span>
                                <ChevronRight size={14} strokeWidth={1.5} className="text-[var(--color-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-1 transition-all" />
                            </div>
                        </Link>

                        {/* Nuevas Consultas (2 cols) */}
                        <div className="sm:col-span-2 bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] overflow-hidden flex flex-col">
                            <div className="px-5 py-3.5 border-b border-[var(--color-rule)] flex items-center justify-between bg-[var(--color-paper)]">
                                <h3 className="font-bold font-heading text-[var(--color-ink)] text-xs uppercase tracking-wider">Últimas Consultas Recibidas</h3>
                                {stats.totalLeads > 0 && (
                                    <span className="text-[10px] font-bold bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/25 px-2.5 py-0.5 rounded-full">
                                        {stats.totalLeads} LEADS
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 divide-y divide-[var(--color-rule-2)] min-h-[140px]">
                                {stats.recentLeads.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center">
                                        <p className="text-xs font-semibold text-[var(--color-muted)]">Bandeja sin consultas pendientes</p>
                                        <p className="text-[11px] text-[var(--color-neutral)] mt-0.5">Acá aparecerán las consultas de tus clientes potenciales</p>
                                    </div>
                                ) : (
                                    stats.recentLeads.map((lead: any) => (
                                        <Link
                                            key={lead.id}
                                            href={`/dashboard/leads?id=${lead.id}`}
                                            className="flex items-center gap-3.5 px-5 py-3 hover:bg-[var(--color-paper-3)] transition-colors group"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-[var(--color-paper-3)] border border-[var(--color-rule)] flex items-center justify-center flex-shrink-0 text-[var(--color-accent)] font-black text-xs">
                                                {lead.nombre?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="text-xs font-bold text-[var(--color-ink)] truncate group-hover:text-[var(--color-accent)] transition-colors">{lead.nombre}</p>
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 border ${
                                                        lead.estado === 'nuevo' ? 'bg-[var(--color-positive-soft)] text-[var(--color-positive)] border-[var(--color-positive)]/30' :
                                                        lead.estado === 'contactado' ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] border-[var(--color-accent)]/30' :
                                                        'bg-[var(--color-paper-3)] text-[var(--color-muted)] border-[var(--color-rule)]'
                                                    }`}>
                                                        {lead.estado}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-[var(--color-muted)] truncate">{lead.propertyTitle || 'Consulta general'}</p>
                                            </div>
                                            <div className="text-right">
                                                <ChevronRight size={14} strokeWidth={1.5} className="text-[var(--color-neutral)] group-hover:text-[var(--color-accent)] group-hover:translate-x-1 transition-all" />
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
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold font-heading text-[var(--color-ink)] tracking-tight">
                            Últimas Novedades
                        </h2>
                        <Link href="/blog" target="_blank" className="text-xs font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-2)] flex items-center gap-1 transition-colors">
                            Ver blog <ChevronRight size={14} strokeWidth={1.5} />
                        </Link>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-[var(--color-paper-4)] [&::-webkit-scrollbar-thumb]:rounded-full">
                        {blogPosts.length === 0 ? (
                            <div className="flex-shrink-0 w-full bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] py-8 px-4 text-center">
                                <p className="text-xs font-medium text-[var(--color-muted)]">Todavía no hay artículos publicados</p>
                            </div>
                        ) : (
                            blogPosts.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/blog/${post.slug}`}
                                    target="_blank"
                                    className="flex-shrink-0 w-64 snap-start bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] overflow-hidden hover:border-[var(--color-neutral)] transition-all group"
                                >
                                    <div className="h-32 bg-[var(--color-paper-3)] relative overflow-hidden">
                                        {post.imageUrl ? (
                                            <Image src={post.imageUrl} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="256px" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[var(--color-neutral)]">
                                                <Newspaper size={24} strokeWidth={1.5} />
                                            </div>
                                        )}
                                        {post.category && (
                                            <span className="absolute top-2.5 left-2.5 text-[9px] font-bold uppercase tracking-widest text-[var(--color-accent)] bg-[var(--color-paper)]/90 px-2.5 py-0.5 rounded-full border border-[var(--color-rule)]">
                                                {post.category}
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs font-bold font-heading text-[var(--color-ink)] leading-snug line-clamp-2 group-hover:text-[var(--color-accent)] transition-colors">{post.title}</p>
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-accent)] mt-2 group-hover:gap-1.5 transition-all">
                                            Leer nota <ArrowRight size={12} strokeWidth={1.5} />
                                        </span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </section>

                {/* ─── BANNER DE REDES SOCIALES ─────────────────────────── */}
                <div className="relative bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-2xl p-7 overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                    <div className="relative z-10">
                        <span className="inline-block px-2.5 py-0.5 mb-2 text-[9px] font-bold uppercase tracking-widest text-[var(--color-accent)] bg-[var(--color-accent)]/10 rounded-full border border-[var(--color-accent)]/20">
                            Comunidad
                        </span>
                        <h3 className="text-xl font-bold font-heading text-[var(--color-ink)] tracking-tight mb-1">Seguinos en redes</h3>
                        <p className="text-[var(--color-muted)] text-xs leading-relaxed max-w-md">Novedades del mercado, tips para inmobiliarias y todo lo nuevo de Zeta Prop, primero ahí.</p>
                    </div>
                    <div className="relative z-10 flex items-center gap-3 flex-shrink-0">
                        <a
                            href="https://www.instagram.com/zeta_prop"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-2)] text-[var(--color-paper)] font-bold px-4 py-2.5 rounded-full transition-all text-xs"
                        >
                            <Instagram size={16} strokeWidth={1.5} /> Instagram
                        </a>
                        <a
                            href="https://www.linkedin.com/company/zetaprop"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-[var(--color-paper-3)] hover:bg-[var(--color-paper-4)] text-[var(--color-ink)] font-bold px-4 py-2.5 rounded-full border border-[var(--color-rule)] transition-all text-xs"
                        >
                            <Linkedin size={16} strokeWidth={1.5} /> LinkedIn
                        </a>
                    </div>
                </div>

                {/* ─── 6. SUSCRIPCIÓN ───────────────────────────────────── */}
                {stats.subscription && (
                    <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold font-heading text-[var(--color-ink)] text-sm">{stats.plan?.name || `Plan ${stats.subscription.planTier}`}</p>
                                    <span className="bg-[var(--color-positive-soft)] text-[var(--color-positive)] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[var(--color-positive)]/30">Activo</span>
                                </div>
                                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                                    {stats.subscription.billingPeriod === 'monthly' ? 'Mensual' :
                                     stats.subscription.billingPeriod === 'quarterly' ? 'Trimestral' : 'Anual'}
                                    {stats.subscription.amount ? ` · ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(stats.subscription.amount)}` : ''}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div>
                                <p className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest">Vence el</p>
                                <p className="font-bold font-heading text-[var(--color-ink)] text-xs mt-0.5">
                                    {stats.subscription.endDate instanceof Date
                                        ? format(stats.subscription.endDate, "d MMM yyyy", { locale: es })
                                        : '—'}
                                </p>
                            </div>
                            <Link href="/precios" className="text-xs font-bold text-[var(--color-accent)] hover:text-[var(--color-accent-2)] flex items-center gap-1 whitespace-nowrap">
                                Cambiar plan <ChevronRight size={13} strokeWidth={1.5} />
                            </Link>
                        </div>
                    </div>
                )}

                {/* ─── 8. ACCESOS DIRECTOS ────────────────────────── */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold font-heading text-[var(--color-ink)] tracking-tight">
                            Accesos Directos
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        <Link href="/dashboard/propiedades" className="bg-[var(--color-paper-2)] p-5 rounded-2xl border border-[var(--color-rule)] hover:border-[var(--color-neutral)] transition-all group flex flex-col h-full">
                            <h3 className="text-xs font-bold font-heading text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors mb-1.5">Gestión de Inventario</h3>
                            <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">Publicá y administrá tus propiedades, subí fotos y ubicá todo en el mapa.</p>
                        </Link>

                        <Link href="/dashboard/leads" className="bg-[var(--color-paper-2)] p-5 rounded-2xl border border-[var(--color-rule)] hover:border-[var(--color-neutral)] transition-all group flex flex-col h-full">
                            <h3 className="text-xs font-bold font-heading text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors mb-1.5">CRM y Clientes</h3>
                            <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">Respondé consultas, gestioná contactos y no pierdas ningún interesado.</p>
                        </Link>

                        <Link href="/dashboard/alquileres" className="bg-[var(--color-paper-2)] p-5 rounded-2xl border border-[var(--color-rule)] hover:border-[var(--color-neutral)] transition-all group flex flex-col h-full">
                            <h3 className="text-xs font-bold font-heading text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors mb-1.5">Alquileres y Cobros</h3>
                            <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">Controlá vencimientos, generá contratos y administrá los pagos mensuales.</p>
                        </Link>

                        <Link href="/dashboard/mi-sitio" className="bg-[var(--color-paper-2)] p-5 rounded-2xl border border-[var(--color-rule)] hover:border-[var(--color-neutral)] transition-all group flex flex-col h-full">
                            <h3 className="text-xs font-bold font-heading text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors mb-1.5">Tu Inmobiliaria Web</h3>
                            <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">Personalizá tu propia página web pública con tu catálogo y marca propia.</p>
                        </Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
