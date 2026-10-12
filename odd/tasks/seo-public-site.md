# SEO for the public site

Branch: `feat/landing-dark-warm` · Delivery strategy: ask-on-risk

## Objective
Make every public page (all routes except /dashboard) crawlable, canonical and correctly described so Google can index and rank zetaprop.com.ar.

## Problem (audit 2026-10-12, verified spot checks)
- `(main)/layout.tsx` sets `alternates.canonical` to the home, inherited by every page without its own (confirmed on /faqs).
- `robots.ts` disallows `/_next/` (blocks JS/CSS/images for Googlebot) (confirmed).
- Funnel/auth pages are indexable; `/firebase-check` debug page is public.
- Property pages: unlimited URL variants, client-only content (0 h1 in SSR), JSON-LD rendered as a meta tag, "Venta de Venta" titles, internal links never hit sitemap URLs.
- Titles duplicate the brand; several descriptions > 160 chars; OG images point to missing files.
- Structured data: home FAQPage not on page, duplicated SoftwareApplication, no BlogPosting / FAQPage on /faqs / breadcrumbs.
- Agency subdomains canonicalized to main domain → fixed by merging `fix/agency-site-canonical` (a326957).

## Constraints
- No over-promising copy; no fabricated ratings/numbers in structured data.
- Agency sites (`src/app/sites/**`) unchanged except canonical handling.
- Push/PR/merge to main are the user's decision.

## Tasks
- [x] S0 — merge agency canonical fix (a326957) — inline (git state op)
- [x] S1 — indexing basics: canonicals per page, robots, noindex for funnel/auth pages, delete /firebase-check, title template, descriptions 120–160, sitemap fixes, remove debug headers — delegated (2+ non-trivial files)
- [ ] S2 — property URLs: one `propertyUrl()` helper, canonical redirects, server-rendered detail, real JSON-LD, honest titles — delegated
- [ ] S3 — structured data + OG/icons: remove fake FAQPage, dedupe entities, offers on /precios, BlogPosting, FAQPage on /faqs, BreadcrumbList, OG image route, apple-icon, manifest, themeColor — delegated
- [ ] S4 — keywords in h1s, blog → module CTAs, alt text — delegated
- [ ] S5 — performance: unused fonts, home catalog download, hero responsive image — delegated

## Checks per task
`npx tsc --noEmit -p .`, `npx vitest run`, eslint on touched paths (no new errors), curl rendered HTML for canonical/robots/title/h1/JSON-LD.

## Progress
- S0 done: a326957.
- S1 implemented (delegated writer, uncommitted; checkbox left for parent):
  - Removed home canonical from `(main)/layout.tsx`; self-canonicals on all 15 indexable routes (new `faqs/layout.tsx`, `/contacto`, `/modelo`, `/propiedades` page-level metadata). Layout OG `url` removed so pages without OG don't inherit og:url = home.
  - Title template `%s | Zeta Prop`; brand suffixes removed; home uses `title.absolute`. Descriptions 120–160 chars, no numbers.
  - robots.ts: removed `/_next/`; added `/sites/` (subdomain `/robots.txt` is rewritten to `/sites/{slug}/robots.txt` → 404, so main robots never applies to agency hosts) and `/social/`.
  - noindex layouts: login, register, forgot-password, checkout, verify, verify-email, invitacion, unsubscribe, newsletter, access-denied; busqueda = noindex,follow.
  - Deleted `/firebase-check`. Sitemap: +faqs/modelo/cookies, −busqueda, no request-time lastModified on static pages, blog/property lastmod from data, sold/inactive listings excluded.
  - proxy.ts: X-Debug-* headers removed (lookup error now logged server-side). `<html lang="es-AR">`, themeColor `#110f0d` (also inherited by /dashboard, which has no own viewport).
  - Pending/out of surface: `/portal/inquilino/*` still indexable (`portal/layout.tsx` is a client component, can't export metadata); `/[operation]/[slug]` 404 still emits noindex + layout `index, follow` (comes from not-found boundary metadata → fix in `(main)/not-found.tsx` or S2).
  - Evidence: tsc exit 0; vitest 18 files/122 tests pass; eslint no new errors; curl (Googlebot UA) self-canonicals on 15 routes, noindex on funnel pages; sitemap 116 URLs; no X-Debug headers.
  - Parent follow-up: tenant portal noindex via `portal/inquilino/layout.tsx`; removed explicit index/follow from `(main)/layout.tsx` robots so 404s only carry noindex. Verified with curl (Googlebot UA).
