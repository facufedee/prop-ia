import { describe, it, expect } from 'vitest';
import { planBulkIncrease, buildIncreaseUpdate, increasedRent } from '@/lib/financial/bulkIncrease';

const TODAY = new Date(2026, 10, 12); // 12 Nov 2026
const INDICES = { years: { 2026: { 8: 2, 9: 3, 10: 1 } } };

const contract = (overrides: Record<string, unknown> = {}) => ({
    id: 'a',
    estado: 'activo',
    direccion: 'Coronel Paulino Rojas 207',
    fechaInicio: new Date(2026, 7, 1), // Aug 2026: IPC every 3 months -> adjusts in Nov
    fechaFin: new Date(2028, 6, 31),
    diaVencimiento: 10,
    montoMensual: 100000,
    ajusteTipo: 'IPC',
    ajusteValor: 0,
    ajusteFrecuencia: 3,
    historialPagos: [],
    ...overrides,
} as any);

describe('increasedRent', () => {
    it('rounds the increase down like the single-contract modal', () => {
        expect(increasedRent(100000, 6.1)).toBe(106100);
        expect(increasedRent(333333, 7.35)).toBe(333333 + Math.floor(333333 * 0.0735));
    });
});

describe('planBulkIncrease', () => {
    it('lists active contracts with a due increase and their suggested rent', () => {
        const rows = planBulkIncrease([contract()], INDICES, TODAY);

        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({
            contract: { id: 'a' },
            fromMonth: '2026-11',
            currentRent: 100000,
            suggestion: { pct: 6.1, label: 'IPC agosto – octubre 2026' },
        });
    });

    it('skips inactive contracts, applied increases and upcoming ones', () => {
        const rows = planBulkIncrease([
            contract({ id: 'finished', estado: 'finalizado' }),
            contract({ id: 'applied', montoMensual: 120000, historialPagos: [{ id: 'x', mes: '2026-10', monto: 100000, montoAlquiler: 100000, estado: 'pagado', fechaVencimiento: new Date() }] }),
            contract({ id: 'upcoming', fechaInicio: new Date(2026, 8, 1) }),
        ], INDICES, TODAY);

        expect(rows).toEqual([]);
    });

    it('keeps a row without suggestion when the index is not published', () => {
        const [row] = planBulkIncrease([contract()], { years: {} }, TODAY);
        expect(row.suggestion).toBeNull();
    });
});

describe('buildIncreaseUpdate', () => {
    it('sets the new rent from the adjustment month and freezes earlier unpaid months', () => {
        const update = buildIncreaseUpdate(contract(), 106100, '2026-11');

        expect(update.montoMensual).toBe(106100);
        const byMonth = Object.fromEntries(update.historialPagos!.map(p => [p.mes, p.montoAlquiler]));
        expect(byMonth).toEqual({ '2026-08': 100000, '2026-09': 100000, '2026-10': 100000 });
    });
});
