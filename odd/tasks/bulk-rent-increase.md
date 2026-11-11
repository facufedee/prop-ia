# Bulk rent increase

## Objective
Apply the due rent increases of several contracts at once, using the official index suggestion, from the Alquileres list.

## Why
When INDEC publishes the IPC, agencies open every contract and tap "Aumentar" one by one. That is the most repetitive monthly task.

## Scope
- `src/lib/financial/bulkIncrease.ts` (new: plan rows and per-contract update)
- `src/__tests__/bulkIncrease.test.ts`
- `src/app/(main)/dashboard/alquileres/components/BulkIncreaseModal.tsx` (new)
- `src/app/(main)/dashboard/alquileres/page.tsx` (button in Capi alert, open modal, reload)
- `src/lib/financial/pendingSummary.ts` (chat line points to the Alquileres list)

## Constraints
- Reuse `getContractAlerts`, `suggestIncrease`, `buildPaymentPeriods`, `applyRentIncrease`.
- The user reviews and can edit or uncheck every row before applying.
- Rows without a published index start unchecked with an empty percentage.
- One contract failing must not stop the others; report results per contract.

## Tasks
- [x] T1 `planBulkIncrease` + `buildIncreaseUpdate` with tests (route: inline, TDD)
- [x] T2 BulkIncreaseModal and wiring in Alquileres (route: inline)
- [x] T3 Chat summary points to bulk apply (route: inline, mechanical)

## Acceptance criteria
- Only active contracts with a due adjustment are listed.
- New rent matches the single-contract modal rounding.
- Months before the adjustment keep the old rent.

## Checks
- `npx vitest run src/__tests__/bulkIncrease.test.ts`
- `npx tsc --noEmit`, ESLint on touched files

## Progress
- Branch: `feat/bulk-rent-increase`, stacked on `feat/capybara-assistant`.
- RED observed for bulkIncrease (module missing), GREEN 5/5. BulkIncreaseModal behavior tests 2/2 (prefilled IPC, saves new rent, skips unchecked, continues after a failure). Related suites 40/40.
- `npx tsc --noEmit` clean; ESLint 0 errors on touched files (2 pre-existing warnings in alquileres/page.tsx).
- Not verified in the signed-in dashboard.
