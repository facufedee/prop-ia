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
- [x] D3 — Shell + icons: header, sidebar menu icons, footer, AnnouncementBanner, dashboard home cleanup — delegated
- [x] D4 — High-traffic pages: propiedades (PropertyWizard), alquileres (list/[id]/nuevo, LiquidacionesTab, PaymentCard), clientes, leads, calendario, agenda-cobros, liquidaciones, finanzas — delegated
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
- D3 implemented by delegated writer (uncommitted, awaiting parent verification):
  - Icon style: lucide `strokeWidth={1.5}`, 18px sidebar / 16px submenus, muted by default; active item = ink text/icon on paper-2 with the bronze left border (submenus too). No icon tiles.
  - Sidebar icon remap (no duplicate top-level icons; submenus no longer reuse parent icons): Plantilla LayoutTemplate, Identidad BadgeCheck, Contacto y Redes AtSign, Dominio Link2, SEO Search, Noticias Newspaper, Chat MessagesSquare, Emprendimientos Building, Mensajes Inbox, Agentes Contact, Multi Sucursal Store, Inquilinos KeyRound, Propietarios UserRound, Panel de Contratos ScrollText, Pipeline Kanban, Reportes de Ventas ChartLine. Tasación keeps Calculator. Unused imports (Crown, Menu, CreditCard, Bot, Sparkles, Building2, TrendingUp, date-fns) removed.
  - Header fully tokenized (branch dropdown paper-2/rule, accent unread badge, paper-3 avatar with ink initial, notifications as tone-colored icons without pastel circles, danger logout).
  - Footer: emoji removed, muted xs text. AnnouncementBanner: paper-2 + rule border + 2px tone bar, no tinted icon tile.
  - Home: 16 unused imports, unused `userRole/userPermissions` and `TUTORIALS` removed; Quick Add accent tile removed; emerald/rose to positive/danger tokens; all icons 1.5 stroke.
  - Shared: `ui/` only holds InfoAlert (tokenized; currently unused), LoadingSpinner (already tokenized in D2) and WhatsappButton (public site, WhatsApp brand green, untouched). No Button/Badge/Card/Modal primitives exist. OnboardingModal (dashboard layout) tokenized: ink pill primary, outline secondary, accent focus ring. MiniCalendar light variants dropped.
  - Portals: FichasPdfModal (PropertyCard) wraps the portal in `app-theme dark` and is tokenized. OnboardingTour also portals but is not imported anywhere, left untouched. Unused dashboard components EstimationChart/LastEstimations/QuickActions left as-is.
- D3 evidence: `tsc` exit 0; vitest 21/21 files, 153 tests pass; eslint on 9 touched files: 0 unused-vars (home dropped 18 unused-var warnings; remaining no-explicit-any/react-hooks/no-img-element are pre-existing); off-brand rg = 0 except `slide-in-from-top-2` (animation class, false positive); Sparkles/Bot/Wand rg = 0; `/login` 200.
- Pending: browser visual check (owner login).
- D4 implemented by delegated writer (uncommitted, awaiting parent verification):
  - Method: scripted class remap (neutral grays -> paper/ink/muted/rule tokens; green/red/amber families -> positive/danger/warning (+ -soft); indigo/violet/purple/blue/sky/cyan/teal/fuchsia -> accent / accent-soft; gradients flattened), then manual passes: accent primary buttons -> ink pill/paper text (36), pastel icon tiles -> paper-3 circle + muted icon, lucide `strokeWidth={1.5}`, `font-heading` on h1, accent focus rings `/40`, per-name avatar colors/gradients -> neutral paper-3 avatars.
  - Propiedades: page, PropertyCard, editar/[id], nueva; PropertyWizard, StepIndicator, GoogleMap; FichaThumbnail (wireframe hex -> token fills); tables/PropertiesTable (component only rendered by dashboard; print routes import only the `Property` type). Portfolio banner gradient -> paper-2 card with ink pill button.
  - Alquileres: page, nuevo, [id] (+ LiquidacionesTab, ServicesTab, ServiceChargeForm), IPCAdjustmentModal, Maintenance*, PaymentCard (WhatsApp hex -> positive tokens, emoji removed from alert copy), PaymentEditModal, PaymentHistoryModal, PaymentPlanTable, PropertySelector, RentalCard, RentalsTable, UploadDocuments; modals/ContractGeneratorPreviewModal (only used by alquileres/[id]); forms/ClientSelector (only used by alquileres/nuevo).
  - Agenda de cobros, Liquidaciones: page headers' gradient icon tiles -> paper-3 circles.
  - Finanzas: Recharts colors via new `src/lib/chartColors.ts` (`useChartColors`, useSyncExternalStore reading `--color-*` from `.app-theme` with getComputedStyle; `var(--color-*)` fallback on server); tooltip themed.
  - Clientes: page, ClientDetailClient, ClientFormModal, Inquilinos/Propietarios/LeadsTable, LeadAgendaSidebar; modals/LimitReachedModal (used by ClientFormModal + PropertyWizard; Zap -> Crown, gradient -> paper-3 panel).
  - Leads: page, LeadCard, KanbanCard, KanbanColumn, NewLeadModal, PipelineMetrics. Emoji removed (source/priority labels, urgency badges, "Cerrado" column title); priority emoji -> tone dot with title/aria-label; contactado/visita/negociacion columns neutral, nuevo accent, seguimiento warning, cerrado positive, perdido muted.
  - Calendario: page, nueva, [id].
  - Sparkles (cover image) -> Star, Zap (services, priority label) -> Check / Flag.
- D4 evidence: 48 files changed + 1 new (`src/lib/chartColors.ts`); off-brand rg (indigo..fuchsia/bg-gradient/6-digit hex) 495 -> 0 lines; legacy palette lines 1585 -> 14 (all `bg-black/40-50` modal backdrops, intentional); `dark:` 0; emoji 0; `tsc` exit 0; eslint on touched files 68 errors / 110 warnings vs HEAD 68 / 111 (no new; remaining no-explicit-any/no-unused-vars/exhaustive-deps pre-existing); vitest first run 3 files failed on cold-import timeouts, rerun 21/21 files, 153 tests pass.
- Pending: browser visual check (owner login).
