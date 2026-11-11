import { describe, it, expect } from 'vitest';
import { applyRentIncrease, parsePercentage } from '@/lib/financial/applyRentIncrease';
import { Pago } from '@/domain/models/Alquiler';

const pago = (mes: string, overrides: Partial<Pago> = {}): Pago => ({
    id: `id-${mes}`,
    mes,
    monto: 100000,
    montoAlquiler: 100000,
    fechaVencimiento: new Date(`${mes}-10T12:00:00`),
    estado: 'pendiente',
    ...overrides,
});

const projected = (mes: string): Pago => pago(mes, { id: `proj-${mes}` });

describe('applyRentIncrease', () => {
    it('updates unpaid months from the selected month on and keeps earlier ones', () => {
        const history = [pago('2026-09'), pago('2026-10'), pago('2026-11')];
        const result = applyRentIncrease({ history, periods: history, newRent: 120000, fromMonth: '2026-10' });

        expect(result.map(p => p.montoAlquiler)).toEqual([100000, 120000, 120000]);
    });

    it('also updates overdue and partially paid months but never paid ones', () => {
        const history = [
            pago('2026-10', { estado: 'pagado' }),
            pago('2026-11', { estado: 'vencido' }),
            pago('2026-12', { estado: 'parcial', pagoParcial: 50000 }),
        ];
        const result = applyRentIncrease({ history, periods: history, newRent: 120000, fromMonth: '2026-10' });

        expect(result.map(p => p.montoAlquiler)).toEqual([100000, 120000, 120000]);
        expect(result[2].pagoParcial).toBe(50000);
    });

    it('stores projected months before the increase so they keep the old rent', () => {
        const history = [pago('2026-11')];
        const periods = [projected('2026-10'), history[0], projected('2026-12')];
        const result = applyRentIncrease({ history, periods, newRent: 120000, fromMonth: '2026-11' });

        expect(result.map(p => [p.mes, p.montoAlquiler])).toEqual([
            ['2026-10', 100000],
            ['2026-11', 120000],
        ]);
    });

    it('recomputes the total with services, extra charges, penalties and discounts', () => {
        const history = [pago('2026-11', {
            detalleServicios: [{ concepto: 'Luz', monto: 5000 }],
            cargosAdicionales: [{ id: 'c1', concepto: 'Expensas', monto: 3000 }],
            montoPunitorios: 2000,
            montoDescuento: 1000,
        })];
        const [updated] = applyRentIncrease({ history, periods: history, newRent: 120000, fromMonth: '2026-11' });

        expect(updated.monto).toBe(120000 + 5000 + 3000 + 2000 - 1000);
        expect(updated.desglose).toMatchObject({ alquilerPuro: 120000, servicios: 5000, cargosAdicionales: 3000 });
    });

    it('recalculates percentage fees and keeps fixed ones', () => {
        const history = [pago('2026-11', { desglose: { alquilerPuro: 100000, servicios: 0, honorarios: 4000 } })];

        const [pct] = applyRentIncrease({ history, periods: history, newRent: 120000, fromMonth: '2026-11', honorariosTipo: 'porcentaje', honorariosValor: 5 });
        const [fixed] = applyRentIncrease({ history, periods: history, newRent: 120000, fromMonth: '2026-11', honorariosTipo: 'fijo', honorariosValor: 4000 });

        expect(pct.desglose?.honorarios).toBe(6000);
        expect(fixed.desglose?.honorarios).toBe(4000);
    });
});

describe('parsePercentage', () => {
    it('accepts comma and dot decimals', () => {
        expect(parsePercentage('15,5')).toBe(15.5);
        expect(parsePercentage('15.5')).toBe(15.5);
        expect(parsePercentage(' 8 ')).toBe(8);
    });

    it('returns 0 for empty or invalid input', () => {
        expect(parsePercentage('')).toBe(0);
        expect(parsePercentage('abc')).toBe(0);
    });
});
