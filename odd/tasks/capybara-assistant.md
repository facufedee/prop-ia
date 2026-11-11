# Capybara assistant

## Objective
An animated capybara assistant that guides users step by step with a speech bubble, starting with the New Contract wizard.

## Why
Long info banners are not read. A friendly, contextual hint next to the task tells the user what to do now.

## Scope
- `src/ui/components/assistant/CapybaraAssistant.tsx` (new: original SVG capybara + bubble + CSS animations)
- `src/app/(main)/dashboard/alquileres/nuevo/page.tsx` (per-step messages)

## Constraints
- Original character, inline SVG, no new dependencies.
- Respect `prefers-reduced-motion`.
- Collapsible; collapsed state remembered per viewer (localStorage wrapped in try/catch).
- Works at phone width and in light/dark theme tokens.

## Tasks
- [x] T0 Replace new-contract banner with inline property hint (route: inline) — commit on this branch
- [x] T1 CapybaraAssistant component (route: inline, one non-trivial file)
- [x] T2 Per-step messages in New Contract wizard (route: inline, mechanical)
- [x] T3 Capi on Propiedades, Property wizard (per step), Alquileres, Plan de pagos, Agenda de cobros, Liquidaciones, with data-aware messages (route: inline, mechanical insertions)

- [x] T4 Compact minimized Capi (floating button), `important` alerts that show even when minimized (route: inline)
- [x] T5 `contractAlerts`: overdue months, due/upcoming adjustment, IPC/ICL/percentage suggestion with tests (route: inline, TDD)
- [x] T6 Plan de pagos + Alquileres list use alerts; increase modal suggests official index and defaults "Rige desde" to the adjustment month (route: inline)
- [x] T7 Capi in the AI chat: avatar, auto-open once per session on desktop, waving/hopping launcher with pending badge, pending-summary greeting, scrollable quick prompts, on-page tips toggle; minimized page tips no longer render a floating button (route: inline)

## Acceptance criteria
- Capybara blinks, breathes and bounces when its message changes; bubble pops in.
- Message changes with each wizard step.
- User can hide the bubble and bring it back by clicking the capybara.

## Checks
- `npx tsc --noEmit`, ESLint on touched files
- Render check in the browser (component preview; the dashboard needs a signed-in session)

## Progress
- Branch: `feat/capybara-assistant`, stacked on `fix/rent-increase-save`.
- T0 commit 60f9743.
- Checks: `npx tsc --noEmit` clean; ESLint 0 errors on the new component (2 pre-existing `any` errors in nuevo/page.tsx); CapybaraAssistant.test.tsx 3/3.
- Render verified from static markup served by the dev server: capybara + bubble render, breathe/blink/ear/pop animations active.
- Not verified inside the signed-in wizard.
- T3: tsc clean; ESLint 23 errors / 28 warnings before and after (all pre-existing `any`), no new findings. Not verified in the signed-in dashboard.
- T4-T6: RED observed for contractAlerts (module missing), GREEN 12/12; assistant tests 5/5; related suites 33/33. tsc clean; ESLint 0 errors (warnings 17 -> 15). Not verified in the signed-in dashboard.
- T7: pendingSummary RED (module missing) then GREEN 5/5; assistant 4/4; contractAlerts 12/12. tsc clean; ChatPanel lint only the pre-existing `as any`. Avatar wave/hop verified in a static render served by the dev server. Chat not verified signed in.
