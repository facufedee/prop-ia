export interface IndicesData {
    /** IPC monthly variation (%), year -> month (1-12) -> value. */
    years: Record<number, Record<number, number>>;
    /** ICL daily value, keyed by "YYYY-MM-DD". */
    icl?: Record<string, number>;
    syncedAt?: string;
}

/**
 * Turns INDEC's IPC level series ([["2026-08-01", 12276.766], ...]) into the
 * monthly variation INDEC publishes (rounded to 1 decimal, e.g. 1.7).
 * The first point has no previous month, so it produces no variation.
 */
export function ipcFromLevels(rows: Array<[string, number]>): Record<number, Record<number, number>> {
    const sorted = [...rows]
        .filter(([date, level]) => /^\d{4}-\d{2}/.test(date) && Number.isFinite(level) && level > 0)
        .sort((a, b) => a[0].localeCompare(b[0]));

    const years: Record<number, Record<number, number>> = {};
    for (let i = 1; i < sorted.length; i++) {
        const [date, level] = sorted[i];
        const previous = sorted[i - 1][1];
        const year = parseInt(date.slice(0, 4), 10);
        const month = parseInt(date.slice(5, 7), 10);
        const pct = Math.round((level / previous - 1) * 1000) / 10;
        (years[year] ??= {})[month] = pct;
    }
    return years;
}

/** BCRA v4 returns `detalle: [{ fecha, valor }]`; we keep it as a date -> value map. */
export function iclFromDetalle(detalle: Array<{ fecha: string; valor: number }>): Record<string, number> {
    const icl: Record<string, number> = {};
    for (const { fecha, valor } of detalle) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(fecha) && Number.isFinite(valor)) icl[fecha] = valor;
    }
    return icl;
}

export function toISODate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/**
 * ICL value on a given date. If that day has no value (not yet published, or a
 * gap), falls back to the most recent earlier day within `maxLookbackDays`.
 */
export function iclAt(icl: Record<string, number> | undefined, date: Date, maxLookbackDays = 10): number | null {
    if (!icl) return null;
    const cursor = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    for (let i = 0; i <= maxLookbackDays; i++) {
        const value = icl[toISODate(cursor)];
        if (value !== undefined) return value;
        cursor.setDate(cursor.getDate() - 1);
    }
    return null;
}
