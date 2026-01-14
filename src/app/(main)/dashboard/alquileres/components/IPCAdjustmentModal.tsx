import { useState, useEffect } from "react";
import { X, TrendingUp, AlertCircle, ArrowRight, Edit2, RotateCcw, Calendar, History } from "lucide-react";
import { MoneyInput } from "@/ui/components/forms";
import { Pago } from "@/domain/models/Alquiler";

interface IPCAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentRent: number;
    previousRent?: number;
    defaultPercentage?: number;
    paymentHistory?: Pago[];
    onConfirm: (newRent: number) => void;
}

export default function IPCAdjustmentModal({
    isOpen,
    onClose,
    currentRent,
    previousRent,
    defaultPercentage,
    paymentHistory = [],
    onConfirm
}: IPCAdjustmentModalProps) {
    const [percentage, setPercentage] = useState<string>(defaultPercentage ? defaultPercentage.toString() : "");
    const [baseRent, setBaseRent] = useState(currentRent);
    const [isEditingBase, setIsEditingBase] = useState(false);

    useEffect(() => {
        setBaseRent(currentRent);
    }, [currentRent]);

    if (!isOpen) return null;

    const pctValue = parseFloat(percentage) || 0;
    const increaseAmount = Math.floor(baseRent * (pctValue / 100));
    const newRent = baseRent + increaseAmount;

    // Derive Adjustment History
    const adjustments = (() => {
        const sorted = [...paymentHistory].sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime());
        const history: { date: Date; oldRent: number; newRent: number; pct: number }[] = [];

        let lastRent = sorted[0]?.montoAlquiler || 0;

        sorted.forEach((p, i) => {
            const current = p.montoAlquiler || 0;
            if (current > lastRent && lastRent > 0) {
                const diff = current - lastRent;
                const pct = ((diff / lastRent) * 100);
                history.push({
                    date: new Date(p.fechaVencimiento),
                    oldRent: lastRent,
                    newRent: current,
                    pct
                });
            }
            if (current > 0) lastRent = current;
        });

        return history.reverse(); // Newest first
    })();

    const handleRestorePrevious = () => {
        if (previousRent) {
            setBaseRent(previousRent);
            setIsEditingBase(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <TrendingUp className="text-indigo-600 w-5 h-5" />
                        Ajuste por IPC / Aumento
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Adjustment History Carousel */}
                    {adjustments.length > 0 && (
                        <div className="mb-2">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <History size={12} />
                                Historial Detectado
                            </h4>
                            <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                                {adjustments.map((adj, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setBaseRent(adj.oldRent);
                                            setPercentage(adj.pct.toFixed(1).replace('.0', ''));
                                            setIsEditingBase(false);
                                        }}
                                        className="snap-center shrink-0 w-32 bg-white border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-lg p-2 text-left transition-colors group"
                                    >
                                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                            <Calendar size={10} />
                                            {adj.date.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })}
                                        </div>
                                        <div className="font-bold text-indigo-600 text-lg">
                                            {adj.pct.toFixed(1).replace('.0', '')}%
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-1 truncate">
                                            ${adj.oldRent.toLocaleString()} → ${adj.newRent.toLocaleString()}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">
                            Esto actualizará el <strong>precio actual del contrato</strong> y recalculará todos los <strong>pagos futuros pendientes</strong> a partir de este mes.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Porcentaje de Aumento
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                placeholder="Ej: 15"
                                value={percentage}
                                onChange={(e) => setPercentage(e.target.value)}
                                className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg font-medium text-gray-900"
                                autoFocus
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 relative group flex flex-col justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Actual</p>

                                {isEditingBase ? (
                                    <MoneyInput
                                        value={baseRent}
                                        onChange={(val) => setBaseRent(Number(val))}
                                        className="text-lg font-bold text-gray-700 w-full bg-white border border-gray-300 rounded px-2 py-1"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <p className="text-lg font-bold text-gray-500 line-through decoration-red-400">
                                            ${baseRent.toLocaleString('es-AR')}
                                        </p>
                                        <button
                                            onClick={() => setIsEditingBase(true)}
                                            className="p-1 hover:bg-gray-200 rounded-full text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Corregir valor actual"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Restore / Modify Previous Suggestion - Only show if NO adjustments found in carousel to avoid clutter */}
                            {previousRent && previousRent !== baseRent && !isEditingBase && adjustments.length === 0 && (() => {
                                // Calculate detected percentage
                                const diff = baseRent - previousRent;
                                const detectedPct = ((diff / previousRent) * 100).toFixed(1).replace('.0', '');

                                return (
                                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-100 rounded text-xs">
                                        <p className="text-yellow-800 mb-1">
                                            Aumento reciente detectado: <span className="font-bold">{detectedPct}%</span>
                                        </p>
                                        <button
                                            onClick={() => {
                                                setBaseRent(previousRent);
                                                setPercentage(detectedPct);
                                                setIsEditingBase(false);
                                            }}
                                            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                                            title="Corregir este porcentaje"
                                        >
                                            <Edit2 size={10} />
                                            Corregir porcentaje
                                        </button>
                                    </div>
                                );
                            })()}

                            {isEditingBase && (
                                <button
                                    onClick={() => setIsEditingBase(false)}
                                    className="absolute top-2 right-2 text-xs text-indigo-600 font-medium hover:underline"
                                >
                                    Listo
                                </button>
                            )}
                        </div>

                        <div className="flex items-center justify-center text-gray-400">
                            <ArrowRight className="w-6 h-6" />
                        </div>

                        <div className="p-3 bg-green-50 rounded-lg border border-green-100 col-span-2">
                            <p className="text-xs text-green-700 uppercase tracking-wide font-medium">Nuevo Valor</p>
                            <p className="text-2xl font-bold text-green-700 mt-1">
                                ${newRent.toLocaleString('es-AR')}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                                (+${increaseAmount.toLocaleString('es-AR')})
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl sticky bottom-0 bg-white z-10">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onConfirm(newRent)}
                        className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors font-medium shadow-sm"
                    >
                        {pctValue > 0 ? "Aplicar Aumento" : "Actualizar Valor"}
                    </button>
                </div>
            </div>
        </div>
    );
}
