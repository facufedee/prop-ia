import { addMonths, format, startOfMonth } from "date-fns";
import { Alquiler, Pago } from "@/domain/models/Alquiler";

type PeriodsContract = Pick<
    Alquiler,
    "fechaInicio" | "fechaFin" | "diaVencimiento" | "montoMensual" | "historialPagos" | "honorariosTipo" | "honorariosValor"
>;

const MAX_PERIODS = 60;

/**
 * Turns a stored date into a Date. Handles Date, Firestore Timestamp (`toDate()`),
 * ISO strings and plain "YYYY-MM-DD" (read at noon to avoid shifting the day in GMT-3).
 */
export function toPaymentDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "object" && typeof (value as { toDate?: unknown }).toDate === "function") {
        return (value as { toDate: () => Date }).toDate();
    }
    if (typeof value === "string") {
        const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
        return isNaN(date.getTime()) ? null : date;
    }
    return null;
}

/**
 * Every month of the contract: stored payments as they are, plus projected
 * pending payments (id `proj-YYYY-MM`) for months not stored yet.
 */
export function buildPaymentPeriods(contract: PeriodsContract): Pago[] {
    const start = startOfMonth(toPaymentDate(contract.fechaInicio) ?? new Date());
    const end = startOfMonth(toPaymentDate(contract.fechaFin) ?? new Date());
    const stored = new Map((contract.historialPagos || []).map(p => [p.mes, p]));
    const dueDay = contract.diaVencimiento && contract.diaVencimiento > 0 && contract.diaVencimiento <= 31
        ? contract.diaVencimiento
        : 10;

    let honorarios = 0;
    if (contract.honorariosTipo === "fijo" && contract.honorariosValor) {
        honorarios = contract.honorariosValor;
    } else if (contract.honorariosTipo === "porcentaje" && contract.honorariosValor) {
        honorarios = Math.floor(contract.montoMensual * (contract.honorariosValor / 100));
    }

    const periods: Pago[] = [];
    for (let month = start, i = 0; month <= end && i < MAX_PERIODS; month = addMonths(month, 1), i++) {
        const mes = format(month, "yyyy-MM");
        const existing = stored.get(mes);
        if (existing) {
            periods.push({
                ...existing,
                fechaVencimiento: toPaymentDate(existing.fechaVencimiento) ?? new Date(month.getFullYear(), month.getMonth(), dueDay),
                fechaPago: toPaymentDate(existing.fechaPago) ?? undefined,
            });
            continue;
        }
        periods.push({
            id: `proj-${mes}`,
            mes,
            monto: contract.montoMensual,
            montoAlquiler: contract.montoMensual,
            montoPunitorios: 0,
            montoDescuento: 0,
            fechaVencimiento: new Date(month.getFullYear(), month.getMonth(), dueDay),
            estado: "pendiente",
            detalleServicios: [],
            desglose: {
                alquilerPuro: contract.montoMensual,
                servicios: 0,
                honorarios,
                cargosAdicionales: 0,
                otros: 0,
            },
        });
    }
    return periods;
}
