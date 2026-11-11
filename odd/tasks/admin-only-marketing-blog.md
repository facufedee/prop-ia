# Admin-only marketing and blog

## Objective

Restrict `/dashboard/marketing` and `/dashboard/blog` to platform admins ("Super Admin" / "Administrador", plus the owner email). Client roles (Cliente Pro, Cliente Enterprise, Agente) had both by default.

## Why

Marketing edits ZetaProp's own email templates and bulk campaigns; publishing a blog post auto-announces it on ZetaProp's Instagram/LinkedIn (Make.com webhook). Neither belongs to a client.

## Scope / constraints

- Branch `fix/admin-only-marketing-blog`. No push / PR without asking.
- Do not run the Firestore cleanup against production without asking.
- Out of scope: IG carousel publisher under `/dashboard/admin/redes`.

## Tasks

- [x] T1 Shared admin-only list + idempotent strip planner (`src/lib/roles/adminOnlyPermissions.ts`). Route: inline.
- [x] T2 One default permission map (`DEFAULT_ROLE_PERMISSIONS`) for seed and sync; no admin-only routes for non-admin roles; `syncDefaultRoles` strips them from existing non-admin roles. Route: inline.
- [x] T3 `scripts/strip_admin_only_permissions.mjs` (dry run by default, `--apply` writes). Not run against production.
- [x] T4 Server enforcement: `firestore.rules` `blog_posts` write/draft read -> `isAdmin()` (blog CRUD/publish uses the client SDK, so rules are the server gate); `/api/blog/generate` and `/api/social/generate` `verifyAuth` -> `verifyAdmin`. Already admin: `/api/marketing/templates`, `/api/marketing/send`, `/api/admin/bulk-email`, `/api/social/blog/[id]/announce`.
- [x] T5 Page guards: `AdminGuard` layouts for `dashboard/marketing` and `dashboard/blog`; sidebar hides admin-only routes for non-admins.
- [x] T6 Tests: `verifyAdmin.test.ts`, `adminOnlyRoutes.test.ts` (RED observed on the old generate routes), `adminOnlyPermissions.test.ts`, rules cases in `scripts/test_firestore_rules.mjs`.

## Checks

See commit body / session report for observed results.

## Next step

User decides: run the strip script (dry run, then `--apply`) or use Roles y Permisos -> sync; deploy `firestore.rules`; push / PR.
