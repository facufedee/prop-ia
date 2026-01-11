"use client";

import { useState, useEffect } from "react";
import { Pago, Alquiler } from "@/domain/models/Alquiler";
import { X, Plus, Trash2, AlertTriangle, Calendar, Calculator } from "lucide-react";
import { parseISO, startOfMonth, endOfMonth, format, isValid, parse, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

interface PaymentEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    payment: Partial<Pago>;
    rental: Alquiler;
    onSave: (payment: Pago) => void;
}

const PRESET_SERVICES = ['Agua', 'Luz', 'Gas', 'Impuesto Municipal'];
const MAX_VALUE = 999999999;
const DEFAULT_PENALTY_RATE = 1; // 1% per day

const CurrencyInput = ({
    value,
    onChange,
    className = "",
    placeholder = "",
    readOnly = false,
    showError = false
}: {
    value: number,
    onChange: (val: number) => void,
    className?: string,
    placeholder?: string,
    readOnly?: boolean,
    showError?: boolean
}) => {
    // Safety check for NaN
    const safeValue = isNaN(value) ? 0 : value;
    const errorClass = (safeValue > MAX_VALUE || showError) ? "border-red-500 focus:ring-red-500" : "";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        if (raw.length > 15) return;

        const num = parseInt(raw);
        if (isNaN(num)) {
            onChange(0);
        } else {
            onChange(num);
        }
    };

    const displayValue = safeValue === 0 && !readOnly ? '0' : safeValue.toLocaleString('es-AR');

    return (
        <div className="w-full">
            <input
                type="text"
                className={`${className} ${errorClass}`}
                value={readOnly && safeValue === 0 ? '$ 0' : displayValue}
                onChange={handleChange}
                placeholder={placeholder}
                readOnly={readOnly}
            />
            {safeValue > MAX_VALUE && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Excede el máximo permitido
                </p>
            )}
        </div>
    );
};

const DateInput = ({ value, onChange, minDate, maxDate, className = "" }: { value?: Date, onChange: (d: Date | undefined) => void, minDate?: string, maxDate?: string, className?: string }) => {

    // Convert Date -> YYYY-MM-DD string for input value
    const dateToString = (date?: Date) => {
        if (!date || !isValid(date)) return "";
        return format(date, "yyyy-MM-dd");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (!val) {
            onChange(undefined);
            return;
        }

        const parsed = parse(val, "yyyy-MM-dd", new Date());

        if (isValid(parsed)) {
            if (minDate && val < minDate) {
                alert("Fecha anterior al mes permitido");
                return;
            }
            if (maxDate && val > maxDate) {
                alert("Fecha posterior al mes permitido");
                return;
            }
            onChange(parsed);
        }
    };

    return (
        <div className="relative">
            <input
                type="date"
                className={className}
                value={dateToString(value)}
                onChange={handleChange}
                min={minDate}
                max={maxDate}
            />
            {value && isValid(value) && (
                <p className="text-xs text-green-600 mt-1 capitalize font-medium">
                    {format(value, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
            )}
        </div>
    );
};

export default function PaymentEditModal({ isOpen, onClose, payment, rental, onSave }: PaymentEditModalProps) {
    // Helper to safely parse any date format (Date, string, Timestamp)
    const toDate = (value: any): Date | undefined => {
        if (!value) return undefined;
        if (value instanceof Date) return value;
        if (typeof value === 'object' && value.toDate) return value.toDate(); // Firestore Timestamp
        if (typeof value === 'string') {
            const parsed = parseISO(value);
            return isValid(parsed) ? parsed : undefined;
        }
        return undefined;
    };

    const [form, setForm] = useState<Partial<Pago>>({
        ...payment,
        fechaVencimiento: toDate(payment.fechaVencimiento),
        fechaPago: toDate(payment.fechaPago)
    });

    const [services, setServices] = useState<{ concepto: string; monto: number }[]>([]);

    // Honorarios Logic -- ADDED
    const [honorarios, setHonorarios] = useState<number>(0);

    // Discount logic
    const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
    const [discountInputValue, setDiscountInputValue] = useState<number>(form.montoDescuento || 0);

    // Penalty Logic
    const [penaltyInfo, setPenaltyInfo] = useState<{ days: number, suggested: number }>({ days: 0, suggested: 0 });

    useEffect(() => {
        if (isOpen) {
            setForm({
                ...payment,
                fechaVencimiento: toDate(payment.fechaVencimiento),
                fechaPago: toDate(payment.fechaPago)
            });
            setDiscountInputValue(payment.montoDescuento || 0);
            setDiscountType('amount');

            // Initialize Honorarios -- ADDED
            if (payment.desglose?.honorarios !== undefined) {
                setHonorarios(payment.desglose.honorarios);
            } else {
                // Calculate default from contract
                if (rental.honorariosTipo === 'fijo' && rental.honorariosValor) {
                    setHonorarios(rental.honorariosValor);
                } else if (rental.honorariosTipo === 'porcentaje' && rental.honorariosValor) {
                    // Usually calculated on base rent. 
                    const baseRent = payment.montoAlquiler || rental.montoMensual || 0;
                    setHonorarios(Math.floor(baseRent * (rental.honorariosValor / 100)));
                } else {
                    setHonorarios(0);
                }
            }

            // Calculate initial penalty suggestion
            calculatePenalty({ ...payment });


            const currentServices = payment.detalleServicios || [];
            const mergedServices = [...currentServices];

            PRESET_SERVICES.forEach(preset => {
                const exists = mergedServices.some(s => s.concepto === preset);
                if (!exists) mergedServices.push({ concepto: preset, monto: 0 });
            });

            mergedServices.sort((a, b) => {
                const idxA = PRESET_SERVICES.indexOf(a.concepto);
                const idxB = PRESET_SERVICES.indexOf(b.concepto);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return 0;
            });

            setServices(mergedServices);
        }
    }, [isOpen, payment, rental]);

    const calculatePenalty = (currentForm: Partial<Pago>) => {
        if (!currentForm.fechaVencimiento || !currentForm.montoAlquiler) return;

        // Determination reference date: Payment Date or Today
        const refDate = currentForm.fechaPago ? new Date(currentForm.fechaPago) : new Date();
        const dueDate = new Date(currentForm.fechaVencimiento);

        // Reset hours for fair comparison
        refDate.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);

        const diff = differenceInDays(refDate, dueDate);
        const daysLate = Math.max(0, diff);

        if (daysLate > 0) {
            // Use punitoriosValor if percentage, otherwise default to DEFAULT_PENALTY_RATE
            const dailyRate = (rental.punitoriosTipo === 'porcentaje' && rental.punitoriosValor)
                ? rental.punitoriosValor
                : DEFAULT_PENALTY_RATE;

            // Formula: Rent * (Rate/100) * Days
            const calculated = Math.floor(currentForm.montoAlquiler * (dailyRate / 100) * daysLate);
            setPenaltyInfo({ days: daysLate, suggested: calculated });

            // Auto update if punitorios is 0
            if (!currentForm.montoPunitorios) {
                setForm(prev => ({ ...prev, montoPunitorios: calculated }));
            }
        } else {
            setPenaltyInfo({ days: 0, suggested: 0 });
        }
    };

    // Recalculate on date change
    useEffect(() => {
        if (form.fechaVencimiento) {
            const refDate = form.fechaPago ? new Date(form.fechaPago) : new Date();
            const dueDate = new Date(form.fechaVencimiento);
            refDate.setHours(0, 0, 0, 0);
            dueDate.setHours(0, 0, 0, 0);

            const diff = differenceInDays(refDate, dueDate);
            const daysLate = Math.max(0, diff);

            if (daysLate > 0) {
                const dailyRate = (rental.punitoriosTipo === 'porcentaje' && rental.punitoriosValor)
                    ? rental.punitoriosValor
                    : DEFAULT_PENALTY_RATE;

                const calculated = Math.floor((form.montoAlquiler || 0) * (dailyRate / 100) * daysLate);
                setPenaltyInfo({ days: daysLate, suggested: calculated });

                // If it was auto-set (or 0), update it
                // We'll update if it's 0 or if we want dynamic update.
                // User said "que recalcule". So we update.
                setForm(prev => ({ ...prev, montoPunitorios: calculated }));
            } else {
                setPenaltyInfo({ days: 0, suggested: 0 });
                // If no delay, clear penalty? Yes.
                setForm(prev => ({ ...prev, montoPunitorios: 0 }));
            }
        }
    }, [form.fechaVencimiento, form.fechaPago, form.montoAlquiler, rental.punitoriosValor, rental.punitoriosTipo]);


    const getSubtotal = () => {
        const alquilerVal = Number(form.montoAlquiler) || 0;
        const punitorios = Number(form.montoPunitorios) || 0;
        const servicesTotal = services.reduce((sum, s) => sum + (Number(s.monto) || 0), 0);
        const honorariosVal = Number(honorarios) || 0; // -- ADDED
        return alquilerVal + servicesTotal + punitorios + honorariosVal;
    }

    const calculateDiscountAmount = () => {
        if (discountType === 'amount') return discountInputValue;
        const subtotal = getSubtotal();
        const percent = Math.min(discountInputValue, 100);
        return Math.floor(subtotal * (percent / 100));
    }

    const calculateTotal = () => {
        const subtotal = getSubtotal();
        const discount = calculateDiscountAmount();
        return subtotal - discount;
    };

    useEffect(() => {
        const discount = calculateDiscountAmount();
        setForm(prev => ({ ...prev, montoDescuento: discount }));
    }, [discountInputValue, discountType, services, form.montoPunitorios, form.montoAlquiler, honorarios]); // Added honorarios


    const handleServiceChange = (index: number, val: number) => {
        const newServices = [...services];
        newServices[index] = { ...newServices[index], monto: val };
        setServices(newServices);
        updateServicesTotal(newServices);
    };

    const handleServiceNameChange = (idx: number, val: string) => {
        const newServices = [...services];
        newServices[idx] = { ...newServices[idx], concepto: val };
        setServices(newServices);
    };

    const updateServicesTotal = (srvs: { concepto: string; monto: number }[]) => {
        const total = srvs.reduce((sum, s) => sum + (Number(s.monto) || 0), 0);
        setForm(prev => ({ ...prev, montoServicios: total }));
    };

    const addService = (name: string = '') => {
        if (services.length >= 10) return;
        const newServices = [...services, { concepto: name, monto: 0 }];
        setServices(newServices);
        updateServicesTotal(newServices);
    };

    const removeService = (index: number) => {
        const newServices = services.filter((_, i) => i !== index);
        setServices(newServices);
        updateServicesTotal(newServices);
    };

    const handleSave = () => {
        if (!form.id) return;
        const total = calculateTotal();
        const finalPayment: Pago = {
            ...form as Pago,
            detalleServicios: services,
            monto: total,
            montoDescuento: calculateDiscountAmount(),
            desglose: {
                ...payment.desglose, // keep existing Breakdown generic fields if any
                alquilerPuro: Number(form.montoAlquiler) || 0,
                servicios: services.reduce((sum, s) => sum + (Number(s.monto) || 0), 0),
                honorarios: honorarios, // -- ADDED
            }
        };
        onSave(finalPayment);
        onClose();
    };

    const handleDiscountChange = (val: number) => {
        if (discountType === 'percent' && val > 100) {
            setDiscountInputValue(100);
        } else {
            setDiscountInputValue(val);
        }
    };

    const getMonthConstraints = () => {
        if (!form.mes) return { min: '', max: '' };
        try {
            const date = parseISO(`${form.mes}-01`);
            if (!isValid(date)) return { min: '', max: '' };
            const start = format(startOfMonth(date), 'yyyy-MM-dd');
            const end = format(endOfMonth(date), 'yyyy-MM-dd');
            return { min: start, max: end };
        } catch {
            return { min: '', max: '' };
        }
    };
    const { min: minDate, max: maxDate } = getMonthConstraints();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-white z-10 shrink-0">
                    <h2 className="text-lg font-bold text-gray-900">Editar Pago - {payment.mes}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto grow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Monto Alquiler</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                                <CurrencyInput
                                    value={Number(form.montoAlquiler) || 0}
                                    onChange={(val) => setForm({ ...form, montoAlquiler: val })}
                                    className="w-full pl-6 pr-3 py-1.5 border rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                                    readOnly={true}
                                />
                            </div>
                        </div>

                        {/* Honorarios Input -- ADDED */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Honorarios
                                {rental.honorariosTipo && (
                                    <span className="ml-2 text-[10px] text-gray-400 font-normal">
                                        ({rental.honorariosTipo === 'porcentaje' ? `${rental.honorariosValor}%` : 'Fijo'})
                                    </span>
                                )}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
                                <CurrencyInput
                                    value={honorarios}
                                    onChange={setHonorarios}
                                    className="w-full pl-6 pr-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha Vencimiento</label>
                                    <DateInput
                                        value={form.fechaVencimiento}
                                        onChange={(d) => d && setForm({ ...form, fechaVencimiento: d })}
                                        minDate={minDate}
                                        maxDate={maxDate}
                                        className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                </div>
                                <div>
                                    {/* Placeholder for alignment if needed */}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-lg p-3 bg-gray-50/50">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-semibold text-gray-900">Servicios e Impuestos</h3>
                        </div>

                        <div className="space-y-2">
                            {services.map((service, idx) => {
                                const isPreset = PRESET_SERVICES.includes(service.concepto);
                                return (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <div className="flex-1">
                                            {isPreset ? (
                                                <div className="px-3 py-1.5 border border-gray-200 bg-white rounded-lg text-gray-700 text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                                    {service.concepto}
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    placeholder="Nombre servicio"
                                                    className="w-full px-3 py-1.5 border rounded-lg text-sm"
                                                    value={service.concepto}
                                                    onChange={e => handleServiceNameChange(idx, e.target.value)}
                                                />
                                            )}
                                        </div>
                                        <div className="relative w-32 shrink-0">
                                            <span className="absolute left-2 top-1.5 text-gray-500 text-xs">$</span>
                                            <CurrencyInput
                                                value={Number(service.monto) || 0}
                                                onChange={(val) => handleServiceChange(idx, val)}
                                                className="w-full pl-5 pr-2 py-1.5 border rounded-lg bg-white text-sm"
                                            />
                                        </div>
                                        {!isPreset && (
                                            <button onClick={() => removeService(idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded shrink-0">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        {isPreset && <div className="w-7 shrink-0" />}
                                    </div>
                                );
                            })}

                            {services.length < 10 && (
                                <button
                                    onClick={() => addService('')}
                                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-1"
                                >
                                    <Plus className="w-3 h-3" />
                                    Agregar otro
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* PUNITORIOS SECTION */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1 flex justify-between items-center">
                                Punitorios
                                {penaltyInfo.days > 0 && (
                                    <span className="text-[10px] text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100">
                                        {penaltyInfo.days} días mora
                                    </span>
                                )}
                            </label>
                            <div className="relative">
                                <span className="absolute left-2 top-1.5 text-gray-500 text-sm">$</span>
                                <CurrencyInput
                                    value={Number(form.montoPunitorios) || 0}
                                    onChange={(val) => setForm({ ...form, montoPunitorios: val })}
                                    className={`w-full pl-6 pr-2 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm ${penaltyInfo.days > 0 ? 'border-red-300 ring-2 ring-red-50' : ''}`}
                                />
                            </div>
                            {penaltyInfo.days > 0 && (
                                <div className="text-[10px] text-gray-500 mt-1 flex justify-between items-center">
                                    <span>Tasa: {(rental.punitoriosTipo === 'porcentaje' ? rental.punitoriosValor : DEFAULT_PENALTY_RATE)}%/día</span>
                                    <button
                                        onClick={() => setForm({ ...form, montoPunitorios: penaltyInfo.suggested })}
                                        className="text-indigo-600 hover:underline flex items-center gap-0.5 font-medium"
                                        title={`Aplicar cálculo sugerido: $${penaltyInfo.suggested}`}
                                    >
                                        <Calculator className="w-3 h-3" />
                                        Calc: ${penaltyInfo.suggested}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* DISCOUNT SECTION - Improved Alignment */}
                        <div>
                            <div className="flex justify-between items-center mb-1 h-5">
                                <label className="text-xs font-semibold text-gray-700">Descuento</label>
                                <div className="flex bg-gray-100 rounded-lg p-0.5 scale-90 origin-right">
                                    <button
                                        onClick={() => setDiscountType('amount')}
                                        className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${discountType === 'amount'
                                            ? 'bg-white text-indigo-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        $ Monto
                                    </button>
                                    <button
                                        onClick={() => setDiscountType('percent')}
                                        className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${discountType === 'percent'
                                            ? 'bg-white text-indigo-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        % Porc
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                {discountType === 'amount' && (
                                    <span className="absolute left-2 top-1.5 text-gray-500 text-sm text-green-600">-$</span>
                                )}
                                <CurrencyInput
                                    value={discountInputValue}
                                    onChange={handleDiscountChange}
                                    className={`w-full ${discountType === 'amount' ? 'pl-7' : 'pl-3'} pr-8 py-1.5 border rounded-lg focus:ring-2 focus:ring-green-500 bg-green-50/50 text-sm`}
                                />
                                {discountType === 'percent' && (
                                    <span className="absolute right-3 top-1.5 text-gray-500 text-sm">%</span>
                                )}
                            </div>
                            {discountType === 'percent' && (
                                <div className="text-[10px] text-green-600 text-right mt-0.5 font-medium min-h-[15px]">
                                    = -${calculateDiscountAmount().toLocaleString('es-AR')}
                                </div>
                            )}
                        </div>

                        {/* PAGO PARCIAL - Fixed NaN */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1 h-5 flex items-center">Pago Parcial</label>
                            <div className="relative">
                                <span className="absolute left-2 top-1.5 text-gray-500 text-sm">$</span>
                                <CurrencyInput
                                    value={Number(form.pagoParcial) || 0}
                                    onChange={(val) => setForm({ ...form, pagoParcial: val })}
                                    className="w-full pl-6 pr-2 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3 rounded-b-xl shrink-0">
                    <div className="flex flex-col min-w-0 max-w-full text-center sm:text-left">
                        <div className="flex items-center gap-4">
                            <div>
                                <div className="text-gray-600 text-xs uppercase tracking-wide">Total</div>
                                <div className="font-bold text-xl text-indigo-600">
                                    ${calculateTotal().toLocaleString('es-AR')}
                                </div>
                            </div>
                            <div className="h-8 w-px bg-gray-300 mx-2"></div>
                            <div>
                                <div className="text-gray-500 text-xs uppercase tracking-wide">Resta Pagar</div>
                                <div className="font-bold text-lg text-gray-800">
                                    ${(calculateTotal() - (Number(form.pagoParcial) || 0)).toLocaleString('es-AR')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 shrink-0 flex-wrap justify-center">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm text-sm"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

