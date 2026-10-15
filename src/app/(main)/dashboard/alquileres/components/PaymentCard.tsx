
import { useState, useRef, useEffect } from "react";
import { format, isValid, differenceInDays, isAfter, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import { Pago, Alquiler } from "@/domain/models/Alquiler";
import { Edit2, Download, AlertCircle, CheckCircle2, Clock, Trash2, MoreVertical, XCircle, TrendingUp } from "lucide-react";
import { whatsappService } from "@/infrastructure/services/whatsappService";
import { receiptService, AgencyProfile } from "@/infrastructure/services/receiptService";
import { useAuth } from "@/ui/context/AuthContext";

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
    const { user, userData } = useAuth();
    const agencyProfile: AgencyProfile | undefined = userData ? {
        agencyName: userData.agencyName,
        agencyLicense: userData.agencyLicense,
        agencyManager: userData.agencyManager,
        agencyCuit: userData.agencyCuit,
        agencyAddress: userData.agencyAddress,
        agencyWhatsapp: userData.agencyWhatsapp,
        logoUrl: userData.logoUrl,
        // from inmobiliariaProfile if filled in configuracion tab
        condicionIva: userData.inmobiliariaProfile?.condicionIva,
        firmante: userData.inmobiliariaProfile?.firmante,
        cargoFirmante: userData.inmobiliariaProfile?.cargoFirmante,
    } : undefined;
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
    const servicios = (payment.detalleServicios && payment.detalleServicios.length > 0)
        ? payment.detalleServicios.reduce((acc, s) => acc + (s.monto || 0), 0)
        : (payment.montoServicios || 0);
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
    // Honorarios are included in baseAlquiler (Rent), so we don't add them.
    const totalCalculado = baseAlquiler + servicios + adicionales + punitorios - descuentos;
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


    const handleWhatsApp = async () => {
        const phone = contract.telefonoInquilino || contract.contactoInquilino;
        if (!phone) {
            alert("No hay teléfono de contacto disponible");
            return;
        }

        try {
            // 1. Download Receipt
            receiptService.generateReceipt(payment, contract, agencyProfile, user?.uid);

            // 2. Prepare Message
            // Ensure monthName is correctly formatted in Spanish
            const paymentDate = new Date(`${payment.mes}-02`);
            const monthName = isValid(paymentDate)
                ? format(paymentDate, 'MMMM', { locale: es })
                : payment.mes;

            const inquilinoName = contract.nombreInquilino
                ? contract.nombreInquilino.split(' ')[0]
                : 'Estimado/a';

            const message = `Hola ${inquilinoName}, te envío el comprobante de pago del alquiler de ${monthName}. Saludos!`;

            // 3. Open WhatsApp
            const cleanPhone = phone.replace(/\D/g, '');
            const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

            // Open in new tab (some browsers block popups if not direct user action, but this is inside onClick so it should work)
            window.open(url, '_blank');

            // 4. Instructions
            // Use setTimeout to ensure the alert appears after the new tab opens (and doesn't block it)
            setTimeout(() => {
                alert(
                    "El comprobante se ha descargado en tu dispositivo.\n\n" +
                    "Por favor, adjúntalo manualmente en el chat de WhatsApp que se acaba de abrir."
                );
            }, 1000);

        } catch (error) {
            console.error("Error creating receipt:", error);
            alert("Error al generar el comprobante.");
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
        <div className={`rounded-2xl border transition-all duration-300 relative overflow-visible group ${isPaid
            ? 'bg-[var(--color-paper-2)] border-[var(--color-positive)]/30 hover:shadow-md'
            : isOverdue
                ? 'bg-[var(--color-paper-2)] border-[var(--color-danger)]/30 shadow-sm hover:shadow-md hover:border-[var(--color-danger)]/30'
                : isDueSoon
                    ? 'bg-[var(--color-paper-2)] border-[var(--color-warning)]/30 hover:shadow-md'
                    : 'bg-[var(--color-paper-2)] border-[var(--color-rule-2)] shadow-sm hover:shadow-md hover:border-[var(--color-neutral)]'
            }`}>

            {/* Header / Main Info */}
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-[var(--color-ink)] capitalize tracking-tight leading-none">
                                {format(new Date(`${payment.mes}-02`), 'MMMM', { locale: es })}
                            </h3>
                            <span className="text-[var(--color-neutral)] font-medium text-sm">
                                {format(new Date(`${payment.mes}-02`), 'yyyy')}
                            </span>
                        </div>
                        <p className={`text-xs font-semibold tracking-wide uppercase ${isOverdue ? 'text-[var(--color-danger)]' : 'text-[var(--color-neutral)]'}`}>
                            {isPaid ? 'Pagado el ' + (payment.fechaPago ? format(new Date(payment.fechaPago), 'dd/MM') : '-') :
                                `Vence ${isValid(new Date(payment.fechaVencimiento)) ? format(new Date(payment.fechaVencimiento), 'dd/MM') : '-'}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isPaid ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[var(--color-positive-soft)] text-[var(--color-positive)] tracking-wider uppercase border border-[var(--color-positive)]/30">
                                <CheckCircle2 strokeWidth={1.5} className="w-3 h-3 mr-1" /> Pagado
                            </span>
                        ) : isOverdue ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[var(--color-danger-soft)] text-[var(--color-danger)] tracking-wider uppercase border border-[var(--color-danger)]/30">
                                <AlertCircle strokeWidth={1.5} className="w-3 h-3 mr-1" /> Vencido
                            </span>
                        ) : isDueSoon ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[var(--color-warning-soft)] text-[var(--color-warning)] tracking-wider uppercase border border-[var(--color-warning)]/30">
                                <Clock strokeWidth={1.5} className="w-3 h-3 mr-1" /> {daysToDue === 0 ? 'Hoy' : `${daysToDue} días`}
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[var(--color-paper)] text-[var(--color-muted)] tracking-wider uppercase border border-[var(--color-rule)]">
                                Pendiente
                            </span>
                        )}

                        {/* Meatball Menu for Paid Items */}
                        {isPaid && onCancelPayment && (
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-1.5 hover:bg-[var(--color-paper-3)] rounded-full transition-colors text-[var(--color-neutral)] hover:text-[var(--color-ink-2)]"
                                >
                                    <MoreVertical strokeWidth={1.5} size={18} />
                                </button>

                                {showMenu && (
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--color-paper-2)] rounded-xl shadow-xl border border-[var(--color-rule-2)] z-10 py-1 origin-top-right transform transition-all animate-in fade-in zoom-in-95 duration-200">
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                onCancelPayment(payment);
                                            }}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition-colors font-medium"
                                        >
                                            <XCircle strokeWidth={1.5} size={16} />
                                            Cancelar Pago
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Big Amount */}
                <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                        <span className={`text-4xl font-black tracking-tighter ${isPaid ? 'text-[var(--color-positive)]' : isOverdue ? 'text-[var(--color-danger)]' : 'text-[var(--color-ink)]'}`}>
                            {formatMoney(totalFinal).replace(',00', '')}
                            <span className="text-lg text-[var(--color-neutral)] font-medium ml-1">
                                {totalFinal % 1 !== 0 ? ',' + totalFinal.toFixed(2).split('.')[1] : ''}
                            </span>
                        </span>
                    </div>

                    {!isPaid && (saldo < totalFinal ? (
                        <div className="flex items-center gap-2 mt-2 bg-[var(--color-warning-soft)] px-3 py-1.5 rounded-lg w-fit">
                            <p className="text-xs text-[var(--color-warning)] font-bold">Parcial: {formatMoney(payment.pagoParcial || 0)}</p>
                            <span className="text-[10px] text-[var(--color-warning)]">•</span>
                            <p className="text-xs text-[var(--color-warning)] font-medium">Resta: {formatMoney(saldo)}</p>
                        </div>
                    ) : (
                        <p className="text-xs text-[var(--color-neutral)] font-medium mt-1 uppercase tracking-wider">Total a pagar</p>
                    ))}

                    {isPaid && isLatePayment && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/30">
                            <AlertCircle strokeWidth={1.5} className="w-3 h-3 text-[var(--color-danger)]" />
                            <span className="text-xs font-semibold text-[var(--color-danger)]">Pago fuera de término</span>
                        </div>
                    )}
                </div>

                {/* Breakdown Summary */}
                <div className="space-y-2 text-sm text-[var(--color-muted)] mb-6 bg-[var(--color-paper)]/50 p-4 rounded-xl border border-[var(--color-rule-2)]/50">
                    <div className="flex justify-between items-center">
                        <span>Alquiler</span>
                        <span className="font-semibold text-[var(--color-ink-2)]">{formatMoney(baseAlquiler - honorarios)}</span>
                    </div>
                    {honorarios > 0 && (
                        <div className="flex justify-between items-center text-[var(--color-accent)]/70">
                            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]/30"></span> Honorarios</span>
                            <span className="font-medium">{formatMoney(honorarios)}</span>
                        </div>
                    )}
                    {servicios > 0 && (
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-neutral)]"></span> Servicios</span>
                            <span className="font-medium">{formatMoney(servicios)}</span>
                        </div>
                    )}
                    {adicionales > 0 && (
                        <div className="flex justify-between items-center text-[var(--color-accent)]">
                            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"></span> Adicionales</span>
                            <span className="font-medium">{formatMoney(adicionales)}</span>
                        </div>
                    )}
                    {punitorios > 0 && (
                        <div className="flex justify-between items-center text-[var(--color-danger)] bg-[var(--color-danger-soft)] px-2 py-1 -mx-2 rounded-md">
                            <span className="font-medium flex items-center gap-1.5"><TrendingUp strokeWidth={1.5} className="w-3 h-3" /> Intereses</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold">+{formatMoney(punitorios)}</span>
                                {!isPaid && (
                                    <button
                                        onClick={handleRemovePunitorios}
                                        className="p-1 hover:bg-[var(--color-paper-3)] rounded-md text-[var(--color-danger)] hover:text-[var(--color-danger)] transition-colors shadow-sm"
                                        title="Eliminar intereses"
                                    >
                                        <Trash2 strokeWidth={1.5} className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    {descuentos > 0 && (
                        <div className="flex justify-between items-center text-[var(--color-positive)] bg-[var(--color-positive-soft)] px-2 py-1 -mx-2 rounded-md">
                            <span className="font-medium">Descuentos</span>
                            <span className="font-bold">-{formatMoney(descuentos)}</span>
                        </div>
                    )}
                </div>

                {/* Expand Button for Inputs/Details */}
                {!isPaid && (
                    <div className="flex gap-3">
                        <button
                            onClick={() => onEdit && onEdit(payment)}
                            className="flex items-center justify-center p-3 bg-[var(--color-paper-2)] border border-[var(--color-rule)] hover:border-[var(--color-neutral)] hover:bg-[var(--color-paper-3)] text-[var(--color-ink-2)] rounded-xl transition-all shadow-sm active:scale-95"
                            title="Editar Montos"
                        >
                            <Edit2 strokeWidth={1.5} className="w-5 h-5" />
                        </button>

                        <button
                            onClick={handleWhatsApp}
                            className="flex items-center justify-center p-3 bg-[var(--color-positive-soft)] hover:bg-[var(--color-positive)]/25 text-[var(--color-positive)] rounded-xl transition-all active:scale-95 border border-[var(--color-positive)]/30"
                            title="Enviar Recordatorio por WhatsApp"
                        >
                            <div className="relative w-5 h-5 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                            </div>
                            <span className="ml-2 font-medium">WhatsApp</span>
                        </button>

                        <button
                            onClick={() => onMarkPaid(payment)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-ink)] hover:bg-[var(--color-ink-2)] text-[var(--color-paper)] rounded-xl text-sm font-bold transition-all shadow-lg active:scale-[0.98]"
                        >
                            Cobrar {formatMoney(totalFinal).split(',')[0]}
                        </button>
                    </div>
                )}

                {isPaid && (
                    <div className="flex gap-3">
                        {onDownload && (
                            <button
                                onClick={() => onDownload(payment)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-paper-2)] border border-[var(--color-rule)] hover:bg-[var(--color-paper-3)] text-[var(--color-ink-2)] rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-[0.98]"
                            >
                                <Download strokeWidth={1.5} className="w-4 h-4" /> Comprobante
                            </button>
                        )}
                        <button
                            onClick={handleWhatsApp}
                            className="flex items-center justify-center gap-2 p-3 bg-[var(--color-paper-2)] border border-[var(--color-rule)] hover:bg-[var(--color-paper-3)] rounded-xl transition-all shadow-sm active:scale-95 text-[var(--color-ink-2)]"
                            title="Enviar Comprobante por WhatsApp"
                        >
                            <div className="relative w-5 h-5 flex items-center justify-center text-[var(--color-positive)]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                            </div>
                            <span className="font-medium text-sm hidden sm:inline">Enviar Comprobante</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Additional "Red" Section for Punitorios */}
            {isOverdue && !isPaid && punitorios === 0 && (
                <div className="bg-[var(--color-danger-soft)] p-4 border-t border-[var(--color-danger)]/30 rounded-b-2xl flex flex-col gap-3 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div className="text-[var(--color-danger)] text-xs font-semibold flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-danger)] animate-pulse"></span>
                            Se venció hace {Math.max(0, differenceInDays(today, dueDate))} días
                        </div>
                        {calculatedInterest === null ? (
                            <button
                                onClick={handleCalculateInterest}
                                className="text-xs bg-[var(--color-paper-2)] border border-[var(--color-danger)]/30 text-[var(--color-danger)] px-3 py-1.5 rounded-lg shadow-sm hover:bg-[var(--color-danger-soft)] font-semibold transition-all hover:shadow-md"
                            >
                                + Calcular Interés
                            </button>
                        ) : (
                            <span className="text-[var(--color-danger)] font-bold text-sm">
                                +{formatMoney(calculatedInterest)}
                            </span>
                        )}
                    </div>

                    {calculatedInterest !== null && (
                        <div className="flex items-center justify-between pt-3 border-t border-[var(--color-danger)]/30 animate-in fade-in slide-in-from-top-1">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-danger)]">
                                {contract.punitoriosTipo === 'porcentaje'
                                    ? `${contract.punitoriosValor}% Recargo`
                                    : 'Recargo Fijo'}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCalculatedInterest(null)}
                                    className="text-xs text-[var(--color-danger)] hover:text-[var(--color-danger)] px-3 py-1.5 font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={applyInterest}
                                    className="text-xs bg-[var(--color-danger)] text-[var(--color-accent-ink)] px-4 py-1.5 rounded-lg shadow-md hover:bg-[var(--color-danger)] font-bold transition-all hover:shadow-lg"
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
