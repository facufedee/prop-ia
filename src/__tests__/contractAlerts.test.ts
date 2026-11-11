import { describe, it, expect } from 'vitest';
import { getContractAlerts, suggestIncrease } from '@/lib/financial/contractAlerts';

const TODAY = new Date(2026, 10, 12); // 12 Nov 2026

const contract = (overrides: Record<string, unknown> = {}) => ({
    fechaInicio: new Date(2026, 7, 1), // Aug 2026
    fechaFin: new Date(2028, 6, 31),
    diaVencimiento: 10,
    montoMensual: 100000,
    ajusteTipo: 'IPC',
    ajusteValor: 0,
    ajusteFrecuencia: 3,
    historialPagos: [],
    ...overrides,
} as any);

const paid = (mes: string, montoAlquiler = 100000) => ({ id: mes, mes, monto: montoAlquiler, montoAlquiler, estado: 'pagado', fechaVencimiento: new Date() });
const pending = (mes: string, montoAlquiler = 100000) => ({ ...paid(mes, montoAlquiler), estado: 'pendiente' });

describe('getContractAlerts: overdue months', () => {
    it('lists unpaid months whose due date already passed', () => {
        const alerts = getContractAlerts(contract({ historialPagos: [paid('2026-08'), paid('2026-09')] }), TODAY);
        expect(alerts.overdueMonths).toEqual(['2026-10', '2026-11']);
    });

    it('does not count the current month before its due day', () => {
        const alerts = getContractAlerts(contract({ historialPagos: [paid('2026-08'), paid('2026-09')] }), new Date(2026, 10, 5));
        expect(alerts.overdueMonths).toEqual(['2026-10']);
    });
});

describe('getContractAlerts: rent adjustment', () => {
    it('flags an adjustment that is due and not applied yet', () => {
        const alerts = getContractAlerts(contract(), TODAY);
        expect(alerts.adjustment).toEqual({ status: 'due', month: '2026-11' });
    });

    it('does not flag it once the new rent is in place', () => {
        const alerts = getContractAlerts(contract({ montoMensual: 120000, historialPagos: [paid('2026-10')] }), TODAY);
        expect(alerts.adjustment).toBeNull();
    });

    it('warns about an adjustment coming next month', () => {
        const alerts = getContractAlerts(contract({ fechaInicio: new Date(2026, 8, 1) }), TODAY);
        expect(alerts.adjustment).toEqual({ status: 'upcoming', month: '2026-12' });
    });

    it('ignores contracts with manual adjustment', () => {
        const alerts = getContractAlerts(contract({ ajusteTipo: 'manual' }), TODAY);
        expect(alerts.adjustment).toBeNull();
    });

    it('treats a stored pending month with the old rent as not applied', () => {
        const alerts = getContractAlerts(contract({ historialPagos: [pending('2026-10'), pending('2026-11')] }), TODAY);
        expect(alerts.adjustment).toEqual({ status: 'due', month: '2026-11' });
    });
});

describe('suggestIncrease', () => {
    it('compounds the IPC of the months before the adjustment', () => {
        const indices = { years: { 2026: { 8: 2, 9: 3, 10: 1 } } };
        const suggestion = suggestIncrease(contract(), indices, '2026-11');
        expect(suggestion).toMatchObject({ pct: 6.1, missingMonths: [] });
        expect(suggestion?.label).toBe('IPC agosto – octubre 2026');
    });

    it('reports months INDEC has not published yet', () => {
        const indices = { years: { 2026: { 8: 2, 9: 3 } } };
        const suggestion = suggestIncrease(contract(), indices, '2026-11');
        expect(suggestion).toMatchObject({ pct: 5.1, missingMonths: ['2026-10'] });
    });

    it('returns null when no IPC month is published', () => {
        expect(suggestIncrease(contract(), { years: {} }, '2026-11')).toBeNull();
    });

    it('uses the ICL ratio between adjustment dates', () => {
        const indices = { years: {}, icl: { '2025-11-01': 30, '2026-11-01': 36 } };
        const rental = contract({ ajusteTipo: 'ICL', ajusteFrecuencia: 12, fechaInicio: new Date(2025, 10, 1) });
        expect(suggestIncrease(rental, indices, '2026-11')).toMatchObject({ pct: 20, label: 'ICL BCRA' });
    });

    it('uses the fixed percentage of the contract', () => {
        const rental = contract({ ajusteTipo: 'porcentaje', ajusteValor: 10 });
        expect(suggestIncrease(rental, { years: {} }, '2026-11')).toMatchObject({ pct: 10 });
    });
});
