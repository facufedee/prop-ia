# Dashboard: dark warm theme (landing palette)

Branch: `feat/dashboard-dark-warm` (from main ec6e2d9) · Delivery: ask-on-risk

## Objective
Make the whole /dashboard use the landing's dark warm theme (same tokens as `src/ui/sections/landing-theme.css`), dark-only, with the bronze "Zeta"+"Prop" wordmark, no indigo/violet/purple/cyan/sky/blue/teal, and no "AI-looking" icon patterns.

## Starting point
Antigravity left 17 uncommitted files (carried onto this branch): coherent sidebar/home/MiniCalendar in warm hex, but a global navy `#0b0f17` body on every route, removed dark override rules, broken `.l-nav__word` wordmark outside `.landing-page`, gradient logos in loaders/favicons, light mode broken. ~1,476 off-brand color uses in ~128 files; ~50 dashboard pages untouched.

## Decisions (owner, 2026-10-14)
- Dashboard is **dark-only**, using the **landing's** dark (not Antigravity's navy, not ad-hoc hex).
- Logo: the landing wordmark ("Zeta" ink + "Prop" bronze); new bronze ZP favicon set. All existing logo PNGs have indigo/cyan.
- Icons: keep lucide-react (no new deps); remove Sparkles/Bot/Wand/Zap-as-decoration, gradient/pastel icon tiles and emoji.

## Tasks
- [x] D1 — Contain globals + tokens: revert root `html/body` navy + `:root` changes; dashboard-scoped theme reusing landing tokens and fonts (Montserrat/Inter Tight); restore and extend the dark override layer (incl. violet/purple/sky/cyan/teal); remove theme toggle; ThemeProvider no longer affects public pages — delegated
- [x] D2 — Brand: wordmark component for sidebar (expanded/collapsed) + loaders (AuthGuard, dashboard/loading, LoadingSpinner); new bronze favicon/apple/manifest icons; retire gradient PNGs — delegated
- [ ] D3 — Shell + icons: header, sidebar menu icons, footer, AnnouncementBanner, dashboard home cleanup — delegated
- [ ] D4 — High-traffic pages: propiedades (PropertyWizard), alquileres (list/[id]/nuevo, LiquidacionesTab, PaymentCard), clientes, leads, calendario, agenda-cobros, liquidaciones, finanzas — delegated
- [ ] D5 — Remaining modules + admin + emails — delegated

## Checks per task
`npx tsc --noEmit -p .`; eslint on touched files (no new errors); `npx vitest run`; rg count of off-brand classes in touched files = 0; public pages unaffected (curl /, /alquileres, /login render, no `#0b0f17`); visual check in the browser (needs the owner logged in).

## Progress
- Branch created; feature doc written.
- D1/D2 implemented by delegated writer (uncommitted, awaiting parent verification):
  - Tokens: `landing-theme.css` color/shadow/radius tokens now on `.landing-page, .app-theme`; type/spacing/motion tokens stay `.landing-page`-only (they collide with Tailwind's `--text-*`/`--ease-*`).
  - `layout.tsx` back to HEAD (no `dark`/navy on html/body); `globals.css` `:root` back to main; `@theme inline` adds `--font-heading` (Montserrat); `.app-theme` + `.app-theme .font-sans` use Inter Tight.
  - ClientLayout dashboard wrapper: `app-theme dark` + font variables + paper/ink. ThemeProvider dark-only, no `<html>` mutation; toggle removed from DashboardHeader.
  - Override layer re-scoped `.dark [data-dashboard]` → `.app-theme` (covers header/sidebar), all token-based; HEAD rules restored; 229 generated off-brand remaps (indigo/violet/purple/cyan/sky/blue/teal/fuchsia, all variants: hover/focus/focus-within/group-hover/peer-*/dark:/prose-a).
  - Hex → `var(--color-*)` in page.tsx, sidebar, header, shell, MiniCalendar, AnnouncementBanner.
  - Brand: `src/ui/components/brand/Wordmark.tsx` (sidebar expanded + compact "ZP"); `BrandLoader` in LoadingSpinner used by AuthGuard and dashboard/loading; bronze ring spinner with `motion-reduce`.
  - Icons regenerated (sharp): icon.png 64, apple-icon.png 180, icon-192/512, favincon.png 64, favicon.ico (PNG-in-ICO 16/32/48). loading.png restored to HEAD (unreferenced).
- Evidence: `tsc` exit 0; vitest 21/21 files pass (first run 4 cold-import timeouts, rerun green); eslint no new errors (ThemeContext 1→0); `/`, `/alquileres`, `/login` 200 with 0 `0b0f17`/`class="dark"`.
- Pending: browser visual check (owner login); D3 header indigo classes (9) remain by design.
