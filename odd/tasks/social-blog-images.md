# Feature: social-blog-images

## Objective
Re-brand the blog social generator (/social/blog/[id]) to the dark warm ZetaProp brand and render the images server-side so each one has a stable public URL a future auto-publisher (Instagram Graph API / LinkedIn API) can use.

## Scope
- Image route `src/app/api/social/blog/[id]/image/route.tsx` (next/og): `format=instagram` (1080x1350), `square` (1080x1080), `linkedin` (1200x627), optional `title` override (<=120 chars). Published posts only, else 404.
- Generator page uses the route (img preview, download, copy image link); suggested copy without emoji.
- Remove client-side canvases (InstagramCanvas, LinkedInCanvas) and html2canvas usage.
- (social) layout: robots noindex + Toaster.

## Tasks
- [ ] S1 — image route (Route: delegated; writer handles route + page + cleanup across 3+ files).
- [ ] S2 — generator page rewrite + noindex layout (Route: delegated).
- [ ] S3 — cleanup: delete canvases, drop html2canvas import (npm dep left in package.json; now unused in src).

## Checks
- tsc, eslint on touched files, vitest.
- curl image route for each format -> 200 image/png; unknown id -> 404; /social/blog/{id} -> 200.

## Progress
- S1-S3 implemented by delegated writer; see verification below.

## Findings
- /social/blog/[id] has no auth (proxy only guards /dashboard and auth paths). Not changed here; noindex added.

## Next
- Decide whether /social should move under /dashboard or get an auth guard.
