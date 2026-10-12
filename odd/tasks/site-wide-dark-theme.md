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
- [ ] T6 — Legal + error pages. Route: delegated writer.

## Checks
- `npx tsc --noEmit -p .`, eslint on touched files (no new errors), `npx vitest run`, browser pass per group at 1440 and 375 (no overflow, contrast AA on solid backgrounds, no light leftovers).

## Delivery
- Branch `feat/landing-dark-warm` (already holds the landing work). Work-unit commit per task.

## Progress
- 2026-10-11: document created. Google prompt close button enlarged (3fa9bc4).
