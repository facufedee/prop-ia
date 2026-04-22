# Tech Stack

## Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **UI**: React 19 + Tailwind CSS v4
- **Icons**: Lucide React
- **Maps**: Leaflet / React-Leaflet
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **State**: React Context API (no Redux)
- **Drag & Drop**: @hello-pangea/dnd

## Backend / Infrastructure
- **Platform**: Firebase (Firestore, Auth, Storage)
- **API Routes**: Next.js App Router API handlers (`src/app/api/`)
- **Auth**: Firebase Auth — Email/Password + Google OAuth
- **Admin SDK**: firebase-admin (server-side only)

## AI / ML
- **Generative AI**: Google Gemini (`@google/generative-ai`)
- **Price Prediction**: TensorFlow.js (`@tensorflow/tfjs`) + Python model in `api/`
- **Python API**: FastAPI/script in `api/predict.py` (separate from Next.js)

## Integrations
- **Payments**: MercadoPago SDK
- **Email**: Resend + Postmark
- **SMS/WhatsApp**: Twilio
- **Document Generation**: `docx` library (Word contracts)
- **PDF**: jsPDF + jspdf-autotable

## Testing
- **Runner**: Vitest
- **Environment**: jsdom
- **UI Testing**: @testing-library/react
- **Config**: `vitest.config.mts`

## Linting / Formatting
- ESLint with `eslint-config-next`
- TypeScript strict mode enforced

## Path Aliases
- `@/*` maps to `./src/*`

## Common Commands

```bash
npm run dev        # Start development server (Next.js)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
npm run test       # Run Vitest (watch mode) — use `vitest --run` for single pass
```

## Environment Variables
Copy `env.template` to `.env.local`. Key variables:
- `NEXT_PUBLIC_FIREBASE_*` — Firebase client config
- `GEMINI_API_KEY` / `gemini_api_key` — Google AI
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `MERCADOPAGO_*`, `TWILIO_*`, `RESEND_*`, `POSTMARK_*`

## Deployment
Hosted on **Vercel** (auto-detected Next.js). Firebase project handles DB/Auth/Storage. Python prediction API runs separately.
