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
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">Liquidaciones al Propietario</h3>
                    <p className="text-gray-500 text-sm mt-1">Saldos pendientes y emitidos para el dueño del inmueble.</p>
                </div>
                <div className="flex items-center gap-3">
                    {sortedLiquidaciones.length > 0 && (
                        <button
                            onClick={() => reportService.generateLiquidacionesReport(alquiler, sortedLiquidaciones)}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm font-medium text-sm"
                        >
                            <History size={16} />
                            Historial PDF
                        </button>
                    )}
                    <button
                        onClick={() => { setSelectedMonth(""); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm"
                    >
                        <Plus size={16} />
                        Personalizada
                    </button>
                </div>
            </div>

            {/* Pendientes de Liquidar Section */}
            {availablePagos.length > 0 && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Pendientes de Liquidar
                        </h4>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={toggleAllPending}
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 font-medium"
                            >
                                {selectedPendingIds.size === availablePagos.length ? (
                                    <><CheckSquare size={18} /> Deseleccionar todo</>
                                ) : (
                                    <><Square size={18} /> Seleccionar todo</>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {availablePagos.map((pago) => (
                            <div key={pago.id}
                                className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-amber-50/50 border rounded-xl shadow-sm gap-4 transition-all ${selectedPendingIds.has(pago.id) ? 'border-amber-400 ring-1 ring-amber-400 bg-amber-100/30' : 'border-amber-200 hover:border-amber-300'}`}
                            >
                                <div className="flex items-start gap-3 w-full sm:w-auto">
                                    <div onClick={() => togglePendingSelection(pago.id)} className="mt-1 text-gray-400 cursor-pointer">
                                        {selectedPendingIds.has(pago.id) ? <CheckSquare size={20} className="text-amber-600" /> : <Square size={20} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-gray-900 text-base capitalize">
                                                {format(parseISO(pago.mes + "-01"), "MMMM yyyy", { locale: es })}
                                            </h4>
                                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border bg-emerald-50 text-emerald-700 border-emerald-100">
                                                Pagado Inquilino
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Total cobrado: <span className="font-medium text-gray-900">${pago.monto?.toLocaleString()}</span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); openModalForMonth(pago.mes); }}
                                    className="w-full sm:w-auto px-5 py-2.5 bg-white border border-amber-300 text-amber-700 rounded-lg text-sm font-bold hover:bg-amber-100 transition-colors shadow-sm whitespace-nowrap uppercase tracking-wide"
                                >
                                    Liquidar {format(parseISO(pago.mes + "-01"), "MMMM", { locale: es })}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Batch Actions for Pending Liquidations */}
                    {selectedPendingIds.size > 0 && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-200">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-900">{selectedPendingIds.size} seleccionados</span>
                                <span className="text-xs text-gray-500">Pendientes de liquidar</span>
                            </div>
                            <div className="h-8 w-px bg-gray-200"></div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleBatchLiquidate}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-medium text-sm disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                                    ) : (
                                        <CheckCircle2 size={16} />
                                    )}
                                    Generar {selectedPendingIds.size} Liquidaciones Rápidas
                                </button>
                                <button
                                    onClick={() => setSelectedPendingIds(new Set())}
                                    className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium"
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
                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        Liquidaciones Generadas
                    </h4>

                    {sortedLiquidaciones.length > 0 && (
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={toggleAll}
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 font-medium"
                            >
                                {selectedIds.size === sortedLiquidaciones.length ? (
                                    <><CheckSquare size={18} /> Deseleccionar todo</>
                                ) : (
                                    <><Square size={18} /> Seleccionar todo</>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Floating Action Bar */}
                {selectedIds.size > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex flex-wrap justify-between items-center gap-4 animate-in fade-in slide-in-from-top-2">
                        <span className="text-sm font-semibold text-indigo-900 ml-2">
                            {selectedIds.size} liquidaciones seleccionadas
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={handleDownloadSelected}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors shadow-sm"
                            >
                                <Download size={16} />
                                Descargar {selectedIds.size > 1 ? 'PDFs' : 'PDF'}
                            </button>
                            <button
                                onClick={handleSendWhatsApp}
                                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors shadow-sm"
                            >
                                <MessageCircle size={16} />
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
                                className={`bg-white border-2 rounded-xl p-5 shadow-sm transition-all cursor-pointer ${selectedIds.has(liq.id) ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-indigo-300'
                                    }`}
                                onClick={() => toggleSelection(liq.id)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div onClick={(e) => { e.stopPropagation(); toggleSelection(liq.id); }} className="mr-1 text-gray-400">
                                                {selectedIds.has(liq.id) ? <CheckSquare size={20} className="text-indigo-600" /> : <Square size={20} />}
                                            </div>
                                            <h4 className="font-bold text-gray-900 text-lg capitalize">
                                                {format(parseISO(liq.mes + "-01"), "MMMM yyyy", { locale: es })}
                                            </h4>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 ml-8">
                                            Emitida el {format(parseSafeDate(liq.fechaEmision), "dd MMM yyyy", { locale: es })}
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className={`px-2 py-0.5 mt-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${liq.estado === 'pagado'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            : 'bg-amber-50 text-amber-700 border-amber-100'
                                            }`}>
                                            {liq.estado}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteLiquidacion(liq.id, liq.mes); }}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar liquidación (Volver a pendiente)"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-5 pl-8">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Total Ingresos:</span>
                                        <span className="font-medium text-gray-900">
                                            ${liq.detalles.filter(d => d.tipo === 'ingreso').reduce((acc, d) => acc + d.monto, 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Monto Inquilino:</span>
                                        <span className="font-medium text-gray-900">${liq.TotalCobradoInquilino.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Deducciones:</span>
                                        <span className="font-medium text-red-600">
                                            -${liq.detalles.filter(d => d.tipo === 'egreso').reduce((acc, d) => acc + d.monto, 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                                        <span className="font-semibold text-gray-900">Neto a Pagar:</span>
                                        <span className="text-lg font-bold text-indigo-700">${liq.netoAPagar.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2 border-t border-gray-50 pl-8" onClick={e => e.stopPropagation()}>
                                    {liq.estado === 'pendiente' && (
                                        <button
                                            onClick={() => handleMarkAsPaid(liq.id)}
                                            className="flex-1 flex justify-center items-center gap-1 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
                                        >
                                            <CheckCircle2 size={16} />
                                            Marcar Pagado
                                        </button>
                                    )}
                                    <button
                                        onClick={() => receiptService.generateLiquidacionReceipt(liq, alquiler)}
                                        className="flex-1 flex justify-center items-center gap-1 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        <FileText size={16} />
                                        PDF
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h4 className="text-lg font-medium text-gray-900 mb-1">No hay historial</h4>
                        <p className="text-gray-500 text-sm">Las liquidaciones generadas aparecerán aquí.</p>
                    </div>
                )}
            </div>

            {/* Modal de Nueva Liquidación */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">Nueva Liquidación</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mes a Liquidar</label>
                                <select
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
                                    <p className="text-amber-600 text-xs mt-2">No hay pagos cobrados pendientes de liquidación.</p>
                                )}
                            </div>

                            {selectedMonth && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                                    <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                                        <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Resumen Base</h4>

                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Alquiler Puro:</span>
                                            <span className="font-medium">
                                                ${availablePagos.find(p => p.mes === selectedMonth)?.desglose?.alquilerPuro?.toLocaleString()}
                                            </span>
                                        </div>
                                        {availablePagos.find(p => p.mes === selectedMonth)?.montoPunitorios ? (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Punitorios:</span>
                                                <span className="font-medium">
                                                    ${availablePagos.find(p => p.mes === selectedMonth)?.montoPunitorios?.toLocaleString()}
                                                </span>
                                            </div>
                                        ) : null}
                                        {availablePagos.find(p => p.mes === selectedMonth)?.detalleServicios?.length ? (
                                            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                                                <span className="text-gray-600 text-xs font-semibold mb-1">Servicios a liquidar:</span>
                                                {availablePagos.find(p => p.mes === selectedMonth)?.detalleServicios?.map((s, idx) => (
                                                    <label key={idx} className="flex items-center justify-between text-sm cursor-pointer hover:bg-white p-1 rounded transition-colors -mx-1 px-1">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                                                checked={checkedServicesIndices.has(idx)}
                                                                onChange={() => {
                                                                    const newSet = new Set(checkedServicesIndices);
                                                                    if (newSet.has(idx)) newSet.delete(idx);
                                                                    else newSet.add(idx);
                                                                    setCheckedServicesIndices(newSet);
                                                                }}
                                                            />
                                                            <span className="text-gray-700">{s.concepto}</span>
                                                        </div>
                                                        <span className="font-medium text-gray-900">${s.monto.toLocaleString()}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : null}
                                        <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                                            <span className="text-gray-600">Honorarios Inmo:</span>
                                            <span className="font-medium text-red-600">
                                                -${availablePagos.find(p => p.mes === selectedMonth)?.desglose?.honorarios?.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Otras Deducciones</h4>
                                        <div className="flex gap-2 items-end">
                                            <div className="flex-1">
                                                <label className="block text-xs text-gray-500 mb-1">Monto ($)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    className="w-full p-2.5 border border-gray-200 rounded-lg"
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
                                                <label className="block text-xs text-gray-500 mb-1">Motivo (ej. Arreglo cañería)</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2.5 border border-gray-200 rounded-lg"
                                                    value={motivoDescuento}
                                                    onChange={(e) => setMotivoDescuento(e.target.value)}
                                                    placeholder="Motivo del descuento"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-indigo-50 p-4 rounded-xl flex justify-between items-center border border-indigo-100">
                                        <span className="font-bold text-indigo-900">Total a Pagar Propietario</span>
                                        <span className="text-xl font-bold text-indigo-700">
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

                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateLiquidacion}
                                disabled={!selectedMonth || isSubmitting}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium text-sm"
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
