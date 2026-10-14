"use client";

import { useState } from "react";
import { Pago, Alquiler } from "@/domain/models/Alquiler";
import { X, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PaymentHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    payment: Pago;
    rental: Alquiler;
    onConfirm: (payment: Pago, date: Date, isHistorical: boolean, methodData?: { metodoPago: 'efectivo' | 'transferencia'; fechaTransferencia?: string; nroComprobante?: string }) => void;
}

export default function PaymentHistoryModal({ isOpen, onClose, payment, rental, onConfirm }: PaymentHistoryModalProps) {
    const [isHistorical, setIsHistorical] = useState(false);
    const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Default method to efectivo for simplicity, or nothing if we want to force selection
    const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia'>('efectivo');
    const [fechaTransferencia, setFechaTransferencia] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [nroComprobante, setNroComprobante] = useState("");

    if (!isOpen) return null;

    const handleConfirm = () => {
        const date = new Date(paymentDate + 'T12:00:00'); // Ensure midday to avoid timezone shifts

        onConfirm(payment, date, isHistorical, {
            metodoPago,
            ...(metodoPago === 'transferencia' ? { fechaTransferencia, nroComprobante } : {})
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--color-paper-2)] rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-semibold text-lg">Registrar Pago</h3>
                    <button onClick={onClose} className="p-1 hover:bg-[var(--color-paper-3)] rounded-lg transition-colors">
                        <X strokeWidth={1.5} size={20} className="text-[var(--color-muted)]" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-[var(--color-accent-soft)] p-4 rounded-lg border border-[var(--color-accent)]/30 mb-4">
                        <p className="text-sm text-[var(--color-accent)] font-medium">Periodo: {payment.mes}</p>
                        <p className="text-2xl font-bold text-[var(--color-accent)] mt-1">
                            {rental.monedaAlquiler} {payment.monto.toLocaleString()}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-[var(--color-paper-3)] transition-colors">
                            <input
                                type="checkbox"
                                checked={isHistorical}
                                onChange={(e) => setIsHistorical(e.target.checked)}
                                className="w-5 h-5 text-[var(--color-accent)] rounded focus:ring-[var(--color-accent)]/40"
                            />
                            <div>
                                <span className="block font-medium text-[var(--color-ink)]">Registro Histórico</span>
                                <span className="text-xs text-[var(--color-muted)]">Marcar como pagado en fecha anterior</span>
                            </div>
                        </label>

                        {isHistorical && (
                            <div className="animate-in slide-in-from-top-2 duration-200">
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                    Fecha Real de Pago
                                </label>
                                <div className="relative">
                                    <Calendar strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral)] w-5 h-5" />
                                    <input
                                        type="date"
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                        max={format(new Date(), 'yyyy-MM-dd')}
                                        className="w-full pl-10 pr-4 py-2 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 outline-none text-[var(--color-ink)]"
                                    />
                                </div>
                                <p className="text-xs text-[var(--color-warning)] mt-2 bg-[var(--color-warning-soft)] p-2 rounded border border-[var(--color-warning)]/30">
                                    El pago se registrará con esta fecha. Si la fecha es posterior al vencimiento inicial, podría generar intereses si no se ajustan manualmente.
                                </p>
                            </div>
                        )}

                        {!isHistorical && (
                            <p className="text-sm text-[var(--color-muted)] p-2 text-center bg-[var(--color-paper)] rounded">
                                Se registrará con fecha de hoy: <strong>{format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}</strong>
                            </p>
                        )}

                        <div className="pt-4 border-t border-[var(--color-rule-2)]">
                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                Método de Pago
                            </label>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <button
                                    onClick={() => setMetodoPago('efectivo')}
                                    className={`py-2 px-4 rounded-xl text-sm font-medium border transition-colors ${metodoPago === 'efectivo' ? 'bg-[var(--color-accent-soft)] border-[var(--color-accent)]/30 text-[var(--color-accent)]' : 'bg-[var(--color-paper-2)] border-[var(--color-rule)] text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)]'}`}
                                >
                                    Efectivo
                                </button>
                                <button
                                    onClick={() => setMetodoPago('transferencia')}
                                    className={`py-2 px-4 rounded-xl text-sm font-medium border transition-colors ${metodoPago === 'transferencia' ? 'bg-[var(--color-accent-soft)] border-[var(--color-accent)]/30 text-[var(--color-accent)]' : 'bg-[var(--color-paper-2)] border-[var(--color-rule)] text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)]'}`}
                                >
                                    Transferencia
                                </button>
                            </div>

                            {metodoPago === 'transferencia' && (
                                <div className="space-y-3 animate-in slide-in-from-top-2 duration-200 bg-[var(--color-paper)] p-3 rounded-xl border border-[var(--color-rule-2)]">
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-ink-2)] mb-1">
                                            Fecha de Transferencia
                                        </label>
                                        <input
                                            type="date"
                                            value={fechaTransferencia}
                                            onChange={(e) => setFechaTransferencia(e.target.value)}
                                            max={format(new Date(), 'yyyy-MM-dd')}
                                            className="w-full px-3 py-2 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 outline-none text-[var(--color-ink)] text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-ink-2)] mb-1">
                                            Número de Comprobante
                                        </label>
                                        <input
                                            type="text"
                                            value={nroComprobante}
                                            onChange={(e) => setNroComprobante(e.target.value)}
                                            placeholder="Ej. TRF-982374"
                                            className="w-full px-3 py-2 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 outline-none text-[var(--color-ink)] text-sm"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t bg-[var(--color-paper)] flex justify-end gap-3 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[var(--color-ink-2)] hover:bg-[var(--color-paper-4)] rounded-lg transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-ink-2)] rounded-lg transition-colors font-medium shadow-sm"
                    >
                        Confirmar Pago
                    </button>
                </div>
            </div>
        </div>
    );
}
