"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/infrastructure/firebase/client";
import { inquilinosService } from "@/infrastructure/services/inquilinosService";
import { propietariosService } from "@/infrastructure/services/propietariosService";
import { leadsService } from "@/infrastructure/services/leadsService";
import { Inquilino } from "@/domain/models/Inquilino";
import { Propietario } from "@/domain/models/Propietario";
import { Lead } from "@/domain/models/Lead";
import InquilinosTable from "./components/InquilinosTable";
import PropietariosTable from "./components/PropietariosTable";
import LeadsTable from "./components/LeadsTable";
import ClientFormModal from "./components/ClientFormModal";
import { Users, Building2, UserPlus, Plus, Search, Key, TrendingUp } from "lucide-react";

type TabType = "inquilinos" | "propietarios" | "leads";

const VALID_TABS: TabType[] = ["inquilinos", "propietarios", "leads"];

function ClientesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const getInitialTab = (): TabType => {
        const t = searchParams.get("tab");
        return VALID_TABS.includes(t as TabType) ? (t as TabType) : "inquilinos";
    };

    const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Inquilino | Propietario | Lead | null>(null);
    const [inquilinos, setInquilinos] = useState<Inquilino[]>([]);
    const [propietarios, setPropietarios] = useState<Propietario[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);

    // Sync tab → URL
    const switchTab = (tab: TabType) => {
        setActiveTab(tab);
        setSearchTerm("");
        router.replace(`/dashboard/clientes?tab=${tab}`, { scroll: false });
    };

    // Sync URL → tab (back/forward navigation)
    useEffect(() => {
        const t = searchParams.get("tab");
        if (VALID_TABS.includes(t as TabType)) setActiveTab(t as TabType);
    }, [searchParams]);

    const fetchAllData = useCallback(async (uid: string) => {
        try {
            setLoading(true);
            const [i, p, l] = await Promise.all([
                inquilinosService.getInquilinos(uid),
                propietariosService.getPropietarios(uid),
                leadsService.getLeads(uid),
            ]);
            setInquilinos(i);
            setPropietarios(p);
            setLeads(l);
        } catch (err) {
            console.error("Error fetching clientes:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!auth) { setLoading(false); return; }
        const unsub = auth.onAuthStateChanged((u) => {
            if (u) fetchAllData(u.uid);
            else setLoading(false);
        });
        return () => unsub();
    }, [fetchAllData]);

    // Refreshes only the single record that was created/edited instead of
    // re-fetching all inquilinos + propietarios + leads from scratch.
    const handleSuccess = async (type: TabType, id?: string) => {
        if (!auth?.currentUser) return;
        switchTab(type);

        if (!id) {
            // No id to target a single-record refresh — fall back to a full reload.
            fetchAllData(auth.currentUser.uid);
            return;
        }

        try {
            if (type === "inquilinos") {
                const updated = await inquilinosService.getInquilinoById(id);
                if (updated) setInquilinos((prev) => prev.some((i) => i.id === id)
                    ? prev.map((i) => (i.id === id ? updated : i))
                    : [updated, ...prev]);
            } else if (type === "propietarios") {
                const updated = await propietariosService.getPropietarioById(id);
                if (updated) setPropietarios((prev) => prev.some((p) => p.id === id)
                    ? prev.map((p) => (p.id === id ? updated : p))
                    : [updated, ...prev]);
            } else if (type === "leads") {
                const updated = await leadsService.getLeadById(id);
                if (updated) setLeads((prev) => prev.some((l) => l.id === id)
                    ? prev.map((l) => (l.id === id ? updated : l))
                    : [updated, ...prev]);
            }
        } catch (err) {
            console.error("Error refreshing client after save:", err);
            fetchAllData(auth.currentUser.uid);
        }
    };

    // ── Delete / Edit handlers ────────────────────────────────────────────────
    const handleDeleteInquilino = async (id: string) => {
        if (!confirm("¿Eliminar este inquilino?")) return;
        await inquilinosService.deleteInquilino(id);
        setInquilinos((p) => p.filter((i) => i.id !== id));
    };
    const handleEditInquilino = (i: Inquilino) => { setEditingClient(i); setIsModalOpen(true); };
    const handleViewInquilino = (i: Inquilino) => router.push(`/dashboard/clientes/inquilinos/${i.id}`);

    const handleDeletePropietario = async (id: string) => {
        if (!confirm("¿Eliminar este propietario?")) return;
        await propietariosService.deletePropietario(id);
        setPropietarios((p) => p.filter((x) => x.id !== id));
    };
    const handleEditPropietario = (p: Propietario) => { setEditingClient(p); setIsModalOpen(true); };
    const handleViewPropietario = (p: Propietario) => router.push(`/dashboard/clientes/propietarios/${p.id}`);

    const handleDeleteLead = async (id: string) => {
        if (!confirm("¿Eliminar este lead?")) return;
        await leadsService.deleteLead(id);
        setLeads((p) => p.filter((l) => l.id !== id));
    };
    const handleEditLead = (l: Lead) => { setEditingClient(l); setIsModalOpen(true); };
    const handleViewLead = (l: Lead) => router.push(`/dashboard/clientes/leads/${l.id}`);
    const handleConvertLead = async (id: string) => {
        if (!confirm("¿Marcar como convertido?")) return;
        await leadsService.convertLead(id);
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, estado: "cerrado" } : l)));
    };

    // ── Filtered lists ────────────────────────────────────────────────────────
    const term = searchTerm.toLowerCase();
    const filteredInquilinos = inquilinos.filter((i) =>
        i.nombre.toLowerCase().includes(term) ||
        i.email?.toLowerCase().includes(term) ||
        i.dni?.includes(term)
    );
    const filteredPropietarios = propietarios.filter((p) =>
        p.nombre.toLowerCase().includes(term) ||
        p.email?.toLowerCase().includes(term) ||
        p.dni?.includes(term)
    );
    const filteredLeads = leads.filter((l) =>
        l.nombre?.toLowerCase().includes(term) ||
        l.email?.toLowerCase().includes(term) ||
        l.telefono?.includes(term)
    );

    // ── KPI labels per tab ────────────────────────────────────────────────────
    const TABS = [
        {
            id: "inquilinos" as TabType,
            label: "Inquilinos",
            icon: Key,
            count: inquilinos.length,
            color: "text-[var(--color-positive)]",
            activeBg: "bg-[var(--color-positive-soft)] border-[var(--color-positive)]/30 text-[var(--color-positive)]",
            inactiveBg: "text-[var(--color-muted)] hover:text-[var(--color-ink-2)] border-transparent",
            dot: "bg-[var(--color-positive)]",
        },
        {
            id: "propietarios" as TabType,
            label: "Propietarios",
            icon: Building2,
            count: propietarios.length,
            color: "text-[var(--color-accent)]",
            activeBg: "bg-[var(--color-accent-soft)] border-[var(--color-accent)]/30 text-[var(--color-accent)]",
            inactiveBg: "text-[var(--color-muted)] hover:text-[var(--color-ink-2)] border-transparent",
            dot: "bg-[var(--color-accent)]",
        },
        {
            id: "leads" as TabType,
            label: "Leads / Consultas",
            icon: TrendingUp,
            count: leads.length,
            color: "text-[var(--color-accent)]",
            activeBg: "bg-[var(--color-accent-soft)] border-[var(--color-accent)]/30 text-[var(--color-accent)]",
            inactiveBg: "text-[var(--color-muted)] hover:text-[var(--color-ink-2)] border-transparent",
            dot: "bg-[var(--color-accent)]",
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[var(--color-muted)] text-sm font-medium">Cargando clientes...</p>
                </div>
            </div>
        );
    }

    const activeTabDef = TABS.find((t) => t.id === activeTab)!;

    return (
        <div className="space-y-6">
            <ClientFormModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingClient(null); }}
                onSuccess={handleSuccess}
                initialType={activeTab}
                initialData={editingClient}
            />

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)] flex items-center gap-2">
                        <Users strokeWidth={1.5} size={22} className="text-[var(--color-accent)]" /> Clientes
                    </h1>
                    <p className="text-[var(--color-muted)] text-sm mt-0.5">
                        Inquilinos, propietarios y leads de tu inmobiliaria
                    </p>
                </div>
                <button
                    onClick={() => { setEditingClient(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-xl hover:bg-[var(--color-ink-2)] transition shadow-sm text-sm font-semibold active:scale-95"
                >
                    <Plus strokeWidth={1.5} size={16} /> Nuevo Cliente
                </button>
            </div>

            {/* ── KPI cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => switchTab(tab.id)}
                            className={`flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                                isActive
                                    ? tab.activeBg + " shadow-sm"
                                    : "bg-[var(--color-paper-2)] border-[var(--color-rule-2)] hover:border-[var(--color-neutral)]"
                            }`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? "bg-[var(--color-paper-2)]/60" : "bg-[var(--color-paper)]"}`}>
                                <Icon size={22} className={isActive ? tab.color : "text-[var(--color-neutral)]"} />
                            </div>
                            <div>
                                <p className={`text-3xl font-extrabold tracking-tight ${isActive ? "" : "text-[var(--color-ink-2)]"}`}>
                                    {tab.count}
                                </p>
                                <p className={`text-xs font-bold uppercase tracking-widest mt-0.5 ${isActive ? "" : "text-[var(--color-neutral)]"}`}>
                                    {tab.label}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── Search + Tab bar ── */}
            <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule-2)] shadow-sm p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                {/* Search */}
                <div className="relative flex-1">
                    <Search strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral)]" />
                    <input
                        type="text"
                        placeholder={
                            activeTab === "inquilinos" ? "Buscar por nombre, email o DNI..." :
                            activeTab === "propietarios" ? "Buscar por nombre, email o DNI..." :
                            "Buscar por nombre, email o teléfono..."
                        }
                        className="w-full pl-9 pr-4 py-2.5 bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] focus:bg-[var(--color-paper-2)] transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-[var(--color-paper-3)] rounded-xl p-1 flex-shrink-0">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => switchTab(tab.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? "bg-[var(--color-paper-2)] shadow text-[var(--color-ink)]"
                                        : "text-[var(--color-muted)] hover:text-[var(--color-ink-2)]"
                                }`}
                            >
                                <Icon size={14} />
                                {tab.label}
                                <span className={`ml-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                                    activeTab === tab.id ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]" : "bg-[var(--color-paper-4)] text-[var(--color-muted)]"
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Table content ── */}
            <div>
                {activeTab === "inquilinos" && (
                    <InquilinosTable
                        inquilinos={filteredInquilinos}
                        onDelete={handleDeleteInquilino}
                        onEdit={handleEditInquilino}
                        onViewDetail={handleViewInquilino}
                    />
                )}
                {activeTab === "propietarios" && (
                    <PropietariosTable
                        propietarios={filteredPropietarios}
                        onDelete={handleDeletePropietario}
                        onEdit={handleEditPropietario}
                        onViewDetail={handleViewPropietario}
                    />
                )}
                {activeTab === "leads" && (
                    <LeadsTable
                        leads={filteredLeads}
                        onDelete={handleDeleteLead}
                        onEdit={handleEditLead}
                        onViewDetail={handleViewLead}
                        onConvert={handleConvertLead}
                    />
                )}
            </div>
        </div>
    );
}

export default function ClientesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ClientesContent />
        </Suspense>
    );
}
