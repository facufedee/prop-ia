# Feature: social-auto-publish

## Objective
When a blog post gets published, notify a Make.com custom webhook with the post data, public JPEG image URLs and ready captions so Make posts it to Instagram and LinkedIn.

## Why
Manual posting from the /social generator is repetitive; the marketing agent already publishes posts autonomously.

## Scope / constraints
- No new dependencies (sharp is used as Next.js' own optional dependency, imported lazily).
- Never throw from the notifier; publishing must never fail because of social.
- Idempotent via `socialAnnouncedAt`; force re-send only from the generator button.
- No secrets or webhook URLs in logs.

## Route
Delegated direct (one bounded writer): 2+ non-trivial files (route, lib, dashboard, generator page, tests, docs).

## Tasks
- [ ] T1 JPEG output: `type=jpeg` on `/api/social/blog/{id}/image` converts via sharp (q88), PNG default unchanged.
- [ ] T2 Caption builder `src/lib/social/blogCaptions.ts` (IG <= 2,200, 3-6 hashtags; LinkedIn <= 3,000, <= 3 hashtags, URL), used by the generator page. Tests: `src/__tests__/blogCaptions.test.ts`.
- [ ] T3 Notifier `src/lib/social/announceBlogPost.ts` (not-configured / not-found / unpublished / scheduled skips, already-announced, force, 8s timeout, success flag, failure error). Tests: `src/__tests__/announceBlogPost.test.ts`.
- [ ] T4 Hooks: cron publish route (`social: {status}`), admin route `POST /api/social/blog/{id}/announce` (verifyAdmin), dashboard BlogForm on draft -> published, generator button "Enviar a redes ahora" (logged-in only, confirm, "Ya enviado el ...").
- [ ] T5 Docs `docs/social-auto-publish.md` (Spanish): env vars, Make scenario, sample payload, requirements, testing, duplicates.

## Acceptance / checks
- RED then GREEN for both new test files; full `npx vitest run`; `npx tsc --noEmit -p .`; eslint on touched files (no new errors).
- `curl .../image?format=instagram&type=jpeg` -> 200 image/jpeg; default -> image/png.
- `curl -X POST .../announce` without auth -> 401.

## Progress / evidence (writer run, uncommitted)
- RED: both new test files failed (module not found), 8 failed tests reported.
- GREEN: 17/17 in the two new files; full suite 21 files / 153 tests passed.
- tsc: clean. eslint: only pre-existing `no-explicit-any` errors in the cron route and a pre-existing `<img>` warning in BlogForm.
- curl JPEG: `200 image/jpeg` (linkedin JPEG verified 1200x627); PNG default `200 image/png`; announce without auth `401`.

## Next step
User: set `MAKE_SOCIAL_WEBHOOK_URL` / `MAKE_SOCIAL_WEBHOOK_SECRET` in Vercel, build the Make scenario per docs, deploy, test with the generator button. Parent: review, check off tasks, commit.
