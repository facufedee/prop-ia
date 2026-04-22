# Project Structure

## Root Layout

```
src/
├── app/              # Next.js App Router — routes and API handlers
├── domain/           # Pure TypeScript interfaces, models, and abstractions
├── infrastructure/   # Concrete implementations (Firebase, services, adapters)
├── ui/               # React components, hooks, contexts, email templates
├── lib/              # Shared utilities and thin wrappers around external libs
├── usecases/         # Application use case orchestrators
└── utils/            # Generic helper functions

api/                  # Standalone Python prediction service
data/                 # Static JSON config files (IPC indices, tasacion config)
public/               # Static assets, images, PWA manifest
scripts/              # One-off admin/seed scripts (not part of the app)
```

## `src/app/` — Route Groups

| Group | Path | Purpose |
|---|---|---|
| `(main)` | `/dashboard`, `/propiedades`, etc. | Main admin panel (auth required) |
| `(tenant)` | `/inquilino/[id]` | Tenant portal (passwordless) |
| `(print)` | `/print/*` | Print-optimized layouts |
| `(social)` | `/social/*` | Social sharing pages |
| `sites/[slug]` | `/{agency-slug}` | White-label agency public sites |
| `api/` | `/api/*` | Server-side API route handlers |

## `src/domain/` — Domain Layer

- `models/` — TypeScript interfaces for all entities (Property, Alquiler, User, Lead, etc.)
- `entities/` — Value objects and richer domain types
- `repositories/` — Repository interfaces (contracts only, no implementation)
- `services/` — Domain service interfaces
- `adapters/` — Messaging adapter interfaces
- `strategies/` — Pricing strategy interfaces
- `factories/` — Document factory interfaces
- `security/` — Rate limiter interface

## `src/infrastructure/` — Infrastructure Layer

- `firebase/` — `client.ts` (browser SDK) and `admin.ts` (server SDK) — keep these separate
- `services/` — All business logic lives here (one file per domain entity)
- `repositories/` — Concrete repository implementations
- `adapters/` — WhatsApp, messaging concrete adapters
- `ai/` — Gemini tool definitions
- `auth/` — Firebase auth service
- `cache/` — In-memory cache implementation
- `context/` — `BranchContext` (React context for multi-branch)
- `events/` — EventManager (observer pattern)
- `facades/` — DashboardFacade (aggregates multiple services)
- `factories/` — Contract generators
- `observers/` — AuditLogObserver
- `security/` — InMemoryRateLimiter
- `strategies/` — ML and rule-based pricing strategies

## `src/ui/` — UI Layer

- `components/` — Reusable components organized by domain (dashboard, properties, forms, modals, etc.)
- `components/ui/` — Generic primitives (buttons, inputs, cards)
- `sections/` — Landing page sections (Hero, Features, Pricing, etc.)
- `context/` — `AuthContext`, `ThemeContext`
- `hooks/` — Custom React hooks
- `emails/` — React email templates (rendered server-side via Resend/Postmark)
- `auth/` — Route guard HOCs (`AdminGuard`, `AuthGuard`, `PermissionGuard`)

## Key Conventions

- **No business logic in React components** — call services from `infrastructure/services/`
- **Firebase client vs admin**: `firebase/client.ts` is browser-only; `firebase/admin.ts` is server-only (import with `server-only`)
- **API routes** are thin — validate input, call a service, return response
- **Domain models** are pure interfaces — no Firebase or framework imports
- **`@/`** alias resolves to `src/` — always use it for imports within `src/`
- **Test files** co-located with source: `*.test.ts` / `*.test.tsx`
- **Spanish naming** for domain concepts matching the business (e.g., `alquileres`, `inquilinos`, `propietarios`)
