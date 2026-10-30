# Feature: trial-enforcement

## Objective
Make the 14-day free trial behave exactly like the Basic plan, and enforce trial/subscription expiry server-side (Firestore rules) instead of only in the browser.

## Problem
- Trial limits are hardcoded (25 properties / 80 clients) in `subscriptionService.checkUsageLimit`; editing the Basic plan in the admin panel does not affect the trial.
- `PropertyForm.tsx` and `dashboard/propiedades/page.tsx` create properties without any limit check.
- Trial expiry (`TrialEnforcer`) and subscription expiry (`AccountLockEnforcer`) are client-only; Firestore rules allow creating properties/clients regardless.
- A user can set any `createdAt` on self-signup (only protected on update), so the trial start can be forged.

## Scope / constraints
- Firestore rules cannot count documents: quantity limits stay client-side. Rules enforce *access window* (trial or paid period) on create of `properties`, `inquilinos`, `propietarios`.
- New server-owned field `users/{uid}.accessUntil` (Timestamp), written only by admin/Admin SDK.
- Org members (`organizationId` = owner uid) use the org owner's access window. Self-signup only allows `organizationId` with the Agente role. Remaining gap: rules do not verify an invitation, so a self-signed Agente can point at any org and borrow its window.
- Not covered by the window: alquileres, leads, visitas, ventas, transacciones, carteles, configuracion_comisiones, agentes, tickets, sites, branches, rentalServices.
- Do not deploy rules or run backfill against production; the user does that.
- Delivery strategy: ask-on-risk. Forecast ~350 authored lines.

## Tasks
- [x] T1 — Trial uses Basic plan limits (commit b419869; vitest RED 6 failed → GREEN 6 passed; tsc clean; review assess: medium, under_budget) (route: delegated writer; trigger: 3+ non-trivial files)
  - `checkUsageLimit` without subscription reads the Basic plan (`plans/basic`, fallback query `tier == 'basic'`, fallback `PLANS`).
  - Remove hardcoded 25/80 and 5/10 fallbacks; dashboard fallback limits read the same source.
  - Add limit check to `PropertyForm.tsx` and `dashboard/propiedades/page.tsx` create paths.
  - Checks: vitest unit test for trial limits (RED → GREEN), `npx tsc --noEmit`.
- [x] T2 — Server-side access window (vitest paymentActivation RED 2 failed → GREEN 7 passed; tsc clean; Rules API 334/334 passed after defaulting request.time in harness) (route: delegated writer; trigger: rules + services + script)
  - `firestore.rules`: protect `accessUntil` (create + update), require `createdAt == request.time` on self-signup create, `hasActiveAccess()` on create of properties/inquilinos/propietarios.
  - Signup and invitation write `createdAt: serverTimestamp()`.
  - Payment webhook / admin activation mirror subscription `endDate` into `users.accessUntil`.
  - Backfill script for existing paying users (not executed).
  - Rules API test cases in `scripts/test_firestore_rules.mjs`.
  - Checks: vitest, `npx tsc --noEmit`; rules tests need user authorization (remote Rules API).

## Progress
- Branch `feat/trial-enforcement` created from `main`.
- T1 and T2 implemented.

## Rollout order (production, user-run)
1. Deploy app code (webhook/admin mirror accessUntil, serverTimestamp createdAt).
2. `npx tsx scripts/backfillAccessUntil.ts` (dry run), then `--apply`.
3. Run `node scripts/test_firestore_rules.mjs`, then deploy `firestore.rules`.
Deploying rules before the backfill locks out every paying user older than 14 days.

## Next step
Run Rules API tests (needs authorization), native review of the branch, then PR.
