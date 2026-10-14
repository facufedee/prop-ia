"use client";

import { useEffect, useState, useCallback } from "react";
import { format, differenceInDays, startOfDay, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, CheckCircle2, Clock, CalendarDays, TrendingDown, ExternalLink, X, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/ui/context/AuthContext";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { Alquiler, Pago } from "@/domain/models/Alquiler";
import { toast } from "sonner";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PagoConContexto extends Pago {
    alquilerId: string;
    direccion: string;
    nombreInquilino: string;
    whatsappInquilino?: string;
    diasRestantes: number; // negativo = vencido
}

type Filtro = "vencidos" | "hoy" | "semana" | "mes" | "todos";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clasificarPago(pago: PagoConContexto): Filtro {
    const d = pago.diasRestantes;
    if (d < 0) return "vencidos";
    if (d === 0) return "hoy";
    if (d <= 7) return "semana";
    return "mes";
}

function badgePago(dias: number) {
    if (dias < 0) return {
        label: `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? "s" : ""}`,
        className: "bg-[var(--color-danger-soft)] text-[var(--color-danger)] border border-[var(--color-danger)]/30",
        dot: "bg-[var(--color-danger)]",
    };
    if (dias === 0) return {
        label: "Vence hoy",
        className: "bg-[var(--color-warning-soft)] text-[var(--color-warning)] border border-[var(--color-warning)]/30",
        dot: "bg-[var(--color-warning)]",
    };
    if (dias <= 3) return {
        label: `Vence en ${dias} día${dias !== 1 ? "s" : ""}`,
        className: "bg-[var(--color-warning-soft)] text-[var(--color-warning)] border border-[var(--color-warning)]/30",
        dot: "bg-[var(--color-warning)]/30",
    };
    return {
        label: `Vence en ${dias} días`,
        className: "bg-[var(--color-accent-soft)] text-[var(--color-accent)] border border-[var(--color-accent)]/30",
        dot: "bg-[var(--color-accent)]/30",
    };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AgendaCobrosPage() {
    const { user } = useAuth();
    const [pagos, setPagos] = useState<PagoConContexto[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState<Filtro>("vencidos");
    const [cobrandoId, setCobrandoId] = useState<string | null>(null); // pagoId being paid
    const [modalPago, setModalPago] = useState<PagoConContexto | null>(null);
    const [metodoPago, setMetodoPago] = useState("transferencia");
    const [fechaPago, setFechaPago] = useState(new Date().toISOString().split("T")[0]);
    const [guardando, setGuardando] = useState(false);

    const cargarPagos = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const alquileres = await alquileresService.getAlquileres(user.uid);
            const hoy = startOfDay(new Date());

            const pendientes: PagoConContexto[] = [];

            alquileres
                .filter(a => a.estado === "activo")
                .forEach((a: Alquiler) => {
                    (a.historialPagos || [])
                        .filter(p => p.estado === "pendiente" || p.estado === "vencido")
                        .forEach(p => {
                            const venc = p.fechaVencimiento ? startOfDay(new Date(p.fechaVencimiento)) : null;
                            const diasRestantes = venc ? differenceInDays(venc, hoy) : 0;
                            // Only show payments due within next 30 days or already overdue
                            if (diasRestantes <= 30) {
                                pendientes.push({
                                    ...p,
                                    alquilerId: a.id,
                                    direccion: a.direccion,
                                    nombreInquilino: a.nombreInquilino,
                                    whatsappInquilino: a.whatsappInquilino,
                                    diasRestantes,
                                });
                            }
                        });
                });

            // Sort: overdue first (most overdue first), then by due date asc
            pendientes.sort((a, b) => a.diasRestantes - b.diasRestantes);
            setPagos(pendientes);
        } catch (err) {
            console.error(err);
            toast.error("Error al cargar la agenda de cobros");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { cargarPagos(); }, [cargarPagos]);

    // ── Counts per filter ────────────────────────────────────────────────────

    const counts = {
        vencidos: pagos.filter(p => p.diasRestantes < 0).length,
        hoy: pagos.filter(p => p.diasRestantes === 0).length,
        semana: pagos.filter(p => p.diasRestantes > 0 && p.diasRestantes <= 7).length,
        mes: pagos.filter(p => p.diasRestantes > 7 && p.diasRestantes <= 30).length,
        todos: pagos.length,
    };

    const pagosFiltrados = filtro === "todos"
        ? pagos
        : pagos.filter(p => clasificarPago(p) === filtro);

    const totalFiltrado = pagosFiltrados.reduce((sum, p) => sum + (p.monto || 0), 0);

    // ── Cobrar ───────────────────────────────────────────────────────────────

    const abrirModal = (pago: PagoConContexto) => {
        setModalPago(pago);
        setMetodoPago("transferencia");
        setFechaPago(new Date().toISOString().split("T")[0]);
    };

    const confirmarCobro = async () => {
        if (!modalPago) return;
        setGuardando(true);
        try {
            const pagoActualizado: Pago = {
                ...modalPago,
                estado: "pagado",
                fechaPago: new Date(fechaPago),
                metodoPago,
            };
            await alquileresService.registrarPago(modalPago.alquilerId, pagoActualizado);
            toast.success(`Pago de ${modalPago.nombreInquilino} registrado`);
            setModalPago(null);
            await cargarPagos();
        } catch (err) {
            console.error(err);
            toast.error("Error al registrar el pago");
        } finally {
            setGuardando(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)] flex items-center gap-2">
                        <span className="w-9 h-9 rounded-full bg-[var(--color-paper-3)] flex items-center justify-center">
                            <CalendarDays size={18} strokeWidth={1.5} className="text-[var(--color-muted)]" />
                        </span>
                        Agenda de Cobros
                    </h1>
                    <p className="text-[var(--color-muted)] mt-1 text-sm">Pagos pendientes de todos los contratos activos</p>
                </div>
                <button
                    onClick={cargarPagos}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)] rounded-xl transition"
                >
                    <RefreshCw strokeWidth={1.5} size={14} className={loading ? "animate-spin" : ""} />
                    Actualizar
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button onClick={() => setFiltro("vencidos")} className={`text-left p-4 rounded-2xl border-2 transition-all ${filtro === "vencidos" ? "border-[var(--color-danger)] bg-[var(--color-danger-soft)]" : "border-transparent bg-[var(--color-paper-2)] hover:border-[var(--color-danger)]/30"} shadow-sm`}>
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle strokeWidth={1.5} size={16} className="text-[var(--color-danger)]" />
                        <span className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide">Vencidos</span>
                    </div>
                    <p className="text-3xl font-bold text-[var(--color-danger)]">{loading ? "—" : counts.vencidos}</p>
                </button>

                <button onClick={() => setFiltro("hoy")} className={`text-left p-4 rounded-2xl border-2 transition-all ${filtro === "hoy" ? "border-[var(--color-warning)] bg-[var(--color-warning-soft)]" : "border-transparent bg-[var(--color-paper-2)] hover:border-[var(--color-warning)]/30"} shadow-sm`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Clock strokeWidth={1.5} size={16} className="text-[var(--color-warning)]" />
                        <span className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide">Hoy</span>
                    </div>
                    <p className="text-3xl font-bold text-[var(--color-warning)]">{loading ? "—" : counts.hoy}</p>
                </button>

                <button onClick={() => setFiltro("semana")} className={`text-left p-4 rounded-2xl border-2 transition-all ${filtro === "semana" ? "border-[var(--color-warning)] bg-[var(--color-warning-soft)]" : "border-transparent bg-[var(--color-paper-2)] hover:border-[var(--color-warning)]/30"} shadow-sm`}>
                    <div className="flex items-center gap-2 mb-2">
                        <CalendarDays strokeWidth={1.5} size={16} className="text-[var(--color-warning)]" />
                        <span className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide">Esta semana</span>
                    </div>
                    <p className="text-3xl font-bold text-[var(--color-warning)]">{loading ? "—" : counts.semana}</p>
                </button>

                <button onClick={() => setFiltro("mes")} className={`text-left p-4 rounded-2xl border-2 transition-all ${filtro === "mes" ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]" : "border-transparent bg-[var(--color-paper-2)] hover:border-[var(--color-accent)]/30"} shadow-sm`}>
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown strokeWidth={1.5} size={16} className="text-[var(--color-accent)]" />
                        <span className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide">Este mes</span>
                    </div>
                    <p className="text-3xl font-bold text-[var(--color-accent)]">{loading ? "—" : counts.mes}</p>
                </button>
            </div>

            {/* Table */}
            <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] shadow-sm overflow-hidden">
                {/* Table header with filter tabs + total */}
                <div className="px-6 py-4 border-b border-[var(--color-rule-2)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex gap-1 bg-[var(--color-paper-3)] p-1 rounded-xl w-fit">
                        {([
                            { key: "vencidos", label: "Vencidos" },
                            { key: "hoy", label: "Hoy" },
                            { key: "semana", label: "Semana" },
                            { key: "mes", label: "Mes" },
                            { key: "todos", label: "Todos" },
                        ] as { key: Filtro; label: string }[]).map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFiltro(f.key)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${filtro === f.key ? "bg-[var(--color-paper-2)] text-[var(--color-ink)] shadow-sm" : "text-[var(--color-muted)] hover:text-[var(--color-ink-2)]"}`}
                            >
                                {f.label}
                                {counts[f.key] > 0 && (
                                    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${f.key === "vencidos" ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]" : "bg-[var(--color-paper-4)] text-[var(--color-ink-2)]"}`}>
                                        {counts[f.key]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    {pagosFiltrados.length > 0 && (
                        <p className="text-sm text-[var(--color-muted)]">
                            Total: <span className="font-semibold text-[var(--color-ink)]">$ {totalFiltrado.toLocaleString("es-AR")}</span>
                        </p>
                    )}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="py-16 flex flex-col items-center gap-3 text-[var(--color-neutral)]">
                        <Loader2 strokeWidth={1.5} size={28} className="animate-spin" />
                        <p className="text-sm">Cargando agenda...</p>
                    </div>
                ) : pagosFiltrados.length === 0 ? (
                    <div className="py-16 text-center">
                        <CheckCircle2 strokeWidth={1.5} size={40} className="text-[var(--color-positive)] mx-auto mb-3" />
                        <p className="text-[var(--color-ink-2)] font-medium">Todo al día</p>
                        <p className="text-[var(--color-neutral)] text-sm mt-1">No hay cobros pendientes en este período</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[var(--color-paper)] border-b border-[var(--color-rule-2)]">
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Inquilino / Propiedad</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Período</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Vencimiento</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Monto</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-rule-2)]">
                                {pagosFiltrados.map(pago => {
                                    const badge = badgePago(pago.diasRestantes);
                                    const [year, month] = pago.mes.split("-");
                                    const periodoLabel = format(new Date(Number(year), Number(month) - 1, 1), "MMMM yyyy", { locale: es });

                                    return (
                                        <tr key={`${pago.alquilerId}-${pago.id}`} className="hover:bg-[var(--color-paper-3)] transition-colors">
                                            {/* Estado */}
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                                    {badge.label}
                                                </span>
                                            </td>

                                            {/* Inquilino / Propiedad */}
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-[var(--color-ink)]">{pago.nombreInquilino}</p>
                                                <p className="text-xs text-[var(--color-neutral)] mt-0.5 max-w-[200px] truncate">{pago.direccion}</p>
                                            </td>

                                            {/* Período */}
                                            <td className="px-6 py-4 text-[var(--color-ink-2)] capitalize">{periodoLabel}</td>

                                            {/* Vencimiento */}
                                            <td className="px-6 py-4 text-[var(--color-muted)]">
                                                {pago.fechaVencimiento
                                                    ? format(new Date(pago.fechaVencimiento), "dd/MM/yyyy")
                                                    : "—"}
                                            </td>

                                            {/* Monto */}
                                            <td className="px-6 py-4 text-right font-semibold text-[var(--color-ink)]">
                                                $ {(pago.monto || 0).toLocaleString("es-AR")}
                                            </td>

                                            {/* Acción */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => abrirModal(pago)}
                                                        className="px-3 py-1.5 bg-[var(--color-ink)] text-[var(--color-paper)] text-xs font-medium rounded-lg hover:bg-[var(--color-ink-2)] transition"
                                                    >
                                                        Cobrar
                                                    </button>
                                                    <Link
                                                        href={`/dashboard/alquileres/${pago.alquilerId}`}
                                                        className="p-1.5 text-[var(--color-neutral)] hover:text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)] rounded-lg transition"
                                                        title="Ver contrato"
                                                    >
                                                        <ExternalLink strokeWidth={1.5} size={14} />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal cobrar */}
            {modalPago && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-[var(--color-paper-2)] rounded-2xl shadow-xl w-full max-w-sm">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-rule-2)]">
                            <h3 className="font-semibold text-[var(--color-ink)]">Registrar cobro</h3>
                            <button onClick={() => setModalPago(null)} className="p-1 rounded-lg hover:bg-[var(--color-paper-3)] transition">
                                <X strokeWidth={1.5} size={18} className="text-[var(--color-muted)]" />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            {/* Resumen */}
                            <div className="bg-[var(--color-paper)] rounded-xl p-4 space-y-1.5">
                                <p className="font-medium text-[var(--color-ink)]">{modalPago.nombreInquilino}</p>
                                <p className="text-sm text-[var(--color-muted)]">{modalPago.direccion}</p>
                                <p className="text-xs text-[var(--color-neutral)] capitalize">
                                    {format(new Date(Number(modalPago.mes.split("-")[0]), Number(modalPago.mes.split("-")[1]) - 1, 1), "MMMM yyyy", { locale: es })}
                                </p>
                                <p className="text-2xl font-bold text-[var(--color-ink)] pt-1">
                                    $ {(modalPago.monto || 0).toLocaleString("es-AR")}
                                </p>
                            </div>

                            {/* Fecha */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">Fecha de pago</label>
                                <input
                                    type="date"
                                    value={fechaPago}
                                    onChange={e => setFechaPago(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-[var(--color-rule)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-neutral)] focus:border-[var(--color-neutral)] outline-none"
                                />
                            </div>

                            {/* Método */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">Método de pago</label>
                                <select
                                    value={metodoPago}
                                    onChange={e => setMetodoPago(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-[var(--color-rule)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-neutral)] focus:border-[var(--color-neutral)] outline-none bg-[var(--color-paper-2)]"
                                >
                                    <option value="transferencia">Transferencia</option>
                                    <option value="efectivo">Efectivo</option>
                                    <option value="mercadopago">MercadoPago</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="debito">Débito automático</option>
                                </select>
                            </div>
                        </div>

                        <div className="px-6 pb-5 flex gap-3">
                            <button
                                onClick={() => setModalPago(null)}
                                className="flex-1 px-4 py-2.5 border border-[var(--color-rule)] text-[var(--color-ink-2)] rounded-xl text-sm font-medium hover:bg-[var(--color-paper-3)] transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarCobro}
                                disabled={guardando}
                                className="flex-1 px-4 py-2.5 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-xl text-sm font-medium hover:bg-[var(--color-ink-2)] transition disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {guardando ? <Loader2 strokeWidth={1.5} size={14} className="animate-spin" /> : <CheckCircle2 strokeWidth={1.5} size={14} />}
                                Confirmar cobro
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
