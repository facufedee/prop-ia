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
    instalado: "bg-green-100 text-green-700 border-green-200",
    almacen: "bg-gray-100 text-gray-700 border-gray-200",
    reparacion: "bg-amber-100 text-amber-700 border-amber-200",
    retirar: "bg-orange-100 text-orange-700 border-orange-200",
    roto: "bg-red-100 text-red-700 border-red-200",
    perdido: "bg-red-100 text-red-700 border-red-200",
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
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
                            <Signpost size={18} className="text-white" />
                        </span>
                        Cartelería
                    </h1>
                    <p className="text-gray-500 mt-1">Seguimiento de tus carteles físicos de venta y alquiler</p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm shadow-indigo-200 transition"
                >
                    <Plus size={18} /> Nuevo Cartel
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
                <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
                    <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <DollarSign size={20} className="text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Inversión total en cartelería</p>
                        <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(stats.valorInvertido)}</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto max-w-full">
                    {FILTER_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${filter === tab.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por código o dirección..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
                    <Signpost size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">
                        {carteles.length === 0 ? "Todavía no cargaste ningún cartel" : "No hay carteles con ese filtro"}
                    </p>
                    {carteles.length === 0 && (
                        <button onClick={() => setModalOpen(true)} className="mt-4 text-indigo-600 font-semibold hover:underline">
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
                            className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all group"
                        >
                            <div className="relative h-36 bg-gray-100">
                                {cartel.fotos?.[0] ? (
                                    <img src={cartel.fotos[0]} alt={cartel.codigo} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <Camera size={28} />
                                    </div>
                                )}
                                <span className={`absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border ${ESTADO_BADGE[cartel.estado]}`}>
                                    {CARTEL_ESTADO_LABELS[cartel.estado]}
                                </span>
                            </div>
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="font-bold text-gray-900 text-sm">{cartel.codigo}</p>
                                    <span className="text-xs text-gray-400">{CARTEL_MEDIDA_LABELS[cartel.medida]}</span>
                                </div>
                                <p className="text-xs text-gray-500 mb-2">{CARTEL_TIPO_LABELS[cartel.tipo]}</p>
                                <div className="flex items-center gap-1.5 text-xs text-gray-600 border-t border-gray-50 pt-2">
                                    <MapPin size={12} className="flex-shrink-0 text-gray-400" />
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
        indigo: "bg-indigo-50 text-indigo-600",
        green: "bg-green-50 text-green-600",
        gray: "bg-gray-100 text-gray-600",
        orange: "bg-orange-50 text-orange-600",
        amber: "bg-amber-50 text-amber-600",
        red: "bg-red-50 text-red-600",
    };
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
                <Icon size={16} />
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            {alert && <p className="text-[10px] text-orange-600 font-bold mt-1">{alert}</p>}
        </div>
    );
}
