"use client";

import { useEffect, useState } from "react";
import CapybaraAssistant from "@/ui/components/assistant/CapybaraAssistant";
import { format, addMonths, startOfMonth, isSameMonth, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Pago, Alquiler } from "@/domain/models/Alquiler";
import { CheckCircle2, Clock, AlertCircle, Edit2, ExternalLink, ChevronDown } from "lucide-react";
import PaymentEditModal from "./PaymentEditModal";
import { whatsappService } from "@/infrastructure/services/whatsappService";
import { receiptService, AgencyProfile } from "@/infrastructure/services/receiptService";
import { reportService } from "@/infrastructure/services/reportService";
import { useAuth } from "@/ui/context/AuthContext";
import PaymentHistoryModal from "./PaymentHistoryModal";
import IPCAdjustmentModal from "./IPCAdjustmentModal";
import { applyRentIncrease } from "@/lib/financial/applyRentIncrease";
import { getContractAlerts, suggestIncrease } from "@/lib/financial/contractAlerts";
import { IndicesData } from "@/lib/financial/indices";
import { FileText, TrendingUp } from "lucide-react";

import { Inquilino } from "@/domain/models/Inquilino";

import { PaymentCard } from "./PaymentCard";

interface PaymentPlanTableProps {
    alquiler: Alquiler;
    inquilino?: Inquilino | null;
    onUpdatePayment: (payment: Pago) => void;
    /** Resolves true when the contract was saved. */
    onUpdateContract?: (updates: Partial<Alquiler>) => Promise<boolean>;
}

export default function PaymentPlanTable({ alquiler, inquilino, onUpdatePayment, onUpdateContract }: PaymentPlanTableProps) {
    const { user, userData } = useAuth();
    const agencyProfile: AgencyProfile | undefined = userData ? {
        agencyName: userData.agencyName,
        agencyLicense: userData.agencyLicense,
        agencyManager: userData.agencyManager,
        agencyCuit: userData.agencyCuit,
        agencyAddress: userData.agencyAddress,
        agencyWhatsapp: userData.agencyWhatsapp,
        logoUrl: userData.logoUrl,
        condicionIva: userData.inmobiliariaProfile?.condicionIva,
        firmante: userData.inmobiliariaProfile?.firmante,
        cargoFirmante: userData.inmobiliariaProfile?.cargoFirmante,
    } : undefined;
    const [selectedPayment, setSelectedPayment] = useState<Pago | null>(null);
    const [confirmingPayment, setConfirmingPayment] = useState<Pago | null>(null);
    const [showIPCModal, setShowIPCModal] = useState(false);
    const [showPending, setShowPending] = useState(true);
    const [showHistory, setShowHistory] = useState(true);
    const [indices, setIndices] = useState<IndicesData | null>(null);

    // Official IPC (INDEC) / ICL (BCRA), refreshed server-side every 12 hours.
    useEffect(() => {
        if (alquiler.ajusteTipo !== 'IPC' && alquiler.ajusteTipo !== 'ICL') return;
        fetch('/api/config/indices')
            .then(res => (res.ok ? res.json() : null))
            .then(data => setIndices(data))
            .catch(error => console.error("Error loading indices:", error));
    }, [alquiler.ajusteTipo]);

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

    const unpaidMonths = periods
        .filter(p => p.estado !== 'pagado')
        .map(p => p.mes)
        .sort();
    const currentMonth = format(new Date(), 'yyyy-MM');
    const alerts = getContractAlerts(alquiler);
    const adjustmentMonth = alerts.adjustment?.month;
    const defaultFromMonth = (adjustmentMonth && unpaidMonths.includes(adjustmentMonth))
        ? adjustmentMonth
        : unpaidMonths.find(mes => mes >= currentMonth) ?? unpaidMonths[0];
    const suggestion = adjustmentMonth
        ? suggestIncrease(alquiler, indices ?? { years: {} }, adjustmentMonth)
        : (alquiler.ajusteTipo === 'porcentaje' ? suggestIncrease(alquiler, { years: {} }, currentMonth) : null);

    const monthName = (mes: string) => format(parseISO(`${mes}-01`), "MMMM yyyy", { locale: es });
    const adjustmentLabel = alquiler.ajusteTipo === 'IPC' || alquiler.ajusteTipo === 'ICL' ? ` por ${alquiler.ajusteTipo}` : '';
    const overdueCount = alerts.overdueMonths.length;
    const capiImportant = overdueCount > 0 || alerts.adjustment?.status === 'due';
    const capiMessage = (
        <>
            {overdueCount > 0 && (
                <p>
                    {overdueCount === 1
                        ? <>El cobro de <strong>{monthName(alerts.overdueMonths[0])}</strong> está vencido.</>
                        : <>Hay <strong>{overdueCount} cobros vencidos</strong> ({alerts.overdueMonths.map(monthName).join(", ")}).</>}
                    {" "}Cuando te paguen, tocá <strong>Cobrar</strong> en ese mes.
                </p>
            )}
            {alerts.adjustment?.status === 'due' && (
                <p className={overdueCount > 0 ? "mt-1.5" : ""}>
                    Desde <strong>{monthName(alerts.adjustment.month)}</strong> le corresponde aumento{adjustmentLabel} y todavía no lo aplicaste.{" "}
                    {suggestion
                        ? <>Tocá <strong>Aumentar</strong>: ya te cargo el {suggestion.label} ({suggestion.pct.toLocaleString("es-AR")}%).</>
                        : <>Tocá <strong>Aumentar</strong> para aplicarlo.</>}
                </p>
            )}
            {alerts.adjustment?.status === 'upcoming' && (
                <p className={overdueCount > 0 ? "mt-1.5" : ""}>
                    En <strong>{monthName(alerts.adjustment.month)}</strong> le toca aumento{adjustmentLabel}. Cuando llegue, tocá <strong>Aumentar</strong> y te cargo el índice.
                </p>
            )}
            {!capiImportant && alerts.adjustment?.status !== 'upcoming' && (
                pendingPayments.length === 0
                    ? <>¡Al día! No hay cobros pendientes en este contrato 🎉</>
                    : <>Todo en orden 👌 Cuando te paguen, tocá <strong>Cobrar</strong> en ese mes.</>
            )}
        </>
    );
    const capiKey = `plan-${alquiler.id}-${alerts.overdueMonths.join(",")}-${alerts.adjustment?.status ?? "none"}-${adjustmentMonth ?? ""}`;

    const handleApplyIPC = async (newRent: number, fromMonth: string): Promise<boolean> => {
        if (!onUpdateContract) return false;

        const historialPagos = applyRentIncrease({
            history: alquiler.historialPagos,
            periods,
            newRent,
            fromMonth,
            honorariosTipo: alquiler.honorariosTipo,
            honorariosValor: alquiler.honorariosValor,
        });

        return onUpdateContract({ montoMensual: newRent, historialPagos });
    };

    const handleMarkAsPaid = (pago: Pago) => {
        setConfirmingPayment(pago);
    };

    const handleConfirmPayment = (
        pago: Pago,
        date: Date,
        isHistorical: boolean,
        methodData?: { metodoPago: 'efectivo' | 'transferencia', fechaTransferencia?: string, nroComprobante?: string }
    ) => {

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
        const servicios = (pago.detalleServicios && pago.detalleServicios.length > 0)
            ? pago.detalleServicios.reduce((acc, s) => acc + (s.monto || 0), 0)
            : (pago.montoServicios || 0);
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
            ...(methodData || {}),
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
        receiptService.generateReceipt(pago, alquiler, agencyProfile, user?.uid);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-[var(--color-rule-2)]">
                <div>
                    <h3 className="text-2xl font-bold text-[var(--color-ink)] tracking-tight">Plan de Pagos</h3>
                    <p className="text-[var(--color-muted)] mt-1 text-sm">Gestiona los cobros y el historial del contrato</p>
                </div>
                <div className="grid grid-cols-2 sm:flex gap-3 w-full md:w-auto">
                    <button
                        onClick={handleDownloadReport}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-paper-2)] border border-[var(--color-rule)] text-[var(--color-ink-2)] rounded-xl hover:bg-[var(--color-paper-3)] hover:border-[var(--color-neutral)] transition-all shadow-sm font-medium text-sm active:scale-95"
                    >
                        <FileText strokeWidth={1.5} size={16} className="text-[var(--color-muted)]" />
                        <span>Informe</span>
                    </button>
                    <button
                        onClick={() => setShowIPCModal(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-xl hover:bg-[var(--color-ink-2)] transition-all shadow-md font-medium text-sm active:scale-95 border border-transparent"
                    >
                        <TrendingUp strokeWidth={1.5} size={16} />
                        <span>Aumentar</span>
                    </button>
                </div>
            </div>

            <CapybaraAssistant important={capiImportant} messageKey={capiKey} message={capiMessage} />

            {/* Pending Section */}
            <div>
                <button
                    onClick={() => setShowPending(prev => !prev)}
                    className="flex items-center gap-3 mb-6 w-full group"
                >
                    <h4 className="text-lg font-bold text-[var(--color-ink)]">
                        Pagos Pendientes
                    </h4>
                    <span className="bg-[var(--color-warning-soft)] text-[var(--color-warning)] px-2.5 py-0.5 rounded-full text-xs font-bold">
                        {pendingPayments.length}
                    </span>
                    <ChevronDown strokeWidth={1.5}
                        size={18}
                        className={`ml-auto text-[var(--color-neutral)] group-hover:text-[var(--color-ink-2)] transition-transform duration-200 ${showPending ? '' : '-rotate-90'}`}
                    />
                </button>
                {showPending && (
                    pendingPayments.length > 0 ? (
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
                        <div className="p-8 text-center bg-[var(--color-paper)] rounded-2xl border border-dashed border-[var(--color-rule)]">
                            <p className="text-[var(--color-muted)] text-sm">No hay pagos pendientes por cobrar.</p>
                        </div>
                    )
                )}
            </div>

            {/* Paid Section */}
            <div>
                <button
                    onClick={() => setShowHistory(prev => !prev)}
                    className="flex items-center gap-3 mb-6 w-full group"
                >
                    <h4 className="text-lg font-bold text-[var(--color-ink)]">
                        Historial
                    </h4>
                    <span className="bg-[var(--color-paper-3)] text-[var(--color-ink-2)] px-2.5 py-0.5 rounded-full text-xs font-bold">
                        {paidPayments.length}
                    </span>
                    <ChevronDown strokeWidth={1.5}
                        size={18}
                        className={`ml-auto text-[var(--color-neutral)] group-hover:text-[var(--color-ink-2)] transition-transform duration-200 ${showHistory ? '' : '-rotate-90'}`}
                    />
                </button>
                {showHistory && (
                    paidPayments.length > 0 ? (
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
                        <div className="p-8 text-center bg-[var(--color-paper)] rounded-xl border border-dashed border-[var(--color-rule)]">
                            <p className="text-[var(--color-muted)]">Aún no hay pagos registrados.</p>
                        </div>
                    )
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
                    defaultPercentage={suggestion?.pct ?? (alquiler.ajusteValor || undefined)}
                    paymentHistory={alquiler.historialPagos}
                    unpaidMonths={unpaidMonths}
                    defaultFromMonth={defaultFromMonth}
                    suggestion={suggestion}
                    onConfirm={handleApplyIPC}
                />
            )}

            {selectedPayment && (
                <PaymentEditModal
                    isOpen={true}
                    onClose={() => setSelectedPayment(null)}
                    payment={selectedPayment}
                    rental={alquiler}
                    onSave={(updated, applyToFuture) => {
                        if (applyToFuture && onUpdateContract) {
                            // BULK UPDATE STRATEGY to avoid race conditions
                            const monthToMatch = updated.mes;

                            // 1. Start with existing history
                            let newHistory = [...alquiler.historialPagos];

                            // 2. Remove the "old" version of the current payment if it exists
                            // Match by Month as it is the key
                            const existingIndex = newHistory.findIndex(p => p.mes === monthToMatch);

                            if (existingIndex >= 0) {
                                newHistory[existingIndex] = updated;
                            } else {
                                newHistory.push(updated);
                            }

                            // 3. Find rounding service to propagate
                            const roundingService = updated.detalleServicios?.find(s => s.concepto === 'Redondeo');
                            if (roundingService) {
                                // 4. Update FUTURE pending payments in the history
                                newHistory = newHistory.map(p => {
                                    // Skip the one we just updated (checked by month)
                                    if (p.mes === monthToMatch) return p;

                                    if (p.estado === 'pendiente' && p.mes > monthToMatch) {
                                        const currentServices = p.detalleServicios || [];
                                        const hasRounding = currentServices.some(s => s.concepto === 'Redondeo');

                                        if (!hasRounding) {
                                            const newServices = [...currentServices, { concepto: 'Redondeo', monto: roundingService.monto }];
                                            // Recalculate Logic
                                            const servicesTotal = (newServices && newServices.length > 0)
                                                ? newServices.reduce((acc, s) => acc + (Number(s.monto) || 0), 0)
                                                : 0;

                                            const rent = p.montoAlquiler || alquiler.montoMensual;
                                            const punitorios = p.montoPunitorios || 0;
                                            const discount = p.montoDescuento || 0;
                                            // Priority logic for services total
                                            const total = rent + servicesTotal + punitorios - discount;

                                            // Ensure we update both detail and total
                                            return {
                                                ...p,
                                                detalleServicios: newServices,
                                                montoServicios: servicesTotal,
                                                monto: total,
                                                desglose: {
                                                    ...p.desglose,
                                                    servicios: servicesTotal
                                                }
                                            } as Pago;
                                        }
                                    }
                                    return p;
                                });
                            }

                            // 5. Save EVERYTHING in one go
                            onUpdateContract({ historialPagos: newHistory });

                        } else {
                            // Standard single update
                            onUpdatePayment(updated);
                        }
                        setSelectedPayment(null);
                    }}
                />
            )}
        </div>
    );
}
