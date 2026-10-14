"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Wallet, CheckCircle2, Clock, ExternalLink, X, Loader2, RefreshCw, Building2 } from "lucide-react";
import { useAuth } from "@/ui/context/AuthContext";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { Alquiler, Liquidacion } from "@/domain/models/Alquiler";
import { toast } from "sonner";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiquidacionConContexto extends Liquidacion {
    alquilerId: string;
    direccion: string;
    nombrePropietario: string;
    emailPropietario?: string;
    whatsappPropietario?: string;
}

type Filtro = "pendientes" | "pagadas";

// Convierte Firestore Timestamp, string o number a Date de forma segura
function toDate(value: any): Date | null {
    if (!value) return null;
    if (typeof value.toDate === "function") return value.toDate();
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LiquidacionesPage() {
    const { user } = useAuth();
    const [liquidaciones, setLiquidaciones] = useState<LiquidacionConContexto[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState<Filtro>("pendientes");
    const [modalLiq, setModalLiq] = useState<LiquidacionConContexto | null>(null);
    const [fechaPago, setFechaPago] = useState(new Date().toISOString().split("T")[0]);
    const [metodoPago, setMetodoPago] = useState("transferencia");
    const [guardando, setGuardando] = useState(false);

    const cargarLiquidaciones = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const alquileres = await alquileresService.getAlquileres(user.uid);

            const todas: LiquidacionConContexto[] = [];
            alquileres
                .filter((a: Alquiler) => a.estado === "activo")
                .forEach((a: Alquiler) => {
                    (a.historialLiquidaciones || []).forEach(l => {
                        todas.push({
                            ...l,
                            alquilerId: a.id,
                            direccion: a.direccion,
                            nombrePropietario: a.nombrePropietario || "Sin propietario",
                            emailPropietario: a.emailPropietario,
                            whatsappPropietario: a.telefonoPropietario,
                        });
                    });
                });

            // Sort: newest first
            todas.sort((a, b) => {
                const da = toDate(a.fechaEmision)?.getTime() ?? 0;
                const db2 = toDate(b.fechaEmision)?.getTime() ?? 0;
                return db2 - da;
            });

            setLiquidaciones(todas);
        } catch (err) {
            console.error(err);
            toast.error("Error al cargar las liquidaciones");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { cargarLiquidaciones(); }, [cargarLiquidaciones]);

    // ── Counts ───────────────────────────────────────────────────────────────

    const pendientes = liquidaciones.filter(l => l.estado === "pendiente");
    const pagadas = liquidaciones.filter(l => l.estado === "pagado");
    const listado = filtro === "pendientes" ? pendientes : pagadas;

    const totalPendiente = pendientes.reduce((s, l) => s + (l.netoAPagar || 0), 0);
    const totalPagado = pagadas.reduce((s, l) => s + (l.netoAPagar || 0), 0);

    // ── Marcar como pagada ───────────────────────────────────────────────────

    const abrirModal = (liq: LiquidacionConContexto) => {
        setModalLiq(liq);
        setFechaPago(new Date().toISOString().split("T")[0]);
        setMetodoPago("transferencia");
    };

    const confirmarPago = async () => {
        if (!modalLiq) return;
        setGuardando(true);
        try {
            const alquiler = await alquileresService.getAlquilerById(modalLiq.alquilerId);
            if (!alquiler) throw new Error("Contrato no encontrado");

            const updatedLiqs = (alquiler.historialLiquidaciones || []).map(l =>
                l.id === modalLiq.id
                    ? { ...l, estado: "pagado" as const, fechaPago: new Date(fechaPago) }
                    : l
            );

            await alquileresService.updateAlquiler(modalLiq.alquilerId, {
                historialLiquidaciones: updatedLiqs,
            });

            toast.success(`Liquidación de ${modalLiq.nombrePropietario} marcada como pagada`);
            setModalLiq(null);
            await cargarLiquidaciones();
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
                            <Wallet size={18} strokeWidth={1.5} className="text-[var(--color-muted)]" />
                        </span>
                        Liquidaciones
                    </h1>
                    <p className="text-[var(--color-muted)] mt-1 text-sm">Pagos pendientes a propietarios de todos los contratos</p>
                </div>
                <button
                    onClick={cargarLiquidaciones}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)] rounded-xl transition"
                >
                    <RefreshCw strokeWidth={1.5} size={14} className={loading ? "animate-spin" : ""} />
                    Actualizar
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                    onClick={() => setFiltro("pendientes")}
                    className={`text-left p-5 rounded-2xl border-2 transition-all shadow-sm ${filtro === "pendientes" ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]" : "border-transparent bg-[var(--color-paper-2)] hover:border-[var(--color-accent)]/30"}`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Clock strokeWidth={1.5} size={16} className="text-[var(--color-accent)]" />
                            <span className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide">Pendientes de pago</span>
                        </div>
                        <span className="text-xs font-semibold bg-[var(--color-accent-soft)] text-[var(--color-accent)] px-2 py-0.5 rounded-full">
                            {loading ? "—" : pendientes.length}
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-[var(--color-accent)]">
                        {loading ? "—" : `$ ${totalPendiente.toLocaleString("es-AR")}`}
                    </p>
                    <p className="text-xs text-[var(--color-neutral)] mt-1">Neto a transferir a propietarios</p>
                </button>

                <button
                    onClick={() => setFiltro("pagadas")}
                    className={`text-left p-5 rounded-2xl border-2 transition-all shadow-sm ${filtro === "pagadas" ? "border-[var(--color-positive)] bg-[var(--color-positive-soft)]" : "border-transparent bg-[var(--color-paper-2)] hover:border-[var(--color-positive)]/30"}`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 strokeWidth={1.5} size={16} className="text-[var(--color-positive)]" />
                            <span className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide">Pagadas</span>
                        </div>
                        <span className="text-xs font-semibold bg-[var(--color-positive-soft)] text-[var(--color-positive)] px-2 py-0.5 rounded-full">
                            {loading ? "—" : pagadas.length}
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-[var(--color-positive)]">
                        {loading ? "—" : `$ ${totalPagado.toLocaleString("es-AR")}`}
                    </p>
                    <p className="text-xs text-[var(--color-neutral)] mt-1">Total liquidado históricamente</p>
                </button>
            </div>

            {/* Table */}
            <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--color-rule-2)] flex items-center justify-between">
                    <div className="flex gap-1 bg-[var(--color-paper-3)] p-1 rounded-xl w-fit">
                        {(["pendientes", "pagadas"] as Filtro[]).map(f => (
                            <button
                                key={f}
                                onClick={() => setFiltro(f)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all capitalize ${filtro === f ? "bg-[var(--color-paper-2)] text-[var(--color-ink)] shadow-sm" : "text-[var(--color-muted)] hover:text-[var(--color-ink-2)]"}`}
                            >
                                {f === "pendientes" ? "Pendientes" : "Pagadas"}
                                {f === "pendientes" && pendientes.length > 0 && (
                                    <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                                        {pendientes.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    {listado.length > 0 && (
                        <p className="text-sm text-[var(--color-muted)]">
                            Total: <span className="font-semibold text-[var(--color-ink)]">
                                $ {listado.reduce((s, l) => s + (l.netoAPagar || 0), 0).toLocaleString("es-AR")}
                            </span>
                        </p>
                    )}
                </div>

                {loading ? (
                    <div className="py-16 flex flex-col items-center gap-3 text-[var(--color-neutral)]">
                        <Loader2 strokeWidth={1.5} size={28} className="animate-spin" />
                        <p className="text-sm">Cargando liquidaciones...</p>
                    </div>
                ) : listado.length === 0 ? (
                    <div className="py-16 text-center">
                        <CheckCircle2 strokeWidth={1.5} size={40} className="text-[var(--color-positive)] mx-auto mb-3" />
                        <p className="text-[var(--color-ink-2)] font-medium">
                            {filtro === "pendientes" ? "No hay liquidaciones pendientes" : "No hay liquidaciones pagadas"}
                        </p>
                        <p className="text-[var(--color-neutral)] text-sm mt-1">
                            {filtro === "pendientes" ? "Todos los propietarios están al día" : "Aún no se registraron pagos"}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[var(--color-paper)] border-b border-[var(--color-rule-2)]">
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Propietario</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Propiedad</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Período</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Emitida</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Cobrado al inquilino</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Neto propietario</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-rule-2)]">
                                {listado.map(liq => {
                                    const [year, month] = liq.mes.split("-");
                                    const periodoLabel = format(
                                        new Date(Number(year), Number(month) - 1, 1),
                                        "MMMM yyyy",
                                        { locale: es }
                                    );

                                    return (
                                        <tr key={`${liq.alquilerId}-${liq.id}`} className="hover:bg-[var(--color-paper-3)] transition-colors">
                                            {/* Propietario */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-[var(--color-paper-3)] flex items-center justify-center flex-shrink-0">
                                                        <Building2 strokeWidth={1.5} size={13} className="text-[var(--color-muted)]" />
                                                    </div>
                                                    <span className="font-medium text-[var(--color-ink)]">{liq.nombrePropietario}</span>
                                                </div>
                                            </td>

                                            {/* Propiedad */}
                                            <td className="px-6 py-4 text-[var(--color-muted)] max-w-[180px] truncate">{liq.direccion}</td>

                                            {/* Período */}
                                            <td className="px-6 py-4 text-[var(--color-ink-2)] capitalize">{periodoLabel}</td>

                                            {/* Emitida */}
                                            <td className="px-6 py-4 text-[var(--color-neutral)] text-xs">
                                                {toDate(liq.fechaEmision)
                                                    ? format(toDate(liq.fechaEmision)!, "dd/MM/yyyy")
                                                    : "—"}
                                            </td>

                                            {/* Cobrado al inquilino */}
                                            <td className="px-6 py-4 text-right text-[var(--color-muted)]">
                                                $ {(liq.TotalCobradoInquilino || 0).toLocaleString("es-AR")}
                                            </td>

                                            {/* Neto propietario */}
                                            <td className="px-6 py-4 text-right font-bold text-[var(--color-ink)]">
                                                $ {(liq.netoAPagar || 0).toLocaleString("es-AR")}
                                            </td>

                                            {/* Acción */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {liq.estado === "pendiente" ? (
                                                        <button
                                                            onClick={() => abrirModal(liq)}
                                                            className="px-3 py-1.5 bg-[var(--color-ink)] text-[var(--color-paper)] text-xs font-medium rounded-lg hover:bg-[var(--color-ink-2)] transition"
                                                        >
                                                            Pagar
                                                        </button>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[var(--color-positive)] text-xs font-medium">
                                                            <CheckCircle2 strokeWidth={1.5} size={13} />
                                                            {liq.fechaPago
                                                                ? format(toDate(liq.fechaPago)!, "dd/MM/yy")
                                                                : "Pagada"}
                                                        </span>
                                                    )}
                                                    <Link
                                                        href={`/dashboard/alquileres/${liq.alquilerId}`}
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

            {/* Modal pagar */}
            {modalLiq && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-[var(--color-paper-2)] rounded-2xl shadow-xl w-full max-w-sm">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-rule-2)]">
                            <h3 className="font-semibold text-[var(--color-ink)]">Registrar pago al propietario</h3>
                            <button onClick={() => setModalLiq(null)} className="p-1 rounded-lg hover:bg-[var(--color-paper-3)] transition">
                                <X strokeWidth={1.5} size={18} className="text-[var(--color-muted)]" />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            {/* Resumen */}
                            <div className="bg-[var(--color-accent-soft)] rounded-xl p-4 space-y-1.5">
                                <p className="font-medium text-[var(--color-ink)]">{modalLiq.nombrePropietario}</p>
                                <p className="text-sm text-[var(--color-muted)]">{modalLiq.direccion}</p>
                                <p className="text-xs text-[var(--color-neutral)] capitalize">
                                    {format(
                                        new Date(Number(modalLiq.mes.split("-")[0]), Number(modalLiq.mes.split("-")[1]) - 1, 1),
                                        "MMMM yyyy",
                                        { locale: es }
                                    )}
                                </p>
                                <div className="pt-2 border-t border-[var(--color-accent)]/30 flex justify-between items-center">
                                    <span className="text-xs text-[var(--color-muted)]">Neto a pagar</span>
                                    <span className="text-2xl font-bold text-[var(--color-accent)]">
                                        $ {(modalLiq.netoAPagar || 0).toLocaleString("es-AR")}
                                    </span>
                                </div>
                                {modalLiq.honorariosA > 0 && (
                                    <p className="text-xs text-[var(--color-neutral)]">
                                        (Cobrado al inquilino: $ {(modalLiq.TotalCobradoInquilino || 0).toLocaleString("es-AR")} — Honorarios: $ {modalLiq.honorariosA.toLocaleString("es-AR")})
                                    </p>
                                )}
                            </div>

                            {/* Fecha */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">Fecha de pago</label>
                                <input
                                    type="date"
                                    value={fechaPago}
                                    onChange={e => setFechaPago(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-[var(--color-rule)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] outline-none"
                                />
                            </div>

                            {/* Método */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">Método de pago</label>
                                <select
                                    value={metodoPago}
                                    onChange={e => setMetodoPago(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-[var(--color-rule)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] outline-none bg-[var(--color-paper-2)]"
                                >
                                    <option value="transferencia">Transferencia</option>
                                    <option value="efectivo">Efectivo</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>
                        </div>

                        <div className="px-6 pb-5 flex gap-3">
                            <button
                                onClick={() => setModalLiq(null)}
                                className="flex-1 px-4 py-2.5 border border-[var(--color-rule)] text-[var(--color-ink-2)] rounded-xl text-sm font-medium hover:bg-[var(--color-paper-3)] transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarPago}
                                disabled={guardando}
                                className="flex-1 px-4 py-2.5 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-xl text-sm font-medium hover:bg-[var(--color-ink-2)] transition disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {guardando ? <Loader2 strokeWidth={1.5} size={14} className="animate-spin" /> : <CheckCircle2 strokeWidth={1.5} size={14} />}
                                Confirmar pago
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
