# Feature: site-wide-dark-theme

## Objective
Every public page (everything except the app under /dashboard) uses the landing's dark warm style: LandingNav/LandingFooter, `.landing-page` tokens (charcoal paper, warm ink, bronze accent), Montserrat headings + Inter Tight body.

## Scope
- In: precios, servicios, nosotros, faqs, contacto, modelo, blog (index + post), propiedades (listing, [slug], p/[id]), [operation]/[slug], busqueda, login, register, checkout (+success/failure/pending), verify, verify-email, invitacion/[token], newsletter/confirmar, unsubscribe, terminos, privacidad, cookies, access-denied, not-found.
- Out: /dashboard (app), /sites/* (customer sites with their own templates), (tenant) inquilino portal, (main)/portal/inquilino (mock, cleanup task pending), (print), (social), firebase-check.

## Decisions
- Merge `feat/blog-index-redesign` into this branch first so the redesigned blog is the one restyled.
- Chrome: ClientLayout renders LandingNav/LandingFooter and the `.landing-page` theme wrapper (with fonts) for all public routes; LandingNav gains the signed-in state the old Navbar had.
- Page content uses theme tokens (`var(--color-*)`) and existing landing classes (l-section, l-container, l-section__title, l-eyebrow, l-btn, l-faq, l-cta-band, l-field/l-input) instead of light Tailwind grays and indigo.
- Copy is not rewritten in this feature (except where it contradicts verified capabilities, handled by the separate false-claims task).

## Tasks
- [ ] T0 — Merge blog redesign branch. Route: inline.
- [ ] T1 — Shared chrome + theme wrapper + signed-in LandingNav. Route: inline.
- [ ] T2 — Marketing pages. Route: delegated writer.
- [ ] T3 — Blog index + post. Route: delegated writer.
- [ ] T4 — Property portal pages. Route: delegated writer.
  - Progress (uncommitted): listing, busqueda, [agency], [operation]/[slug] -> detail, ContactModal, PropertiesGrid, PropertyDisclaimer, PropertyMapInner, SimilarPropertyCard restyled with s- classes. PropertyHero / PropertyPublicCard / PublicMap gained opt-in tone="dark" (default light path unchanged vs HEAD: git diff shows only added lines plus the signature line gaining the defaulted prop). src/app/sites untouched. tsc clean; eslint shows only pre-existing errors. Browser pass at 1440/375 still pending.
- [ ] T4b — Property detail redesign (gallery grid + sticky price/contact card). Route: delegated writer.
  - Done (uncommitted, not browser-verified): top row (back circle with history-aware back, breadcrumb, share + save icon buttons reusing existing handleShare/handleSave localStorage), desktop gallery main 3fr + side 2x2 grid with layouts for 1-5+ items and +N overlay opening the existing lightbox, mobile scroll-snap swiper with counter, video tile opens an embed overlay. Two-column layout (grid areas head/aside/body; aside sticky at >=64rem, between head and body on phones). Specs pills only for fields with data (area, ambientes, baños; no cochera field exists). Anchor tabs Descripción/Características/Ubicación, all content in DOM. Price card: operation label, accent price, expensas when present, agency block, Enviar consulta (ContactModal), WhatsApp + Llamar only when agency.phoneNumber exists. Removed the hard-coded 5.0 rating and the fake WhatsApp fallback number. Lightbox restyled with tokens. Obsolete s-stage/s-thumb/s-specs/s-panel/s-agent CSS removed.
- [ ] T5 — Auth/funnel pages. Route: delegated writer.
  - Progress (uncommitted): /login and /register restyled via new presentational `src/ui/components/auth/AuthShell.tsx` (wordmark, single h1, form column; LANDING_PHOTOS.hero panel with scrim + one line at >=1024px, hidden below) and `.s-auth*` classes in site-pages.css (paper-3 inputs 48px/16px, accent focus ring, ink pill submit, paper-2 outlined Google button, danger-soft alert). Handlers, state, effects, redirects and copy unchanged (register: strength bar colors mapped to danger/warning/positive tokens; gift emoji dropped from the trial badge). tsc clean; eslint only pre-existing `no-explicit-any` in the unchanged catch blocks; both routes return 200; no gray/indigo/violet/bg-white left.
  - [ ] Browser pass at 1440/375 for login/register (pending, parent).
  - [ ] Remaining T5 pages: checkout (+states), verify, verify-email, invitacion, newsletter/confirmar, unsubscribe.
    - Progress (uncommitted, not browser-verified): all nine routes restyled, presentation only. New `.s-util*` classes (shell clearing the nav pill with 16px phone gutters, centered paper-2 card with rule border, status mark in positive/warning/danger/accent soft circle, Montserrat title, accent text link, outlined ghost pill, loading state) and `.s-checkout*` classes (two columns 7fr/5fr at >=64rem with sticky payment/summary aside, single column below; segmented billing control and method cards with 48px+ targets and aria-pressed). Reuses `.s-auth-submit` (ink pill, now also on links), `.s-auth-input` (+ `--plain` variant and disabled style), `.s-auth-form`, `.s-auth-label`, `.s-auth-alert`, `.s-page-title`, `.s-page-lede`. Mercado Pago button moved from brand blue to the ink pill. Removed: celebration and lightbulb emoji, the "←" glyph (now a lucide arrow), the duplicate copyright lines in newsletter/unsubscribe. Each render branch has exactly one h1. Hooks, handlers, fetches, redirects and copy unchanged (diffed). tsc clean; eslint identical to baseline (7 errors/6 warnings, all pre-existing any/unused/deps); all nine routes 200 before and after; no gray/indigo/violet/white/gradient classes left.
    - [ ] Browser pass at 1440/375 for checkout (+ credit, transfer, logged-out states) and status pages (pending, parent).
- [ ] T6 — Legal + error pages. Route: delegated writer.
- [ ] T7 — Remove unverified marketing claims on /precios, /faqs, /servicios. Route: delegated writer (copy verified against dashboard/services/api code before each change).
  - Progress (uncommitted, pending parent verification): pricing FAQ moved to `src/ui/components/pricing/pricingFaqs.ts` and reused by the FAQPage JSON-LD; yearly "-17%" badge now derived from plan prices (hidden when 0). Removed/rewrote: Enterprise API/SLA/24-7, read-only trial mode, Amex/MercadoPago-wallet claim, Excel/portal import, WhatsApp-priority/account executive support, "Cancelá cuando quieras" (no cancel UI; payments are one-off, so "Sin débito automático"), matching, Google Calendar, automatic reminders, day-by-day punitorios, sale contracts/PDF contracts, Excel exports, "menos de 10 minutos", "todas las funcionalidades" trial. Mi Sitio (subdomain) moved to available; roadmap relabeled "En evaluación" without dates. Shared plan data (`src/infrastructure/data/plans.ts` / Firestore `plans`) untouched.
- [ ] T8 — clean plan feature claims in Firestore (script ready; user runs --apply). Route: delegated writer.
  - Progress (uncommitted): `src/infrastructure/data/plans.ts` `features` + `featuresList` cleaned (seed; `import type` so Node can load it); `scripts/clean_plan_claims.ts` (dry run by default, `--apply` writes only `features`, `featuresList`, `updatedAt` on existing basic/professional/enterprise docs, imports the lists from plans.ts). `/precios` (PricingTable) and home Pricing render `features`; `featuresList` is read only by the AI chat tools; `usePlanPermission.canAccess` is never called, so neither field gates access (gating = role permissions in roleService.ts). Not changed: plan `description` ("con marca propia", "Automatización…") — script never touches it. Run: `node --env-file=.env.local scripts/clean_plan_claims.ts [--apply]`.
- [ ] T9 — remove unverified claims from nosotros and modelo. Route: delegated writer (claims verified against src/lib/prediction, public/models, api/, dashboard code).
  - Progress (uncommitted): /nosotros superlative, client-base, cadence, automatic-backup, punitorios-automáticos, credentials and real-time/no-hidden-cost claims rewritten. /modelo: +450k/+25k/2015, Deep Learning, "precisión comprobada" and both chart PNGs (no training data, notebook or metrics in repo) removed; page now describes the TF.js neural network, its inputs, median fill and post-model adjustments, plus a transparency note. PNG files under public/images/model left in place (now unreferenced).

## Checks
- `npx tsc --noEmit -p .`, eslint on touched files (no new errors), `npx vitest run`, browser pass per group at 1440 and 375 (no overflow, contrast AA on solid backgrounds, no light leftovers).

## Delivery
- Branch `feat/landing-dark-warm` (already holds the landing work). Work-unit commit per task.

## Progress
- 2026-10-11: document created. Google prompt close button enlarged (3fa9bc4).
