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

    const handleSuccess = (type: TabType) => {
        if (auth?.currentUser) {
            switchTab(type);
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
        if (auth?.currentUser) fetchAllData(auth.currentUser.uid);
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
            color: "text-emerald-600",
            activeBg: "bg-emerald-50 border-emerald-200 text-emerald-700",
            inactiveBg: "text-gray-500 hover:text-gray-700 border-transparent",
            dot: "bg-emerald-500",
        },
        {
            id: "propietarios" as TabType,
            label: "Propietarios",
            icon: Building2,
            count: propietarios.length,
            color: "text-indigo-600",
            activeBg: "bg-indigo-50 border-indigo-200 text-indigo-700",
            inactiveBg: "text-gray-500 hover:text-gray-700 border-transparent",
            dot: "bg-indigo-500",
        },
        {
            id: "leads" as TabType,
            label: "Leads / Consultas",
            icon: TrendingUp,
            count: leads.length,
            color: "text-violet-600",
            activeBg: "bg-violet-50 border-violet-200 text-violet-700",
            inactiveBg: "text-gray-500 hover:text-gray-700 border-transparent",
            dot: "bg-violet-500",
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 text-sm font-medium">Cargando clientes...</p>
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
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users size={22} className="text-indigo-500" /> Clientes
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Inquilinos, propietarios y leads de tu inmobiliaria
                    </p>
                </div>
                <button
                    onClick={() => { setEditingClient(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-sm text-sm font-semibold active:scale-95"
                >
                    <Plus size={16} /> Nuevo Cliente
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
                                    : "bg-white border-gray-100 hover:border-gray-200"
                            }`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? "bg-white/60" : "bg-gray-50"}`}>
                                <Icon size={22} className={isActive ? tab.color : "text-gray-400"} />
                            </div>
                            <div>
                                <p className={`text-3xl font-extrabold tracking-tight ${isActive ? "" : "text-gray-700"}`}>
                                    {tab.count}
                                </p>
                                <p className={`text-xs font-bold uppercase tracking-widest mt-0.5 ${isActive ? "" : "text-gray-400"}`}>
                                    {tab.label}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── Search + Tab bar ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={
                            activeTab === "inquilinos" ? "Buscar por nombre, email o DNI..." :
                            activeTab === "propietarios" ? "Buscar por nombre, email o DNI..." :
                            "Buscar por nombre, email o teléfono..."
                        }
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 flex-shrink-0">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => switchTab(tab.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? "bg-white shadow text-gray-800"
                                        : "text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                <Icon size={14} />
                                {tab.label}
                                <span className={`ml-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                                    activeTab === tab.id ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-500"
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
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ClientesContent />
        </Suspense>
    );
}
