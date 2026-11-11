import { describe, it, expect } from 'vitest';
import { buildPaymentPeriods, toPaymentDate } from '@/lib/financial/paymentPeriods';

const contract = (overrides: Record<string, unknown> = {}) => ({
    fechaInicio: new Date(2026, 7, 15), // 15 Aug 2026
    fechaFin: new Date(2026, 10, 14), // 14 Nov 2026
    diaVencimiento: 10,
    montoMensual: 100000,
    historialPagos: [],
    ...overrides,
} as any);

describe('buildPaymentPeriods', () => {
    it('keeps stored payments and projects the missing months', () => {
        const stored = { id: 'real', mes: '2026-09', monto: 90000, montoAlquiler: 90000, estado: 'pagado', fechaVencimiento: new Date(2026, 8, 10) };
        const periods = buildPaymentPeriods(contract({ historialPagos: [stored] }));

        expect(periods.map(p => [p.id, p.mes, p.estado])).toEqual([
            ['proj-2026-08', '2026-08', 'pendiente'],
            ['real', '2026-09', 'pagado'],
            ['proj-2026-10', '2026-10', 'pendiente'],
            ['proj-2026-11', '2026-11', 'pendiente'],
        ]);
        expect(periods[0]).toMatchObject({ monto: 100000, montoAlquiler: 100000, fechaVencimiento: new Date(2026, 7, 10) });
    });

    it('falls back to day 10 when the due day is missing', () => {
        const [first] = buildPaymentPeriods(contract({ diaVencimiento: 0 }));
        expect(first.fechaVencimiento).toEqual(new Date(2026, 7, 10));
    });

    it('computes percentage fees for projected months', () => {
        const [first] = buildPaymentPeriods(contract({ honorariosTipo: 'porcentaje', honorariosValor: 5 }));
        expect(first.desglose?.honorarios).toBe(5000);
    });

    it('turns Firestore timestamps into dates', () => {
        const stored = { id: 'real', mes: '2026-08', estado: 'pendiente', monto: 1, fechaVencimiento: { toDate: () => new Date(2026, 7, 10) } };
        const [first] = buildPaymentPeriods(contract({ historialPagos: [stored] }));
        expect(first.fechaVencimiento).toEqual(new Date(2026, 7, 10));
    });
});

describe('toPaymentDate', () => {
    it('accepts dates, Firestore timestamps, ISO strings and plain dates', () => {
        expect(toPaymentDate(new Date(2026, 0, 5))).toEqual(new Date(2026, 0, 5));
        expect(toPaymentDate({ toDate: () => new Date(2026, 0, 5) })).toEqual(new Date(2026, 0, 5));
        expect(toPaymentDate('2026-01-05')).toEqual(new Date(2026, 0, 5, 12));
        expect(toPaymentDate(undefined)).toBeNull();
    });
});
