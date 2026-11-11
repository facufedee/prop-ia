import { describe, it, expect } from 'vitest';
import { buildPendingSummary, formatPendingGreeting } from '@/lib/financial/pendingSummary';

const TODAY = new Date(2026, 10, 12); // 12 Nov 2026

const pago = (mes: string, estado = 'pagado') => ({ id: mes, mes, monto: 100000, montoAlquiler: 100000, estado, fechaVencimiento: new Date() });

const contract = (overrides: Record<string, unknown>) => ({
    id: 'a',
    estado: 'activo',
    direccion: 'Coronel Paulino Rojas 207',
    fechaInicio: new Date(2026, 7, 1),
    fechaFin: new Date(2028, 6, 31),
    diaVencimiento: 10,
    montoMensual: 100000,
    ajusteTipo: 'manual',
    ajusteValor: 0,
    historialPagos: [],
    historialLiquidaciones: [],
    ...overrides,
} as any);

const overdueContract = contract({ historialPagos: [pago('2026-08'), pago('2026-09'), pago('2026-10')], historialLiquidaciones: [
    { id: 'l8', mes: '2026-08', estado: 'pagado' }, { id: 'l9', mes: '2026-09', estado: 'pagado' }, { id: 'l10', mes: '2026-10', estado: 'pagado' },
] });

const upcomingContract = contract({
    id: 'b',
    direccion: 'Rodríguez Peña 2380',
    fechaInicio: new Date(2026, 8, 1),
    diaVencimiento: 15,
    historialPagos: [pago('2026-09'), pago('2026-10')],
    historialLiquidaciones: [{ id: 'l9', mes: '2026-09', estado: 'pendiente' }],
});

describe('buildPendingSummary', () => {
    it('collects overdue payments, payments due this week and what to settle', () => {
        const summary = buildPendingSummary([overdueContract, upcomingContract], TODAY);

        expect(summary.overdue).toEqual([{ alquilerId: 'a', direccion: 'Coronel Paulino Rojas 207', mes: '2026-11' }]);
        expect(summary.upcoming).toEqual([{ alquilerId: 'b', direccion: 'Rodríguez Peña 2380', mes: '2026-11', dueDate: new Date(2026, 10, 15) }]);
        expect(summary.toSettle).toEqual([{ alquilerId: 'b', direccion: 'Rodríguez Peña 2380', mes: '2026-10' }]);
        expect(summary.pendingSettlements).toBe(1);
        expect(summary.total).toBe(4);
    });

    it('ignores contracts that are not active', () => {
        const summary = buildPendingSummary([{ ...overdueContract, estado: 'finalizado' }], TODAY);
        expect(summary.total).toBe(0);
    });

    it('includes rent increases that are due', () => {
        const ipc = contract({ id: 'c', ajusteTipo: 'IPC', ajusteFrecuencia: 3, diaVencimiento: 28, historialPagos: [pago('2026-08'), pago('2026-09'), pago('2026-10')] });
        const summary = buildPendingSummary([ipc], TODAY);
        expect(summary.increases).toEqual([{ alquilerId: 'c', direccion: 'Coronel Paulino Rojas 207', month: '2026-11', status: 'due' }]);
    });
});

describe('formatPendingGreeting', () => {
    it('lists what is pending with links to each section', () => {
        const text = formatPendingGreeting(buildPendingSummary([overdueContract, upcomingContract], TODAY));

        expect(text).toContain('**1 cobro vencido**');
        expect(text).toContain('Coronel Paulino Rojas 207 (noviembre)');
        expect(text).toContain('vence el 15/11');
        expect(text).toContain('**1 cobro para liquidar**');
        expect(text).toContain('1 liquidación sin pagar');
        expect(text).toContain('(/dashboard/agenda-cobros)');
    });

    it('says everything is up to date when nothing is pending', () => {
        const text = formatPendingGreeting(buildPendingSummary([], TODAY));
        expect(text).toContain('todo al día');
    });
});
