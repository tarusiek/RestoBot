# Security, Compliance, & Privacy Architecture

## 1. Security Architecture
- **Layer 1: Network & Edge**: Cloudflare WAF, Vercel Edge Firewall.
- **Layer 2: Application**: Next.js App Router API strict CORS, Zod validation.
- **Layer 3: Data**: Supabase PostgreSQL Row Level Security (RLS).
- **Layer 4: Identity**: Supabase Auth (JWT).

## 2. Authentication Security
- **Provider**: Supabase Auth / Auth.js.
- **MFA**: Enforced for `SuperAdmin` and `Owner` roles.
- **Tokens**: HttpOnly, Secure, SameSite=Strict cookies. No client-side JWT storage.

## 3. Authorization/RBAC Security
```typescript
type Role = "SuperAdmin" | "Owner" | "Manager" | "Editor" | "Chef";

interface Permission {
  tenantId: string;
  role: Role;
  canPublish: boolean;
  canEditTheme: boolean;
}
```
- Checked via Middleware before hitting server actions.

## 4. Multi-Tenant Isolation Security
- **Database (RLS)**:
```sql
CREATE POLICY "Tenant Isolation" ON "Reservations"
  FOR ALL USING (tenant_id = auth.jwt()->>'app_metadata'->>'tenant_id');
```

## 5. API Security
- **Endpoints**: Secured via API Gateway pattern at Next.js Edge.
- **Headers**: Strict `Content-Security-Policy`, `X-Frame-Options: DENY`.

## 6. CMS Security
- **Access**: `/admin` route protected by Edge Middleware intercepting valid JWTs.
- **State**: Sensitive API keys (e.g., Stripe, Resend) never returned to client JSON payloads.

## 7. Admin Dashboard Security
- **Session Timeout**: 15 minutes of inactivity auto-logs out `Owner` accounts.
- **IP Allowlisting**: Optional for enterprise tenants to restrict CMS access.

## 8. Input Validation Architecture
- **Client**: React Hook Form + Zod.
- **Server**: Server Actions re-validate identical Zod schema. `parse()` strips unknown keys.

## 9. AI-Safe Validation Pipeline
- **Risk**: Prompt injection, hallucinated CSS payloads.
- **Defense**: Output piped through strict JSON parsing, dropping malicious HTML (`DOMPurify`), escaping script tags.

## 10. XSS/CSRF Protection
- **XSS**: React natively escapes HTML. Explicitly banning `dangerouslySetInnerHTML`.
- **CSRF**: Server Actions implement native CSRF protections. CSRF tokens for external API webhooks.

## 11. Rate Limiting Architecture
- **Tool**: Upstash Redis via `@upstash/ratelimit`.
- **API (Booking)**: 5 requests per 10 minutes per IP.
- **AI Generation**: 2 requests per hour per Tenant.

## 12. WAF Strategy
- **Cloudflare**: Bot Management, SQLi protection, OWASP Top 10 ruleset applied globally.

## 13. Secure File Upload Architecture
- **Flow**: Client requests signed URL from backend -> Uploads directly to S3.
- **Validation**: Strict MIME type checking (`image/webp`, `image/jpeg`).
- **Scanning**: AWS Lambda scans bucket objects for malware.

## 14. Secrets Management
- **Storage**: Vercel Environment Variables, encrypted at rest.
- **Rotation**: Automated secret rotation every 90 days.

## 15. Encryption Architecture
- **In Transit**: TLS 1.3 enforced globally.
- **At Rest**: AES-256 for PostgreSQL volumes. PII fields (Phone numbers) column-level encrypted via `pgsodium`.

## 16. Session Security
- **JWT Expiry**: Short-lived access tokens (15m), long-lived refresh tokens rotated automatically.
- **Revocation**: Global logout capability flushes Redis session cache.

## 17. Audit Logging
- **Schema**: `id`, `timestamp`, `actor_id`, `tenant_id`, `action` (e.g., `DELETED_RESERVATION`), `ip_hash`.
- **Immutability**: Appended to write-only Logtail/Supabase table.

## 18. GDPR Architecture
- **Data Minimization**: Only capturing essential PII.
- **Right to Erasure**: Endpoint `/api/gdpr/delete` cascades deletion across DB and PostHog.
- **Data Portability**: JSON export available in CMS.

## 19. Cookie Consent Architecture
- **Mechanism**: Blocks PostHog script injection until `consent=true`.
- **Strictly Necessary**: Session cookies load immediately.

## 20. Data Retention Policy
- **Reservations**: PII scrubbed after 12 months.
- **Logs**: Access logs rotated and deleted after 30 days.

## 21. Backup Security
- **PITR**: Point-in-Time Recovery enabled on Supabase.
- **Encryption**: Backups encrypted with distinct KMS keys.

## 22. Infrastructure Hardening
- **Dependencies**: Dependabot + `pnpm audit` enforced in CI/CD.
- **Containers**: Distroless base images if Dockerizing background workers.

## 23. Edge Security Strategy
- **DDoS Mitigation**: Vercel/Cloudflare absorbs volumetric attacks.
- **Geo-Blocking**: Opt-in blocking of high-risk IP ranges.

## 24. Monitoring/Threat Detection
- **Alerts**: Sentry tracks unexpected 401/403 spikes indicating brute force attempts.

## 25. Abuse Prevention
- **AI Tokens**: Hard limits on token generation to prevent financial DDOS via AI feature abuse.

## 26. Reservation Spam Protection
- **Defense**: Cloudflare Turnstile (invisible CAPTCHA) on booking endpoints.
- **Honeypot**: Hidden form fields to trap automated scraping bots.

## 27. AI Abuse Protection
- **Prompt Sanitization**: OpenAI Moderation API runs before queuing generation tasks.

## 28. Compliance Architecture
- **Certifications**: Hosted on SOC2 Type II, ISO 27001 compliant infrastructure (Vercel/AWS/Supabase).

## 29. Privacy-Safe Analytics
- **Plausible**: Cookieless tracking fallback. IPs hashed with rotating daily salt.

## 30. Incident Response Architecture
- **Runbook**: Automated PagerDuty escalation -> Isolate Tenant -> Revoke Keys -> Vercel Rollback.
