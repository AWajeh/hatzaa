# הצעה (Hatzaa) — Quote management SaaS for Israeli contractors

A multi-tenant SaaS for קבלנים and other tradespeople to build, send and
track professional quotes (הצעות מחיר). Hebrew / Arabic (RTL) and English
(LTR) from day one, real multi-tenant data isolation, VAT handling that's
configurable per business, WhatsApp delivery, PDF export, and a payments
layer built against Cardcom (see `src/lib/payments/PROVIDER_COMPARISON.md`).

## Stack

- **Next.js 15** (App Router, TypeScript) — full-stack, SSR, SEO-friendly
- **PostgreSQL + Prisma** — relational, indexed, tenant-isolated schema (`prisma/schema.prisma`)
- **next-intl** — real i18n (`src/i18n/messages/{he,ar,en}.json`), RTL/LTR aware routing
- **NextAuth v4** — email/password (bcrypt) + optional Google OAuth
- **Tailwind CSS** + a small hand-built design system (`src/components/ui`) using Radix UI primitives — no template, no AI-generic look
- **@react-pdf/renderer** + self-hosted Noto Sans Hebrew/Arabic fonts — Hebrew/Arabic/English PDFs, no headless browser
- **Cardcom** payment provider behind a swappable `PaymentProvider` interface (`src/lib/payments/`)

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start Postgres** (or point `DATABASE_URL` at your own instance)

   ```bash
   docker compose up -d
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Fill in `NEXTAUTH_SECRET` (`openssl rand -base64 32`). Google login and
   Cardcom are optional for local development — leave them blank and those
   features degrade gracefully (Google button hidden, checkout returns a
   clear "not configured" error instead of crashing).

4. **Run migrations + seed demo data**

   ```bash
   npx prisma migrate dev --name init
   npm run db:seed
   ```

   Seeds the three plans (Free/Pro/Business) and a demo business:
   `demo@hatzaa.co.il` / `Demo1234!` — a renovation contractor with sample
   services and a customer already set up.

5. **Run the app**

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` (redirects to `/he`).

## Project layout

```
src/
  app/
    [locale]/
      page.tsx                  # landing page
      (auth)/login, register    # public auth pages
      (dashboard)/...           # authenticated app (middleware-protected)
      quote/[publicId]          # public quote view (client's link)
    api/                        # REST route handlers (tenant-scoped)
  components/
    ui/                         # design system primitives
    landing/, nav/, dashboard/, settings/, customers/, services/, quotes/
  lib/
    auth.ts, tenant.ts          # auth + multi-tenant scoping
    pricing.ts                  # VAT/discount/total math (agorot-precise)
    pdf/                        # react-pdf quote document + font registration
    payments/                   # PaymentProvider interface + Cardcom adapter
    whatsapp.ts                 # wa.me deep-link message builder
    validations.ts              # zod schemas shared by API routes + forms
  i18n/
    messages/{he,ar,en}.json    # every user-facing string
prisma/
  schema.prisma                 # Users, Businesses, Customers, Services,
                                 # Quotes, Subscriptions, Payments, ...
assets/fonts/                   # self-hosted fonts for PDF generation
```

## Multi-tenancy

Every business-scoped table carries `businessId`. All reads/writes go
through `requireBusiness()` (`src/lib/tenant.ts`), which resolves the
signed-in user's business from their session and must be used in every API
route that touches tenant data — there is no global "list everything"
query path.

## VAT

VAT is **not hardcoded**. `Business.vatRate` (a `Decimal`, e.g. `0.17`) is
editable from Settings → Preferences and is the default applied to new
quotes; each quote also stores its own `vatRate` at creation time so past
quotes remain correct if the business's default rate changes later.

## Payments

Card data never touches this app's servers or database — see
`src/lib/payments/types.ts` for the `PaymentProvider` boundary and
`src/lib/payments/PROVIDER_COMPARISON.md` for why Cardcom was chosen for
the MVP and how to swap providers later.

## Testing

```bash
npm run typecheck
npm test
```
