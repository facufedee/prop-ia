"use client";

import { useState } from "react";
import { format, addMonths, startOfMonth, isSameMonth, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Pago, Alquiler } from "@/domain/models/Alquiler";
import { CheckCircle2, Clock, AlertCircle, Edit2, ExternalLink } from "lucide-react";
import PaymentEditModal from "./PaymentEditModal";
import { whatsappService } from "@/infrastructure/services/whatsappService";

import { Inquilino } from "@/domain/models/Inquilino";

interface PaymentPlanTableProps {
    alquiler: Alquiler;
    inquilino?: Inquilino | null;
    onUpdatePayment: (payment: Pago) => void;
}

const WhatsAppIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        className={className}
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.232-.298.347-.497.114-.198.058-.371-.027-.52-.084-.149-.768-1.87-1.055-2.551-.278-.659-.556-.569-.766-.583-.198-.014-.424-.015-.65-.015-.226 0-.594.084-.906.425-.311.34-1.188 1.161-1.188 2.831 0 1.67 1.216 3.285 1.385 3.511.171.226 2.394 3.656 5.803 5.127.81.35 1.442.56 1.936.717 1.228.388 2.35.334 3.242.2 1.398-.208 4.29-1.755 4.887-3.447.596-1.692.596-3.143.418-3.447-.179-.304-.654-.486-.951-.635zM12 21.8c-1.614 0-3.197-.417-4.606-1.209l-.33-.186-3.398.891.907-3.311-.215-.342A9.098 9.098 0 0 1 12 3.7c4.986 0 9.044 4.057 9.044 9.043 0 4.986-4.058 9.057-9.044 9.057z" />
    </svg>
);

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

                periods.push({
                    id: `proj-${periodKey}`,
                    mes: periodKey,
                    monto: alquiler.montoMensual,
                    montoAlquiler: alquiler.montoMensual,
                    fechaVencimiento: new Date(current.getFullYear(), current.getMonth(), day),
                    estado: 'pendiente',
                    detalleServicios: []
                });
            }
            current = addMonths(current, 1);
            index++;
        }
        return periods;
    };

    const periods = generatePeriods();

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'pagado':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Pagado</span>;
            case 'pendiente':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pendiente</span>;
            case 'vencido':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" /> Vencido</span>;
            default:
                return null;
        }
    };

    const handleSendWhatsApp = (pago: Pago) => {
        // Priority: Inquilino WhatsApp > Inquilino Phone > Contract Phone > Contract Contact
        const phone = inquilino?.whatsapp || inquilino?.telefono || alquiler.telefonoInquilino || alquiler.contactoInquilino || '';

        if (!pago || !phone) {
            alert("No hay teléfono registrado para el inquilino (verifica la ficha del cliente)");
            return;
        }
        const message = whatsappService.generatePaymentMessage(alquiler, pago);
        whatsappService.sendMessage(phone, message);
    };

    const handleMarkAsPaid = (pago: Pago) => {
        if (!window.confirm(`¿Estás seguro de marcar el periodo ${pago.mes} como PAGADO?\n\nEsta acción registrará la fecha de pago actual.`)) {
            return;
        }
        const updated: Pago = { ...pago, estado: 'pagado', fechaPago: new Date() };
        onUpdatePayment(updated);
    };

    const handleRevertPayment = (pago: Pago) => {
        if (!window.confirm(`¿Estás seguro de REVERTIR el pago del periodo ${pago.mes}?\n\nEl estado volverá a PENDIENTE.`)) {
            return;
        }

        // Use destructuring to remove fechaPago to avoid "undefined" in Firestore
        const { fechaPago, ...rest } = pago;
        const updated: Pago = { ...rest, estado: 'pendiente' };

        onUpdatePayment(updated);
    }

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-4 py-3">Periodo</th>
                                <th className="px-4 py-3">Vencimiento</th>
                                <th className="px-4 py-3 text-right">Alquiler</th>
                                <th className="px-4 py-3 text-right">Servicios</th>
                                <th className="px-4 py-3 text-right">Punitorios</th>
                                <th className="px-4 py-3 text-right">Descuento</th>
                                <th className="px-4 py-3 text-right">Total</th>
                                <th className="px-4 py-3 text-right bg-blue-50/50">Saldo</th>
                                <th className="px-4 py-3 text-center">Estado</th>
                                <th className="px-4 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {periods.map((pago) => {
                                const totalServicios = (pago.detalleServicios || []).reduce((acc, s) => acc + (s.monto || 0), 0) + (pago.montoServicios || 0);
                                const total = pago.monto || (pago.montoAlquiler! + totalServicios + (pago.montoPunitorios || 0) - (pago.montoDescuento || 0));

                                const saldo = total - (pago.pagoParcial || 0);
                                const showSaldo = saldo > 0 && pago.estado !== 'pagado';

                                const isPaid = pago.estado === 'pagado';
                                const rowOpacity = isPaid ? 'opacity-70 bg-gray-50' : '';

                                return (
                                    <tr key={pago.id} className={`hover:bg-gray-50 transition-colors ${rowOpacity}`}>
                                        <td className="px-4 py-2 font-medium text-gray-900">
                                            {format(parseISO(`${pago.mes}-01`), 'MMMM yyyy', { locale: es })}
                                        </td>
                                        <td className="px-4 py-2 text-gray-500">
                                            {isValid(new Date(pago.fechaVencimiento))
                                                ? format(new Date(pago.fechaVencimiento), 'dd/MM/yyyy')
                                                : '-'}
                                        </td>
                                        <td className="px-4 py-2 text-right text-gray-600">
                                            ${(pago.montoAlquiler || 0).toLocaleString('es-AR')}
                                        </td>
                                        <td className="px-4 py-2 text-right text-gray-600">
                                            {totalServicios > 0 ? `$${totalServicios.toLocaleString('es-AR')}` : '-'}
                                        </td>
                                        <td className="px-4 py-2 text-right text-red-600">
                                            {(pago.montoPunitorios || 0) > 0 ? `$${(pago.montoPunitorios || 0).toLocaleString('es-AR')}` : '-'}
                                        </td>
                                        <td className="px-4 py-2 text-right text-green-600">
                                            {(pago.montoDescuento || 0) > 0 ? `-$${(pago.montoDescuento || 0).toLocaleString('es-AR')}` : '-'}
                                        </td>
                                        <td className="px-4 py-2 text-right font-bold text-indigo-600">
                                            ${total.toLocaleString('es-AR')}
                                        </td>
                                        <td className="px-4 py-2 text-right font-bold text-blue-700 bg-blue-50/30">
                                            {isPaid ?
                                                <span className="text-green-600 text-xs">$0</span> :
                                                <span>${saldo.toLocaleString('es-AR')}</span>
                                            }
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            {getEstadoBadge(pago.estado)}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setSelectedPayment(pago)}
                                                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                                    title="Editar detalles"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>

                                                <button
                                                    onClick={() => handleSendWhatsApp(pago)}
                                                    className="p-2 text-[#25D366] hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100"
                                                    title="Enviar WhatsApp"
                                                >
                                                    <WhatsAppIcon className="w-5 h-5" />
                                                </button>

                                                {!isPaid ? (
                                                    <button
                                                        onClick={() => handleMarkAsPaid(pago)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                        title="Marcar como pagado"
                                                    >
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleRevertPayment(pago)}
                                                        className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors border border-transparent hover:border-orange-100"
                                                        title="Revertir a pendiente"
                                                    >
                                                        <AlertCircle className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
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
