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
- Org members (`organizationId` set) are exempt from the trial window in rules (known gap: they inherit the owner's subscription, not modeled in rules yet).
- Do not deploy rules or run backfill against production; the user does that.
- Delivery strategy: ask-on-risk. Forecast ~350 authored lines.

## Tasks
- [ ] T1 — Trial uses Basic plan limits (route: delegated writer; trigger: 3+ non-trivial files)
  - `checkUsageLimit` without subscription reads the Basic plan (`plans/basic`, fallback query `tier == 'basic'`, fallback `PLANS`).
  - Remove hardcoded 25/80 and 5/10 fallbacks; dashboard fallback limits read the same source.
  - Add limit check to `PropertyForm.tsx` and `dashboard/propiedades/page.tsx` create paths.
  - Checks: vitest unit test for trial limits (RED → GREEN), `npx tsc --noEmit`.
- [ ] T2 — Server-side access window (route: delegated writer; trigger: rules + services + script)
  - `firestore.rules`: protect `accessUntil` (create + update), require `createdAt == request.time` on self-signup create, `hasActiveAccess()` on create of properties/inquilinos/propietarios.
  - Signup and invitation write `createdAt: serverTimestamp()`.
  - Payment webhook / admin activation mirror subscription `endDate` into `users.accessUntil`.
  - Backfill script for existing paying users (not executed).
  - Rules API test cases in `scripts/test_firestore_rules.mjs`.
  - Checks: vitest, `npx tsc --noEmit`; rules tests need user authorization (remote Rules API).

## Progress
- Branch `feat/trial-enforcement` created from `main`.

## Next step
T1.
