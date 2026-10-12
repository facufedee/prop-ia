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
- [x] S2 — property URLs: one `propertyUrl()` helper, canonical redirects, server-rendered detail, real JSON-LD, honest titles — delegated
- [x] S3 — structured data + OG/icons: remove fake FAQPage, dedupe entities, offers on /precios, BlogPosting, FAQPage on /faqs, BreadcrumbList, OG image route, apple-icon, manifest, themeColor — delegated
- [x] S4 — keywords in h1s, blog → module CTAs, alt text — delegated
- [~] S5 — performance: unused fonts, home catalog download, hero responsive image — delegated

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
- S2 implemented (delegated writer, uncommitted; checkbox left for parent):
  - `src/lib/seo/propertyUrl.ts`: `propertySlug` (NFD, ≤80 chars, fallback "propiedad"), `propertyOperationSegment` (Alquiler/Alquiler Temporal → alquiler, else venta), `propertyPath`, `absolutePropertyUrl`, `propertyIdFromSlug`. Tests `src/__tests__/propertyUrl.test.ts` (RED: module missing → GREEN 12/12).
  - Canonical route `/[operation]/[slug]`: server-loads the property (React `cache`, Firestore values → ISO strings), 404 for unknown ops (`venta|alquiler|temporal|propiedad` accepted) or ids, 308 to `propertyPath()` on any op/slug mismatch. Metadata: `{title} – {localidad}` (locality skipped if already in title, ≤60), description from listing text (~155) with data fallback, self-canonical, OG url. Body JSON-LD `@graph` = RealEstateListing (offers → Offer + itemOffered House/Apartment/Accommodation/Place) + BreadcrumbList; `other['script:ld+json']` removed.
  - `PropertyDetailClient` takes `initialProperty`; renders from props on the server (client fetch only as fallback; similar listings still client-side). h1, price, specs, description, features in SSR HTML.
  - `/propiedades/p/[id]` → 308 server redirect. `/propiedades/[slug]` split into server `page.tsx` (agency listing loaded server-side + passed as initial data; property id → 308; unknown → 404; self-canonical, title "Propiedades de {agencia}" with absolute brand because the propiedades layout's string title drops the root template) + `AgencyPropertiesClient.tsx`.
  - Links → `propertyPath()`: PropertyPublicCard (main portal only; agency sites, detected via `basePath` prop or SiteProvider `site`, keep `{basePath}/propiedades/{id}`), SimilarPropertyCard, PropertyMapInner, PropertyHorizontalCard, PropertyNetworkCTA, feeds route, FichaTemplate, sitemap.
  - Evidence: curl 308 for /propiedades/p/{id}, /propiedades/{id}, /venta/wrong-{id}, /alquiler/{slug}-{id}, /temporal/x-{id}; canonical 200 with 1 h1, description, price, self canonical, RealEstateListing+BreadcrumbList, no `script:ld+json` meta; /propiedades/claudio-gomez 200 self-canonical; /propiedades has 8 canonical-format links. tsc exit 0; vitest 19/19 files (first run had 3 cold-import timeout files, rerun clean); eslint no new errors.
  - Pending: stored titles start with "Venta - …", so slugs read `venta/venta-casa-…` and the title keeps one "Venta -"; dashboard links (`/propiedades/p/{id}` in PropertiesTable, dashboard PropertyCard, ClientDetailClient, ClientFormModal) rely on the 308 (out of surface); h1 shows street+number (design unchanged).
- S3 implemented (delegated writer, uncommitted; checkbox left for parent):
  - `src/ui/seo/JsonLd.tsx`: `<JsonLd>` (escapes `<`), `breadcrumbList()`, stable ids `/#organization`, `/#website`, `/#software`. Used on every touched page incl. the S2 property page (`serializeJsonLd` removed) and the module-landing FAQPage scripts.
  - `(main)/layout.tsx`: `@graph` Organization (logo `Logo ZetaProp Fondo Blanco.png`, sameAs = footer Instagram + LinkedIn only, no locality claim) + WebSite (`publisher` → org, no SearchAction because /busqueda is noindex). Missing OG/twitter images removed; `manifest: '/manifest.json'`.
  - Home: fake FAQPage removed; single SoftwareApplication (`@id` /#software, no offers, no screenshot).
  - /precios: FAQPage (pricingFaqs) + SoftwareApplication `@id` /#software with one Offer per plan (name, monthly price, ARS, url /precios) read server-side from Firestore `plans` via adminDb (read-only, no seeding; `revalidate = 3600`; on error offers node omitted) + BreadcrumbList. Offers live only here.
  - /faqs: data extracted to `faqs/faqData.ts` (page imports it, no UI change); layout emits FAQPage (23 questions) + BreadcrumbList.
  - Blog post: BlogPosting (Person author when named, else org @id; publisher org; mainEntityOfPage canonical; image only when cover exists) + BreadcrumbList. Blog index: Blog + BreadcrumbList. OG images on posts without cover omitted (was `[]`).
  - /propiedades: `propiedades/layout.tsx` deleted (WebSite/RealEstateAgent/"líder… miles" JSON-LD + plain-string title); page emits CollectionPage + BreadcrumbList; agency page `/propiedades/[slug]` title now uses the template.
  - BreadcrumbList on /alquileres, /propiedades-gestion, /pagina-web, /servicios, /precios.
  - OG: `(main)/opengraph-image.tsx` (ImageResponse 1200×630, default font) + `twitter-image.tsx`; all images pointing to missing files removed (layout, home, precios, 3 landings, property fallback). Property OG = first photo or file-based default.
  - Icons: `src/app/apple-icon.png` 180, `public/icon-192.png`, `public/icon-512.png` from `Logo ZetaProp Fondo Negro 2.png` (1080 wordmark on black; the ZP mark only exists at 32px). manifest: dark colors, purpose `any` (wordmark is not maskable-safe), dropped portrait lock.
  - Evidence: tsc exit 0; vitest 19 files/134 tests pass; eslint on touched files: 1 pre-existing `any` (propiedades/page.tsx formatPostDate), none new.
  - Pending: curl verification of rendered JSON-LD/OG/icons NOT run — no dev server was listening on :3000 and starting one was denied. Parent must run the curl checks.
  - Parent follow-up: pages with their own openGraph lost the file-based image; added static `public/assets/img/og-default.png` via `src/lib/seo/ogImage.ts` on alquileres, propiedades-gestion, pagina-web, precios, modelo. Rendered check (Googlebot UA): JSON-LD types per page OK, all parse, FAQPage /faqs 22 = visible, og:image on all checked pages, icons/manifest 200.
- S4 implemented (delegated writer, uncommitted; checkbox left for parent):
  - H1 keyword kickers: `<span class="l-hero__eyebrow l-h1-kicker">` as first child of each h1 (+ `.l-hero h1 .l-h1-kicker` line-height rule). Home "Software para inmobiliarias"; the 3 module landings had an eyebrow `<p>` above the h1 → moved inside with the keyword text (alquileres "Software de gestión de alquileres", propiedades-gestion "CRM inmobiliario y gestión de propiedades", pagina-web "Página web para inmobiliarias"). Headlines unchanged. Home hero checked visually at 375 and 1440: no layout break.
  - Blog post: `.s-post-cta` aside after the tags, before the share box. Keyword match on category + tags (order: rentals → CRM/captación/tasación → web/SEO/marketing → venta/propiedad → default "/" "Conocé Zeta Prop").
  - `ArticleMarkdown` `fallbackAlt` prop (post title) for markdown images with empty alt. Public cards already use title / "title - Foto N".
  - Pending/out of surface: `PropertyDetailClient.tsx` gallery images (lines ~663, ~716) still `alt=""`.
  - Evidence (curl Googlebot): exactly 1 h1 on /, /alquileres, /propiedades-gestion, /pagina-web, each starting with its kicker; /blog/aumento-alquileres-octubre-2026 → /alquileres CTA, /blog/como-captar-mas-clientes-inmobiliaria → /propiedades-gestion, /blog/comprar-departamento-en-pozo-ventajas-riesgos (Inversión) → "/".
- S5 implemented (delegated writer, uncommitted; checkbox left for parent):
  - Home carousel: `publicService.getFeaturedProperties(8)` (same filter: publishToPortal, active, has photo, newest first) called on the server in `(main)/page.tsx`, mapped to plain `NetworkProperty` props with `href = propertyPath()`; `PropertyNetworkCTA` no longer imports the Firebase client service. Home `revalidate = 3600` (was static with no revalidation; no dynamic APIs found).
  - Unsplash `photoSrc()` default width 2400 → 1600 (PhotoHero 100vw, AuthShell 50vw). Modules keeps its explicit 2000/1400 (out of surface).
  - Hero image: kept as is. Re-encoding the 2400×1340 webp: 189,458 B → q72 173,396 B / q70 171,778 B (−9%, below the 20% rule, and lossy-on-lossy). A 1200px q72 variant is 62,110 B, but an SVG `<image>` has no srcset and two toggled SVGs may double-download, so it was not created.
  - Fonts skipped: Geist is used on public pages (Tailwind `--font-sans`/`--font-mono` map to Geist in globals.css; `font-mono` in ArticleMarkdown code and PropertyPublicCard; html default font). Dashboard layout is `src/app/(main)/dashboard/layout.tsx`. Home HTML references 3 woff2 files (unchanged).
  - Evidence: home SSR has 16 cards (8 × duplicated track), 8 unique links all `/{venta|alquiler}/{slug}-{id}`.
- S4/S5 checks: tsc exit 0; vitest 19 files/134 tests pass; eslint touched files: only pre-existing `any` (publicService.ts 30, 50) + unused `orderBy` warning.
  - S5 partial: Geist not scoped (globals.css maps Tailwind sans/mono to Geist; public pages use it); hero image kept (SVG <image> has no srcset; re-encode saves only ~9%). Done: home featured properties server-rendered (8, canonical links, revalidate 3600), Unsplash source width 1600.
