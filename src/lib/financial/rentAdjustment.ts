import { Alquiler } from "@/domain/models/Alquiler";
import { parseISO, differenceInMonths, addMonths, isBefore, isSameMonth } from "date-fns";

interface IndicesConfig {
    years: Record<number, Record<number, number>>; // year -> month (1-12) -> value
}

// Helper to fetch indices (in a real app, might want to cache or pass from component)
// For this utility, we'll assume indices are passed in or fetched if needed. 
// Given the context of usage (likely in components), we'll make it pure logic first.

/**
 * Calculates the current rent based on IPC adjustments.
 * 
 * Logic:
 * 1. Identify "Base Date" and "Base Amount".
 *    - Initially, Base Date = Contract Start Date, Base Amount = Initial Monthly Rent.
 * 2. Determine adjustment periods based on frequency (e.g. every 3 months).
 * 3. For each period passed, calculate the cumulative IPC for that period.
 * 4. Apply the cumulative IPC to the Base Amount to get the new Current Rent.
 * 
 * IMPORTANT: The user said "mes 1, 2, 3 se paga el mismo valor. A partir del 4, 5, 6 con ese aumento".
 * This means the rent is constant during a period, and jumps at the start of the next period.
 * The jump is based on the accumulated IPC of the *in-between* months? 
 * Usually: Adjustment for Month 4 is based on IPC of Month 1, 2, 3.
 * 
 * @param rental The rental contract
 * @param indices The IPC indices configuration
 * @param targetDate The date for which we want to calculate the rent (default: now)
 */
export const calculateCurrentRent = (
    rental: Alquiler,
    indices: IndicesConfig,
    targetDate: Date = new Date()
): { currentRent: number, lastAdjustmentDate: Date, nextAdjustmentDate: Date, accumulatedPercentage: number } => {

    // Default return if not IPC or missing data
    const defaultResult = {
        currentRent: rental.montoMensual || 0, // Fallback
        lastAdjustmentDate: rental.fechaInicio,
        nextAdjustmentDate: addMonths(rental.fechaInicio, rental.ajusteFrecuencia || 0),
        accumulatedPercentage: 0
    };

    if (rental.ajusteTipo !== 'IPC' || !rental.montoMensual) {
        return defaultResult;
    }

    const frequency = rental.ajusteFrecuencia || 3; // Default 3 months
    const startDate = typeof rental.fechaInicio === 'string' ? parseISO(rental.fechaInicio) : rental.fechaInicio;

    // Determine how many full periods have passed
    // Period 0: Months 0-2 (Pay initial rent)
    // Period 1: Months 3-5 (Pay adjusted rent #1)

    // Diff in months from Start to Target
    // e.g. Start Jan 1. Target Apr 1. Diff = 3 months. 
    // If freq=3, we are in the START of the 2nd period (Index 1).
    const monthsDiff = differenceInMonths(targetDate, startDate);

    if (monthsDiff < frequency) {
        // Still in the first period
        return {
            ...defaultResult,
            nextAdjustmentDate: addMonths(startDate, frequency)
        };
    }

    // How many adjustments specific periods have occurred?
    // e.g. Month 4 (diff 3). frequency 3. adjustments = floor(3/3) = 1.
    const numberOfAdjustments = Math.floor(monthsDiff / frequency);

    let currentAmount = rental.montoMensual;
    let accumulatedTotal = 1;

    // Calculate compound interest for each elapsed period
    for (let i = 0; i < numberOfAdjustments; i++) {
        // Period Start Date (for retrieving indices)
        // Adjust #1 happens at Month 3. Based on indices of Month 0, 1, 2.
        const periodStartIndex = i * frequency;
        const periodStart = addMonths(startDate, periodStartIndex);

        let periodAccumulator = 1;

        // Accumulate IPC for the months in this period
        for (let m = 0; m < frequency; m++) {
            const monthDate = addMonths(periodStart, m);
            const year = monthDate.getFullYear();
            const month = monthDate.getMonth() + 1; // 1-12

            const rate = indices.years[year]?.[month] ?? 0;
            // Formula: value * (1 + rate/100)
            periodAccumulator *= (1 + rate / 100);
        }

        currentAmount *= periodAccumulator;
        accumulatedTotal *= periodAccumulator;
    }

    // Round current amount to nearest 100? Optional but good for valid currency
    // Keeping precise for now or rounding to integer
    currentAmount = Math.ceil(currentAmount);

    const lastAdjDate = addMonths(startDate, numberOfAdjustments * frequency);
    const nextAdjDate = addMonths(lastAdjDate, frequency);

    return {
        currentRent: currentAmount,
        lastAdjustmentDate: lastAdjDate,
        nextAdjustmentDate: nextAdjDate,
        accumulatedPercentage: (accumulatedTotal - 1) * 100
    };
};
