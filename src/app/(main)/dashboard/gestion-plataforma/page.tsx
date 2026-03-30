"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { adminService } from "@/infrastructure/services/adminService";
import { User } from "@/domain/models/User";
import { RoleProtection } from "@/ui/components/auth/RoleProtection";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import {
    Shield, User as UserIcon, Calendar, Mail, Search, Trash2, Ban,
    CheckCircle, Clock, Eye, AlertCircle, ChevronUp, ChevronDown,
    ChevronsUpDown, MailX, Home, Key, BarChart3, Users, TrendingUp,
    DollarSign, Activity, Send, Megaphone, Plus, X, CheckCircle2,
    Loader2, RefreshCw, Bell, Info, AlertTriangle, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PlanTier } from "@/domain/models/Subscription";
import { useRouter } from "next/navigation";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "dashboard" | "usuarios" | "emails" | "anuncios";
type SortField = "nombre" | "plan" | "registro" | "ultimoAcceso" | "vencimiento" | "alquileres" | "estado";
type SortDirection = "asc" | "desc";
type AnnouncementType = "info" | "warning" | "success" | "error";

interface DashboardData {
    kpis: { totalUsers: number; activeUsers: number; trialUsers: number; expiredUsers: number; disabledUsers: number; mrr: number; expiringSoon: number };
    registrationsByMonth: { month: string; usuarios: number }[];
    planDistribution: { name: string; value: number }[];
    moduleUsage: { module: string; acciones: number }[];
    atRisk: { uid: string; displayName: string; email: string; lastLogin: Date; planTier: string }[];
}

interface Announcement {
    id: string;
    title: string;
    message: string;
    type: AnnouncementType;
    active: boolean;
    createdAt?: string;
    expiresAt?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
    basic: "#94a3b8",
    professional: "#6366f1",
    enterprise: "#8b5cf6",
};

const ANNOUNCEMENT_STYLES: Record<AnnouncementType, { bg: string; border: string; icon: any; label: string }> = {
    info:    { bg: "bg-blue-50 dark:bg-blue-900/20",    border: "border-blue-200 dark:border-blue-700",    icon: Info,          label: "Información" },
    warning: { bg: "bg-amber-50 dark:bg-amber-900/20",  border: "border-amber-200 dark:border-amber-700",  icon: AlertTriangle, label: "Advertencia" },
    success: { bg: "bg-green-50 dark:bg-green-900/20",  border: "border-green-200 dark:border-green-700",  icon: CheckCircle2,  label: "Éxito" },
    error:   { bg: "bg-red-50 dark:bg-red-900/20",      border: "border-red-200 dark:border-red-700",      icon: XCircle,       label: "Urgente" },
};

function getExpirationDate(user: User): Date | null {
    if (user.subscription?.endDate) return new Date(user.subscription.endDate);
    if (user.createdAt) return addDays(new Date(user.createdAt), 14);
    return null;
}
function isExpired(user: User): boolean {
    if (user.disabled) return false;
    const d = getExpirationDate(user);
    return !!d && new Date() > d;
}
function isExpiringSoon(user: User): boolean {
    if (user.disabled) return false;
    const d = getExpirationDate(user);
    if (!d || new Date() > d) return false;
    return d.getTime() - Date.now() < 7 * 86400000;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, color }: {
    label: string; value: string | number; sub?: string; icon: any; color: string;
}) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex items-start gap-4">
            <div className={`p-2.5 rounded-xl ${color}`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
                {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PlatformManagementPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("dashboard");

    // ── Shared user list ────────────────────────────────────────────────────
    const [users, setUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);

    // ── Dashboard ───────────────────────────────────────────────────────────
    const [dashData, setDashData] = useState<DashboardData | null>(null);
    const [dashLoading, setDashLoading] = useState(true);

    // ── Users tab ───────────────────────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState("");
    const [onlyNoMails, setOnlyNoMails] = useState(false);
    const [sortField, setSortField] = useState<SortField>("registro");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    // ── Emails tab ──────────────────────────────────────────────────────────
    const [emailSubject, setEmailSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");
    const [campaignName, setCampaignName] = useState("");
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [emailSegment, setEmailSegment] = useState<"all" | "active" | "expired" | "trial" | "basic" | "professional" | "enterprise">("all");
    const [sending, setSending] = useState(false);
    const [emailSearch, setEmailSearch] = useState("");

    // ── Anuncios tab ────────────────────────────────────────────────────────
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [annLoading, setAnnLoading] = useState(false);
    const [newAnn, setNewAnn] = useState({ title: "", message: "", type: "info" as AnnouncementType, expiresAt: "" });
    const [savingAnn, setSavingAnn] = useState(false);

    // ── Load data ───────────────────────────────────────────────────────────

    const loadUsers = useCallback(async () => {
        try {
            const data = await adminService.getAllUsers();
            setUsers(data);
        } catch { toast.error("Error al cargar usuarios"); }
        finally { setUsersLoading(false); }
    }, []);

    const loadDashboard = useCallback(async () => {
        setDashLoading(true);
        try {
            const data = await adminService.getPlatformDashboard();
            setDashData(data as DashboardData);
        } catch { toast.error("Error al cargar el dashboard"); }
        finally { setDashLoading(false); }
    }, []);

    const loadAnnouncements = useCallback(async () => {
        setAnnLoading(true);
        try {
            const res = await fetch("/api/admin/announcements");
            const data = await res.json();
            if (data.announcements) setAnnouncements(data.announcements);
            else if (data.announcement) setAnnouncements([data.announcement]); // Backwards compatibility
            else setAnnouncements([]);
        } catch { toast.error("Error al cargar anuncios"); }
        finally { setAnnLoading(false); }
    }, []);

    useEffect(() => { loadUsers(); loadDashboard(); loadAnnouncements(); }, []);

    // ── Users tab handlers ──────────────────────────────────────────────────

    const handleToggleStatus = async (uid: string, currentStatus: boolean | undefined) => {
        const newStatus = !currentStatus;
        if (!confirm(`¿${newStatus ? "Deshabilitar" : "Habilitar"} este usuario?`)) return;
        try {
            await adminService.toggleUserStatus(uid, newStatus);
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, disabled: newStatus } : u));
            toast.success(`Usuario ${newStatus ? "deshabilitado" : "habilitado"}`);
        } catch { toast.error("Error al actualizar el estado"); }
    };

    const handleDelete = async (uid: string) => {
        if (!confirm("¿Eliminar permanentemente? Esta acción no se puede deshacer.")) return;
        try {
            await adminService.deleteUser(uid);
            setUsers(prev => prev.filter(u => u.uid !== uid));
            toast.success("Usuario eliminado");
        } catch { toast.error("Error al eliminar"); }
    };

    const handleUpdatePlan = async (uid: string, newPlan: string) => {
        const prev = [...users];
        setUsers(p => p.map(u => u.uid === uid ? { ...u, subscription: { ...u.subscription, planId: newPlan, planTier: newPlan as PlanTier, status: u.subscription?.status || "active", billingPeriod: u.subscription?.billingPeriod || "monthly" } } : u));
        try {
            await adminService.updateUserPlan(uid, newPlan as PlanTier);
            toast.success("Plan actualizado");
        } catch { setUsers(prev); toast.error("Error al actualizar plan"); }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) setSortDirection(d => d === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortDirection("asc"); }
    };

    const filteredUsers = useMemo(() => {
        let result = users.filter(u =>
            u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (onlyNoMails) result = result.filter(u => u.unsubscribedMarketing);
        return [...result].sort((a, b) => {
            let vA: string | number = 0, vB: string | number = 0;
            switch (sortField) {
                case "nombre": vA = (a.displayName || a.email || "").toLowerCase(); vB = (b.displayName || b.email || "").toLowerCase(); break;
                case "plan": vA = (a.subscription?.planTier || "basic"); vB = (b.subscription?.planTier || "basic"); break;
                case "registro": vA = a.createdAt ? new Date(a.createdAt).getTime() : 0; vB = b.createdAt ? new Date(b.createdAt).getTime() : 0; break;
                case "ultimoAcceso": vA = a.lastLogin ? new Date(a.lastLogin).getTime() : 0; vB = b.lastLogin ? new Date(b.lastLogin).getTime() : 0; break;
                case "vencimiento": vA = getExpirationDate(a)?.getTime() ?? 0; vB = getExpirationDate(b)?.getTime() ?? 0; break;
                case "alquileres": vA = a.alquileresCount || 0; vB = b.alquileresCount || 0; break;
                case "estado": vA = a.disabled ? 2 : isExpired(a) ? 1 : 0; vB = b.disabled ? 2 : isExpired(b) ? 1 : 0; break;
            }
            if (typeof vA === "string") return sortDirection === "asc" ? vA.localeCompare(vB as string) : (vB as string).localeCompare(vA);
            return sortDirection === "asc" ? (vA - (vB as number)) : ((vB as number) - vA);
        });
    }, [users, searchTerm, onlyNoMails, sortField, sortDirection]);

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ChevronsUpDown size={14} className="text-gray-300 ml-1 inline" />;
        return sortDirection === "asc" ? <ChevronUp size={14} className="text-indigo-500 ml-1 inline" /> : <ChevronDown size={14} className="text-indigo-500 ml-1 inline" />;
    };

    // ── Email tab handlers ──────────────────────────────────────────────────

    const emailSegmentedUsers = useMemo(() => {
        let base = users.filter(u =>
            !u.unsubscribedMarketing &&
            (u.displayName?.toLowerCase().includes(emailSearch.toLowerCase()) ||
             u.email?.toLowerCase().includes(emailSearch.toLowerCase()))
        );
        switch (emailSegment) {
            case "active": return base.filter(u => !u.disabled && !isExpired(u) && !!u.subscription);
            case "expired": return base.filter(u => isExpired(u));
            case "trial": return base.filter(u => !u.subscription && !u.disabled);
            case "basic": return base.filter(u => u.subscription?.planTier === "basic");
            case "professional": return base.filter(u => u.subscription?.planTier === "professional");
            case "enterprise": return base.filter(u => u.subscription?.planTier === "enterprise");
            default: return base;
        }
    }, [users, emailSegment, emailSearch]);

    const toggleSelectAll = () => {
        if (selectedUserIds.size === emailSegmentedUsers.length) {
            setSelectedUserIds(new Set());
        } else {
            setSelectedUserIds(new Set(emailSegmentedUsers.map(u => u.uid)));
        }
    };

    const handleSendBulkEmail = async () => {
        if (!emailSubject.trim() || !emailBody.trim()) { toast.error("Completá el asunto y el cuerpo"); return; }
        if (selectedUserIds.size === 0) { toast.error("Seleccioná al menos un usuario"); return; }
        if (!confirm(`¿Enviar email a ${selectedUserIds.size} usuario${selectedUserIds.size !== 1 ? "s" : ""}?`)) return;
        setSending(true);
        try {
            const res = await fetch("/api/admin/bulk-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject: emailSubject,
                    html: emailBody.replace(/\n/g, "<br>"),
                    userIds: Array.from(selectedUserIds),
                    campaignName: campaignName || "Campaña manual",
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`Enviados: ${data.sent} · Fallidos: ${data.failed}`);
            setEmailSubject(""); setEmailBody(""); setCampaignName(""); setSelectedUserIds(new Set());
        } catch (e: any) {
            toast.error(e.message || "Error al enviar");
        } finally {
            setSending(false);
        }
    };

    // ── Announcements handlers ──────────────────────────────────────────────

    const handleSaveAnnouncement = async () => {
        if (!newAnn.title.trim() || !newAnn.message.trim()) { toast.error("Completá título y mensaje"); return; }
        setSavingAnn(true);
        try {
            await fetch("/api/admin/announcements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newAnn),
            });
            toast.success("Anuncio publicado");
            setNewAnn({ title: "", message: "", type: "info", expiresAt: "" });
            loadAnnouncements();
        } catch { toast.error("Error al publicar"); }
        finally { setSavingAnn(false); }
    };

    const handleDeleteAnnouncement = async (id: string) => {
        try {
            await fetch("/api/admin/announcements", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            setAnnouncements(prev => prev.filter(a => a.id !== id));
            toast.success("Anuncio desactivado");
        } catch { toast.error("Error al desactivar"); }
    };

    // ── Render ──────────────────────────────────────────────────────────────

    const TABS: { id: Tab; label: string; icon: any }[] = [
        { id: "dashboard", label: "Dashboard", icon: BarChart3 },
        { id: "usuarios", label: "Usuarios", icon: Users },
        { id: "emails", label: "Emails masivos", icon: Send },
        { id: "anuncios", label: "Anuncios", icon: Megaphone },
    ];

    return (
        <RoleProtection requiredPermission="/dashboard/gestion-plataforma">
            <div className="space-y-6">

                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Shield className="text-indigo-600 w-6 h-6" /> Gestión de Plataforma
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            Panel de control para administrar Zeta Prop.
                        </p>
                    </div>
                    <button onClick={() => { loadDashboard(); loadUsers(); }} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <RefreshCw className="w-4 h-4" /> Actualizar
                    </button>
                </div>

                {/* ── Tabs ── */}
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1 w-fit">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button key={id} onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                activeTab === id
                                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{label}</span>
                        </button>
                    ))}
                </div>

                {/* ═══════════════════════════════ DASHBOARD TAB ═══════════════════════════════ */}
                {activeTab === "dashboard" && (
                    <div className="space-y-6">
                        {dashLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                            </div>
                        ) : dashData ? (
                            <>
                                {/* KPI Cards */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <KpiCard label="Usuarios totales" value={dashData.kpis.totalUsers} icon={Users} color="bg-indigo-500" />
                                    <KpiCard label="Activos" value={dashData.kpis.activeUsers} sub={`${dashData.kpis.trialUsers} en trial`} icon={CheckCircle} color="bg-green-500" />
                                    <KpiCard label="MRR" value={`$${dashData.kpis.mrr.toLocaleString("es-AR")}`} sub="ARS / mes" icon={DollarSign} color="bg-violet-500" />
                                    <KpiCard label="Por vencer" value={dashData.kpis.expiringSoon} sub={`${dashData.kpis.expiredUsers} vencidos`} icon={AlertCircle} color="bg-amber-500" />
                                </div>

                                {/* Charts row */}
                                <div className="grid lg:grid-cols-3 gap-6">

                                    {/* Registros por mes */}
                                    <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Nuevos registros por mes</p>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <BarChart data={dashData.registrationsByMonth}>
                                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                                <YAxis tick={{ fontSize: 12 }} />
                                                <Tooltip />
                                                <Bar dataKey="usuarios" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Plan distribution */}
                                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Distribución por plan</p>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <PieChart>
                                                <Pie data={dashData.planDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                                                    {dashData.planDistribution.map((entry) => (
                                                        <Cell key={entry.name} fill={PLAN_COLORS[entry.name] || "#94a3b8"} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Module usage + At-risk users */}
                                <div className="grid lg:grid-cols-3 gap-6">
                                    {/* Module usage */}
                                    <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Módulos más usados</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Últimos 30 días · desde audit_logs</p>
                                        {dashData.moduleUsage.length === 0 ? (
                                            <p className="text-sm text-gray-400 text-center py-8">Sin datos de audit_logs aún</p>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={220}>
                                                <BarChart data={dashData.moduleUsage} layout="vertical">
                                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                                    <YAxis dataKey="module" type="category" tick={{ fontSize: 11 }} width={100} />
                                                    <Tooltip />
                                                    <Bar dataKey="acciones" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>

                                    {/* At-risk users */}
                                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Usuarios en riesgo</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Sin login hace +14 días</p>
                                        {dashData.atRisk.length === 0 ? (
                                            <p className="text-sm text-gray-400 text-center py-8">¡Ninguno! Todos activos.</p>
                                        ) : (
                                            <div className="space-y-2.5">
                                                {dashData.atRisk.slice(0, 7).map(u => (
                                                    <div key={u.uid} className="flex items-center justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{u.displayName}</p>
                                                            <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                                                {u.lastLogin ? format(u.lastLogin, "dd MMM", { locale: es }) : "—"}
                                                            </p>
                                                        </div>
                                                        <button onClick={() => router.push(`/dashboard/gestion-plataforma/${u.uid}`)} className="p-1 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg flex-shrink-0">
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* User funnel */}
                                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Estado de usuarios</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                        {[
                                            { label: "Total", value: dashData.kpis.totalUsers, color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300" },
                                            { label: "Activos", value: dashData.kpis.activeUsers, color: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" },
                                            { label: "En trial", value: dashData.kpis.trialUsers, color: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" },
                                            { label: "Vencidos", value: dashData.kpis.expiredUsers, color: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400" },
                                            { label: "Deshabilitados", value: dashData.kpis.disabledUsers, color: "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-500" },
                                        ].map(item => (
                                            <div key={item.label} className={`rounded-xl p-4 text-center ${item.color}`}>
                                                <p className="text-2xl font-bold">{item.value}</p>
                                                <p className="text-xs mt-1 font-medium">{item.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                )}

                {/* ═══════════════════════════════ USUARIOS TAB ════════════════════════════════ */}
                {activeTab === "usuarios" && (
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex flex-col md:flex-row gap-3 justify-between items-center">
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Total: <strong className="text-gray-900 dark:text-white">{users.length}</strong></span>
                                {users.filter(u => u.unsubscribedMarketing).length > 0 && (
                                    <button onClick={() => setOnlyNoMails(p => !p)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${onlyNoMails ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-amber-300"}`}>
                                        <MailX size={13} /> Sin mails ({users.filter(u => u.unsubscribedMarketing).length})
                                    </button>
                                )}
                            </div>
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            {(["nombre", "plan", "registro", "ultimoAcceso", "vencimiento", "alquileres", "estado"] as SortField[]).map(f => (
                                                <th key={f} onClick={() => handleSort(f)} className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap capitalize text-xs">
                                                    {f === "alquileres" ? "Prop/Alq" : f.replace(/([A-Z])/g, " $1")} <SortIcon field={f} />
                                                </th>
                                            ))}
                                            <th className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300 text-right text-xs">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {usersLoading ? (
                                            <tr><td colSpan={8} className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto" /></td></tr>
                                        ) : filteredUsers.length === 0 ? (
                                            <tr><td colSpan={8} className="py-12 text-center text-gray-400">No se encontraron usuarios</td></tr>
                                        ) : filteredUsers.map(user => {
                                            const expired = isExpired(user);
                                            const soon = isExpiringSoon(user);
                                            const expDate = getExpirationDate(user);
                                            return (
                                                <tr key={user.uid} className={`hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors ${user.disabled ? "opacity-60" : ""}`}>
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                                {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <UserIcon size={15} />}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900 dark:text-white text-xs">{user.displayName || "Sin nombre"}</p>
                                                                <p className="text-[10px] text-gray-400 dark:text-gray-500">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <select value={user.subscription?.planTier || "basic"} onChange={e => handleUpdatePlan(user.uid, e.target.value)}
                                                            className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                                            <option value="basic">Básico</option>
                                                            <option value="professional">Professional</option>
                                                            <option value="enterprise">Enterprise</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-5 py-3 text-xs">{user.createdAt ? format(new Date(user.createdAt), "dd MMM yy", { locale: es }) : "—"}</td>
                                                    <td className="px-5 py-3 text-xs">{user.lastLogin ? format(new Date(user.lastLogin), "dd MMM yy HH:mm", { locale: es }) : "—"}</td>
                                                    <td className="px-5 py-3">
                                                        {expDate ? (
                                                            <span className={`text-xs font-medium ${expired ? "text-red-600" : soon ? "text-amber-600" : "text-gray-600 dark:text-gray-400"}`}>
                                                                {format(expDate, "dd MMM yy", { locale: es })}
                                                            </span>
                                                        ) : <span className="text-xs text-gray-400">—</span>}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold"><Home size={10} />{user.propiedadesCount || 0}</span>
                                                            <span className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded text-[10px] font-bold"><Key size={10} />{user.alquileresCount || 0}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        {user.disabled ? <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">Inhabilitado</span>
                                                            : expired ? <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-700">Vencido</span>
                                                            : soon ? <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-700">Por vencer</span>
                                                            : <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">Activo</span>}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button onClick={() => router.push(`/dashboard/gestion-plataforma/${user.uid}`)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg" title="Ver perfil"><Eye size={15} /></button>
                                                            <button onClick={() => handleToggleStatus(user.uid, user.disabled)} className={`p-1.5 rounded-lg ${user.disabled ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" : "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"}`} title={user.disabled ? "Habilitar" : "Inhabilitar"}>{user.disabled ? <CheckCircle size={15} /> : <Ban size={15} />}</button>
                                                            <button onClick={() => handleDelete(user.uid)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Eliminar"><Trash2 size={15} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════ EMAILS TAB ══════════════════════════════════ */}
                {activeTab === "emails" && (
                    <div className="grid lg:grid-cols-5 gap-6">
                        {/* Left: user selector */}
                        <div className="lg:col-span-2 space-y-3">
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Destinatarios</p>
                                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{selectedUserIds.size} seleccionados</span>
                                </div>

                                {/* Segments */}
                                <div className="flex flex-wrap gap-1.5">
                                    {([
                                        ["all", "Todos"], ["active", "Activos"], ["expired", "Vencidos"],
                                        ["trial", "Trial"], ["professional", "Pro"], ["enterprise", "Enterprise"],
                                    ] as [typeof emailSegment, string][]).map(([seg, label]) => (
                                        <button key={seg} onClick={() => { setEmailSegment(seg); setSelectedUserIds(new Set()); }}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${emailSegment === seg ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"}`}>
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    <input type="text" placeholder="Filtrar..." value={emailSearch} onChange={e => setEmailSearch(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>

                                <div className="max-h-72 overflow-y-auto space-y-1 border border-gray-100 dark:border-gray-800 rounded-xl p-2">
                                    <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer">
                                        <input type="checkbox" checked={selectedUserIds.size === emailSegmentedUsers.length && emailSegmentedUsers.length > 0} onChange={toggleSelectAll} className="rounded" />
                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Seleccionar todos ({emailSegmentedUsers.length})</span>
                                    </label>
                                    {emailSegmentedUsers.map(u => (
                                        <label key={u.uid} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer">
                                            <input type="checkbox" checked={selectedUserIds.has(u.uid)}
                                                onChange={() => {
                                                    setSelectedUserIds(prev => {
                                                        const next = new Set(prev);
                                                        next.has(u.uid) ? next.delete(u.uid) : next.add(u.uid);
                                                        return next;
                                                    });
                                                }} className="rounded" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{u.displayName || "Sin nombre"}</p>
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{u.email}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right: composer */}
                        <div className="lg:col-span-3 space-y-4">
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Redactar campaña</p>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Nombre de la campaña</label>
                                    <input type="text" value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="Ej: Newsletter marzo 2026"
                                        className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Asunto *</label>
                                    <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Asunto del email..."
                                        className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Cuerpo del mensaje *</label>
                                    <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={10} placeholder={"Hola {nombre},\n\nEscribí tu mensaje acá...\n\nSaludos,\nEl equipo de Zeta Prop"}
                                        className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono" />
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Los saltos de línea se convierten a &lt;br&gt; automáticamente.</p>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {selectedUserIds.size === 0
                                            ? "Seleccioná destinatarios"
                                            : `Enviando a ${selectedUserIds.size} usuario${selectedUserIds.size !== 1 ? "s" : ""}`}
                                    </p>
                                    <button onClick={handleSendBulkEmail} disabled={sending || selectedUserIds.size === 0 || !emailSubject || !emailBody}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50">
                                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        Enviar campaña
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════ ANUNCIOS TAB ════════════════════════════════ */}
                {activeTab === "anuncios" && (
                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Create announcement */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Nuevo anuncio
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2">
                                Aparece como banner en el dashboard de todos los usuarios.
                            </p>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Tipo</label>
                                <div className="flex gap-2 flex-wrap">
                                    {(["info", "warning", "success", "error"] as AnnouncementType[]).map(t => {
                                        const s = ANNOUNCEMENT_STYLES[t];
                                        const Icon = s.icon;
                                        return (
                                            <button key={t} onClick={() => setNewAnn(p => ({ ...p, type: t }))}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${newAnn.type === t ? `${s.bg} ${s.border}` : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500"}`}>
                                                <Icon className="w-3.5 h-3.5" /> {s.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Título</label>
                                <input type="text" value={newAnn.title} onChange={e => setNewAnn(p => ({ ...p, title: e.target.value }))} placeholder="Ej: Mantenimiento programado"
                                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Mensaje</label>
                                <textarea value={newAnn.message} onChange={e => setNewAnn(p => ({ ...p, message: e.target.value }))} rows={3} placeholder="Descripción del anuncio..."
                                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Fecha de vencimiento (Opcional)</label>
                                <input type="datetime-local" value={newAnn.expiresAt} onChange={e => setNewAnn(p => ({ ...p, expiresAt: e.target.value }))}
                                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                                <p className="text-[10px] text-gray-400 mt-1">Si no se elige, el anuncio permanecerá activo hasta ser eliminado manualmente.</p>
                            </div>

                            {/* Preview */}
                            {(newAnn.title || newAnn.message) && (() => {
                                const s = ANNOUNCEMENT_STYLES[newAnn.type];
                                const Icon = s.icon;
                                return (
                                    <div className={`rounded-xl border p-3 ${s.bg} ${s.border}`}>
                                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 mb-1">
                                            <Icon className="w-3.5 h-3.5" /> {newAnn.title || "Título"}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-300">{newAnn.message || "Mensaje..."}</p>
                                        {newAnn.expiresAt && !isNaN(new Date(newAnn.expiresAt).getTime()) && (
                                            <p className="text-[10px] text-gray-400 mt-2">Vence: {format(new Date(newAnn.expiresAt), "dd/MM/yy HH:mm", { locale: es })}</p>
                                        )}
                                    </div>
                                );
                            })()}

                            <button onClick={handleSaveAnnouncement} disabled={savingAnn}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-all">
                                {savingAnn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                                Publicar anuncio
                            </button>
                        </div>

                        {/* Active announcements */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Anuncio activo</p>
                            {annLoading ? (
                                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
                            ) : announcements.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 dark:text-gray-600">
                                    <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No hay anuncios activos</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {announcements.map(ann => {
                                        const s = ANNOUNCEMENT_STYLES[ann.type as AnnouncementType] || ANNOUNCEMENT_STYLES.info;
                                        const Icon = s.icon;
                                        return (
                                            <div key={ann.id} className={`rounded-xl border p-4 ${s.bg} ${s.border}`}>
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 mb-1">
                                                            <Icon className="w-4 h-4" /> {ann.title}
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-300">{ann.message}</p>
                                                        <div className="flex flex-wrap items-center gap-3 mt-2">
                                                            {ann.createdAt && !isNaN(new Date(ann.createdAt).getTime()) && (
                                                                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                                                    Publicado {format(new Date(ann.createdAt), "dd/MM/yy HH:mm", { locale: es })}
                                                                </p>
                                                            )}
                                                            {ann.expiresAt && !isNaN(new Date(ann.expiresAt).getTime()) && (
                                                                <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    Vence {format(new Date(ann.expiresAt), "dd/MM/yy HH:mm", { locale: es })}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex-shrink-0 transition-colors" title="Desactivar">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </RoleProtection>
    );
}
