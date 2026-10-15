"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/ui/context/AuthContext";
import { useChartColors } from "@/lib/chartColors";
import { ventasService } from "@/infrastructure/services/ventasService";
import { VentaOperacion } from "@/domain/models/Venta";
import {
    TrendingUp, Handshake, DollarSign, Percent, Building2, User,
    Loader2, Download, RefreshCw, ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { format, getYear, getMonth } from "date-fns";
import { es } from "date-fns/locale";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend
} from "recharts";

// ── helpers ───────────────────────────────────────────────────────────────────

const fmtARS = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const fmtUSD = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function toDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "object" && "toDate" in value) return value.toDate();
    if (typeof value === "string" || typeof value === "number") {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }
    return null;
}

// ── types ─────────────────────────────────────────────────────────────────────

interface Row {
    venta: VentaOperacion;
    fechaCierre: Date;
    precioFinal: number;
    comisionMonto: number;
}

interface MonthlyBar {
    name: string;
    volumenARS: number;
    volumenUSD: number;
    comisionARS: number;
    operaciones: number;
}

// ── component ─────────────────────────────────────────────────────────────────

export default function VentasReportesPage() {
    const chartColors = useChartColors();
    const { user } = useAuth();
    const [ventas, setVentas] = useState<VentaOperacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState<number | "all">("all");
    const [sortKey, setSortKey] = useState<"fechaCierre" | "precioFinal" | "comisionMonto">("fechaCierre");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

    const cargar = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await ventasService.getVentas(user.uid);
            setVentas(data);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { cargar(); }, [cargar]);

    // ── filter to closed operations ───────────────────────────────────────────
    const cerradas = ventas.filter(v => v.etapa === "cerrada");

    const rows: Row[] = cerradas
        .map(v => {
            const fechaCierre = toDate(v.updatedAt) ?? toDate(v.createdAt) ?? new Date(0);
            const precioFinal = v.precioAcordado ?? v.precioListado;
            const comisionMonto = v.comisionMontoBruto ?? (precioFinal * v.comisionPorcentaje) / 100;
            return { venta: v, fechaCierre, precioFinal, comisionMonto };
        })
        .filter(r => {
            const y = getYear(r.fechaCierre);
            const m = getMonth(r.fechaCierre);
            if (y !== year) return false;
            if (month !== "all" && m !== month) return false;
            return true;
        });

    // ── stats ─────────────────────────────────────────────────────────────────
    const rowsARS = rows.filter(r => r.venta.moneda === "ARS");
    const rowsUSD = rows.filter(r => r.venta.moneda === "USD");

    const volumenARS = rowsARS.reduce((s, r) => s + r.precioFinal, 0);
    const volumenUSD = rowsUSD.reduce((s, r) => s + r.precioFinal, 0);
    const comisionTotal = rows.reduce((s, r) => s + r.comisionMonto, 0);
    const comisionMedia = rows.length > 0 ? comisionTotal / rows.length : 0;

    // ── monthly chart data ────────────────────────────────────────────────────
    const chartData: MonthlyBar[] = Array.from({ length: 12 }, (_, i) => ({
        name: format(new Date(2024, i, 1), "MMM", { locale: es }),
        volumenARS: 0,
        volumenUSD: 0,
        comisionARS: 0,
        operaciones: 0,
    }));

    cerradas.forEach(v => {
        const fechaCierre = toDate(v.updatedAt) ?? toDate(v.createdAt) ?? new Date(0);
        if (getYear(fechaCierre) !== year) return;
        const m = getMonth(fechaCierre);
        const precio = v.precioAcordado ?? v.precioListado;
        const comision = v.comisionMontoBruto ?? (precio * v.comisionPorcentaje) / 100;
        if (v.moneda === "ARS") chartData[m].volumenARS += precio;
        else chartData[m].volumenUSD += precio;
        chartData[m].comisionARS += comision;
        chartData[m].operaciones += 1;
    });

    // ── sort rows ─────────────────────────────────────────────────────────────
    const sortedRows = [...rows].sort((a, b) => {
        const aVal = sortKey === "fechaCierre" ? a.fechaCierre.getTime() : a[sortKey];
        const bVal = sortKey === "fechaCierre" ? b.fechaCierre.getTime() : b[sortKey];
        return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    const toggleSort = (key: typeof sortKey) => {
        if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortKey(key); setSortDir("desc"); }
    };
    const sortIcon = (key: typeof sortKey) =>
        sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

    const years = [2023, 2024, 2025, 2026, 2027];

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)] flex items-center gap-2">
                        <TrendingUp strokeWidth={1.5} className="text-[var(--color-accent)]" size={24} />
                        Reportes de Ventas
                    </h1>
                    <p className="text-sm text-[var(--color-muted)] mt-0.5">Volumen, comisiones y operaciones cerradas</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/dashboard/ventas"
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-[var(--color-ink-2)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] rounded-xl transition-colors"
                    >
                        <Handshake strokeWidth={1.5} size={15} /> Pipeline
                    </Link>
                    <button
                        onClick={cargar}
                        className="p-2 text-[var(--color-neutral)] hover:text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)] rounded-lg transition-colors"
                    >
                        <RefreshCw strokeWidth={1.5} size={16} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center py-32">
                    <Loader2 strokeWidth={1.5} size={32} className="text-[var(--color-accent)] animate-spin" />
                </div>
            ) : (
                <>
                    {/* Filters */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <select
                            value={year}
                            onChange={e => setYear(Number(e.target.value))}
                            className="px-4 py-2 border border-[var(--color-rule)] rounded-xl bg-[var(--color-paper-2)] text-sm text-[var(--color-ink)] focus:ring-2 focus:ring-[var(--color-accent)]/40 outline-none"
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <select
                            value={month}
                            onChange={e => setMonth(e.target.value === "all" ? "all" : Number(e.target.value))}
                            className="px-4 py-2 border border-[var(--color-rule)] rounded-xl bg-[var(--color-paper-2)] text-sm text-[var(--color-ink)] focus:ring-2 focus:ring-[var(--color-accent)]/40 outline-none"
                        >
                            <option value="all">Todo el año</option>
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i} value={i}>
                                    {format(new Date(2024, i, 1), "MMMM", { locale: es })}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            {
                                label: "Operaciones cerradas",
                                value: rows.length.toString(),
                                icon: Handshake,
                                color: "text-[var(--color-muted)]",
                                bg: "bg-[var(--color-paper-3)]",
                            },
                            {
                                label: "Volumen ARS",
                                value: fmtARS(volumenARS),
                                icon: DollarSign,
                                color: "text-[var(--color-positive)]",
                                bg: "bg-[var(--color-paper-3)]",
                            },
                            {
                                label: "Volumen USD",
                                value: fmtUSD(volumenUSD),
                                icon: DollarSign,
                                color: "text-[var(--color-positive)]",
                                bg: "bg-[var(--color-paper-3)]",
                            },
                            {
                                label: "Comisión media",
                                value: fmtARS(comisionMedia),
                                icon: Percent,
                                color: "text-[var(--color-muted)]",
                                bg: "bg-[var(--color-paper-3)]",
                            },
                        ].map(s => (
                            <div key={s.label} className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-4 shadow-sm flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full bg-[var(--color-paper-3)] flex items-center justify-center flex-shrink-0`}>
                                    <s.icon strokeWidth={1.5} size={18} className={s.color} />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-lg font-bold text-[var(--color-ink)] truncate">{s.value}</div>
                                    <div className="text-xs text-[var(--color-muted)]">{s.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chart */}
                    <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] shadow-sm p-5">
                        <h3 className="text-sm font-semibold text-[var(--color-ink-2)] mb-4">Operaciones cerradas por mes — {year}</h3>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.rule} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: chartColors.muted, fontSize: 12 }}
                                        dy={8}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: chartColors.muted, fontSize: 11 }}
                                        tickFormatter={v => v === 0 ? "0" : `${(v / 1_000_000).toFixed(1)}M`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: "12px", border: `1px solid ${chartColors.rule}`, background: chartColors.paper3, color: chartColors.ink, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.3)" }}
                                        labelStyle={{ color: chartColors.ink }}
                                        itemStyle={{ color: chartColors.ink2 }}
                                        cursor={{ fill: chartColors.paper3 }}
                                        formatter={(val: any, name: any) => {
                                            if (name === "Operaciones") return [val, name];
                                            return [fmtARS(val as number), name];
                                        }}
                                    />
                                    <Legend wrapperStyle={{ color: chartColors.muted }} />
                                    <Bar dataKey="volumenARS" name="Volumen ARS" fill={chartColors.accent} radius={[4, 4, 0, 0]} barSize={18} />
                                    <Bar dataKey="comisionARS" name="Comisión" fill={chartColors.neutral} radius={[4, 4, 0, 0]} barSize={18} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-[var(--color-rule-2)] flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <h3 className="text-sm font-semibold text-[var(--color-ink)]">Operaciones Cerradas</h3>
                                <span className="text-xs text-[var(--color-muted)] bg-[var(--color-paper-3)] px-2 py-0.5 rounded-full font-medium">
                                    {rows.length} registros
                                </span>
                            </div>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--color-accent)] bg-[var(--color-accent-soft)] hover:bg-[var(--color-accent-soft)] rounded-lg transition-colors font-medium">
                                <Download strokeWidth={1.5} size={14} /> Exportar
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-[var(--color-paper)]">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                                            Propiedad
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                                            Partes
                                        </th>
                                        <th
                                            className="px-5 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider cursor-pointer hover:bg-[var(--color-paper-3)] transition-colors select-none"
                                            onClick={() => toggleSort("fechaCierre")}
                                        >
                                            Fecha cierre{sortIcon("fechaCierre")}
                                        </th>
                                        <th
                                            className="px-5 py-3 text-right text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider cursor-pointer hover:bg-[var(--color-paper-3)] transition-colors select-none"
                                            onClick={() => toggleSort("precioFinal")}
                                        >
                                            Precio final{sortIcon("precioFinal")}
                                        </th>
                                        <th
                                            className="px-5 py-3 text-right text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider cursor-pointer hover:bg-[var(--color-paper-3)] transition-colors select-none"
                                            onClick={() => toggleSort("comisionMonto")}
                                        >
                                            Comisión{sortIcon("comisionMonto")}
                                        </th>
                                        <th className="px-5 py-3 text-center text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                                            %
                                        </th>
                                        <th className="px-5 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-rule-2)]">
                                    {sortedRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-12 text-center text-[var(--color-neutral)]">
                                                No hay operaciones cerradas en este periodo.
                                            </td>
                                        </tr>
                                    ) : (
                                        sortedRows.map(({ venta, fechaCierre, precioFinal, comisionMonto }) => (
                                            <tr key={venta.id} className="hover:bg-[var(--color-paper-3)] transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 strokeWidth={1.5} size={14} className="text-[var(--color-accent)] flex-shrink-0" />
                                                        <div>
                                                            <div className="font-medium text-[var(--color-ink)] truncate max-w-[200px]">{venta.direccion}</div>
                                                            <div className="text-xs text-[var(--color-neutral)]">{venta.propiedadTipo}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
                                                            <User strokeWidth={1.5} size={11} className="text-[var(--color-positive)]" />
                                                            <span className="truncate max-w-[140px]">
                                                                {venta.compradores[0]?.nombre ?? "—"}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
                                                            <User strokeWidth={1.5} size={11} className="text-[var(--color-accent)]" />
                                                            <span className="truncate max-w-[140px]">
                                                                {venta.vendedores[0]?.nombre ?? "—"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-sm text-[var(--color-ink-2)] whitespace-nowrap">
                                                    {format(fechaCierre, "dd/MM/yyyy")}
                                                </td>
                                                <td className="px-5 py-4 text-right font-semibold text-[var(--color-ink)] whitespace-nowrap">
                                                    {venta.moneda === "USD"
                                                        ? fmtUSD(precioFinal)
                                                        : fmtARS(precioFinal)}
                                                </td>
                                                <td className="px-5 py-4 text-right whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-positive-soft)] text-[var(--color-positive)]">
                                                        +{fmtARS(comisionMonto)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-center text-sm text-[var(--color-muted)]">
                                                    {venta.comisionPorcentaje}%
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <Link
                                                        href={`/dashboard/ventas/${venta.id}`}
                                                        className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-2)] font-medium"
                                                    >
                                                        Ver <ArrowUpRight strokeWidth={1.5} size={12} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
