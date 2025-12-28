
import { useState, useRef, useEffect } from "react";
import { format, isValid, differenceInDays, isAfter, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import { Pago, Alquiler } from "@/domain/models/Alquiler";
import { Edit2, Download, AlertCircle, CheckCircle2, Clock, Trash2, MoreVertical, XCircle } from "lucide-react";
import { whatsappService } from "@/infrastructure/services/whatsappService";

interface PaymentCardProps {
    payment: Pago;
    contract: Alquiler;
    onUpdate: (payment: Pago) => void;
    onMarkPaid: (payment: Pago) => void;
    onDownload?: (payment: Pago) => void;
    onEdit?: (payment: Pago) => void;
    onCancelPayment?: (payment: Pago) => void;
}

export const PaymentCard = ({ payment, contract, onUpdate, onMarkPaid, onDownload, onEdit, onCancelPayment }: PaymentCardProps) => {
    const [showMenu, setShowMenu] = useState(false);
    const [calculatedInterest, setCalculatedInterest] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Calcular totales
    // Calcular totales
    const baseAlquiler = payment.montoAlquiler || 0;
    const servicios = (payment.detalleServicios || []).reduce((acc, s) => acc + (s.monto || 0), 0) + (payment.montoServicios || 0);
    const adicionales = (payment.cargosAdicionales || []).reduce((acc, c) => acc + (c.monto || 0), 0);
    const punitorios = payment.montoPunitorios || 0;

    // Honorarios: use breakdown, or fallback to contract calculation if not paid/defined yet
    let honorarios = payment.desglose?.honorarios;
    if (honorarios === undefined) {
        if (contract.honorariosTipo === 'fijo' && contract.honorariosValor) {
            honorarios = contract.honorariosValor;
        } else if (contract.honorariosTipo === 'porcentaje' && contract.honorariosValor) {
            const base = payment.montoAlquiler || contract.montoMensual || 0;
            honorarios = Math.floor(base * (contract.honorariosValor / 100));
        } else {
            honorarios = 0;
        }
    }

    const descuentos = payment.montoDescuento || 0;

    // Total calculado si no hay monto fijo seteado
    // Total calculado si no hay monto fijo seteado
    const totalCalculado = baseAlquiler + servicios + adicionales + punitorios + honorarios - descuentos;
    // Prefer stored total if Paid, otherwise calculate live (allows dynamic updates for pending)
    const totalFinal = (payment.estado === 'pagado' && payment.monto) ? payment.monto : totalCalculado;
    const saldo = totalFinal - (payment.pagoParcial || 0);

    const isPaid = payment.estado === 'pagado';
    const today = new Date();
    const dueDate = new Date(payment.fechaVencimiento);

    // Check if overdue: not paid AND (status is 'vencido' OR today > dueDate)
    const isOverdue = !isPaid && (payment.estado === 'vencido' || differenceInDays(today, dueDate) > 0);

    // Check if due soon: not paid, not overdue, and diff is between -3 and 0 (meaning dueDate is today or up to 3 days in future).
    const daysToDue = differenceInDays(dueDate, today);
    const isDueSoon = !isPaid && !isOverdue && daysToDue >= 0 && daysToDue <= 3;

    // Late payment check logic
    const isLatePayment = isPaid && payment.fechaPago && isAfter(startOfDay(new Date(payment.fechaPago)), startOfDay(dueDate));


    const handleWhatsApp = () => {
        const phone = contract.telefonoInquilino || contract.contactoInquilino;
        if (phone) {
            whatsappService.sendMessage(phone, whatsappService.generatePaymentMessage(contract, payment));
        } else {
            alert("No hay teléfono de contacto disponible");
        }
    };

    const handleRemovePunitorios = () => {
        if (confirm("¿Eliminar los intereses por mora de este periodo?")) {
            // Recalculate total subtracting punitorios
            const newTotal = totalFinal - punitorios;
            onUpdate({
                ...payment,
                montoPunitorios: 0,
                monto: newTotal
            });
        }
    };

    const handleCalculateInterest = () => {
        let interest = 0;

        if (contract.punitoriosTipo === 'porcentaje' && contract.punitoriosValor) {
            // Simple calculation: % surcharge on total
            interest = (totalFinal * (contract.punitoriosValor / 100));
        } else if (contract.punitoriosTipo === 'fijo' && contract.punitoriosValor) {
            interest = contract.punitoriosValor;
        }

        setCalculatedInterest(interest);
    };

    const applyInterest = () => {
        if (calculatedInterest === null) return;
        const newTotal = totalFinal + calculatedInterest;
        onUpdate({
            ...payment,
            montoPunitorios: calculatedInterest,
            monto: newTotal,
            punitoriosAplicados: {
                dias: differenceInDays(today, dueDate),
                monto: calculatedInterest,
                tasaApplied: contract.punitoriosValor
            }
        });
        setCalculatedInterest(null);
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
    };

    return (
        <div className={`rounded-xl border transition-all relative overflow-visible ${isPaid
            ? 'bg-green-50 border-green-200'
            : isOverdue
                ? 'bg-white border-red-200 shadow-sm'
                : isDueSoon
                    ? 'bg-yellow-50 border-yellow-200 shadow-sm'
                    : 'bg-white border-gray-200 shadow-sm'
            }`}>

            {/* Header / Main Info */}
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 capitalize">
                            {format(new Date(`${payment.mes}-02`), 'MMMM yyyy', { locale: es })}
                        </h3>
                        <p className="text-sm text-gray-500">
                            Vence: {isValid(new Date(payment.fechaVencimiento)) ? format(new Date(payment.fechaVencimiento), 'dd/MM/yyyy') : '-'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isPaid ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Pagado
                            </span>
                        ) : isOverdue ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <AlertCircle className="w-3 h-3 mr-1" /> Vencido
                            </span>
                        ) : isDueSoon ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Clock className="w-3 h-3 mr-1" /> {daysToDue === 0 ? 'Vence hoy' : `Vence en ${daysToDue} día${daysToDue > 1 ? 's' : ''}`}
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Pendiente
                            </span>
                        )}

                        {/* Meatball Menu for Paid Items */}
                        {isPaid && onCancelPayment && (
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                                >
                                    <MoreVertical size={16} />
                                </button>

                                {showMenu && (
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1 origin-top-right transform transition-all">
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                onCancelPayment(payment);
                                            }}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <XCircle size={14} />
                                            Cancelar Pago
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Big Amount */}
                <div className="mb-4">
                    <div className={`text-3xl font-extrabold ${isPaid ? 'text-green-700' : 'text-indigo-600'}`}>
                        {formatMoney(totalFinal)}
                    </div>
                    {isPaid ? (
                        <p className="text-sm text-green-600 font-medium">
                            Pagado el {payment.fechaPago ? format(new Date(payment.fechaPago), 'dd/MM') : '-'}
                            {isLatePayment && (
                                <span className="text-red-500 font-semibold ml-1 text-xs uppercase tracking-wide">
                                    (Fuera de Término)
                                </span>
                            )}
                        </p>
                    ) : saldo < totalFinal ? (
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-orange-600 font-medium">Pago Parcial: {formatMoney(payment.pagoParcial || 0)}</p>
                            <span className="text-xs text-gray-400">•</span>
                            <p className="text-sm text-gray-500">Resta: {formatMoney(saldo)}</p>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Total a pagar</p>
                    )}
                </div>

                {/* Breakdown Summary */}
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                    <div className="flex justify-between">
                        <span>Alquiler Puro:</span>
                        <span>{formatMoney(baseAlquiler)}</span>
                    </div>
                    {honorarios > 0 && (
                        <div className="flex justify-between text-indigo-800">
                            <span>Honorarios:</span>
                            <span>{formatMoney(honorarios)}</span>
                        </div>
                    )}
                    {servicios > 0 && (
                        <div className="flex justify-between">
                            <span>Servicios/Expensas:</span>
                            <span>{formatMoney(servicios)}</span>
                        </div>
                    )}
                    {adicionales > 0 && (
                        <div className="flex justify-between text-indigo-600">
                            <span>Cargos Adicionales:</span>
                            <span>{formatMoney(adicionales)}</span>
                        </div>
                    )}
                    {punitorios > 0 && (
                        <div className="flex justify-between items-center text-red-600 font-medium">
                            <span>Intereses / Mora:</span>
                            <div className="flex items-center gap-2">
                                <span>+{formatMoney(punitorios)}</span>
                                {!isPaid && (
                                    <button
                                        onClick={handleRemovePunitorios}
                                        className="p-1 hover:bg-red-50 rounded-full text-red-400 hover:text-red-600 transition-colors"
                                        title="Eliminar intereses"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    {descuentos > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Descuentos:</span>
                            <span>-{formatMoney(descuentos)}</span>
                        </div>
                    )}
                </div>

                {/* Expand Button for Inputs/Details */}
                {!isPaid && (
                    <div className="border-t border-gray-100 pt-3 flex gap-2">
                        <button
                            onClick={() => onEdit && onEdit(payment)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Edit2 className="w-4 h-4" /> Editar Montos
                        </button>
                        <button
                            onClick={handleWhatsApp}
                            className="flex items-center justify-center p-2 bg-[#dcf8c6] hover:bg-[#cbf5ad] rounded-lg transition-colors border border-transparent"
                            title="Enviar Recordatorio"
                        >
                            <div className="relative w-6 h-6">
                                <Image
                                    src="/assets/img/WhatsApp.png"
                                    fill
                                    className="object-contain"
                                    alt="WhatsApp"
                                />
                            </div>
                        </button>
                        <button
                            onClick={() => onMarkPaid(payment)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            Registrar Cobro
                        </button>
                    </div>
                )}

                {isPaid && (
                    <div className="border-t border-green-200 pt-3 flex gap-2">
                        {onDownload && (
                            <button
                                onClick={() => onDownload(payment)}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Download className="w-4 h-4" /> Comprobante
                            </button>
                        )}
                        <button
                            onClick={handleWhatsApp}
                            className="flex items-center justify-center p-2 bg-[#dcf8c6] hover:bg-[#cbf5ad] rounded-lg transition-colors border border-transparent grayscale-0"
                            title="Enviar Comprobante PDF"
                        >
                            <div className="relative w-6 h-6">
                                <Image
                                    src="/assets/img/WhatsApp.png"
                                    fill
                                    className="object-contain"
                                    alt="WhatsApp"
                                />
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {/* Additional "Red" Section for Punitorios */}
            {isOverdue && !isPaid && punitorios === 0 && (
                <div className="bg-red-50 p-3 border-t border-red-100 rounded-b-xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <div className="text-red-800 text-sm font-medium flex items-center gap-2">
                            <span className="font-bold">!</span>
                            Periodo vencido hace {Math.max(0, differenceInDays(today, dueDate))} días
                        </div>
                        {calculatedInterest === null ? (
                            <button
                                onClick={handleCalculateInterest}
                                className="text-xs bg-white border border-red-200 text-red-700 px-3 py-1 rounded-lg shadow-sm hover:bg-red-100 font-medium transition-colors"
                            >
                                Calcular Intereses
                            </button>
                        ) : (
                            <span className="text-red-700 font-bold text-sm">
                                +{formatMoney(calculatedInterest)}
                            </span>
                        )}
                    </div>

                    {calculatedInterest !== null && (
                        <div className="flex items-center justify-between pt-2 border-t border-red-100 animate-in fade-in slide-in-from-top-1">
                            <span className="text-xs text-red-600">
                                {contract.punitoriosTipo === 'porcentaje'
                                    ? `${contract.punitoriosValor}% del total`
                                    : 'Recargo fijo'}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCalculatedInterest(null)}
                                    className="text-xs text-red-600 hover:text-red-800 px-2 py-1"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={applyInterest}
                                    className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg shadow-sm hover:bg-red-700 font-medium transition-colors"
                                >
                                    Aplicar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
