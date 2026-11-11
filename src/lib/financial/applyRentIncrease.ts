import { Alquiler, Pago } from "@/domain/models/Alquiler";

interface ApplyRentIncreaseInput {
    /** Payments stored in the contract (`historialPagos`). */
    history: Pago[];
    /** Every period of the contract: stored payments plus projected ones. */
    periods: Pago[];
    newRent: number;
    /** First month ("yyyy-MM") that pays the new rent. */
    fromMonth: string;
    honorariosTipo?: Alquiler['honorariosTipo'];
    honorariosValor?: number;
}

/**
 * Parses a user-typed percentage. Accepts both "15,5" and "15.5".
 */
export const parsePercentage = (raw: string): number => {
    const value = parseFloat(raw.trim().replace(',', '.'));
    return Number.isFinite(value) ? value : 0;
};

const withNewRent = (p: Pago, newRent: number, input: ApplyRentIncreaseInput): Pago => {
    const servicios = (p.detalleServicios && p.detalleServicios.length > 0)
        ? p.detalleServicios.reduce((acc, s) => acc + (Number(s.monto) || 0), 0)
        : (p.montoServicios || 0);
    const cargosAdicionales = (p.cargosAdicionales || []).reduce((acc, c) => acc + (c.monto || 0), 0);
    const punitorios = p.montoPunitorios || 0;
    const descuentos = p.montoDescuento || 0;

    let honorarios = p.desglose?.honorarios || 0;
    if (input.honorariosTipo === 'porcentaje' && input.honorariosValor) {
        honorarios = Math.floor(newRent * (input.honorariosValor / 100));
    }

    return {
        ...p,
        montoAlquiler: newRent,
        // Same formula as PaymentCard: honorarios are included in the rent, not added on top.
        monto: newRent + servicios + cargosAdicionales + punitorios - descuentos,
        desglose: {
            ...p.desglose,
            alquilerPuro: newRent,
            servicios,
            cargosAdicionales,
            honorarios,
        },
    };
};

/**
 * Returns the new `historialPagos` after a rent increase.
 *
 * - Unpaid months (pendiente, vencido, parcial) from `fromMonth` on get the new rent.
 * - Paid months and months before `fromMonth` keep their amount.
 * - Projected months before `fromMonth` are stored, because projected months derive
 *   from `montoMensual` and would otherwise switch to the new rent too.
 */
export const applyRentIncrease = (input: ApplyRentIncreaseInput): Pago[] => {
    const { history, periods, newRent, fromMonth } = input;
    const storedMonths = new Set(history.map(p => p.mes));

    const updatedHistory = history.map(p =>
        p.estado !== 'pagado' && p.mes >= fromMonth ? withNewRent(p, newRent, input) : p
    );

    const frozenProjected = periods.filter(p => !storedMonths.has(p.mes) && p.mes < fromMonth);

    return [...updatedHistory, ...frozenProjected].sort((a, b) => a.mes.localeCompare(b.mes));
};
