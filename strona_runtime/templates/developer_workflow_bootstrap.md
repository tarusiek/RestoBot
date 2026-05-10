# Developer Workflow & Local Architecture

## 1. Local Development Workflow
- **Monorepo**: Turborepo manages `apps/web`, `apps/cms`, `packages/contracts`, `packages/ui`.
- **Command**: `pnpm dev` concurrently boots Next.js apps, Supabase local, and Inngest dev server.

## 2. Bootstrap Process
```bash
git clone repo && cd repo
pnpm install
pnpm dlx supabase start
pnpm run db:setup
pnpm dev
```

## 3. Project Initialization Flow
- Installs dependencies (`pnpm install`).
- Copies `.env.example` -> `.env.local`.
- Seeds local Postgres with 3 mock tenants (English/Polish configs).

## 4. Environment Setup Architecture
- **`.env.local`**: Local overrides (e.g., `NEXT_PUBLIC_SITE_URL=http://localhost:3000`).
- **`.env.test`**: E2E testing overrides (e.g., memory DB connection).

## 5. Dependency Installation Strategy
- **Tool**: `pnpm` workspace.
- **Lockfile**: Strict `pnpm-lock.yaml` enforcement.

## 6. Local Tenant Development Workflow
- **Domain Mapping**: `hosts` file maps `bistro.local -> 127.0.0.1`.
- **Testing**: Navigate to `http://bistro.local:3000/en/menu` to test dynamic tenant resolution.

## 7. Local CMS Workflow
- Available at `http://localhost:3001` (or `/admin` subpath).
- Live preview iframe points to `http://bistro.local:3000` via `postMessage` sync.

## 8. Local Backend Workflow
- **Database**: Supabase Local CLI (Dockerized Postgres + GoTrue Auth).
- **ORM**: `npx prisma studio` runs on port 5555 for local DB inspection.

## 9. Local AI Pipeline Workflow
- **Mocking**: `MOCK_AI_RESPONSES=true` bypasses OpenAI/Gemini to save developer costs, returning static Zod-compliant JSON payloads.
- **Queue**: Inngest dev server (`http://localhost:8288`) intercepts and replays background jobs.

## 10. Local Database Architecture
- **Tool**: Supabase CLI.
- **Migrations**: `supabase db push` syncs local changes.
- **Seeds**: `supabase db reset` wipes and repopulates tenant structures.

## 11. Environment Variable Strategy
- **Validation**: `@t3-oss/env-nextjs` throws build errors if required `.env` variables are missing upon `pnpm dev`.

## 12. Mock Data Architecture
- **Factory**: Faker.js populates `Tenant`, `ConfigRevision`, and `Reservation` tables.
- **Configs**: Static JSON snapshots stored in `/seeds/configs/*.json`.

## 13. Local Media Handling
- Uploads intercepted and written to local filesystem (`/public/uploads`) instead of S3 during development.

## 14. Hot Reload Architecture
- **Next.js**: Fast Refresh for React components.
- **Turborepo**: Caches unchanged packages, preventing redundant rebuilds.

## 15. Dev Tooling Architecture
- **VSCode**: Shared `.vscode/settings.json` enforces Prettier and ESLint on save.
- **TypeScript**: Strict mode enabled across all workspaces.

## 16. Shared Scripts Strategy
```json
// package.json
"scripts": {
  "dev": "turbo run dev --parallel",
  "build": "turbo run build",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "db:reset": "supabase db reset && prisma db push --force-reset && prisma db seed"
}
```

## 17. DX Optimization Strategy
- **Zod Error Formatting**: `zod-error` library formats AI validation failures cleanly in the terminal.

## 18. Local Testing Workflow
- **Unit**: `pnpm test --watch` (Vitest).
- **E2E**: `pnpm test:e2e --ui` (Playwright UI mode).

## 19. Local Deployment Emulation
- **Tool**: `vercel dev`.
- **Purpose**: Accurately simulates Edge Middleware tenant resolution and Next.js ISR cache behavior locally.

## 20. Local Observability Tooling
- **Logs**: Pino-pretty formats backend JSON logs for readability.
- **Tracing**: React Developer Tools Profiler for rendering bottlenecks.

## 21. AI-Assisted Development Workflow
- **Copilot**: `.github/copilot-instructions.md` explicitly defines the system architecture for GitHub Copilot.

## 22. Code Generation Workflow
- Plop.js generators for scaffolding new UI Variants (e.g., `pnpm generate:variant --name=HeroCinematic`).

## 23. Local Caching Strategy
- Redis mocked in-memory or via local Docker container.
- Next.js `.next/cache` persists between dev restarts.

## 24. Local Authentication Strategy
- Supabase Inbucket intercepts signup emails locally.
- Auto-login script `pnpm dev:login` injects auth cookies for E2E testing.

## 25. Local Email Testing Strategy
- **Tool**: Inbucket (bundled with Supabase local) catches all outbound Resend/SMTP traffic at `http://localhost:54324`.

## 26. Local Reservation Testing
- Playwright scripts seed local DB with conflicting time slots to test optimistic concurrency control.

## 27. Local Multilingual Testing
- Quick toggle component injected in dev-mode only to switch `next/navigation` routes between `en`/`pl`.

## 28. Workspace Onboarding Architecture
- Interactive `pnpm setup:workspace` script validates Docker, Node version (via `.nvmrc`), and environment keys.

## 29. CLI Tooling Architecture
- Custom local CLI (`packages/cli`) for executing bulk tenant generation tasks locally.

## 30. Developer Productivity Tooling
- **Pre-commit Hooks**: Husky ensures linting and TypeScript compilation pass before Git commits.
- **Turborepo Cache**: Remote caching enabled via Vercel for CI/CD speedup.
