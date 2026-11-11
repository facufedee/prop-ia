"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { X, TrendingUp, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Alquiler } from "@/domain/models/Alquiler";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { BulkIncreaseRow, buildIncreaseUpdate, increasedRent, planBulkIncrease } from "@/lib/financial/bulkIncrease";
import { parsePercentage } from "@/lib/financial/applyRentIncrease";
import { IndicesData } from "@/lib/financial/indices";

interface BulkIncreaseModalProps {
    contracts: Alquiler[];
    onClose: () => void;
    /** Called after at least one increase was saved, to reload the contracts. */
    onApplied: () => void;
}

interface RowState {
    selected: boolean;
    pct: string;
    status: "idle" | "saving" | "done" | "error";
}

const formatPct = (pct: number) => pct.toLocaleString("es-AR", { maximumFractionDigits: 2 });
const formatMoney = (amount: number) => `$${amount.toLocaleString("es-AR")}`;
const monthLabel = (mes: string) => format(parseISO(`${mes}-01`), "MMMM yyyy", { locale: es });

export default function BulkIncreaseModal({ contracts, onClose, onApplied }: BulkIncreaseModalProps) {
    const [rows, setRows] = useState<BulkIncreaseRow[] | null>(null);
    const [state, setState] = useState<Record<string, RowState>>({});
    const [isApplying, setIsApplying] = useState(false);
    const [savedAny, setSavedAny] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetch("/api/config/indices")
            .then(res => (res.ok ? res.json() : { years: {} }))
            .catch(() => ({ years: {} }))
            .then((indices: IndicesData) => {
                if (cancelled) return;
                const planned = planBulkIncrease(contracts, indices);
                setRows(planned);
                setState(Object.fromEntries(planned.map(row => [row.contract.id, {
                    // Rows with a complete published index start selected; the rest wait for review.
                    selected: !!row.suggestion && row.suggestion.missingMonths.length === 0,
                    pct: row.suggestion ? formatPct(row.suggestion.pct) : "",
                    status: "idle" as const,
                }])));
            });
        return () => {
            cancelled = true;
        };
    }, [contracts]);

    const updateRow = (id: string, patch: Partial<RowState>) =>
        setState(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

    const toApply = (rows ?? []).filter(row => {
        const s = state[row.contract.id];
        return s?.selected && s.status !== "done" && parsePercentage(s.pct) > 0;
    });

    const close = () => {
        if (isApplying) return;
        if (savedAny) onApplied();
        onClose();
    };

    const apply = async () => {
        setIsApplying(true);
        let ok = 0;
        let failed = 0;
        // One by one: a failing contract must not stop the others.
        for (const row of toApply) {
            const id = row.contract.id;
            updateRow(id, { status: "saving" });
            try {
                const newRent = increasedRent(row.currentRent, parsePercentage(state[id].pct));
                await alquileresService.updateAlquiler(id, buildIncreaseUpdate(row.contract, newRent, row.fromMonth));
                updateRow(id, { status: "done" });
                ok++;
            } catch (error) {
                console.error(`Error applying increase to ${id}:`, error);
                updateRow(id, { status: "error" });
                failed++;
            }
        }
        setIsApplying(false);
        if (ok > 0) setSavedAny(true);

        if (failed === 0) {
            toast.success(ok === 1 ? "Aumento aplicado" : `${ok} aumentos aplicados`);
            onApplied();
            onClose();
        } else {
            toast.error(`${failed} ${failed === 1 ? "aumento no se pudo aplicar" : "aumentos no se pudieron aplicar"}. Revisalos e intentá de nuevo.`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--color-paper-2)] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-[var(--color-rule)]">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-[var(--color-ink)]">
                        <TrendingUp strokeWidth={1.5} className="text-[var(--color-accent)] w-5 h-5" />
                        Aumentos pendientes
                    </h3>
                    <button onClick={close} className="p-1 hover:bg-[var(--color-paper-3)] rounded-lg transition-colors" aria-label="Cerrar">
                        <X strokeWidth={1.5} size={20} className="text-[var(--color-muted)]" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto space-y-3">
                    {rows === null && (
                        <p className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                            <Loader2 strokeWidth={1.5} className="w-4 h-4 animate-spin" /> Buscando los índices publicados...
                        </p>
                    )}

                    {rows?.length === 0 && (
                        <p className="text-sm text-[var(--color-muted)]">No hay contratos con aumentos pendientes. ¡Todo al día! 👌</p>
                    )}

                    {rows && rows.length > 0 && (
                        <p className="text-sm text-[var(--color-muted)]">
                            Revisá el porcentaje de cada contrato. Se actualizan los pagos sin cobrar desde el mes del aumento; los meses anteriores y los ya cobrados no cambian.
                        </p>
                    )}

                    {rows?.map(row => {
                        const id = row.contract.id;
                        const s = state[id];
                        if (!s) return null;
                        const pct = parsePercentage(s.pct);
                        const newRent = increasedRent(row.currentRent, pct);
                        const locked = s.status === "done" || s.status === "saving" || isApplying;

                        return (
                            <div key={id} className={`rounded-lg border p-3 ${s.status === "error" ? "border-[var(--color-danger)]/50" : "border-[var(--color-rule)]"} bg-[var(--color-paper)]`}>
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={s.selected}
                                        disabled={locked}
                                        onChange={(e) => updateRow(id, { selected: e.target.checked })}
                                        className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
                                        aria-label={`Aplicar aumento a ${row.contract.direccion}`}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="font-medium text-[var(--color-ink)] truncate">{row.contract.direccion}</p>
                                                <p className="text-xs text-[var(--color-muted)]">
                                                    {row.contract.nombreInquilino} · rige desde <span className="capitalize">{monthLabel(row.fromMonth)}</span>
                                                </p>
                                            </div>
                                            {s.status === "done" && <CheckCircle2 strokeWidth={1.5} className="w-5 h-5 shrink-0 text-[var(--color-positive)]" aria-label="Aplicado" />}
                                            {s.status === "saving" && <Loader2 strokeWidth={1.5} className="w-5 h-5 shrink-0 animate-spin text-[var(--color-muted)]" aria-label="Guardando" />}
                                            {s.status === "error" && <AlertCircle strokeWidth={1.5} className="w-5 h-5 shrink-0 text-[var(--color-danger)]" aria-label="No se pudo aplicar" />}
                                        </div>

                                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                                            <div className="relative w-24">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={s.pct}
                                                    disabled={locked}
                                                    onChange={(e) => updateRow(id, { pct: e.target.value, selected: true })}
                                                    placeholder="0"
                                                    className="w-full pl-2 pr-6 py-1.5 border border-[var(--color-rule)] rounded-md bg-[var(--color-paper-2)] text-[var(--color-ink)] focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)]"
                                                    aria-label={`Porcentaje para ${row.contract.direccion}`}
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">%</span>
                                            </div>
                                            <span className="text-[var(--color-muted)]">
                                                {formatMoney(row.currentRent)} → <strong className="text-[var(--color-positive)]">{formatMoney(newRent)}</strong>
                                            </span>
                                        </div>

                                        <p className="mt-1.5 text-xs text-[var(--color-muted)]">
                                            {row.suggestion
                                                ? <>Sugerido: {row.suggestion.label} ({formatPct(row.suggestion.pct)}%)</>
                                                : <>Todavía no hay índice publicado para este período: cargá el porcentaje a mano o esperá a que INDEC lo publique.</>}
                                        </p>
                                        {row.suggestion && row.suggestion.missingMonths.length > 0 && (
                                            <p className="mt-1 text-xs text-[var(--color-warning)]">
                                                Falta publicar {row.suggestion.missingMonths.map(monthLabel).join(" y ")}: el sugerido no lo incluye.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-[var(--color-rule)] flex justify-end gap-3">
                    <button onClick={close} disabled={isApplying} className="px-4 py-2 text-[var(--color-ink-2)] hover:bg-[var(--color-paper-4)] rounded-lg transition-colors font-medium disabled:opacity-50">
                        {savedAny ? "Cerrar" : "Cancelar"}
                    </button>
                    <button
                        onClick={apply}
                        disabled={isApplying || toApply.length === 0}
                        className="px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-ink-2)] rounded-lg transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isApplying
                            ? "Aplicando..."
                            : toApply.length === 0
                                ? "Aplicar aumentos"
                                : `Aplicar ${toApply.length} ${toApply.length === 1 ? "aumento" : "aumentos"}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
