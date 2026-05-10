# Analytics & Observability Architecture

## 1. Analytics Architecture Overview
- **Pipeline**: Client Events -> Edge Proxy -> Message Queue -> Data Warehouse.
- **Tools**: PostHog (Product analytics/Events), Plausible (Privacy-first Web Analytics), Sentry (Error tracking), Logtail (Backend logs).
- **Tenant Isolation**: Every event requires `tenantId` injection at the edge.

## 2. Event Tracking System
- **Implementation**: Singleton tracking utility wrapping `posthog-js`.
- **Properties**: All events automatically append `tenantId`, `locale` (`pl`|`en`), `deviceType`, `variantType`.
- **Method**: Fire-and-forget async execution to prevent main thread blocking.

## 3. User Behavior Tracking
- **Scroll Depth**: IntersectionObserver tracking at 25%, 50%, 75%, 100%.
- **Heatmaps**: PostHog session replay enabled conditionally (GDPR-compliant mode).
- **Engagement**: Time-on-section tracking via `useInView` hooks on UI Blocks (e.g., "Menu", "Gallery").

## 4. Conversion Funnel Tracking
```typescript
type FunnelEvent = 
  | "booking_started" 
  | "booking_date_selected" 
  | "booking_details_filled" 
  | "booking_completed" 
  | "booking_abandoned";

trackEvent("booking_completed", {
  tenantId: "bistro-warszawa",
  guests: 2,
  locale: "pl",
  timeSlot: "19:00"
});
```

## 5. Reservation Analytics
- **Metrics**: Drop-off rates per step, peak booking times, conversion rate by `utm_campaign`.
- **Backend Sync**: Successful reservations trigger a server-side event to guarantee accuracy if client tracking is blocked by AdBlockers.

## 6. CMS Analytics
- **Tracking**: Logs admin actions: `cms_login`, `config_published`, `theme_updated`, `ai_generation_triggered`.
- **Audit Logging**: Persisted to Supabase `AuditLogs` table for SOC2 compliance and tenant accountability.

## 7. Tenant Analytics Isolation
- **Structure**: PostHog groups feature used to segment users by `tenantId`.
- **Dashboarding**: The CMS queries the PostHog API filtered by `tenantId` to render localized metrics safely.

## 8. Real-Time Analytics Pipeline
- **Edge Proxy**: Events are sent to `/api/track` (Next.js Edge).
- **Sanitization**: Edge strips PII (IP address), validates against Zod event schemas, then forwards to PostHog/Plausible.

## 9. Error Tracking Architecture (Sentry)
- **Frontend**: Wraps Next.js `ErrorBoundary`. Tags errors with `tenantId`, `url`, `locale`.
- **Backend**: Captures unhandled promise rejections, Prisma database timeouts, and LLM failures.
- **Routing**: `tenantId` tags allow filtering crashes isolated to specific restaurant configs.

## 10. Logging Strategy (Logtail)
- **Format**: JSON structured logging via Pino or Winston.
- **Levels**: `info` (traffic), `warn` (rate limits), `error` (DB/AI failures).

## 11. Performance Monitoring
- **Vercel Speed Insights**: Tracks global field data.
- **Metrics**: Real User Monitoring (RUM) for TTFB, FCP, LCP, CLS, INP.
- **Tagging**: Segmented by `tenantId` and `variantName` (e.g., comparing `HeroCinematic` vs `HeroBento` LCP).

## 12. Core Web Vitals Tracking
```typescript
import { useReportWebVitals } from 'next/web-vitals';

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    trackEvent('core_web_vital', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      tenantId: window.__TENANT_ID__
    });
  });
  return null;
}
```

## 13. Session Replay Compatibility
- **Tool**: PostHog Replay.
- **Masking**: Strict DOM masking (`.ph-no-capture`) applied globally to `<input>`, `<textarea>`, and all reservation data to prevent PII leakage.

## 14. Privacy-Safe Analytics
- **Cookieless**: Plausible utilized for baseline traffic metrics without relying on tracking cookies.
- **Anonymization**: IP addresses discarded at Edge. User IDs hashed.

## 15. GDPR Compliance Architecture
- **Consent Banner**: Modular banner injected based on EU geolocation header (`x-vercel-ip-country`).
- **Data Deletion**: Automated webhook listening for GDPR "Right to be Forgotten" requests, scrubbing PostHog and Supabase.

## 16. Consent Management
```typescript
// Consent State Structure
interface ConsentState {
  analytics: boolean; // PostHog
  marketing: boolean; // Facebook Pixel / Google Ads
  functional: boolean; // LocalStorage
}
```

## 17. Event Schema Validation
```typescript
import { z } from "zod";

export const AnalyticsEventSchema = z.object({
  eventName: z.string(),
  tenantId: z.string().uuid(),
  timestamp: z.string().datetime(),
  properties: z.record(z.any()),
  locale: z.enum(["en", "pl"])
});
```

## 18. AI Generation Analytics
- **Metrics**: `ai_generation_started`, `ai_generation_failed`, `llm_token_usage`, `zod_validation_retries`.
- **Dashboard**: Internal super-admin dashboard tracking OpenAI/Gemini costs per tenant.

## 19. Dashboard Metrics Architecture
- **API**: CMS fetches `/api/admin/metrics`.
- **Cache**: Pre-aggregated daily cron jobs store metrics in Redis to prevent slow analytical queries on dashboard load.

## 20. Alerting/Monitoring System
- **Thresholds**: 
  - 500 Errors > 1% in 5m -> PagerDuty.
  - LLM Rate Limits hits > 5 -> Slack Alert.
  - Booking conversion drop > 20% -> Email Alert to Admin.
