# Rent increase save fix

## Objective
Make "Aumentar" (IPC / manual rent increase) reliably save and apply to the right months.

## Problem
A user reported the increase "does not save". Investigation found:
- The percentage field is `type="number"`; decimals typed with a comma (es-AR keyboards, iOS Safari) yield an empty value, so the increase is 0% and the save writes the same rent.
- The increase applies to every `pendiente` payment, including past overdue months, while `vencido` / `parcial` months are skipped.
- Projected months before the increase (not stored in `historialPagos`) silently switch to the new rent because they derive from `montoMensual`.
- The stored `monto` drops punitorios, cargos adicionales and descuentos, and reads services from `desglose` instead of `detalleServicios`.
- The modal closes before the save finishes, and failures only show a generic alert with no error code.

## Scope
- `src/lib/financial/applyRentIncrease.ts` (new pure logic)
- `src/__tests__/applyRentIncrease.test.ts`
- `src/app/(main)/dashboard/alquileres/components/IPCAdjustmentModal.tsx`
- `src/app/(main)/dashboard/alquileres/components/PaymentPlanTable.tsx`
- `src/app/(main)/dashboard/alquileres/[id]/page.tsx`

## Tasks
- [x] T1 Pure `applyRentIncrease` with tests (route: inline, single new module)
- [x] T2 Modal: comma-safe percentage, "applies from" month, saving state, no-op guard (route: inline)
- [x] T3 Wire PaymentPlanTable + page save feedback with error code (route: inline)

## Acceptance criteria
- Increase applies only to unpaid months from the selected month on (pendiente, vencido, parcial).
- Months before it keep the old rent, including projected ones.
- `monto` matches the PaymentCard total formula.
- "15,5" and "15.5" both parse.
- Modal stays open on failure and shows the Firestore error code.

## Checks
- `npx vitest run src/__tests__/applyRentIncrease.test.ts`
- `npx tsc --noEmit`

## Progress
- Branch: `fix/rent-increase-save`
- RED observed (module missing), GREEN: applyRentIncrease.test.ts 7/7.
- `npx tsc --noEmit`: clean. ESLint: 0 errors (pre-existing unused-import warnings only).
- Full suite: newsletter/blog cron tests flaky under parallel load (4 then 2 failures); they pass 22/22 in isolation with and without this change.
- Not verified in the browser: the dashboard needs a real signed-in Firebase session.
