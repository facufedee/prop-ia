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
