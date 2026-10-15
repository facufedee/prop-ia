import { describe, it, expect } from 'vitest';
import { topByLeads, viewsLastDays } from '@/lib/propertyRankings';

const properties = [
    { id: 'a', title: 'A' },
    { id: 'b', title: 'B' },
    { id: 'c', title: 'C' },
];

describe('topByLeads', () => {
    it('ranks the user properties by number of leads, ignoring leads without or with foreign propertyId', () => {
        const leads = [
            { propertyId: 'b' },
            { propertyId: 'b' },
            { propertyId: 'a' },
            { propertyId: undefined },
            { propertyId: 'zzz' },
            {},
        ];
        const result = topByLeads(leads, properties, 5);
        expect(result.map((r) => [r.property.id, r.count])).toEqual([
            ['b', 2],
            ['a', 1],
        ]);
    });

    it('counts a lead once per property even when its consultas repeat it, and includes consultas properties', () => {
        const leads = [
            { propertyId: 'a', consultas: [{ propertyId: 'a' }, { propertyId: 'c' }] },
            { consultas: [{ propertyId: 'c' }] },
        ];
        const result = topByLeads(leads, properties, 5);
        expect(result.map((r) => [r.property.id, r.count])).toEqual([
            ['c', 2],
            ['a', 1],
        ]);
    });

    it('limits the result to n', () => {
        const leads = [{ propertyId: 'a' }, { propertyId: 'b' }, { propertyId: 'c' }];
        expect(topByLeads(leads, properties, 2)).toHaveLength(2);
    });
});

describe('viewsLastDays', () => {
    const today = new Date('2026-10-14T10:00:00Z');

    it('sums the views of the last N days including today', () => {
        const map = { '2026-10-14': 2, '2026-10-10': 3, '2026-10-08': 4, '2026-10-07': 100 };
        expect(viewsLastDays(map, today, 7)).toBe(9);
    });

    it('returns 0 for missing maps and ignores non-numeric values', () => {
        expect(viewsLastDays(undefined, today, 7)).toBe(0);
        expect(viewsLastDays({ '2026-10-14': 'x' as unknown as number }, today, 7)).toBe(0);
    });
});
