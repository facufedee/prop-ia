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
        className: "bg-red-100 text-red-700 border border-red-200",
        dot: "bg-red-500",
    };
    if (dias === 0) return {
        label: "Vence hoy",
        className: "bg-orange-100 text-orange-700 border border-orange-200",
        dot: "bg-orange-500",
    };
    if (dias <= 3) return {
        label: `Vence en ${dias} día${dias !== 1 ? "s" : ""}`,
        className: "bg-amber-100 text-amber-700 border border-amber-200",
        dot: "bg-amber-400",
    };
    return {
        label: `Vence en ${dias} días`,
        className: "bg-blue-50 text-blue-700 border border-blue-200",
        dot: "bg-blue-400",
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
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-9 h-9 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center">
                            <CalendarDays size={18} className="text-white" />
                        </span>
                        Agenda de Cobros
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">Pagos pendientes de todos los contratos activos</p>
                </div>
                <button
                    onClick={cargarPagos}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Actualizar
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button onClick={() => setFiltro("vencidos")} className={`text-left p-4 rounded-2xl border-2 transition-all ${filtro === "vencidos" ? "border-red-400 bg-red-50" : "border-transparent bg-white hover:border-red-200"} shadow-sm`}>
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={16} className="text-red-500" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Vencidos</span>
                    </div>
                    <p className="text-3xl font-bold text-red-600">{loading ? "—" : counts.vencidos}</p>
                </button>

                <button onClick={() => setFiltro("hoy")} className={`text-left p-4 rounded-2xl border-2 transition-all ${filtro === "hoy" ? "border-orange-400 bg-orange-50" : "border-transparent bg-white hover:border-orange-200"} shadow-sm`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-orange-500" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hoy</span>
                    </div>
                    <p className="text-3xl font-bold text-orange-600">{loading ? "—" : counts.hoy}</p>
                </button>

                <button onClick={() => setFiltro("semana")} className={`text-left p-4 rounded-2xl border-2 transition-all ${filtro === "semana" ? "border-amber-400 bg-amber-50" : "border-transparent bg-white hover:border-amber-200"} shadow-sm`}>
                    <div className="flex items-center gap-2 mb-2">
                        <CalendarDays size={16} className="text-amber-500" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Esta semana</span>
                    </div>
                    <p className="text-3xl font-bold text-amber-600">{loading ? "—" : counts.semana}</p>
                </button>

                <button onClick={() => setFiltro("mes")} className={`text-left p-4 rounded-2xl border-2 transition-all ${filtro === "mes" ? "border-blue-400 bg-blue-50" : "border-transparent bg-white hover:border-blue-200"} shadow-sm`}>
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown size={16} className="text-blue-500" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Este mes</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{loading ? "—" : counts.mes}</p>
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Table header with filter tabs + total */}
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
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
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${filtro === f.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                {f.label}
                                {counts[f.key] > 0 && (
                                    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${f.key === "vencidos" ? "bg-red-100 text-red-600" : "bg-gray-200 text-gray-600"}`}>
                                        {counts[f.key]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    {pagosFiltrados.length > 0 && (
                        <p className="text-sm text-gray-500">
                            Total: <span className="font-semibold text-gray-900">$ {totalFiltrado.toLocaleString("es-AR")}</span>
                        </p>
                    )}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
                        <Loader2 size={28} className="animate-spin" />
                        <p className="text-sm">Cargando agenda...</p>
                    </div>
                ) : pagosFiltrados.length === 0 ? (
                    <div className="py-16 text-center">
                        <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">Todo al día</p>
                        <p className="text-gray-400 text-sm mt-1">No hay cobros pendientes en este período</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Inquilino / Propiedad</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Período</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Vencimiento</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Monto</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {pagosFiltrados.map(pago => {
                                    const badge = badgePago(pago.diasRestantes);
                                    const [year, month] = pago.mes.split("-");
                                    const periodoLabel = format(new Date(Number(year), Number(month) - 1, 1), "MMMM yyyy", { locale: es });

                                    return (
                                        <tr key={`${pago.alquilerId}-${pago.id}`} className="hover:bg-gray-50/60 transition-colors">
                                            {/* Estado */}
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                                    {badge.label}
                                                </span>
                                            </td>

                                            {/* Inquilino / Propiedad */}
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900">{pago.nombreInquilino}</p>
                                                <p className="text-xs text-gray-400 mt-0.5 max-w-[200px] truncate">{pago.direccion}</p>
                                            </td>

                                            {/* Período */}
                                            <td className="px-6 py-4 text-gray-700 capitalize">{periodoLabel}</td>

                                            {/* Vencimiento */}
                                            <td className="px-6 py-4 text-gray-500">
                                                {pago.fechaVencimiento
                                                    ? format(new Date(pago.fechaVencimiento), "dd/MM/yyyy")
                                                    : "—"}
                                            </td>

                                            {/* Monto */}
                                            <td className="px-6 py-4 text-right font-semibold text-gray-900">
                                                $ {(pago.monto || 0).toLocaleString("es-AR")}
                                            </td>

                                            {/* Acción */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => abrirModal(pago)}
                                                        className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition"
                                                    >
                                                        Cobrar
                                                    </button>
                                                    <Link
                                                        href={`/dashboard/alquileres/${pago.alquilerId}`}
                                                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                                        title="Ver contrato"
                                                    >
                                                        <ExternalLink size={14} />
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
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900">Registrar cobro</h3>
                            <button onClick={() => setModalPago(null)} className="p-1 rounded-lg hover:bg-gray-100 transition">
                                <X size={18} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            {/* Resumen */}
                            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                                <p className="font-medium text-gray-900">{modalPago.nombreInquilino}</p>
                                <p className="text-sm text-gray-500">{modalPago.direccion}</p>
                                <p className="text-xs text-gray-400 capitalize">
                                    {format(new Date(Number(modalPago.mes.split("-")[0]), Number(modalPago.mes.split("-")[1]) - 1, 1), "MMMM yyyy", { locale: es })}
                                </p>
                                <p className="text-2xl font-bold text-gray-900 pt-1">
                                    $ {(modalPago.monto || 0).toLocaleString("es-AR")}
                                </p>
                            </div>

                            {/* Fecha */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de pago</label>
                                <input
                                    type="date"
                                    value={fechaPago}
                                    onChange={e => setFechaPago(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                                />
                            </div>

                            {/* Método */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Método de pago</label>
                                <select
                                    value={metodoPago}
                                    onChange={e => setMetodoPago(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none bg-white"
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
                                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarCobro}
                                disabled={guardando}
                                className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {guardando ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                Confirmar cobro
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
