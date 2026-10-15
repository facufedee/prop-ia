"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/infrastructure/firebase/client";
import Link from "next/link";
import {
    Plus, Search, Loader2, Signpost, Package, Wrench, AlertTriangle,
    XCircle, DollarSign, MapPin, Home, Camera,
} from "lucide-react";
import { carteleriaService } from "@/infrastructure/services/carteleriaService";
import { Cartel, CartelEstado, CARTEL_ESTADO_LABELS, CARTEL_TIPO_LABELS, CARTEL_MEDIDA_LABELS } from "@/domain/models/Cartel";
import { useBranchContext } from "@/infrastructure/context/BranchContext";
import CartelModal from "./components/CartelModal";

const ESTADO_BADGE: Record<CartelEstado, string> = {
    instalado: "bg-[var(--color-positive-soft)] text-[var(--color-positive)] border-[var(--color-positive)]/30",
    almacen: "bg-[var(--color-paper-3)] text-[var(--color-ink-2)] border-[var(--color-rule)]",
    reparacion: "bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[var(--color-warning)]/30",
    retirar: "bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[var(--color-warning)]/30",
    roto: "bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-[var(--color-danger)]/30",
    perdido: "bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-[var(--color-danger)]/30",
};

const FILTER_TABS: { key: CartelEstado | "todos"; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "instalado", label: "Instalados" },
    { key: "almacen", label: "En almacén" },
    { key: "retirar", label: "A retirar" },
    { key: "reparacion", label: "En reparación" },
    { key: "roto", label: "Rotos" },
    { key: "perdido", label: "Perdidos" },
];

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);

export default function CarteleriaPage() {
    const { selectedBranchId } = useBranchContext();
    const [userId, setUserId] = useState<string | null>(null);
    const [carteles, setCarteles] = useState<Cartel[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<CartelEstado | "todos">("todos");
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        if (!auth) { setLoading(false); return; }
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) setUserId(u.uid);
            else setLoading(false);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (userId) loadCarteles(userId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, selectedBranchId]);

    const loadCarteles = async (uid: string) => {
        setLoading(true);
        try {
            const data = await carteleriaService.getCarteles(uid, selectedBranchId);
            setCarteles(data);
        } catch (error) {
            console.error("Error loading carteles:", error);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const total = carteles.length;
        const byEstado = (estado: CartelEstado) => carteles.filter((c) => c.estado === estado).length;
        const valorInvertido = carteles.reduce(
            (sum, c) => sum + (c.costoAdquisicion || 0) + (c.costoInstalacion || 0),
            0
        );
        const aRetirarViejos = carteles.filter((c) => {
            if (c.estado !== "retirar") return false;
            const ultimoMovimiento = c.historial?.[c.historial.length - 1];
            if (!ultimoMovimiento) return false;
            const dias = (Date.now() - new Date(ultimoMovimiento.fecha).getTime()) / (1000 * 60 * 60 * 24);
            return dias > 7;
        }).length;
        return {
            total,
            instalado: byEstado("instalado"),
            almacen: byEstado("almacen"),
            reparacion: byEstado("reparacion"),
            retirar: byEstado("retirar"),
            problemas: byEstado("roto") + byEstado("perdido"),
            valorInvertido,
            aRetirarViejos,
        };
    }, [carteles]);

    const filtered = carteles.filter((c) => {
        const matchesFilter = filter === "todos" || c.estado === filter;
        const q = search.toLowerCase();
        const matchesSearch =
            !q ||
            c.codigo.toLowerCase().includes(q) ||
            c.propiedadDireccion?.toLowerCase().includes(q) ||
            c.ubicacionAlmacen?.toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
    });

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center h-64">
                <Loader2 strokeWidth={1.5} className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)] flex items-center gap-2">
                        <span className="w-9 h-9 rounded-full bg-[var(--color-paper-3)] flex items-center justify-center">
                            <Signpost strokeWidth={1.5} size={18} className="text-[var(--color-muted)]" />
                        </span>
                        Cartelería
                    </h1>
                    <p className="text-[var(--color-muted)] mt-1">Seguimiento de tus carteles físicos de venta y alquiler</p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-ink)] hover:bg-[var(--color-ink-2)] text-[var(--color-paper)] rounded-xl font-semibold shadow-sm transition"
                >
                    <Plus strokeWidth={1.5} size={18} /> Nuevo Cartel
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard icon={Signpost} label="Total" value={stats.total} color="indigo" />
                <StatCard icon={Home} label="Instalados" value={stats.instalado} color="green" />
                <StatCard icon={Package} label="En almacén" value={stats.almacen} color="gray" />
                <StatCard
                    icon={AlertTriangle}
                    label="A retirar"
                    value={stats.retirar}
                    color="orange"
                    alert={stats.aRetirarViejos > 0 ? `${stats.aRetirarViejos} hace +7 días` : undefined}
                />
                <StatCard icon={Wrench} label="En reparación" value={stats.reparacion} color="amber" />
                <StatCard icon={XCircle} label="Rotos/perdidos" value={stats.problemas} color="red" />
            </div>

            {stats.valorInvertido > 0 && (
                <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule-2)] p-5 flex items-center gap-4 shadow-sm">
                    <div className="w-11 h-11 bg-[var(--color-paper-3)] rounded-full flex items-center justify-center flex-shrink-0">
                        <DollarSign strokeWidth={1.5} size={20} className="text-[var(--color-muted)]" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest">Inversión total en cartelería</p>
                        <p className="text-2xl font-extrabold text-[var(--color-ink)]">{formatCurrency(stats.valorInvertido)}</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex gap-1 bg-[var(--color-paper-3)] p-1 rounded-xl overflow-x-auto max-w-full">
                    {FILTER_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${filter === tab.key ? "bg-[var(--color-paper-2)] text-[var(--color-ink)] shadow-sm" : "text-[var(--color-muted)] hover:text-[var(--color-ink-2)]"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-64">
                    <Search strokeWidth={1.5} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral)]" />
                    <input
                        type="text"
                        placeholder="Buscar por código o dirección..."
                        className="w-full pl-9 pr-3 py-2 border border-[var(--color-rule)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-accent)]/40 outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 text-[var(--color-muted)] bg-[var(--color-paper-2)] rounded-2xl border border-dashed border-[var(--color-rule)]">
                    <Signpost strokeWidth={1.5} size={40} className="mx-auto mb-3 text-[var(--color-neutral)]" />
                    <p className="text-lg font-medium">
                        {carteles.length === 0 ? "Todavía no cargaste ningún cartel" : "No hay carteles con ese filtro"}
                    </p>
                    {carteles.length === 0 && (
                        <button onClick={() => setModalOpen(true)} className="mt-4 text-[var(--color-accent)] font-semibold hover:underline">
                            Cargar el primero
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((cartel) => (
                        <Link
                            key={cartel.id}
                            href={`/dashboard/carteleria/${cartel.id}`}
                            className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule-2)] overflow-hidden hover:shadow-lg hover:border-[var(--color-accent)]/30 transition-all group"
                        >
                            <div className="relative h-36 bg-[var(--color-paper-3)]">
                                {cartel.fotos?.[0] ? (
                                    <img src={cartel.fotos[0]} alt={cartel.codigo} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[var(--color-neutral)]">
                                        <Camera strokeWidth={1.5} size={28} />
                                    </div>
                                )}
                                <span className={`absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border ${ESTADO_BADGE[cartel.estado]}`}>
                                    {CARTEL_ESTADO_LABELS[cartel.estado]}
                                </span>
                            </div>
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="font-bold text-[var(--color-ink)] text-sm">{cartel.codigo}</p>
                                    <span className="text-xs text-[var(--color-neutral)]">{CARTEL_MEDIDA_LABELS[cartel.medida]}</span>
                                </div>
                                <p className="text-xs text-[var(--color-muted)] mb-2">{CARTEL_TIPO_LABELS[cartel.tipo]}</p>
                                <div className="flex items-center gap-1.5 text-xs text-[var(--color-ink-2)] border-t border-[var(--color-rule-2)] pt-2">
                                    <MapPin strokeWidth={1.5} size={12} className="flex-shrink-0 text-[var(--color-neutral)]" />
                                    <span className="truncate">
                                        {cartel.estado === "instalado" && cartel.propiedadDireccion
                                            ? cartel.propiedadDireccion
                                            : cartel.estado === "almacen" && cartel.ubicacionAlmacen
                                                ? cartel.ubicacionAlmacen
                                                : "Sin ubicación registrada"}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {modalOpen && userId && (
                <CartelModal
                    userId={userId}
                    editingCartel={null}
                    onClose={() => setModalOpen(false)}
                    onSaved={() => {
                        setModalOpen(false);
                        loadCarteles(userId);
                    }}
                />
            )}
        </div>
    );
}

function StatCard({
    icon: Icon, label, value, color, alert,
}: { icon: any; label: string; value: number; color: string; alert?: string }) {
    const colorMap: Record<string, string> = {
        indigo: "bg-[var(--color-paper-3)] text-[var(--color-muted)]",
        green: "bg-[var(--color-paper-3)] text-[var(--color-positive)]",
        gray: "bg-[var(--color-paper-3)] text-[var(--color-muted)]",
        orange: "bg-[var(--color-paper-3)] text-[var(--color-warning)]",
        amber: "bg-[var(--color-paper-3)] text-[var(--color-warning)]",
        red: "bg-[var(--color-paper-3)] text-[var(--color-danger)]",
    };
    return (
        <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule-2)] p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-3 ${colorMap[color]}`}>
                <Icon strokeWidth={1.5} size={16} />
            </div>
            <p className="text-2xl font-extrabold text-[var(--color-ink)]">{value}</p>
            <p className="text-xs text-[var(--color-muted)] font-medium">{label}</p>
            {alert && <p className="text-[10px] text-[var(--color-warning)] font-bold mt-1">{alert}</p>}
        </div>
    );
}
