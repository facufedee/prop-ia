"use client";

import { useState } from "react";
import { format, addMonths, startOfMonth, isSameMonth, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Pago, Alquiler } from "@/domain/models/Alquiler";
import { CheckCircle2, Clock, AlertCircle, Edit2, ExternalLink } from "lucide-react";
import PaymentEditModal from "./PaymentEditModal";
import { whatsappService } from "@/infrastructure/services/whatsappService";
import { receiptService } from "@/infrastructure/services/receiptService";
import { reportService } from "@/infrastructure/services/reportService";
import PaymentHistoryModal from "./PaymentHistoryModal";
import IPCAdjustmentModal from "./IPCAdjustmentModal";
import { FileText, TrendingUp } from "lucide-react";

import { Inquilino } from "@/domain/models/Inquilino";

import { PaymentCard } from "./PaymentCard";

interface PaymentPlanTableProps {
    alquiler: Alquiler;
    inquilino?: Inquilino | null;
    onUpdatePayment: (payment: Pago) => void;
    onUpdateContract?: (updates: Partial<Alquiler>) => void;
}

export default function PaymentPlanTable({ alquiler, inquilino, onUpdatePayment, onUpdateContract }: PaymentPlanTableProps) {
    const [selectedPayment, setSelectedPayment] = useState<Pago | null>(null);
    const [confirmingPayment, setConfirmingPayment] = useState<Pago | null>(null);
    const [showIPCModal, setShowIPCModal] = useState(false);

    const generatePeriods = (): Pago[] => {
        const periods: Pago[] = [];
        // Use string splitting to avoid timezone issues (YYYY-MM-DD -> Date in local time/12pm)
        // If we just use new Date(string), it might default to midnight UTC which is previous day in GMT-3
        const parseDateSafe = (dateStr: Date | string) => {
            if (typeof dateStr === 'string') {
                // assume YYYY-MM-DD or ISO. If YYYY-MM-DD, append T12:00:00
                if (dateStr.includes('T')) return new Date(dateStr);
                return new Date(dateStr + 'T12:00:00');
            }
            return new Date(dateStr);
        };

        const start = startOfMonth(parseDateSafe(alquiler.fechaInicio));
        const end = startOfMonth(parseDateSafe(alquiler.fechaFin));

        const paymentMap = new Map(
            alquiler.historialPagos.map(p => [p.mes, p])
        );

        let current = start;
        let index = 0;

        while (current <= end && index < 60) {
            const periodKey = format(current, 'yyyy-MM');
            const existing = paymentMap.get(periodKey);

            if (existing) {
                periods.push(existing);
            } else {
                // Ensure valid day (1-28/30/31). Default to 10 if missing/invalid.
                const day = (alquiler.diaVencimiento && alquiler.diaVencimiento > 0 && alquiler.diaVencimiento <= 31)
                    ? alquiler.diaVencimiento
                    : 10;

                // Calculate initial Honorarios
                let honorariosInitial = 0;
                if (alquiler.honorariosTipo === 'fijo' && alquiler.honorariosValor) {
                    honorariosInitial = alquiler.honorariosValor;
                } else if (alquiler.honorariosTipo === 'porcentaje' && alquiler.honorariosValor) {
                    honorariosInitial = Math.floor(alquiler.montoMensual * (alquiler.honorariosValor / 100));
                }

                periods.push({
                    id: `proj-${periodKey}`,
                    mes: periodKey,
                    monto: alquiler.montoMensual,
                    montoAlquiler: alquiler.montoMensual,
                    montoPunitorios: 0,
                    montoDescuento: 0,
                    fechaVencimiento: new Date(current.getFullYear(), current.getMonth(), day),
                    estado: 'pendiente',
                    detalleServicios: [],
                    desglose: {
                        alquilerPuro: alquiler.montoMensual,
                        servicios: 0,
                        honorarios: honorariosInitial,
                        cargosAdicionales: 0,
                        otros: 0
                    }
                });
            }
            current = addMonths(current, 1);
            index++;
        }
        // sort by date desc (newest first) for cards usually better? or asc?
        // User photo showed "Agosto 2025" then "Diciembre 2025" below, so likely list.
        // Let's keep Ascending for now.
        return periods;
    };

    const periods = generatePeriods();

    // Sort: Pending first (Oldest to Newest), Paid (Newest to Oldest for history)
    const pendingPayments = periods.filter(p => p.estado !== 'pagado').sort((a, b) => new Date(a.mes).getTime() - new Date(b.mes).getTime());
    const paidPayments = periods.filter(p => p.estado === 'pagado').sort((a, b) => new Date(b.mes).getTime() - new Date(a.mes).getTime());

    const handleDownloadReport = () => {
        // Pass all periods (chronological for report usually better)
        const allSorted = [...periods].sort((a, b) => new Date(a.mes).getTime() - new Date(b.mes).getTime());
        reportService.generateContractReport(alquiler, allSorted);
    };

    const handleApplyIPC = (newRent: number) => {
        if (!onUpdateContract) return;

        // Iterate over history to update pending payments
        const updatedHistory = alquiler.historialPagos.map(p => {
            if (p.estado === 'pendiente') {
                // Determine Honorarios
                let newHonorarios = p.desglose?.honorarios || 0;
                if (alquiler.honorariosTipo === 'porcentaje' && alquiler.honorariosValor) {
                    newHonorarios = Math.floor(newRent * (alquiler.honorariosValor / 100));
                }

                const servicios = p.desglose?.servicios || 0;
                const otros = p.desglose?.otros || 0;

                return {
                    ...p,
                    montoAlquiler: newRent,
                    monto: newRent + servicios + otros, // Honorarios are included in Rent, not added on top
                    desglose: {
                        ...p.desglose,
                        alquilerPuro: newRent,
                        honorarios: newHonorarios
                    }
                } as Pago;
            }
            return p;
        });

        onUpdateContract({
            montoMensual: newRent,
            historialPagos: updatedHistory
        });

        setShowIPCModal(false);
    };

    const handleMarkAsPaid = (pago: Pago) => {
        setConfirmingPayment(pago);
    };

    const handleConfirmPayment = (pago: Pago, date: Date, isHistorical: boolean) => {

        // Ensure we save the breakdown logic permanently
        let honorarios = pago.desglose?.honorarios;
        if (honorarios === undefined) {
            if (alquiler.honorariosTipo === 'fijo' && alquiler.honorariosValor) {
                honorarios = alquiler.honorariosValor;
            } else if (alquiler.honorariosTipo === 'porcentaje' && alquiler.honorariosValor) {
                const base = pago.montoAlquiler || alquiler.montoMensual || 0;
                honorarios = Math.floor(base * (alquiler.honorariosValor / 100));
            } else {
                honorarios = 0;
            }
        }

        const rent = pago.montoAlquiler || alquiler.montoMensual;
        const punitorios = pago.montoPunitorios || 0;
        const servicios = (pago.detalleServicios || []).reduce((acc, s) => acc + (s.monto || 0), 0) + (pago.montoServicios || 0);
        const cargosAdicionales = (pago.cargosAdicionales || []).reduce((acc, s) => acc + (s.monto || 0), 0);
        const otros = pago.desglose?.otros || 0;
        const descuentos = pago.montoDescuento || 0;

        // Recalculate total to be safe, or trust existing if it seems valid? 
        // Better to be explicit: The total finalized now includes everything.
        // Honorarios are deducted from Rent (Owner's cost), not added to Tenant's total.
        const totalCalculado = rent + servicios + punitorios + cargosAdicionales + otros - descuentos;

        const updated: Pago = {
            ...pago,
            estado: 'pagado',
            fechaPago: date,
            monto: totalCalculado, // lock in the total
            desglose: {
                alquilerPuro: rent,
                servicios: servicios,
                honorarios: honorarios,
                cargosAdicionales: cargosAdicionales,
                otros: otros
            }
        };
        onUpdatePayment(updated);
        setConfirmingPayment(null);
    };

    const handleDownloadReceipt = (pago: Pago) => {
        receiptService.generateReceipt(pago, alquiler);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                    <h3 className="font-semibold text-gray-900">Plan de Pagos</h3>
                    <p className="text-sm text-gray-500">Gestiona los cobros y el historial</p>
                </div>
                <button
                    onClick={handleDownloadReport}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
                >
                    <FileText size={16} className="text-indigo-600" />
                    Descargar Informe
                </button>
                <button
                    onClick={() => setShowIPCModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm font-medium"
                >
                    <TrendingUp size={16} />
                    Aplicar Aumento
                </button>
            </div>

            {/* Pending Section */}
            <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-8 bg-amber-500 rounded-full"></span>
                    Pagos Pendientes
                </h4>
                {pendingPayments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingPayments.map((pago) => (
                            <PaymentCard
                                key={pago.id}
                                payment={pago}
                                contract={alquiler}
                                onUpdate={onUpdatePayment}
                                onMarkPaid={handleMarkAsPaid}
                                onCancelPayment={(p) => {
                                    if (window.confirm(`¿Cancelar el pago de ${p.mes}? Volverá a estado pendiente.`)) {
                                        onUpdatePayment({ ...p, estado: 'pendiente', fechaPago: undefined });
                                    }
                                }}
                                onEdit={(p) => setSelectedPayment(p)}
                                onDownload={handleDownloadReceipt}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No hay pagos pendientes.</p>
                    </div>
                )}
            </div>

            {/* Paid Section */}
            <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-8 bg-green-500 rounded-full"></span>
                    Historial de Pagos (Abonados)
                </h4>
                {paidPayments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paidPayments.map((pago) => (
                            <PaymentCard
                                key={pago.id}
                                payment={pago}
                                contract={alquiler}
                                onUpdate={onUpdatePayment}
                                onMarkPaid={handleMarkAsPaid}
                                onCancelPayment={(p) => {
                                    if (window.confirm(`¿Cancelar el pago de ${p.mes}? Volverá a estado pendiente.`)) {
                                        onUpdatePayment({ ...p, estado: 'pendiente', fechaPago: undefined });
                                    }
                                }}
                                onEdit={(p) => setSelectedPayment(p)}
                                onDownload={handleDownloadReceipt}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">Aún no hay pagos registrados.</p>
                    </div>
                )}
            </div>

            {confirmingPayment && (
                <PaymentHistoryModal
                    isOpen={true}
                    onClose={() => setConfirmingPayment(null)}
                    payment={confirmingPayment}
                    rental={alquiler}
                    onConfirm={handleConfirmPayment}
                />
            )}

            {showIPCModal && (
                <IPCAdjustmentModal
                    isOpen={true}
                    onClose={() => setShowIPCModal(false)}
                    currentRent={alquiler.montoMensual}
                    previousRent={(() => {
                        // Infer previous rent from history (find first amount != current)
                        const distinct = alquiler.historialPagos
                            .map(p => p.montoAlquiler || 0)
                            .filter(m => m > 0 && m !== alquiler.montoMensual);
                        // Get the most frequent or max? Usually the previous valid one. 
                        // Let's take the most recent payment that is different.
                        // We already have 'periods' which includes all payments. 
                        // But let's trust historialPagos more directly.
                        const sortedHistory = [...alquiler.historialPagos].sort((a, b) => new Date(b.fechaVencimiento).getTime() - new Date(a.fechaVencimiento).getTime());
                        const prev = sortedHistory.find(p => (p.montoAlquiler || 0) > 0 && (p.montoAlquiler || 0) !== alquiler.montoMensual);
                        return prev?.montoAlquiler;
                    })()}
                    defaultPercentage={alquiler.ajusteValor}
                    paymentHistory={alquiler.historialPagos}
                    onConfirm={handleApplyIPC}
                />
            )}

            {selectedPayment && (
                <PaymentEditModal
                    isOpen={true}
                    onClose={() => setSelectedPayment(null)}
                    payment={selectedPayment}
                    rental={alquiler}
                    onSave={(updated) => {
                        onUpdatePayment(updated);
                        setSelectedPayment(null);
                    }}
                />
            )}
        </div>
    );
}
