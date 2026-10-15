# Dashboard: property insights (latest, most inquired, most viewed)

Branch: `feat/dashboard-dark-warm` · Delivery: ask-on-risk

## Objective
On the dashboard home, show each user (1) their 8 latest properties in two rows of 4, (2) their most inquired properties (from existing leads), and (3) their most viewed properties, backed by a new view counter.

## Facts (verified 2026-10-14)
- No property view tracking exists today.
- Leads store `propertyId` (`src/domain/models/Lead.ts:32`, `/api/leads` route), so "most inquired" has data now. Leads are created for all plans; the Consultas page is Pro-only.
- `firestore.rules` exists (properties at :42, leads at :70); rule changes must be deployed by the owner.

## Decisions (owner)
- Do both: "Más consultadas" now + view counter that starts at zero.

## Tasks
- [x] P1 — View counter: server API route that increments a per-property counter (bots filtered by user agent, per-session dedupe, owner views excluded), called from the public property detail on the main portal and on agency sites; stats readable by the property owner (firestore.rules) — delegated
- [x] P2 — Dashboard home: "Tus propiedades" grid (8 latest, 2×4, 2 cols on mobile), "Más consultadas" (top 5 by leads), "Más vistas" (top 5 by views, empty state until data exists) — delegated

## Checks
tsc; vitest (new unit tests for bot filter + ranking helpers); eslint no new errors; curl the view endpoint (bot UA → not counted, normal UA → counted once per session id); dashboard visual check (owner login).

## Progress
- Feature doc created.
- 2026-10-14 — P1 + P2 implemented by a delegated writer (route: delegated direct; trigger: 2+ non-trivial files). Not committed; awaiting parent spot check and owner visual check.

### P1 — view counter (implemented)
- Route `src/app/api/properties/[id]/view/route.ts` (POST, Node runtime). Contract: 200 `{counted:true}` = counted; 204 = ignored, no write (bot/preview/empty UA incl. curl/wget, unknown property, `status == 'inactive'`, property without `userId`, verified token uid == owner, session already counted today); 400 = malformed id/sessionId (`[A-Za-z0-9_-]`, ≤64); 500 = Firestore failure. Unknown property → 204 (chosen: tracker never needs to distinguish, avoids existence probing). Invalid/expired token → treated as anonymous.
- Data model (Admin SDK only): `property_stats/{propertyId}` `{ ownerId, views: increment, lastViewedAt, viewsByDay: {'YYYY-MM-DD' (UTC): increment} }` — buckets older than 90 days are deleted on each counted write (one extra stats read per counted view). Dedupe: `property_view_keys/{propertyId}_{sessionId}_{YYYYMMDD}` via `create()` (ALREADY_EXISTS → 204), with `expiresAt` = now + 2 days.
- **Owner action**: enable a Firestore TTL policy on collection group `property_view_keys`, field `expiresAt` (Console → Firestore (database `propia`) → TTL), otherwise keys accumulate (harmless, just storage).
- Helpers `src/lib/propertyViews.ts` (`isBotUserAgent`, `dayKey`, `pruneViewsByDay` → returns keys to delete). Client hook `src/lib/useTrackPropertyView.ts` (sessionStorage session id + per-property flag, waits `auth.authStateReady()` and sends the ID token if logged in, `keepalive`, never throws). Called with `property?.id` in `PropertyDetailClient.tsx` (portal) and `sites/[slug]/propiedades/[id]/page.tsx` (agency site).
- `firestore.rules`: `property_stats` read by `ownerId == auth.uid` or `isAdmin()`, no client writes; `property_view_keys` deny all. **Not deployed.**

### P2 — dashboard home (implemented)
- New components `src/ui/components/dashboard/RecentPropertiesGrid.tsx` (8 latest by max(updatedAt, createdAt), `grid-cols-2 lg:grid-cols-4`, 4/3 cover, title, locality, price, operation + status badges, links to `/dashboard/propiedades/editar/{id}`, empty state + skeleton) and `PropertyRankingList.tsx` (ranked rows: thumbnail, title, metric, optional detail).
- `dashboard/page.tsx`: reuses the existing branch-aware `properties where userId == uid` query from `computeStats` (same source as the Propiedades page) and the already-loaded `leadsService.getLeads` data. New full-width "Tus propiedades" right after the announcement banner, then "Más consultadas" + "Más vistas" side by side (`lg:grid-cols-2`, stacked on mobile). Existing "Propiedades" inventory/limit KPI block kept (it is a plan-usage KPI, not a recent-properties list).
- "Más vistas": `property_stats where ownerId == uid orderBy views desc limit 20`, filtered to properties visible under the selected branch, top 5, with "últimos 7 días: N". Any error (e.g. rules/index not deployed) → empty state, warned once.
- Ranking helpers `src/lib/propertyRankings.ts` (`topByLeads` counts a lead once per property across `propertyId` + `consultas[].propertyId`; `viewsLastDays`).
- `firestore.indexes.json`: composite index `property_stats (ownerId ASC, views DESC)`. **Not deployed.**

### Owner deploy (pending)
`firebase deploy --only firestore:rules,firestore:indexes` (firebase.json targets database `propia`), then enable the TTL policy above.

### Verification evidence (2026-10-14)
- RED observed: new test files failed on missing modules; GREEN: `propertyViews` + `propertyRankings` 24/24, `propertyViewRoute` 8/8 (bot, owner, first view increments + TTL key, same-session dedupe, 90-day prune, invalid token, unknown/inactive, malformed session).
- `npx vitest run`: 185/185 passed (first run had 4 cold-import timeouts in existing newsletter/blog tests; rerun clean).
- `npx tsc --noEmit -p .`: clean.
- eslint on touched files: new files 0/0; touched existing files equal to HEAD baseline (dashboard 13E/1W, sites detail 5E/4W, portal detail 0/0).
- curl dev server: Googlebot UA → 204; browser UA with malformed sessionId → 400. Browser-UA counted call skipped: dev server uses the production Firestore (`propia`); counting/dedupe verified via route tests.
- Pending: owner visual check of the dashboard home (login required).
