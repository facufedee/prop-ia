# Firestore security rules (database `propia`)

Branch: `fix/firestore-rules` (from main 57624ec)

## Problem
- Live rules for `propia` were fully open (`allow read, write: if true`) since 2026-09-13 (ruleset 87d6d1c7): anyone could read/modify/delete all data.
- On 2026-10-14 the repo `firestore.rules` was deployed; it is secure but incomplete (default deny, missing collections such as `blog_posts`), which broke the app and the /blog prerender.
- Rolled back to 87d6d1c7 on 2026-10-15 02:21 UTC to restore service (owner decision). Open again until this task ships.

## Objective
Complete, least-privilege rules for every collection the CLIENT SDK touches (Admin SDK bypasses rules), verified with the Firebase Rules API test endpoint (no emulator: Java not installed), then deployed by the owner.

## Tasks
- [x] R1 — Inventory: every client-side Firestore read/write/query per collection (who: anonymous visitor, tenant portal, agency site visitor, logged-in owner, agent of an org, admin), with path:line — delegated (see ## Inventory)
- [x] R2 — Rules: write complete rules + test suite (Rules API `projects.test`), all tests passing — delegated (300/300 PASS; see ## R2). Deploy is blocked by the code issues listed under "Blocking code changes".
- [x] R2b — Code changes so every server/public flow works under the new rules without loosening them (Admin SDK on the server, API routes for anonymous lookups, constrained public queries) — delegated (see ## R2b). One wiring edit outside the writer's surface is pending (item 6).
- [ ] R3 — Owner deploys rules (`firebase deploy --only firestore:rules`), smoke test of public site + dashboard — owner

## Checks
Rules compile; Rules API test suite passes; `npx next build` passes (prerender reads with rules applied); no write rule `if true`.

## Progress
- Rollback done (ruleset 87d6d1c7 released on `cloud.firestore/propia`); local `next build` passes.
- R1 + R2 done on 2026-10-14 (bounded writer): inventory below, rules rewritten, Rules API suite 300/300 PASS, `npx tsc --noEmit -p .` clean.

## Inventory

Scope: web SDK only (`db` from `src/infrastructure/firebase/client`). Admin SDK code bypasses rules.
Web SDK code running on the server (pages, generateMetadata, sitemap, API routes) is **anonymous**.

### Actor model (from code)
- **Owner**: agency account; data owned via `userId == auth.uid`. Dashboard queries pass `auth.currentUser.uid` (e.g. `src/app/(main)/dashboard/clientes/page.tsx:57-59`, `src/app/(main)/dashboard/alquileres/page.tsx:35`).
- **Team / agent**: `users/{uid}.organizationId` = owner uid and `roleId` = the "Agente" role, written client-side at signup in `src/app/(main)/invitacion/[token]/page.tsx:98-121`, which also sets `agentes/{agenteId}.authUserId`. Agents query with their own uid. The only org-level reads are `branches` (`src/infrastructure/context/BranchContext.tsx:67-68`), `users` by org (`src/app/(main)/dashboard/calendario/nueva/page.tsx:73`), and `configuracion_comisiones` + branches by org (`src/app/(main)/dashboard/agentes/nuevo/page.tsx:41-45`).
- **Admin**: `users.roleId` is a generated role doc id (`src/infrastructure/services/roleService.ts:97`). Admin = role name "Super Admin"/"Administrador" (`src/ui/auth/PermissionGuard.tsx:52`, `src/lib/apiAuth.ts:55-70`) or the owner email (`src/lib/apiAuth.ts:45`). The old `roleId == 'admin'` helper never matched.
- **Permission holders**: `roles/{id}.permissions` lists dashboard routes (PermissionGuard model). "/dashboard/blog" is held by Pro, Enterprise and Agente; "/dashboard/emprendimientos" by Pro and Enterprise (`roleService.ts:228-357`).
- **Tenant portal**: no Firebase auth. `/inquilino` queries `alquileres` by `codigoAlquiler` anonymously (`alquileresService.ts:289`, `src/app/(tenant)/inquilino/page.tsx:36`) and reads by id (`src/app/(tenant)/inquilino/[id]/page.tsx:44`). `/api/portal/login` queries `alquileres` by `contractCode` with the web SDK, then signs a JWT (`src/app/api/portal/login/route.ts:23-27`).

### Collections (web SDK)
| Collection | Ops / query shape | Actor | Owner field | Evidence |
|---|---|---|---|---|
| users | get (anon agency info); list all (anon slug scan); list by organizationId / `__name__`; create self; update self; admin list/update/delete | anon, owner, agent, admin | doc id | `publicService.ts:167,202`; `firebaseAuthService.ts:21-53,102`; `calendario/nueva/page.tsx:73,76`; `adminService.ts:19,126,134`; `cuenta/page.tsx:111`; `portalIntegrationService.ts:19` |
| users/{uid}/config | transaction get/set receiptCounter | owner | path | `receiptService.ts:95` |
| roles | list, get, where name==; admin write | signed-in, admin | — | `roleService.ts:79-162,423`; `invitacion/[token]/page.tsx:106` |
| permissions_list | list; set (backfill) | admin | — | `roleService.ts:63-69` |
| plans | list, get, where tier==; admin write | anon, admin | — | `subscriptionService.ts:28,63`; `dashboard/page.tsx:221`; `PlanForm.tsx:91,98` |
| addons | list | (not used by UI) | — | `subscriptionService.ts:534` |
| properties | where publishToPortal==true (anon); where userId== only (anon agency sites); get (anon); owner CRUD; admin list | anon, owner, admin | userId | `publicService.ts:70,102-110,118-128,148`; `dashboard/propiedades/page.tsx:91-139`; `PropertyWizard.tsx:692,707` |
| alquileres | where userId (+estado); where codigoAlquiler (anon tenant); get by id (anon tenant, server API routes) | owner, anon | userId | `alquileresService.ts:25,220,289`; `src/app/api/alquileres/**`; `api/portal/login/route.ts:24` |
| inquilinos / propietarios | where userId; get; CRUD | owner | userId | `inquilinosService.ts:24`; `propietariosService.ts:22` |
| leads | where userId (+email / telefono / estado); CRUD; anon create from chat widget | owner, admin (`SYSTEM_ZETA_PROP`), anon | userId | `leadsService.ts:22,60,69,183`; `FloatingChatWidget.tsx:44`; `dashboard/leads/page.tsx:170` |
| visitas | where userId (+fechaHora range, agenteId, leadId, estado); CRUD | owner | userId | `visitasService.ts:25,46,155,177,199` |
| ventas | where userId orderBy createdAt; CRUD; updates properties.status | owner | userId | `ventasService.ts:76,101-170` |
| agentes | where userId; get; CRUD; invited user sets authUserId | owner, invited agent | userId (+authUserId) | `agentesService.ts:25-82`; `invitacion/[token]/page.tsx:98` |
| transacciones | where userId (+agenteId); CRUD | owner | userId | `agentesService.ts:105,122,139,169` |
| configuracion_comisiones | where userId (org id); create/update | owner, agent (read) | userId | `agentesService.ts:206-233` |
| invitations | create; anon where token== & status==pending; update status | owner, anon invitee | organizationId | `invitationService.ts:34,38,57` |
| branches | where organizationId (onSnapshot); CRUD | owner, agent (read) | organizationId | `branchService.ts:13-49`; `BranchContext.tsx:68` |
| rentalServices | where rentalId (+orderBy year/month, month, year); create; update | owner | createdBy | `rentalServicesService.ts:49-124` |
| carteles | where userId (+branchId) orderBy createdAt; CRUD | owner | userId | `carteleriaService.ts:50-164` |
| tickets | where userId orderBy createdAt/updatedAt; admin list/filter; CRUD | owner, admin | userId | `ticketsService.ts:29-440` |
| ticket_messages | where ticketId orderBy timestamp; create | owner, admin | userId (+ticketId) | `ticketsService.ts:246,283,298,417` |
| audit_logs | create (signed-in); where organizationId + filters orderBy timestamp; admin all | owner, admin | userId / organizationId | `auditLogService.ts:33,59-93`; `bitacora/page.tsx:59`; `adminService.ts:319` |
| notifications | create (signed-in → targetRole 'Administrador'); where targetRole==myRole / targetUserId==uid orderBy createdAt; update readBy arrayUnion | signed-in, admin | targetUserId / targetRole | `notificationService.ts:45,64,102-126` |
| subscriptions | where userId (+status) orderBy createdAt; owner cancel; admin CRUD; webhook writes (server, web SDK) | owner, admin | userId | `subscriptionService.ts:95,121,141,170`; `DashboardHeader.tsx:76`; `adminService.ts:152-293` |
| payments | where userId orderBy createdAt; admin create; webhook (server, web SDK) | owner, admin | userId | `subscriptionService.ts:202,217,312,433`; `adminService.ts:237,420` |
| sites | where userId; where slug (availability); create/update | owner | userId | `siteService.ts:53,68,83,97,108,117` |
| blog_posts | where published==true orderBy createdAt (anon /blog prerender, sitemap, novedades); where slug== & published==true; get by id (social page, dashboard); CRUD | anon, blog permission | — (global) | `blogService.ts:64,87,137,153,177-215`; `dashboard/page.tsx:170`; `(social)/social/blog/[id]/page.tsx:45` |
| developments | orderBy createdAt (+active==true); CRUD | emprendimientos permission | — (no owner field) | `developmentService.ts:70-132` |
| contact_messages | anon create; admin list/update/delete | anon, admin | — | `contactService.ts:12-46`; `ContactForm.tsx:72` |
| settings | get/set `email_notifications` | admin; server (web SDK) | — | `NotificationsTab.tsx:48`; `emailNotificationService.ts:54,73` |
| configurations | get/set mercadopago (encrypted) | server routes (web SDK) | — | `configService.ts:46,68` |
| emailLogs | admin where to== orderBy sentAt; server addDoc (web SDK) | admin, server | — | `adminService.ts:244`; `emailNotificationService.ts:8` |
| property_stats | where ownerId orderBy views | owner | ownerId | `dashboard/page.tsx:71-75` |
| chat_sessions(/messages) | set/add/list from API routes with the web SDK (anon) | server | — | `api/chat/send/route.ts:18`; `api/chat/sync/route.ts:14`; `api/webhooks/twilio/route.ts:61,67` |
| Admin SDK only | property_view_keys, newsletter_subscribers, newsletters, announcements, emailTemplates, verification, configuration | server | — | `src/lib/newsletter/**`, `src/app/api/admin/**`, `src/app/api/auth/**` |

Dead code: `src/infrastructure/ai/tools.ts` (unscoped properties/alquileres queries) is not imported. `backupService.ts` (admin pages) reads/restores 12 collections.

### Personal data exposed publicly
- `users/{uid}` public `get` (email, phone, roleId, organizationId, portalIds, ...) is kept because anonymous `publicService.getAgencyById` needs it (`publicService.ts:167`). Follow-up: serve agency info through the Admin SDK or a public `agency_profiles` projection, then restrict to signed-in.
- `alquileres` (DNI, bank data) and `chat_sessions` (keyed by phone number) are NOT public.

### Blocking code changes (needed before deploying the new rules)
1. Tenant portal: `alquileresService.verifyTenantAccess` (`alquileresService.ts:289`) and `getAlquilerById` from `src/app/(tenant)/inquilino/[id]/page.tsx:44`, plus `src/app/api/portal/login/route.ts:23,52,60` → move to API routes using `adminDb`.
2. Server routes using the web SDK (anonymous): `src/app/api/alquileres/route.ts`, `api/alquileres/[id]/route.ts`, `[id]/incidencia`, `[id]/pago`, `api/inquilinos/route.ts`, `api/cron/check-rentals/route.ts:10,32`, `api/webhooks/mercadopago/route.ts:58` + `api/payments/process-payment/route.ts:20,70` (subscriptionService.processPaymentWebhook, configService), `api/config/mercadopago/route.ts:10,45`, `api/config/mercadopago/public/route.ts:7`, `api/notifications/trigger/route.ts` (emailNotificationService settings + emailLogs), `api/chat/send/route.ts:18`, `api/chat/sync/route.ts:14`, `api/webhooks/twilio/route.ts:61,67` → use `adminDb`.
3. Agency public property lists query by `userId` only: `publicService.ts:107` (`getPropertiesByUserId`) and `publicService.ts:127` (`getPropertiesByAgencySlug`) → add `where("status", "==", "active")` (callers already filter `status === "active"` client-side).
4. Invitation lookup by an anonymous visitor: `invitationService.ts:38` → validate the token through an Admin SDK API route (or use the token as doc id with `get`).
5. Anonymous lead from the chat widget: `FloatingChatWidget.tsx:44` (`leadsService.createLead` queries leads anonymously) → POST to `/api/leads/public`.
6. Anonymous slug scan of all users: `publicService.ts:202` (already caught; returns null) → use Admin SDK if the slow path is still needed.

### Possibly blocked queries (rules use get() on a parent; not provable by the test endpoint)
- `rentalServicesService.ts:61,85` query only by `rentalId` → add `where("createdBy", "==", uid)`.
- `ticketsService.ts:283,417` (owner reading messages by `ticketId`) → admin replies have another `userId`; if the query is rejected, store `ticketOwnerId` on messages and filter by it.

## R2 — Rules + tests
- `firestore.rules`: helpers `isAdmin()` (owner email + verified, or role name), `hasPermission(route)`, `myOrgId()`; every collection above covered; server-only collections closed; default deny kept; reads `if true` only on `users` get and `plans`; no `if true` writes.
- Notable choices: users cannot change `roleId`/`organizationId`/`branchId`/`disabled`/`isVerified`/`verificationStatus`/`email`; self-signup only with role "Cliente Básico" (no org) or "Agente" (with organizationId); subscriptions/payments are admin-only writes (owner may only cancel); `properties` public when `publishToPortal == true` or `status == 'active'`; blog/developments gated by role permission; unused legacy blocks (`agents`, `transactions`, `commission_config`) removed.
- `scripts/test_firestore_rules.mjs`: Rules API `projects.test`, 300 cases sent in chunks of 50 (one large suite returns INVALID_ARGUMENT). Run: `node scripts/test_firestore_rules.mjs` (uses `GOOGLE_OAUTH_ACCESS_TOKEN` or `gcloud auth print-access-token`). Result: 300/300 PASS.
- Rules API quirk: mocked string values that start with "/" become paths, so `hasPermission` also checks `path(route)` (no effect in production).

## R2b — Code changes for the new rules (2026-10-15, bounded writer; route: delegated, writer trigger: 2+ non-trivial files)
Rules file unchanged. Uncommitted work of an interrupted writer (alquileres/inquilinos/cron routes, `alquileresService`, `configService`, `server/alquileresAdminService.ts`, `server/inquilinosAdminService.ts`, `api/alquileres/codigo`) was reviewed and kept; fixed the accent regex literal and removed `any`s in `alquileresAdminService`.

1. Server routes → Admin SDK — done.
   - alquileres/** + inquilinos + `/api/alquileres/codigo` (rental code uniqueness for the dashboard): `server/alquileresAdminService.ts`, `server/inquilinosAdminService.ts` (kept; `PUT /api/alquileres/[id]` strips `userId`/`id`).
   - cron/check-rentals: Admin SDK + notification written with `adminDb` (same shape).
   - Payments: activation moved to `server/subscriptionAdminService.ts` (same fields, statuses, role upgrade, notifications, emails; idempotent through the `pending` payment record); `processPaymentWebhook` removed from the client `subscriptionService`. `webhooks/mercadopago` and `payments/process-payment` call it. Tests: `src/__tests__/paymentActivation.test.ts` (7: bad signature, activation, replay idempotency, extension, not approved, process-payment approved/rejected) with `src/__tests__/helpers/fakeAdminDb.ts`.
   - config/mercadopago (+ public, create-preference): `configService.ts` is now `server-only` + Admin SDK; its only non-route caller was the payment flow above.
   - notifications/trigger: `emailNotificationService.ts` is `server-only` + Admin SDK (`settings`, `emailLogs`); only that route uses it.
   - chat/send, chat/sync, webhooks/twilio, portal/login: Admin SDK, responses unchanged.
2. Tenant portal — done. `POST /api/inquilino/acceso` {codigo, dni} → same matching as before (code upper-cased/trimmed, exact DNI), identical 401 `Datos incorrectos` + 1 s delay for wrong code or DNI, 10 attempts / 10 min per IP; returns `{alquilerId, token}` (HS256, `PORTAL_JWT_SECRET`, 2 h, bound to the rental). `GET /api/inquilino/[id]` with `Authorization: Bearer` returns only the fields the page renders (`server/tenantPortalAccess.ts#toTenantView`). Pages keep the same UI; the token lives in the existing `zeta_tenant_session` entry. Tests: `tenantPortalRoutes.test.ts` (4).
3. Agency site lists — done. `getPropertiesByUserId` adds `status == active` (all 3 callers already filter active); `getPropertiesByAgencySlug` merges `status == active` and `publishToPortal == true` (document-id order kept). Visible change: `/propiedades/[slug]` no longer lists properties that are neither active nor portal-published (the rules forbid that read).
4. Invitations — done. `GET /api/invitations/[token]` (Admin SDK, pending + unexpired, returns id/token/agenteId/email/branchId/organizationId/status/expiresAt); `invitationService.validateInvitation` fetches it. The page's signed-in writes (agentes link with `authUserId/phone/updatedAt`, roles query, `users` create with role Agente + organizationId, invitation `pending → used`) match the rules; no page change needed. Tests: `invitationRoute.test.ts` (2).
5. Chat widget lead — done. `FloatingChatWidget` POSTs to `/api/leads/public` (zod-validated, Admin SDK). Difference: the lead's `notas` are now `[]` (the endpoint does not accept notes), and the agent e-mail/in-app notification of that endpoint replaces the old `/api/notifications/trigger newLead` call.
6. Users slug scan — PENDING WIRING. Still used: agency links use `slugify(displayName)` (`PropertyDetailClient.tsx:221`), so `/propiedades/[slug]` needs the scan. Added `server/publicAgencyAdminService.ts` (Admin SDK, `select("displayName")`). Needed (outside the writer surface): in `src/app/(main)/propiedades/[slug]/page.tsx` call `publicAgencyAdminService.getPropertiesByAgencySlug(slug)` instead of `publicService.getPropertiesByAgencySlug(slug)`. Without it, name-slug agency pages 404 after the deploy (uid slugs keep working).
7. rentalServices — done: queries add `where("createdBy", "==", uid)`; `getServicesByRental` sorts year/month in memory (equality-only, no new index). Every create path sets `createdBy` to the signed-in owner; docs without `createdBy` (if any legacy ones exist) would no longer be listed. ticket_messages — unchanged: the `ticketId ==` queries rely on the rule's `get(tickets/ticketId).userId` branch with the equality-bound `ticketId`. If production rejects them, minimal fix without migration: serve messages through an Admin SDK route that checks ticket ownership; the alternative (`ticketOwnerId` on messages) needs a backfill.

Remaining web-SDK server code (all safe under the new rules): `(main)/page.tsx`, sitemap, propertySeo (`publishToPortal == true` query, public `properties`/`users` gets), blog pages/sitemap/novedades (`published == true` queries), `sites/[slug]` (Admin SDK via `siteData.ts`). `ClientFormModal.tsx`/`PaymentCard.tsx` lack "use client" but are only imported by client pages.

Verification: `npx tsc --noEmit -p .` clean; `npx vitest run` 27 files / 198 tests pass (first run had 4 cold-import timeouts in newsletter tests, rerun green); `node scripts/test_firestore_rules.mjs` 300/300 PASS; eslint on touched files: no new errors vs HEAD; `npx next build` passes.

Deploy prerequisites / follow-ups: wire item 6; `PORTAL_JWT_SECRET` must be set in production (the tenant portal now depends on it); `src/app/(main)/portal/inquilino/dashboard/page.tsx` falls back to a hard-coded JWT secret (fix); `chat/send`/`chat/sync` stay unauthenticated by session id (pre-existing); the `users` create rule lets any new account self-assign role "Agente" with any `organizationId` (consider validating invitations server-side); the payment "¡Suscripción Activada!" notification is sent with `targetRole = userId` (pre-existing, kept identical).
