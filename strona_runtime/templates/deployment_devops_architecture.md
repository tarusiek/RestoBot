# Deployment, DevOps, and CI/CD Architecture

This document maps out the enterprise-grade Production Infrastructure, CI/CD pipelines, and DevOps workflows for the AI-driven, multi-tenant Restaurant Generation platform. The topology is built to leverage Vercel for Edge delivery, Supabase for scalable database hosting, Cloudflare for DNS/CDN layer protection, and GitHub Actions for automated deployment gates.

---

## 1. Infrastructure Topology & Environment Strategy
The platform is governed by a strict, three-tier environment pipeline to ensure AI-generated layouts and manual code updates never disrupt live restaurant operations.

- **Development (`dev`)**: Local environment connected to local Supabase instances or a dedicated staging database.
- **Preview / Staging (`preview`)**: Every Pull Request dynamically spins up an ephemeral Vercel environment and a branched Supabase schema. Crucial for visual QA of new Restaurant UI components before merge.
- **Production (`main`)**: The highly-available live environment. Multi-region database, edge-cached, connected to live Stripe and Resend keys.

---

## 2. Vercel & Multi-Tenant Deployment Architecture
Because the system hosts hundreds of restaurant websites under a single Next.js codebase, we utilize **Vercel Platforms Architecture** (Dynamic Custom Domains).

### Domain Management Strategy
1. **Subdomains**: Upon creation, every tenant gets a default subdomain (`bistro-warszawa.platform.com`).
2. **Custom Domains**: Restaurant owners add their own domain (`bistrowarszawa.pl`).
3. **Automated SSL**: Through the Vercel API, we programmatically map the domain to the Vercel Project. Vercel automatically negotiates Let's Encrypt SSL/TLS certificates and handles automatic renewals.

```typescript
// Example: Adding a custom domain via Vercel API internally in the CMS
export async function addCustomDomain(tenantId: string, domain: string) {
  const response = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_ID}/domains`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${VERCEL_API_TOKEN}` },
    body: JSON.stringify({ name: domain })
  });
  
  if (response.ok) {
    // 1. Update Supabase Tenant table
    // 2. Instruct user to configure Cloudflare/DNS CNAME to `cname.vercel-dns.com`
  }
}
```

---

## 3. GitHub Actions CI/CD Pipeline Architecture (`.github/workflows/production.yml`)
All code modifications run through rigorous automated testing gates (Typescript, Zod contract compilation, ESLint) before deploying.

```yaml
name: Production CI/CD
on:
  push:
    branches: [ "main" ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - name: Type Checking & Linting
        run: pnpm run lint && pnpm run typecheck
      - name: Zod Contract Validation
        run: pnpm run test:contracts # Validates AI schemas haven't been broken
      - name: Supabase DB Migration Check
        run: pnpm dlx supabase db lint

  deploy_production:
    needs: validate
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 4. Supabase Database Deployment & Versioning
Database changes (like adding a new tracking metric to the `Tenant` table) must be synced safely across environments.

- **Migration Generation**: Developers run `supabase db diff -f add_tracking_metrics` locally to generate SQL migrations.
- **GitHub Actions Execution**: During CI/CD, the Supabase CLI connects to the remote Production database and runs unapplied migrations *before* the Vercel deployment begins.
- **AI-Safe Seed Data**: Staging environments are seeded automatically with fake restaurant configs (using `faker.js` and dummy JSON payloads) to ensure the visual page builder is testable.

---

## 5. Caching, CDN & Edge Cache Invalidation Strategy
Because the platform relies on Incremental Static Regeneration (ISR), the Edge Cache must be aggressively managed.

- **Static Assets**: Images, fonts, and JS bundles are heavily cached at the Cloudflare/Vercel Edge layer (Cache-Control: `public, max-age=31536000, immutable`).
- **Dynamic HTML (Tenant Pages)**: Cached with `stale-while-revalidate`.
- **Invalidation Webhooks**: When the AI or CMS publishes a new theme configuration, the CMS backend hits a Next.js App Router endpoint to forcefully evict the old HTML from the Edge instantly.

```typescript
// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache';

export async function POST(req: Request) {
  const { tenantId, secret } = await req.json();
  if (secret !== process.env.REVALIDATION_SECRET) return new Response('Unauthorized', { status: 401 });

  // Busts cache across all edge nodes worldwide for this specific restaurant
  revalidateTag(`tenant-${tenantId}`); 
  return new Response('Revalidated', { status: 200 });
}
```

---

## 6. AI Deployment Automation Strategy
The AI generates complete websites autonomously based on prompts. To ensure safety:

1. **Generation Sandbox**: The AI generates the localized JSON (Polish/English) via the background queue (Upstash QStash).
2. **Strict Zod Parse**: The worker runs `RestaurantConfigSchema.parse(payload)`.
3. **Shadow Deployment**: The system persists the config to PostgreSQL as a `isDraft = true` revision.
4. **Visual Regression / Approval**: An automated headless Playwright script takes a screenshot of the draft URL. The human admin approves it, triggering the cache revalidation pipeline.

---

## 7. Monitoring, Logging & Observability Architecture
Given the multi-tenant nature, tracking down a specific restaurant's crash requires granular observability.

- **Vercel Analytics & Speed Insights**: Monitored globally for Core Web Vitals (LCP, CLS, INP) degradation across variants.
- **Sentry Error Tracking**: Integrated at the Next.js `ErrorBoundary` level. Captures React crashes. Crucially, we inject the `tenantId` into the Sentry tags so we can filter bugs (e.g., "Only the Dark Modern variant on Bistro Warszawa is crashing").
- **Supabase Audit Logs**: Every CMS mutation and AI generation event is logged in PostgreSQL, tracking `action`, `user_id`, `tenant_id`, and `timestamp`.
- **Uptime Monitoring**: Datadog or Better Uptime pings the Edge Middleware health-check endpoint every 1 minute.

---

## 8. Rollback & Disaster Recovery Architecture
- **Instant Rollbacks (Frontend)**: Vercel maintains previous production builds. If a merged PR breaks the booking system, a one-click Vercel rollback instantly reverts the UI logic globally.
- **Config Rollbacks (Tenant UI)**: If a restaurant owner accidentally breaks their layout, the CMS allows selecting a historical `ConfigRevision` and hitting "Restore", overwriting the live JSON instantly.
- **Database Backup (Supabase)**: Point-in-Time Recovery (PITR) is enabled on the Supabase Postgres instance, allowing rollback to any second in the last 7 days.
- **Cold Start Mitigation**: Critical serverless functions (like the Database connection pool via PgBouncer) are kept warm or migrated entirely to Edge functions to bypass cold boot times.

---

## 9. Infrastructure Cost Optimization Strategy
- **Edge Middleware**: We use Upstash Redis to resolve domains instead of hitting Postgres. This saves millions of database reads, significantly reducing Supabase compute costs.
- **Vercel Image Optimization**: We utilize Cloudflare or S3 for raw media storage but proxy through Next.js `<Image>`. To avoid exorbitant Vercel Image Optimization charges, we enforce strict `deviceSizes` and `imageSizes` in `next.config.js` to prevent the generation of unnecessary permutations.
- **Supabase Realtime**: Websockets are expensive. We limit Realtime subscriptions strictly to the Admin CMS preview iframe and do not utilize websockets for the public-facing restaurant websites.

---

## 10. Secrets & Environment Variable Strategy
Secrets are managed centrally in Vercel and synced down locally via `vercel env pull`.

```bash
# Critical Production Environment Variables
DATABASE_URL="postgres://..." # Supabase Connection pooling
DIRECT_URL="postgres://..."   # Supabase direct connection for Prisma migrations
UPSTASH_REDIS_REST_URL="..."  # Edge routing cache
RESEND_API_KEY="..."          # Transactional Email
STRIPE_SECRET_KEY="..."       # Payments/Deposits
REVALIDATION_SECRET="..."     # ISR Webhook protection
OPENAI_API_KEY="..."          # AI generation
```
All client-side safe variables are explicitly prefixed with `NEXT_PUBLIC_`. All secret backend logic (AI prompts, Database URLs) remains firmly on the server.
