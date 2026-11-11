import { Alquiler } from "@/domain/models/Alquiler";
import { applyRentIncrease } from "@/lib/financial/applyRentIncrease";
import { getContractAlerts, IncreaseSuggestion, suggestIncrease } from "@/lib/financial/contractAlerts";
import { IndicesData } from "@/lib/financial/indices";
import { buildPaymentPeriods } from "@/lib/financial/paymentPeriods";

export interface BulkIncreaseRow {
    contract: Alquiler;
    /** First month ("yyyy-MM") that pays the new rent. */
    fromMonth: string;
    currentRent: number;
    /** `null` when the index for the period is not published yet. */
    suggestion: IncreaseSuggestion | null;
}

/** New rent after a percentage increase. Same rounding as the single-contract modal. */
export const increasedRent = (rent: number, pct: number) => rent + Math.floor(rent * (pct / 100));

/** Active contracts whose adjustment is due and not applied, with the suggested percentage. */
export function planBulkIncrease(contracts: Alquiler[], indices: IndicesData, today: Date = new Date()): BulkIncreaseRow[] {
    return contracts
        .filter(c => c.estado === "activo")
        .flatMap(contract => {
            const { adjustment } = getContractAlerts(contract, today);
            if (adjustment?.status !== "due") return [];
            return [{
                contract,
                fromMonth: adjustment.month,
                currentRent: contract.montoMensual,
                suggestion: suggestIncrease(contract, indices, adjustment.month),
            }];
        });
}

/** The contract fields to save for one increase. */
export function buildIncreaseUpdate(contract: Alquiler, newRent: number, fromMonth: string): Pick<Alquiler, "montoMensual" | "historialPagos"> {
    return {
        montoMensual: newRent,
        historialPagos: applyRentIncrease({
            history: contract.historialPagos || [],
            periods: buildPaymentPeriods(contract),
            newRent,
            fromMonth,
            honorariosTipo: contract.honorariosTipo,
            honorariosValor: contract.honorariosValor,
        }),
    };
}
