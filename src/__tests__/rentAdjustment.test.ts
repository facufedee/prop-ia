import { describe, it, expect } from 'vitest';
import { iclAt, iclFromDetalle, ipcFromLevels } from '@/lib/financial/indices';
import { calculateCurrentRent } from '@/lib/financial/rentAdjustment';

const rental = (overrides: Record<string, unknown>) =>
    ({ montoMensual: 100000, fechaInicio: new Date(2025, 9, 8), ajusteFrecuencia: 12, ...overrides } as any);

describe('ipcFromLevels', () => {
    it('reproduces the monthly IPC INDEC published for Jul and Aug 2026', () => {
        const years = ipcFromLevels([
            ['2026-06-01', 11826.4103],
            ['2026-07-01', 12076.3937],
            ['2026-08-01', 12276.766],
        ]);
        expect(years[2026][7]).toBe(2.1);
        expect(years[2026][8]).toBe(1.7);
        expect(years[2026][6]).toBeUndefined();
    });

    it('ignores invalid rows and unsorted input', () => {
        const years = ipcFromLevels([
            ['2026-02-01', 110],
            ['basura', 5],
            ['2026-01-01', 100],
            ['2026-03-01', NaN],
        ]);
        expect(years).toEqual({ 2026: { 2: 10 } });
    });
});

describe('iclAt', () => {
    const icl = iclFromDetalle([
        { fecha: '2026-10-07', valor: 36.68 },
        { fecha: '2026-10-08', valor: 36.7 },
        { fecha: 'mal', valor: 1 },
    ]);

    it('returns the value of the exact day', () => {
        expect(iclAt(icl, new Date(2026, 9, 8))).toBe(36.7);
    });

    it('falls back to the latest earlier day when the date is not published yet', () => {
        expect(iclAt(icl, new Date(2026, 9, 12))).toBe(36.7);
    });

    it('returns null when there is nothing nearby', () => {
        expect(iclAt(icl, new Date(2026, 0, 1))).toBeNull();
        expect(iclAt(undefined, new Date())).toBeNull();
    });
});

describe('calculateCurrentRent - ICL', () => {
    const icl = { '2025-10-08': 28, '2026-10-08': 36.7 };

    it('applies the ICL ratio between the last adjustment date and the start date', () => {
        const result = calculateCurrentRent(rental({ ajusteTipo: 'ICL' }), { years: {}, icl }, new Date(2026, 9, 9));
        expect(result.currentRent).toBe(Math.ceil((100000 * 36.7) / 28));
        expect(result.accumulatedPercentage).toBeCloseTo((36.7 / 28 - 1) * 100, 6);
        expect(result.nextAdjustmentDate).toEqual(new Date(2027, 9, 8));
    });

    it('keeps the initial rent before the first adjustment', () => {
        const result = calculateCurrentRent(rental({ ajusteTipo: 'ICL' }), { years: {}, icl }, new Date(2026, 2, 1));
        expect(result.currentRent).toBe(100000);
        expect(result.nextAdjustmentDate).toEqual(new Date(2026, 9, 8));
    });

    it('keeps the current rent when ICL data is missing', () => {
        const result = calculateCurrentRent(rental({ ajusteTipo: 'ICL' }), { years: {}, icl: {} }, new Date(2026, 9, 9));
        expect(result.currentRent).toBe(100000);
    });
});

describe('calculateCurrentRent - IPC', () => {
    it('compounds the monthly IPC of the elapsed period', () => {
        const years = { 2026: { 1: 2, 2: 2, 3: 2 } };
        const result = calculateCurrentRent(
            rental({ ajusteTipo: 'IPC', fechaInicio: new Date(2026, 0, 1), ajusteFrecuencia: 3 }),
            { years },
            new Date(2026, 3, 1)
        );
        expect(result.currentRent).toBe(Math.ceil(100000 * 1.02 ** 3));
    });
});
