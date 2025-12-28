"use client";

import { useState } from "react";
import { format, addMonths, startOfMonth, isSameMonth, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Pago, Alquiler } from "@/domain/models/Alquiler";
import { CheckCircle2, Clock, AlertCircle, Edit2, ExternalLink } from "lucide-react";
import PaymentEditModal from "./PaymentEditModal";
import { whatsappService } from "@/infrastructure/services/whatsappService";
import { receiptService } from "@/infrastructure/services/receiptService";

import { Inquilino } from "@/domain/models/Inquilino";

import { PaymentCard } from "./PaymentCard";

interface PaymentPlanTableProps {
    alquiler: Alquiler;
    inquilino?: Inquilino | null;
    onUpdatePayment: (payment: Pago) => void;
}

export default function PaymentPlanTable({ alquiler, inquilino, onUpdatePayment }: PaymentPlanTableProps) {
    const [selectedPayment, setSelectedPayment] = useState<Pago | null>(null);

    const generatePeriods = () => {
        const periods: Pago[] = [];
        const start = startOfMonth(new Date(alquiler.fechaInicio));
        const end = startOfMonth(new Date(alquiler.fechaFin));

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
                    monto: alquiler.montoMensual + honorariosInitial,
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

    const handleMarkAsPaid = (pago: Pago) => {
        if (!window.confirm(`¿Estás seguro de marcar el periodo ${pago.mes} como PAGADO?\n\nEsta acción registrará la fecha de pago actual.`)) {
            return;
        }

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
        const totalCalculado = rent + servicios + punitorios + honorarios + cargosAdicionales + otros - descuentos;

        const updated: Pago = {
            ...pago,
            estado: 'pagado',
            fechaPago: new Date(),
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
    };

    const handleDownloadReceipt = (pago: Pago) => {
        receiptService.generateReceipt(pago, alquiler);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {periods.map((pago) => (
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
