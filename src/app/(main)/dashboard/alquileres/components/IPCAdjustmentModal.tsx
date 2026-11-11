import { useState, useEffect } from "react";
import { X, TrendingUp, AlertCircle, ArrowRight, Edit2, RotateCcw, Calendar, History } from "lucide-react";
import { MoneyInput } from "@/ui/components/forms";
import { Pago } from "@/domain/models/Alquiler";
import { parsePercentage } from "@/lib/financial/applyRentIncrease";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface IPCAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentRent: number;
    previousRent?: number;
    defaultPercentage?: number;
    paymentHistory?: Pago[];
    /** Unpaid months ("yyyy-MM") the increase can start from, ascending. */
    unpaidMonths: string[];
    defaultFromMonth?: string;
    /** Resolves true when the increase was saved. */
    onConfirm: (newRent: number, fromMonth: string) => Promise<boolean>;
}

export default function IPCAdjustmentModal({
    isOpen,
    onClose,
    currentRent,
    previousRent,
    defaultPercentage,
    paymentHistory = [],
    unpaidMonths,
    defaultFromMonth,
    onConfirm
}: IPCAdjustmentModalProps) {
    const [percentage, setPercentage] = useState<string>(defaultPercentage ? defaultPercentage.toString() : "");
    const [baseRent, setBaseRent] = useState(currentRent);
    const [isEditingBase, setIsEditingBase] = useState(false);
    const [fromMonth, setFromMonth] = useState(defaultFromMonth || unpaidMonths[0] || "");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setBaseRent(currentRent);
    }, [currentRent]);

    if (!isOpen) return null;

    const pctValue = parsePercentage(percentage);
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

    const canSave = !isSaving && !!fromMonth && newRent > 0 && newRent !== currentRent;

    const handleConfirm = async () => {
        if (!canSave) return;
        setIsSaving(true);
        const saved = await onConfirm(newRent, fromMonth);
        setIsSaving(false);
        if (saved) onClose();
    };

    const monthLabel = (mes: string) => format(parseISO(`${mes}-01`), "MMMM yyyy", { locale: es });

    const handleRestorePrevious = () => {
        if (previousRent) {
            setBaseRent(previousRent);
            setIsEditingBase(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--color-paper-2)] rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-[var(--color-paper-2)] z-10">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <TrendingUp strokeWidth={1.5} className="text-[var(--color-accent)] w-5 h-5" />
                        Ajuste por IPC / Aumento
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-[var(--color-paper-3)] rounded-lg transition-colors">
                        <X strokeWidth={1.5} size={20} className="text-[var(--color-muted)]" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Adjustment History Carousel */}
                    {adjustments.length > 0 && (
                        <div className="mb-2">
                            <h4 className="text-xs font-semibold text-[var(--color-neutral)] uppercase tracking-wider mb-2 flex items-center gap-1">
                                <History strokeWidth={1.5} size={12} />
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
                                        className="snap-center shrink-0 w-32 bg-[var(--color-paper-2)] border border-[var(--color-rule)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] rounded-lg p-2 text-left transition-colors group"
                                    >
                                        <div className="text-xs text-[var(--color-muted)] mb-1 flex items-center gap-1">
                                            <Calendar strokeWidth={1.5} size={10} />
                                            {adj.date.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })}
                                        </div>
                                        <div className="font-bold text-[var(--color-accent)] text-lg">
                                            {adj.pct.toFixed(1).replace('.0', '')}%
                                        </div>
                                        <div className="text-[10px] text-[var(--color-neutral)] mt-1 truncate">
                                            ${adj.oldRent.toLocaleString()} → ${adj.newRent.toLocaleString()}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-[var(--color-accent-soft)] p-4 rounded-lg border border-[var(--color-accent)]/30 flex items-start gap-3">
                        <AlertCircle strokeWidth={1.5} className="w-5 h-5 text-[var(--color-accent)] shrink-0 mt-0.5" />
                        <p className="text-sm text-[var(--color-accent)]">
                            Esto actualizará el <strong>precio actual del contrato</strong> y recalculará los <strong>pagos sin cobrar</strong> a partir del mes elegido. Los meses anteriores y los ya cobrados no cambian.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                            Porcentaje de Aumento
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                inputMode="decimal"
                                placeholder="Ej: 15,5"
                                value={percentage}
                                onChange={(e) => setPercentage(e.target.value)}
                                className="w-full pl-4 pr-12 py-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-lg font-medium text-[var(--color-ink)]"
                                autoFocus
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] font-bold">%</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                            Rige desde
                        </label>
                        {unpaidMonths.length > 0 ? (
                            <select
                                value={fromMonth}
                                onChange={(e) => setFromMonth(e.target.value)}
                                className="w-full px-4 py-3 border border-[var(--color-rule)] rounded-lg bg-[var(--color-paper-2)] text-[var(--color-ink)] capitalize focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)]"
                            >
                                {unpaidMonths.map(mes => (
                                    <option key={mes} value={mes}>{monthLabel(mes)}</option>
                                ))}
                            </select>
                        ) : (
                            <p className="text-sm text-[var(--color-muted)]">No hay meses sin cobrar para aplicar el aumento.</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="p-3 bg-[var(--color-paper)] rounded-lg border border-[var(--color-rule-2)] relative group flex flex-col justify-between">
                            <div>
                                <p className="text-xs text-[var(--color-muted)] uppercase tracking-wide font-medium mb-1">Actual</p>

                                {isEditingBase ? (
                                    <MoneyInput
                                        value={baseRent}
                                        onChange={(val) => setBaseRent(Number(val))}
                                        className="text-lg font-bold text-[var(--color-ink-2)] w-full bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded px-2 py-1"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <p className="text-lg font-bold text-[var(--color-muted)] line-through decoration-[var(--color-danger)]">
                                            ${baseRent.toLocaleString('es-AR')}
                                        </p>
                                        <button
                                            onClick={() => setIsEditingBase(true)}
                                            className="p-1 hover:bg-[var(--color-paper-4)] rounded-full text-[var(--color-accent)] md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                            title="Corregir valor actual"
                                        >
                                            <Edit2 strokeWidth={1.5} size={12} />
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
                                    <div className="mt-3 p-2 bg-[var(--color-warning-soft)] border border-[var(--color-warning)]/30 rounded text-xs">
                                        <p className="text-[var(--color-warning)] mb-1">
                                            Aumento reciente detectado: <span className="font-bold">{detectedPct}%</span>
                                        </p>
                                        <button
                                            onClick={() => {
                                                setBaseRent(previousRent);
                                                setPercentage(detectedPct);
                                                setIsEditingBase(false);
                                            }}
                                            className="flex items-center gap-1 text-[var(--color-accent)] hover:text-[var(--color-accent-2)] font-medium hover:underline"
                                            title="Corregir este porcentaje"
                                        >
                                            <Edit2 strokeWidth={1.5} size={10} />
                                            Corregir porcentaje
                                        </button>
                                    </div>
                                );
                            })()}

                            {isEditingBase && (
                                <button
                                    onClick={() => setIsEditingBase(false)}
                                    className="absolute top-2 right-2 text-xs text-[var(--color-accent)] font-medium hover:underline"
                                >
                                    Listo
                                </button>
                            )}
                        </div>

                        <div className="flex items-center justify-center text-[var(--color-neutral)]">
                            <ArrowRight strokeWidth={1.5} className="w-6 h-6" />
                        </div>

                        <div className="p-3 bg-[var(--color-positive-soft)] rounded-lg border border-[var(--color-positive)]/30 col-span-2">
                            <p className="text-xs text-[var(--color-positive)] uppercase tracking-wide font-medium">Nuevo Valor</p>
                            <p className="text-2xl font-bold text-[var(--color-positive)] mt-1">
                                ${newRent.toLocaleString('es-AR')}
                            </p>
                            <p className="text-xs text-[var(--color-positive)] mt-1">
                                (+${increaseAmount.toLocaleString('es-AR')})
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t bg-[var(--color-paper)] flex justify-end gap-3 rounded-b-xl sticky bottom-0 bg-[var(--color-paper-2)] z-10">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 py-2 text-[var(--color-ink-2)] hover:bg-[var(--color-paper-4)] rounded-lg transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!canSave}
                        className="px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-ink-2)] rounded-lg transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? "Guardando..." : pctValue > 0 ? "Aplicar Aumento" : "Actualizar Valor"}
                    </button>
                </div>
            </div>
        </div>
    );
}
