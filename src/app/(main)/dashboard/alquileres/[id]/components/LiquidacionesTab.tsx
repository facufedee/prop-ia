"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Alquiler, Liquidacion, Pago } from "@/domain/models/Alquiler";
import { CheckCircle2, FileText, User, Plus, MessageCircle, Download, CheckSquare, Square, History, Trash2 } from "lucide-react";
import { receiptService } from "@/infrastructure/services/receiptService";
import { reportService } from "@/infrastructure/services/reportService";

const parseSafeDate = (dateVal: any): Date => {
    if (!dateVal) return new Date();
    if (dateVal instanceof Date) return dateVal;
    if (typeof dateVal === 'object' && 'seconds' in dateVal) {
        return new Date(dateVal.seconds * 1000);
    }
    if (typeof dateVal === 'object' && 'toDate' in dateVal) {
        return dateVal.toDate();
    }
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? new Date() : d;
};

interface LiquidacionesTabProps {
    alquiler: Alquiler;
    onUpdateAlquiler: (updates: Partial<Alquiler>) => Promise<void>;
}

export default function LiquidacionesTab({ alquiler, onUpdateAlquiler }: LiquidacionesTabProps) {
    const [showModal, setShowModal] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectedPendingIds, setSelectedPendingIds] = useState<Set<string>>(new Set());

    // Initial deduction state
    const [otrosDescuentos, setOtrosDescuentos] = useState(0);
    const [motivoDescuento, setMotivoDescuento] = useState("");
    const [checkedServicesIndices, setCheckedServicesIndices] = useState<Set<number>>(new Set());

    const liquidaciones = alquiler.historialLiquidaciones || [];

    // Sort liquidaciones descending by mes
    const sortedLiquidaciones = [...liquidaciones].sort((a, b) =>
        new Date(b.mes).getTime() - new Date(a.mes).getTime()
    );

    // Filter available months (only paid ones that haven't been liquidated yet)
    const availablePagos = alquiler.historialPagos.filter(p =>
        p.estado === 'pagado' && !liquidaciones.some(l => l.mes === p.mes)
    ).sort((a, b) => new Date(b.mes).getTime() - new Date(a.mes).getTime());

    const openModalForMonth = (mes: string) => {
        setSelectedMonth(mes);
        const pago = availablePagos.find(p => p.mes === mes);
        if (pago && pago.detalleServicios) {
            setCheckedServicesIndices(new Set(pago.detalleServicios.map((_, i) => i)));
        } else {
            setCheckedServicesIndices(new Set());
        }
        setShowModal(true);
    };

    const handleCreateLiquidacion = async () => {
        if (!selectedMonth) return;

        const pago = availablePagos.find(p => p.mes === selectedMonth);
        if (!pago) return;

        setIsSubmitting(true);

        try {
            const cobrarInquilino = pago.monto || 0;
            const honorarios = pago.desglose?.honorarios || 0;

            const serviciosIncluidos = pago.detalleServicios?.filter((_, i) => checkedServicesIndices.has(i)) || [];
            const totalServicios = serviciosIncluidos.reduce((acc, s) => acc + s.monto, 0);

            const honorariosARestar = honorarios;

            const ingresos = (pago.desglose?.alquilerPuro || 0) + (pago.montoPunitorios || 0) + totalServicios;
            const neto = ingresos - honorariosARestar - otrosDescuentos;

            const nuevaLiquidacion: Liquidacion = {
                id: crypto.randomUUID(),
                mes: selectedMonth,
                fechaEmision: new Date(),
                TotalCobradoInquilino: cobrarInquilino,
                honorariosA: honorariosARestar,
                netoAPagar: neto,
                detalles: [
                    { concepto: "Alquiler " + selectedMonth, monto: pago.desglose?.alquilerPuro || 0, tipo: "ingreso" },
                    ...(pago.montoPunitorios ? [{ concepto: "Intereses/Punitorios", monto: pago.montoPunitorios, tipo: "ingreso" as const }] : []),
                    ...serviciosIncluidos.map(s => ({ concepto: "Servicio: " + s.concepto, monto: s.monto, tipo: "ingreso" as const })),
                    { concepto: "Honorarios Inmobiliaria", monto: honorariosARestar, tipo: "egreso" },
                    ...(otrosDescuentos > 0 ? [{ concepto: motivoDescuento || "Otros descuentos", monto: otrosDescuentos, tipo: "egreso" as const }] : []),
                ],
                estado: 'pendiente'
            };

            const updatedLiquidaciones = [...liquidaciones, nuevaLiquidacion];
            await onUpdateAlquiler({ historialLiquidaciones: updatedLiquidaciones });

            setShowModal(false);
            setSelectedMonth("");
            setOtrosDescuentos(0);
            setMotivoDescuento("");
            setCheckedServicesIndices(new Set());
        } catch (error) {
            console.error("Error creating liquidación:", error);
            alert("Error al generar liquidación.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMarkAsPaid = async (id: string) => {
        if (!confirm("¿Marcar esta liquidación como pagada al propietario?")) return;

        const updatedLiquidaciones = liquidaciones.map(l =>
            l.id === id ? { ...l, estado: 'pagado' as const, fechaPago: new Date() } : l
        );

        await onUpdateAlquiler({ historialLiquidaciones: updatedLiquidaciones });
    };

    const handleDeleteLiquidacion = async (id: string, mes: string) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar la liquidación de ${mes}? Esto la volverá al estado 'Pendiente de liquidar' y la quitará de las finanzas si estaba pagada.`)) return;

        const updatedLiquidaciones = liquidaciones.filter(l => l.id !== id);
        await onUpdateAlquiler({ historialLiquidaciones: updatedLiquidaciones });

        // Ensure it's unselected if it was selected
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
            setSelectedIds(newSelected);
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleAll = () => {
        if (selectedIds.size === sortedLiquidaciones.length) {
            setSelectedIds(newSet => { newSet.clear(); return newSet; });
        } else {
            setSelectedIds(new Set(sortedLiquidaciones.map(l => l.id)));
        }
    };

    const handleSendWhatsApp = () => {
        if (selectedIds.size === 0) return;

        const selected = sortedLiquidaciones.filter(l => selectedIds.has(l.id));

        let text = `Hola ${alquiler.nombrePropietario || ''}!\n\nTe envío el detalle de tus liquidaciones correspondientes a la propiedad en ${alquiler.direccion}:\n`;

        selected.forEach(l => {
            const mes = format(parseISO(l.mes + "-01"), "MMMM yyyy", { locale: es });
            text += `\n*Liquidación ${mes.toUpperCase()}*\n`;
            text += `  Ingreso (Inquilino): $${l.TotalCobradoInquilino.toLocaleString()}\n`;
            const egresos = l.detalles.filter(d => d.tipo === 'egreso').reduce((acc, d) => acc + d.monto, 0);
            if (egresos > 0) text += `  Deducciones: -$${egresos.toLocaleString()}\n`;
            text += `  *Neto a transferir: $${l.netoAPagar.toLocaleString()}*\n`;
        });

        text += `\nPor favor, confirmame la recepción. Para el comprobante completo avisame y te lo envío por aquí.\nSaludos!`;

        const phone = alquiler.telefonoPropietario?.replace(/\D/g, '') || '';

        const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');

        // Deselect all after sending
        setSelectedIds(new Set());
    };

    const handleDownloadSelected = () => {
        if (selectedIds.size === 0) return;

        const selected = sortedLiquidaciones.filter(l => selectedIds.has(l.id));
        selected.forEach(l => {
            receiptService.generateLiquidacionReceipt(l, alquiler);
        });

        // Deselect all after downloading
        setSelectedIds(new Set());
    };

    const togglePendingSelection = (id: string) => {
        const newSet = new Set(selectedPendingIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedPendingIds(newSet);
    };

    const toggleAllPending = () => {
        if (selectedPendingIds.size === availablePagos.length) {
            setSelectedPendingIds(new Set());
        } else {
            setSelectedPendingIds(new Set(availablePagos.map(p => p.id)));
        }
    };

    const handleBatchLiquidate = async () => {
        // We will just open modal for the first one for now or skip if we want automatic?
        // Better yet, just keep it out. User asks for "una seleccion" and maybe batch creation.
        // Wait, "liquidar a propietario" requires filling deductions. Let's just create them straight with 0 extra deductions if batch?
        // For now let's just implement the UI, but what action does it take? We can just batch create them with 0 deductions.
        if (selectedPendingIds.size === 0) return;
        setIsSubmitting(true);
        let currentLiquidaciones = [...liquidaciones];

        const selected = availablePagos.filter(p => selectedPendingIds.has(p.id));
        for (const pago of selected) {
            const cobrarInquilino = pago.monto || pago.montoAlquiler || 0;

            let honorariosARestar = pago.desglose?.honorarios;
            if (honorariosARestar === undefined) {
                if (alquiler.honorariosTipo === 'fijo' && alquiler.honorariosValor) {
                    honorariosARestar = alquiler.honorariosValor;
                } else if (alquiler.honorariosTipo === 'porcentaje' && alquiler.honorariosValor) {
                    honorariosARestar = Math.floor(cobrarInquilino * (alquiler.honorariosValor / 100));
                } else {
                    honorariosARestar = 0;
                }
            }

            const neto = cobrarInquilino - honorariosARestar;
            const nuevaLiquidacion: Liquidacion = {
                id: crypto.randomUUID(),
                mes: pago.mes,
                fechaEmision: new Date(),
                TotalCobradoInquilino: cobrarInquilino,
                honorariosA: honorariosARestar,
                netoAPagar: neto,
                detalles: [
                    { concepto: "Alquiler " + pago.mes, monto: pago.desglose?.alquilerPuro || 0, tipo: "ingreso" },
                    ...(pago.montoPunitorios ? [{ concepto: "Intereses/Punitorios", monto: pago.montoPunitorios, tipo: "ingreso" as const }] : []),
                    { concepto: "Honorarios Inmobiliaria", monto: honorariosARestar, tipo: "egreso" },
                ],
                estado: 'pendiente'
            };
            currentLiquidaciones.push(nuevaLiquidacion);
        }

        await onUpdateAlquiler({ historialLiquidaciones: currentLiquidaciones });
        setSelectedPendingIds(new Set());
        setIsSubmitting(false);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-[var(--color-rule-2)]">
                <div>
                    <h3 className="text-xl font-bold text-[var(--color-ink)] tracking-tight">Liquidaciones al Propietario</h3>
                    <p className="text-[var(--color-muted)] text-sm mt-1">Saldos pendientes y emitidos para el dueño del inmueble.</p>
                </div>
                <div className="flex items-center gap-3">
                    {sortedLiquidaciones.length > 0 && (
                        <button
                            onClick={() => reportService.generateLiquidacionesReport(alquiler, sortedLiquidaciones)}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-paper-2)] text-[var(--color-ink-2)] border border-[var(--color-rule)] rounded-xl hover:bg-[var(--color-paper-3)] transition-colors shadow-sm font-medium text-sm"
                        >
                            <History strokeWidth={1.5} size={16} />
                            Historial PDF
                        </button>
                    )}
                    <button
                        onClick={() => { setSelectedMonth(""); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-xl hover:bg-[var(--color-ink-2)] transition-colors shadow-sm font-medium text-sm"
                    >
                        <Plus strokeWidth={1.5} size={16} />
                        Personalizada
                    </button>
                </div>
            </div>

            {/* Pendientes de Liquidar Section */}
            {availablePagos.length > 0 && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h4 className="text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[var(--color-warning)]"></span>
                            Pendientes de Liquidar
                        </h4>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={toggleAllPending}
                                className="flex items-center gap-2 text-sm text-[var(--color-ink-2)] hover:text-[var(--color-warning)] font-medium"
                            >
                                {selectedPendingIds.size === availablePagos.length ? (
                                    <><CheckSquare strokeWidth={1.5} size={18} /> Deseleccionar todo</>
                                ) : (
                                    <><Square strokeWidth={1.5} size={18} /> Seleccionar todo</>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {availablePagos.map((pago) => (
                            <div key={pago.id}
                                className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-[var(--color-warning-soft)] border rounded-xl shadow-sm gap-4 transition-all ${selectedPendingIds.has(pago.id) ? 'border-[var(--color-warning)] ring-1 ring-[var(--color-warning)] bg-[var(--color-warning)]/7' : 'border-[var(--color-warning)]/30 hover:border-[var(--color-warning)]/30'}`}
                            >
                                <div className="flex items-start gap-3 w-full sm:w-auto">
                                    <div onClick={() => togglePendingSelection(pago.id)} className="mt-1 text-[var(--color-neutral)] cursor-pointer">
                                        {selectedPendingIds.has(pago.id) ? <CheckSquare strokeWidth={1.5} size={20} className="text-[var(--color-warning)]" /> : <Square strokeWidth={1.5} size={20} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-[var(--color-ink)] text-base capitalize">
                                                {format(parseISO(pago.mes + "-01"), "MMMM yyyy", { locale: es })}
                                            </h4>
                                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border bg-[var(--color-positive-soft)] text-[var(--color-positive)] border-[var(--color-positive)]/30">
                                                Pagado Inquilino
                                            </span>
                                        </div>
                                        <p className="text-sm text-[var(--color-ink-2)] mt-1">
                                            Total cobrado: <span className="font-medium text-[var(--color-ink)]">${pago.monto?.toLocaleString()}</span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); openModalForMonth(pago.mes); }}
                                    className="w-full sm:w-auto px-5 py-2.5 bg-[var(--color-paper-2)] border border-[var(--color-warning)]/30 text-[var(--color-warning)] rounded-lg text-sm font-bold hover:bg-[var(--color-warning-soft)] transition-colors shadow-sm whitespace-nowrap uppercase tracking-wide"
                                >
                                    Liquidar {format(parseISO(pago.mes + "-01"), "MMMM", { locale: es })}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Batch Actions for Pending Liquidations */}
                    {selectedPendingIds.size > 0 && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--color-paper-2)] rounded-2xl shadow-xl border border-[var(--color-rule)] p-4 flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-200">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-[var(--color-ink)]">{selectedPendingIds.size} seleccionados</span>
                                <span className="text-xs text-[var(--color-muted)]">Pendientes de liquidar</span>
                            </div>
                            <div className="h-8 w-px bg-[var(--color-paper-4)]"></div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleBatchLiquidate}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-warning)] text-[var(--color-accent-ink)] rounded-xl hover:bg-[var(--color-warning)] transition-colors font-medium text-sm disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <span className="w-4 h-4 rounded-full border-2 border-[var(--color-paper-2)]/20 border-t-[var(--color-paper-2)] animate-spin"></span>
                                    ) : (
                                        <CheckCircle2 strokeWidth={1.5} size={16} />
                                    )}
                                    Generar {selectedPendingIds.size} Liquidaciones Rápidas
                                </button>
                                <button
                                    onClick={() => setSelectedPendingIds(new Set())}
                                    className="px-4 py-2 text-[var(--color-muted)] hover:text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)] rounded-xl transition-colors text-sm font-medium"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Historial Section */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h4 className="text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]"></span>
                        Liquidaciones Generadas
                    </h4>

                    {sortedLiquidaciones.length > 0 && (
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={toggleAll}
                                className="flex items-center gap-2 text-sm text-[var(--color-ink-2)] hover:text-[var(--color-accent-2)] font-medium"
                            >
                                {selectedIds.size === sortedLiquidaciones.length ? (
                                    <><CheckSquare strokeWidth={1.5} size={18} /> Deseleccionar todo</>
                                ) : (
                                    <><Square strokeWidth={1.5} size={18} /> Seleccionar todo</>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Floating Action Bar */}
                {selectedIds.size > 0 && (
                    <div className="bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/30 rounded-xl p-3 flex flex-wrap justify-between items-center gap-4 animate-in fade-in slide-in-from-top-2">
                        <span className="text-sm font-semibold text-[var(--color-accent)] ml-2">
                            {selectedIds.size} liquidaciones seleccionadas
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={handleDownloadSelected}
                                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-paper-2)] text-[var(--color-ink-2)] border border-[var(--color-rule)] rounded-lg hover:bg-[var(--color-paper-3)] text-sm font-medium transition-colors shadow-sm"
                            >
                                <Download strokeWidth={1.5} size={16} />
                                Descargar {selectedIds.size > 1 ? 'PDFs' : 'PDF'}
                            </button>
                            <button
                                onClick={handleSendWhatsApp}
                                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-positive)] text-[var(--color-accent-ink)] rounded-lg hover:bg-[var(--color-positive)] text-sm font-medium transition-colors shadow-sm"
                            >
                                <MessageCircle strokeWidth={1.5} size={16} />
                                Enviar por WhatsApp
                            </button>
                        </div>
                    </div>
                )}

                {sortedLiquidaciones.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedLiquidaciones.map(liq => (
                            <div
                                key={liq.id}
                                className={`bg-[var(--color-paper-2)] border-2 rounded-xl p-5 shadow-sm transition-all cursor-pointer ${selectedIds.has(liq.id) ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/30' : 'border-[var(--color-rule)] hover:border-[var(--color-accent)]/30'
                                    }`}
                                onClick={() => toggleSelection(liq.id)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div onClick={(e) => { e.stopPropagation(); toggleSelection(liq.id); }} className="mr-1 text-[var(--color-neutral)]">
                                                {selectedIds.has(liq.id) ? <CheckSquare strokeWidth={1.5} size={20} className="text-[var(--color-accent)]" /> : <Square strokeWidth={1.5} size={20} />}
                                            </div>
                                            <h4 className="font-bold text-[var(--color-ink)] text-lg capitalize">
                                                {format(parseISO(liq.mes + "-01"), "MMMM yyyy", { locale: es })}
                                            </h4>
                                        </div>
                                        <p className="text-xs text-[var(--color-muted)] mt-1 ml-8">
                                            Emitida el {format(parseSafeDate(liq.fechaEmision), "dd MMM yyyy", { locale: es })}
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className={`px-2 py-0.5 mt-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${liq.estado === 'pagado'
                                            ? 'bg-[var(--color-positive-soft)] text-[var(--color-positive)] border-[var(--color-positive)]/30'
                                            : 'bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[var(--color-warning)]/30'
                                            }`}>
                                            {liq.estado}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteLiquidacion(liq.id, liq.mes); }}
                                            className="p-1.5 text-[var(--color-neutral)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] rounded-lg transition-colors"
                                            title="Eliminar liquidación (Volver a pendiente)"
                                        >
                                            <Trash2 strokeWidth={1.5} size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-5 pl-8">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--color-muted)]">Total Ingresos:</span>
                                        <span className="font-medium text-[var(--color-ink)]">
                                            ${liq.detalles.filter(d => d.tipo === 'ingreso').reduce((acc, d) => acc + d.monto, 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--color-muted)]">Monto Inquilino:</span>
                                        <span className="font-medium text-[var(--color-ink)]">${liq.TotalCobradoInquilino.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--color-muted)]">Deducciones:</span>
                                        <span className="font-medium text-[var(--color-danger)]">
                                            -${liq.detalles.filter(d => d.tipo === 'egreso').reduce((acc, d) => acc + d.monto, 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="pt-3 border-t border-[var(--color-rule-2)] flex justify-between items-center">
                                        <span className="font-semibold text-[var(--color-ink)]">Neto a Pagar:</span>
                                        <span className="text-lg font-bold text-[var(--color-accent)]">${liq.netoAPagar.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2 border-t border-[var(--color-rule-2)] pl-8" onClick={e => e.stopPropagation()}>
                                    {liq.estado === 'pendiente' && (
                                        <button
                                            onClick={() => handleMarkAsPaid(liq.id)}
                                            className="flex-1 flex justify-center items-center gap-1 py-2 bg-[var(--color-positive-soft)] text-[var(--color-positive)] rounded-lg text-sm font-medium hover:bg-[var(--color-positive-soft)] transition-colors"
                                        >
                                            <CheckCircle2 strokeWidth={1.5} size={16} />
                                            Marcar Pagado
                                        </button>
                                    )}
                                    <button
                                        onClick={() => receiptService.generateLiquidacionReceipt(liq, alquiler)}
                                        className="flex-1 flex justify-center items-center gap-1 py-2 border border-[var(--color-rule)] text-[var(--color-ink-2)] rounded-lg text-sm font-medium hover:bg-[var(--color-paper-3)] transition-colors"
                                    >
                                        <FileText strokeWidth={1.5} size={16} />
                                        PDF
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center bg-[var(--color-paper)] rounded-2xl border border-dashed border-[var(--color-rule)]">
                        <User strokeWidth={1.5} className="w-12 h-12 text-[var(--color-neutral)] mx-auto mb-3" />
                        <h4 className="text-lg font-medium text-[var(--color-ink)] mb-1">No hay historial</h4>
                        <p className="text-[var(--color-muted)] text-sm">Las liquidaciones generadas aparecerán aquí.</p>
                    </div>
                )}
            </div>

            {/* Modal de Nueva Liquidación */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-[var(--color-paper-2)] rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-[var(--color-rule-2)] flex justify-between items-center">
                            <h3 className="text-lg font-bold text-[var(--color-ink)]">Nueva Liquidación</h3>
                            <button onClick={() => setShowModal(false)} className="text-[var(--color-neutral)] hover:text-[var(--color-ink-2)]">×</button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">Mes a Liquidar</label>
                                <select
                                    className="w-full p-2.5 bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 outline-none"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                >
                                    <option value="">Seleccionar mes...</option>
                                    {availablePagos.map(p => (
                                        <option key={p.mes} value={p.mes}>
                                            {format(parseISO(p.mes + "-01"), "MMMM yyyy", { locale: es })} (Cobrado: ${p.monto?.toLocaleString()})
                                        </option>
                                    ))}
                                </select>
                                {availablePagos.length === 0 && (
                                    <p className="text-[var(--color-warning)] text-xs mt-2">No hay pagos cobrados pendientes de liquidación.</p>
                                )}
                            </div>

                            {selectedMonth && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                                    <div className="bg-[var(--color-paper)] p-4 rounded-xl space-y-3">
                                        <h4 className="text-sm font-semibold text-[var(--color-ink)] border-b border-[var(--color-rule)] pb-2">Resumen Base</h4>

                                        <div className="flex justify-between text-sm">
                                            <span className="text-[var(--color-ink-2)]">Alquiler Puro:</span>
                                            <span className="font-medium">
                                                ${availablePagos.find(p => p.mes === selectedMonth)?.desglose?.alquilerPuro?.toLocaleString()}
                                            </span>
                                        </div>
                                        {availablePagos.find(p => p.mes === selectedMonth)?.montoPunitorios ? (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-[var(--color-ink-2)]">Punitorios:</span>
                                                <span className="font-medium">
                                                    ${availablePagos.find(p => p.mes === selectedMonth)?.montoPunitorios?.toLocaleString()}
                                                </span>
                                            </div>
                                        ) : null}
                                        {availablePagos.find(p => p.mes === selectedMonth)?.detalleServicios?.length ? (
                                            <div className="pt-2 border-t border-[var(--color-rule-2)] flex flex-col gap-2">
                                                <span className="text-[var(--color-ink-2)] text-xs font-semibold mb-1">Servicios a liquidar:</span>
                                                {availablePagos.find(p => p.mes === selectedMonth)?.detalleServicios?.map((s, idx) => (
                                                    <label key={idx} className="flex items-center justify-between text-sm cursor-pointer hover:bg-[var(--color-paper-3)] p-1 rounded transition-colors -mx-1 px-1">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                className="rounded border-[var(--color-rule)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]/40 w-4 h-4"
                                                                checked={checkedServicesIndices.has(idx)}
                                                                onChange={() => {
                                                                    const newSet = new Set(checkedServicesIndices);
                                                                    if (newSet.has(idx)) newSet.delete(idx);
                                                                    else newSet.add(idx);
                                                                    setCheckedServicesIndices(newSet);
                                                                }}
                                                            />
                                                            <span className="text-[var(--color-ink-2)]">{s.concepto}</span>
                                                        </div>
                                                        <span className="font-medium text-[var(--color-ink)]">${s.monto.toLocaleString()}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : null}
                                        <div className="flex justify-between text-sm pt-2 border-t border-[var(--color-rule-2)]">
                                            <span className="text-[var(--color-ink-2)]">Honorarios Inmo:</span>
                                            <span className="font-medium text-[var(--color-danger)]">
                                                -${availablePagos.find(p => p.mes === selectedMonth)?.desglose?.honorarios?.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-semibold text-[var(--color-ink)] mb-3">Otras Deducciones</h4>
                                        <div className="flex gap-2 items-end">
                                            <div className="flex-1">
                                                <label className="block text-xs text-[var(--color-muted)] mb-1">Monto ($)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    className="w-full p-2.5 border border-[var(--color-rule)] rounded-lg"
                                                    value={otrosDescuentos || ''}
                                                    onChange={(e) => setOtrosDescuentos(Number(e.target.value.replace(/[^0-9.]/g, '')))}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="flex-[2]">
                                                <label className="block text-xs text-[var(--color-muted)] mb-1">Motivo (ej. Arreglo cañería)</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2.5 border border-[var(--color-rule)] rounded-lg"
                                                    value={motivoDescuento}
                                                    onChange={(e) => setMotivoDescuento(e.target.value)}
                                                    placeholder="Motivo del descuento"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-[var(--color-accent-soft)] p-4 rounded-xl flex justify-between items-center border border-[var(--color-accent)]/30">
                                        <span className="font-bold text-[var(--color-accent)]">Total a Pagar Propietario</span>
                                        <span className="text-xl font-bold text-[var(--color-accent)]">
                                            ${(
                                                (availablePagos.find(p => p.mes === selectedMonth)?.desglose?.alquilerPuro || 0) +
                                                (availablePagos.find(p => p.mes === selectedMonth)?.montoPunitorios || 0) +
                                                (availablePagos.find(p => p.mes === selectedMonth)?.detalleServicios?.filter((_, i) => checkedServicesIndices.has(i)).reduce((acc, s) => acc + s.monto, 0) || 0) -
                                                (availablePagos.find(p => p.mes === selectedMonth)?.desglose?.honorarios || 0) -
                                                otrosDescuentos
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-[var(--color-rule-2)] flex justify-end gap-2 bg-[var(--color-paper)]">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-[var(--color-ink-2)] hover:bg-[var(--color-paper-4)] rounded-lg transition-colors font-medium text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateLiquidacion}
                                disabled={!selectedMonth || isSubmitting}
                                className="px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-lg hover:bg-[var(--color-ink-2)] disabled:opacity-50 transition-colors font-medium text-sm"
                            >
                                {isSubmitting ? 'Generando...' : 'Generar Liquidación'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
