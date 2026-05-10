# Testing, QA, Validation, and Reliability Architecture

This document contains the comprehensive, enterprise-grade architecture for Testing, Validation, and Quality Assurance within the AI-driven, multi-tenant restaurant generation platform. This architecture guarantees that AI-generated layouts, multilingual routing, edge-rendered pages, and dynamic components remain robust, performant, and completely free of regressions or critical failures.

---

## 1. Testing Architecture Overview
The QA ecosystem employs a multi-tiered testing strategy designed to intercept failures at the earliest possible stage. 

- **Static Analysis & Contracts (Zod / TypeScript)**: The first line of defense ensuring AI outputs match exact structural schemas.
- **Unit Testing (Vitest)**: Fast, deterministic tests validating helper functions, utilities, and isolated component logic.
- **Integration Testing (Vitest / React Testing Library)**: Validates that dynamic blocks assemble correctly when fed mock configurations.
- **End-to-End Testing (Playwright)**: Browser-based workflows testing real multi-tenant routing, booking flows, and CMS interactions.
- **Visual Regression (Chromatic / Percy)**: Pixel-perfect comparison to detect layout shifts caused by dynamic content or CSS changes.
- **Continuous Monitoring (Sentry / Datadog)**: Runtime safety nets tracking edge anomalies and hydration mismatches.

---

## 2. QA Pipeline Architecture
The CI/CD pipeline enforces strict testing gates on every Pull Request and main branch commit via GitHub Actions.

1. **Pre-commit**: Husky triggers Lint-staged (ESLint, Prettier, TypeScript compilation).
2. **Phase 1 (CI)**: `pnpm test:unit` (Vitest) + `pnpm test:contracts` (Zod validation tests).
3. **Phase 2 (CI)**: Spin up ephemeral preview environment (Vercel Preview).
4. **Phase 3 (CI)**: Run E2E tests against the Vercel Preview URL (`pnpm test:e2e`).
5. **Phase 4 (CI)**: Trigger Lighthouse CI for performance budgeting and Chromatic for visual diffs.
6. **Deployment Gate**: If any phase fails, the deployment is blocked.

---

## 3. Unit & Integration Testing Strategy (Vitest)
Unit tests focus on the purely functional aspects of the application, running entirely within a Node.js/JSDOM environment.

- **Component Contracts**: Validate that `BlockResolver` correctly maps a `"variant": "cinematic-fullscreen"` string to the `<GalleryCinematic />` component.
- **SEO & Metadata**: Assert that the `generateMetadata` function correctly yields Polish titles when `lang === 'pl'`.
- **Motion Utilities**: Test that `getMotionTokens('reduced-motion')` correctly returns stripped-down physics values.

```typescript
// __tests__/BlockResolver.test.tsx
import { render, screen } from '@testing-library/react';
import { HeroResolver } from '@/components/blocks/HeroResolver';

describe('HeroResolver Integration', () => {
  it('renders Cinematic variant when specified in config', () => {
    const mockConfig = { variant: "cinematic-video", headline: "Welcome", media: { url: "vid.mp4" } };
    render(<HeroResolver data={mockConfig} />);
    expect(screen.getByTestId('hero-cinematic')).toBeInTheDocument();
  });
});
```

---

## 4. End-to-End Testing Architecture (Playwright)
Playwright orchestrates browser-based testing, handling the complexities of dynamic routing and edge caching.

- **Multi-Tenant Testing**: Tests inject specific Host headers (e.g., `bistrowarszawa.pl`) to verify the Vercel Edge Middleware correctly resolves to the proper tenant.
- **Multilingual Flows**: Assert that navigating to `/pl/menu` displays Polish text and correctly switches to `/en/menu` when the locale toggle is clicked.
- **Booking Flow**: A synthetic user selects a date, fills the reservation form, submits it, and Playwright asserts that a success toast appears and the mock database receives the entry.

```typescript
// e2e/booking.spec.ts
import { test, expect } from '@playwright/test';

test('completes reservation flow', async ({ page }) => {
  await page.goto('https://preview.bistrowarszawa.pl/en/reservations');
  await page.click('text=Book a Table');
  await page.fill('input[name="guests"]', '2');
  await page.click('button[type="submit"]');
  await expect(page.locator('.toast-success')).toHaveText('Reservation Confirmed');
});
```

---

## 5. Visual Regression & Animation Strategy (Chromatic)
Because the platform hosts hundreds of unique restaurant designs, CSS regressions are catastrophic.

- **Automated Screenshots**: Chromatic hooks into the CI pipeline, snapping DOM states for every variant (Hero, Gallery, Menu).
- **Animation Pausing**: Framer Motion is globally disabled during visual tests using `<MotionConfig reducedMotion="always">` to ensure deterministic, static screenshots without timing discrepancies.
- **Viewport Testing**: Snapshots are captured across 320px, 768px, and 1440px to ensure mobile responsive integrity.

---

## 6. AI-Generated Config Validation Strategy
The most critical failure point is the AI generating corrupted JSON.

- **Schema Fuzzing**: Unit tests automatically generate hundreds of randomized JSON objects (fuzzing) and pass them through `RestaurantConfigSchema.parse()`.
- **Fallback Verification**: E2E tests assert that if a tenant database row contains a corrupted config, the `ErrorBoundary` gracefully catches it and displays a fallback UI, preventing a 500 error cascade.
- **Generative Sanity Checks**: A nightly cron job queries the production database, running all active tenant configs through the latest Zod schemas to detect silent drifts.

---

## 7. Accessibility (A11y) Testing Architecture
Accessibility is enforced via automation to ensure WCAG 2.1 AA compliance.

- **Static Validation**: `eslint-plugin-jsx-a11y` flags missing alt tags and ARIA attributes in the IDE.
- **Axe-Core Integration**: Playwright E2E tests utilize `@axe-core/playwright` to scan rendered pages for contrast ratios, screen reader compatibility, and focus management.
- **Reduced Motion Validation**: Tests explicitly mock the `(prefers-reduced-motion: reduce)` media query and verify that cinematic animations revert to standard opacity fades.

---

## 8. Lighthouse CI & Performance Budget Enforcement
To guarantee the Lighthouse 95+ mandate, performance is treated as a hard pass/fail test.

- **Lighthouse CI**: Runs on the Vercel Preview URL in a headless environment.
- **Budgets**: If LCP exceeds 2.5s or CLS exceeds 0.1, the GitHub Action throws a fatal error, blocking the PR.
- **Bundle Size Tracking**: `next-bundle-analyzer` outputs metrics. An automated script compares the base bundle size against the `main` branch. A size increase > 50kb fails the build.

---

## 9. API & CMS Integrity Testing
The Admin Dashboard and backend integrations must remain secure and functional.

- **API Contract Testing**: Validates that external endpoints (Supabase, Resend, Stripe) conform to expected inputs/outputs using mock Service Workers (MSW).
- **CMS State Verification**: Playwright tests log into the Admin Dashboard, drag-and-drop a Menu block, hit "Publish", and verify that the public-facing preview iframe updates instantly via `postMessage`.
- **RBAC Validation**: E2E tests attempt to access `/admin` using a "Chef" token to verify they are blocked from modifying the Global Theme (restricted to "Owner").

---

## 10. Runtime Validation, Monitoring & Observability
Testing doesn't stop at deployment. Synthetic monitoring tracks the health of live restaurants.

- **Hydration Mismatch Detection**: Sentry is configured to catch React hydration errors (e.g., when Edge HTML doesn't match client JavaScript).
- **Synthetic User Flows (Datadog/Checkly)**: Headless browsers navigate the live booking flows of top-tier restaurants every 5 minutes. If a form fails to submit, the on-call engineer receives a PagerDuty alert.
- **Uptime & Edge Health**: Vercel Edge endpoints are pinged continuously to guarantee multi-region availability.

---

## 11. Security Testing Architecture
- **Dependency Auditing**: `pnpm audit` runs on every PR to catch vulnerable packages.
- **Static Application Security Testing (SAST)**: SonarQube scans the codebase for hardcoded secrets, prototype pollution, and cross-site scripting (XSS) vectors.
- **Tenant Isolation Assertions**: Integration tests explicitly attempt to query Tenant B's reservations using Tenant A's authorization tokens to guarantee Supabase RLS policies are airtight.

---

## 12. AI-Safe Rollback Validation
When a deployment introduces a breaking change, the rollback must be flawless.

- **Rollback Smoke Tests**: A dedicated GitHub Action pipeline simulates a Vercel Rollback, hitting the live URL to ensure caching layers (CDN, Redis) are correctly invalidated and serving the previous functional version.
- **Database Drift Detection**: Prisma schema tests ensure that newer code deployments do not require destructive database migrations that would break older Vercel builds during a rollback event.
