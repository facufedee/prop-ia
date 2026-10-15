// Pure aggregation helpers for the dashboard home rankings.
import { dayKey } from '@/lib/propertyViews';

interface LeadLike {
    propertyId?: string | null;
    consultas?: { propertyId?: string | null }[] | null;
}

export interface RankedProperty<P> {
    property: P;
    count: number;
}

/**
 * Top `n` of the given properties by number of leads that reference them (via `propertyId`
 * or any of the lead's `consultas`). A lead counts once per property; leads pointing at
 * properties outside `properties` are ignored. Ties keep the order of `properties`.
 */
export function topByLeads<P extends { id: string }>(
    leads: LeadLike[],
    properties: P[],
    n: number
): RankedProperty<P>[] {
    const counts = new Map<string, number>();
    for (const lead of leads) {
        const ids = new Set<string>();
        if (lead.propertyId) ids.add(lead.propertyId);
        for (const consulta of lead.consultas ?? []) {
            if (consulta?.propertyId) ids.add(consulta.propertyId);
        }
        ids.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
    }

    return properties
        .map((property) => ({ property, count: counts.get(property.id) ?? 0 }))
        .filter((entry) => entry.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, n);
}

/** Sum of `viewsByDay` over the last `days` days, today included. */
export function viewsLastDays(
    viewsByDay: Record<string, unknown> | null | undefined,
    today: Date,
    days: number
): number {
    if (!viewsByDay) return 0;
    let total = 0;
    for (let i = 0; i < days; i++) {
        const date = new Date(today.getTime());
        date.setUTCDate(date.getUTCDate() - i);
        const value = viewsByDay[dayKey(date)];
        if (typeof value === 'number' && Number.isFinite(value)) total += value;
    }
    return total;
}
