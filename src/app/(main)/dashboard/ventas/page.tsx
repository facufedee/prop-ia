"use client";

import { useEffect, useState, useCallback } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { useAuth } from "@/ui/context/AuthContext";
import { ventasService } from "@/infrastructure/services/ventasService";
import { VentaOperacion, VentaEtapa, ETAPA_CONFIG, ETAPAS_ACTIVAS } from "@/domain/models/Venta";
import VentaKanbanColumn from "./components/VentaKanbanColumn";
import { Plus, Handshake, TrendingUp, FileCheck, DollarSign, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type FiltroEstado = "activo" | "cerrado" | "caido" | "todos";

export default function VentasPage() {
    const { user } = useAuth();
    const [ventas, setVentas] = useState<VentaOperacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState<FiltroEstado>("activo");
    const [busqueda, setBusqueda] = useState("");

    const cargar = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await ventasService.getVentas(user.uid);
            setVentas(data);
        } catch {
            toast.error("Error al cargar operaciones");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { cargar(); }, [cargar]);

    // ── Stats ────────────────────────────────────────────────────────────────
    const activas    = ventas.filter(v => v.estado === "activo");
    const enEscritura = ventas.filter(v => v.etapa === "escrituracion");
    const cerradasMes = ventas.filter(v => {
        if (v.estado !== "cerrado") return false;
        const now = new Date();
        return v.updatedAt.getMonth() === now.getMonth() && v.updatedAt.getFullYear() === now.getFullYear();
    });
    const volumenTotal = ventas
        .filter(v => v.etapa === "cerrada")
        .reduce((acc, v) => acc + (v.precioAcordado ?? v.precioListado), 0);

    // ── Filter + search ──────────────────────────────────────────────────────
    const ventasFiltradas = ventas.filter(v => {
        if (filtro !== "todos" && v.estado !== filtro) return false;
        if (busqueda) {
            const q = busqueda.toLowerCase();
            return (
                v.direccion.toLowerCase().includes(q) ||
                v.compradores.some(c => c.nombre.toLowerCase().includes(q)) ||
                v.vendedores.some(c => c.nombre.toLowerCase().includes(q))
            );
        }
        return true;
    });

    const ventasPorEtapa = (etapa: VentaEtapa) =>
        ventasFiltradas.filter(v => v.etapa === etapa);

    // ── Drag & drop ──────────────────────────────────────────────────────────
    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return;
        const nuevaEtapa = result.destination.droppableId as VentaEtapa;
        const ventaId    = result.draggableId;
        const venta      = ventas.find(v => v.id === ventaId);
        if (!venta || venta.etapa === nuevaEtapa) return;

        // Optimistic update
        setVentas(prev => prev.map(v =>
            v.id === ventaId
                ? { ...v, etapa: nuevaEtapa, estado: nuevaEtapa === "cerrada" ? "cerrado" : nuevaEtapa === "caida" ? "caido" : "activo" }
                : v
        ));

        try {
            await ventasService.actualizarEtapa(ventaId, nuevaEtapa, user?.displayName ?? undefined);
        } catch {
            toast.error("Error al actualizar etapa");
            cargar(); // revert
        }
    };

    const etapasVisibles: VentaEtapa[] = filtro === "cerrado"
        ? ["cerrada"]
        : filtro === "caido"
        ? ["caida"]
        : [...ETAPAS_ACTIVAS, "cerrada", "caida"];

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)] flex items-center gap-2">
                        <Handshake strokeWidth={1.5} className="text-[var(--color-accent)]" size={24} />
                        Ventas
                    </h1>
                    <p className="text-sm text-[var(--color-muted)] mt-0.5">Pipeline de operaciones de compraventa</p>
                </div>
                <Link
                    href="/dashboard/ventas/nuevo"
                    className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-ink)] hover:bg-[var(--color-ink-2)] text-[var(--color-paper)] rounded-xl text-sm font-semibold transition shadow-sm active:scale-95"
                >
                    <Plus strokeWidth={1.5} size={16} /> Nueva Operación
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Operaciones activas",   value: activas.length,     icon: Handshake,  color: "text-[var(--color-muted)]",  bg: "bg-[var(--color-paper-3)]" },
                    { label: "En escrituración",       value: enEscritura.length, icon: FileCheck,  color: "text-[var(--color-muted)]",  bg: "bg-[var(--color-paper-3)]" },
                    { label: "Cerradas este mes",      value: cerradasMes.length, icon: TrendingUp, color: "text-[var(--color-positive)]",   bg: "bg-[var(--color-paper-3)]" },
                    { label: "Volumen cerrado (año)",  value: `$${(volumenTotal / 1_000_000).toFixed(1)}M`, icon: DollarSign, color: "text-[var(--color-positive)]", bg: "bg-[var(--color-paper-3)]" },
                ].map(s => (
                    <div key={s.label} className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-4 shadow-sm flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-[var(--color-paper-3)] flex items-center justify-center flex-shrink-0`}>
                            <s.icon strokeWidth={1.5} size={18} className={s.color} />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-[var(--color-ink)]">{s.value}</div>
                            <div className="text-xs text-[var(--color-muted)]">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
                <input
                    type="text"
                    placeholder="Buscar por dirección, comprador o vendedor…"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    className="flex-1 min-w-[220px] px-4 py-2 bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-xl text-sm text-[var(--color-ink)] placeholder-[var(--color-neutral)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 shadow-sm"
                />
                <div className="flex items-center bg-[var(--color-paper-3)] rounded-xl p-1 gap-1">
                    {(["activo", "cerrado", "caido", "todos"] as FiltroEstado[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setFiltro(f)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${filtro === f ? "bg-[var(--color-paper-2)] shadow text-[var(--color-accent)]" : "text-[var(--color-muted)] hover:text-[var(--color-ink-2)]"}`}
                        >
                            {f === "activo" ? "Activas" : f === "cerrado" ? "Cerradas" : f === "caido" ? "Caídas" : "Todas"}
                        </button>
                    ))}
                </div>
                <button onClick={cargar} className="p-2 text-[var(--color-neutral)] hover:text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)] rounded-lg transition-colors">
                    <RefreshCw strokeWidth={1.5} size={16} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Board */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 strokeWidth={1.5} size={32} className="text-[var(--color-accent)] animate-spin" />
                </div>
            ) : ventasFiltradas.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center bg-[var(--color-paper)] rounded-xl border border-dashed border-[var(--color-rule)]">
                    <Handshake strokeWidth={1.5} size={48} className="text-[var(--color-ink-2)] mb-4" />
                    <p className="text-[var(--color-muted)] font-medium">No hay operaciones todavía</p>
                    <p className="text-sm text-[var(--color-neutral)] mt-1">Crea tu primera operación de venta</p>
                    <Link
                        href="/dashboard/ventas/nuevo"
                        className="mt-4 px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-xl text-sm font-semibold hover:bg-[var(--color-ink-2)] transition"
                    >
                        Nueva Operación
                    </Link>
                </div>
            ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-4 overflow-x-auto pb-4 flex-1" style={{ minHeight: 400 }}>
                        {etapasVisibles.map(etapa => (
                            <VentaKanbanColumn
                                key={etapa}
                                etapa={etapa}
                                ventas={ventasPorEtapa(etapa)}
                            />
                        ))}
                    </div>
                </DragDropContext>
            )}
        </div>
    );
}
