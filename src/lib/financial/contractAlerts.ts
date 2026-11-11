import { addMonths, differenceInCalendarMonths, format, startOfDay, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Alquiler } from "@/domain/models/Alquiler";
import { IndicesData, iclAt } from "@/lib/financial/indices";

type ContractInput = Pick<
    Alquiler,
    "fechaInicio" | "fechaFin" | "diaVencimiento" | "montoMensual" | "ajusteTipo" | "ajusteValor" | "ajusteFrecuencia" | "historialPagos"
>;

export interface ContractAlerts {
    /** Unpaid months ("yyyy-MM") whose due date already passed. */
    overdueMonths: string[];
    /** `due`: an adjustment month arrived and the rent did not change. `upcoming`: next month adjusts. */
    adjustment: { status: "due" | "upcoming"; month: string } | null;
}

export interface IncreaseSuggestion {
    pct: number;
    label: string;
    /** Months of the IPC window INDEC has not published yet. */
    missingMonths: string[];
}

const monthKey = (date: Date) => format(date, "yyyy-MM");
const monthDate = (mes: string) => new Date(parseInt(mes.slice(0, 4), 10), parseInt(mes.slice(5, 7), 10) - 1, 1);
const toDate = (value: Date | string) => (typeof value === "string" ? new Date(value.includes("T") ? value : `${value}T12:00:00`) : new Date(value));

/** Months between adjustments; `null` when the contract does not adjust on a schedule. */
const adjustmentFrequency = (contract: ContractInput): number | null => {
    if (contract.ajusteTipo === "manual") return null;
    if (contract.ajusteFrecuencia && contract.ajusteFrecuencia > 0) return contract.ajusteFrecuencia;
    if (contract.ajusteTipo === "IPC") return 3;
    if (contract.ajusteTipo === "ICL") return 12;
    return null;
};

export function getContractAlerts(contract: ContractInput, today: Date = new Date()): ContractAlerts {
    const start = startOfMonth(toDate(contract.fechaInicio));
    const end = startOfMonth(toDate(contract.fechaFin));
    const currentMonth = startOfMonth(today);
    const dueDay = contract.diaVencimiento && contract.diaVencimiento > 0 && contract.diaVencimiento <= 31 ? contract.diaVencimiento : 10;

    const stored = new Map((contract.historialPagos || []).map(p => [p.mes, p]));
    const rentOf = (mes: string) => stored.get(mes)?.montoAlquiler || contract.montoMensual;

    const overdueMonths: string[] = [];
    for (let month = start; month <= currentMonth && month <= end; month = addMonths(month, 1)) {
        const mes = monthKey(month);
        if (stored.get(mes)?.estado === "pagado") continue;
        const dueDate = new Date(month.getFullYear(), month.getMonth(), dueDay);
        if (dueDate < startOfDay(today)) overdueMonths.push(mes);
    }

    const frequency = adjustmentFrequency(contract);
    if (!frequency) return { overdueMonths, adjustment: null };

    // Adjustments happen every `frequency` months counted from the start month.
    const elapsed = differenceInCalendarMonths(currentMonth, start);
    const lastIndex = Math.floor(elapsed / frequency);
    const lastAdjustment = addMonths(start, lastIndex * frequency);
    if (lastIndex >= 1 && lastAdjustment <= end) {
        const mes = monthKey(lastAdjustment);
        if (rentOf(mes) <= rentOf(monthKey(addMonths(lastAdjustment, -1)))) {
            return { overdueMonths, adjustment: { status: "due", month: mes } };
        }
    }

    const nextAdjustment = addMonths(start, (lastIndex + 1) * frequency);
    const isNextMonth = differenceInCalendarMonths(nextAdjustment, currentMonth) <= 1;
    return {
        overdueMonths,
        adjustment: isNextMonth && nextAdjustment <= end ? { status: "upcoming", month: monthKey(nextAdjustment) } : null,
    };
}

const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Suggested increase for the adjustment that starts in `adjustmentMonth`.
 * IPC: compounds the monthly IPC of the `frequency` months before it.
 * ICL: ratio between the ICL on this adjustment date and on the previous one.
 */
export function suggestIncrease(contract: ContractInput, indices: IndicesData, adjustmentMonth: string): IncreaseSuggestion | null {
    if (contract.ajusteTipo === "porcentaje") {
        return contract.ajusteValor > 0 ? { pct: contract.ajusteValor, label: "Porcentaje del contrato", missingMonths: [] } : null;
    }

    const frequency = adjustmentFrequency(contract);
    if (!frequency) return null;
    const adjustment = monthDate(adjustmentMonth);

    if (contract.ajusteTipo === "ICL") {
        const startDate = toDate(contract.fechaInicio);
        const index = Math.round(differenceInCalendarMonths(adjustment, startOfMonth(startDate)) / frequency);
        if (index < 1) return null;
        const current = iclAt(indices.icl,addMonths(startDate, index * frequency));
        const previous = iclAt(indices.icl, addMonths(startDate, (index - 1) * frequency));
        if (!current || !previous) return null;
        return { pct: round1((current / previous - 1) * 100), label: "ICL BCRA", missingMonths: [] };
    }

    if (contract.ajusteTipo !== "IPC") return null;

    const window = Array.from({ length: frequency }, (_, i) => addMonths(adjustment, i - frequency));
    let factor = 1;
    let published = 0;
    const missingMonths: string[] = [];
    for (const month of window) {
        const rate = indices.years[month.getFullYear()]?.[month.getMonth() + 1];
        if (rate === undefined) {
            missingMonths.push(monthKey(month));
        } else {
            factor *= 1 + rate / 100;
            published++;
        }
    }
    if (published === 0) return null;

    const first = window[0];
    const last = window[window.length - 1];
    const range = first.getFullYear() === last.getFullYear()
        ? `${format(first, "MMMM", { locale: es })} – ${format(last, "MMMM yyyy", { locale: es })}`
        : `${format(first, "MMMM yyyy", { locale: es })} – ${format(last, "MMMM yyyy", { locale: es })}`;

    return { pct: round1((factor - 1) * 100), label: `IPC ${range}`, missingMonths };
}
