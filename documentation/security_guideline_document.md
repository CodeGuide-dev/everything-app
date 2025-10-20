# Security Guidelines for everything-app

This document outlines the security principles and best practices tailored to the **everything-app** repository—a Next.js full-stack starter template integrating AI Chat, AI Search, and AI Image Generation. By embedding security from design through deployment, you will build a resilient, trustworthy platform.

---

## 1. Security by Design & Core Principles

- **Embed Security Early**: Incorporate security at every phase—from planning and design to implementation, testing, and deployment.
- **Least Privilege**: Grant each component, service, and user only the minimal permissions required.
- **Defense in Depth**: Layer multiple controls (network, application, data, and host) so that failure of one does not compromise the system.
- **Fail Securely**: Default to safe states on errors. Do not leak stack traces, internal paths, or PII in responses or logs.
- **Keep It Simple**: Favor clear, maintainable security controls over complex constructs that are error-prone.
- **Secure Defaults**: Configure features (CORS, cookies, TLS) in their most secure settings by default.

---

## 2. Authentication & Access Control

### 2.1 Robust Authentication

- Use the existing `better-auth` library to enforce strong password policies:
  - Minimum length ≥ 12 characters, mixed-case, numbers, symbols.
  - Store passwords using Argon2 or bcrypt with per-user salts.
- **Multi-Factor Authentication** (MFA): Offer TOTP or WebAuthn for high-risk operations (account recovery, profile changes).
- **Session Management**:
  - Store session tokens in **HttpOnly**, **Secure**, **SameSite=Strict** cookies.
  - Generate cryptographically random session IDs and enforce both idle (e.g., 15m) and absolute timeouts (e.g., 24h).
  - Protect against session fixation by rotating IDs on login/logout.

### 2.2 Role-Based Access Control (RBAC)

- Define roles (`user`, `admin`, etc.) in your database schema (e.g., `roles` table).
- Enforce server-side authorization in every Next.js API route:
  - Example in `app/api/chat/route.ts`:
    ```ts
    import { getSession, requireRole } from '@/lib/auth';

    export async function POST(req: Request) {
      const session = await getSession(req.headers.get('cookie'));
      requireRole(session, 'user');
      // ...process chat request
    }
    ```
- Restrict administrative actions (e.g., user management, system settings) to the `admin` role.

---

## 3. Input Handling & Processing

### 3.1 Prevent Injection Attacks

- Use **Drizzle ORM**’s parameterized queries to avoid SQL injection.
- Sanitize and validate all user inputs (chat prompts, search queries, image prompts) using a schema validation library (e.g., Zod).
- For file uploads (e.g., attachments in chat):
  - Allow-list by MIME type and extension.
  - Enforce size limits (e.g., ≤ 5 MB).
  - Store uploads outside the webroot or in an S3 bucket with restricted permissions.

### 3.2 Prompt Injection & Template Injection

- Escape or reject suspicious payloads (e.g., system prompts containing `{{` or commands).
- Avoid direct string interpolation inside server-side templates. Use context-aware rendering methods.

---

## 4. Data Protection & Privacy

### 4.1 Encrypt Data In Transit & At Rest

- Enforce HTTPS (TLS 1.2+) for all front-end and API traffic (Vercel provides built-in certs).
- Encrypt sensitive fields (PII, API keys, tokens) at rest. Use database-level encryption or application-level AES-256.

### 4.2 Secrets Management

- Do **not** commit secrets or `.env` files.
- Use Vercel Environment Variables or a dedicated solution (AWS Secrets Manager, HashiCorp Vault).
- Validate all required env vars (`OPENAI_API_KEY`, `DATABASE_URL`, etc.) at startup with Zod:
  ```ts
  const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    OPENAI_API_KEY: z.string().min(1),
    // ...
  });
  const env = envSchema.parse(process.env);
  ```

### 4.3 Privacy & PII Handling

- Mask or redact sensitive fields in logs (e.g., user email, chat content if requested).
- Provide users with data export/deletion controls to comply with GDPR/CCPA.

---

## 5. API & Service Security

- **Rate Limiting & Throttling**: Use a Next.js middleware (or Vercel Edge function) to limit requests per IP or user (e.g., 100 requests/min).
- **CORS**: Restrict allowed origins to your production domains. Example in `next.config.js`:
  ```js
  module.exports = {
    async headers() {
      return [
        {
          source: '/api/:path*',
          headers: [{ key: 'Access-Control-Allow-Origin', value: 'https://your-domain.com' }]
        }
      ];
    }
  }
  ```
- **Versioning**: Prefix APIs with `/api/v1/...` to manage backward-compatible changes.
- **HTTP Methods**: Enforce correct verbs (GET for reads, POST for creations, PUT/PATCH for updates, DELETE for removals).

---

## 6. Web Application Security Hygiene

- **CSRF Protection**: Implement anti-CSRF tokens for all state-changing routes, or use NextAuth’s built-in CSRF protection.
- **Security Headers** (via `next-secure-headers` or custom middleware):
  - `Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none';`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: no-referrer-when-downgrade`
- **Secure Cookies**: Ensure all cookies set by Next.js API routes use `HttpOnly`, `Secure`, and an appropriate `SameSite` policy.
- **Subresource Integrity (SRI)**: Apply SRI hashes to any third-party scripts or styles loaded via CDN.

---

## 7. Infrastructure & Configuration Management

- **Hardened Docker Images**:
  - Use official Node.js slim images.
  - Run processes as a non-root user.
  - Disable debugging and remove build tools in production layers.
- **Server & OS Hardening**: If self-hosting, disable unnecessary services, apply latest patches, and minimize open ports.
- **Disable Debug in Production**: Ensure `NEXT_PUBLIC_NODE_ENV !== 'development'` disables verbose logging and debug endpoints.

---

## 8. Dependency Management

- **Lockfiles**: Commit `package-lock.json` or `yarn.lock` for deterministic installs.
- **Vulnerability Scanning**: Integrate Dependabot, Snyk, or GitHub Advanced Security to catch CVEs.
- **Minimal Footprint**: Audit dependencies regularly. Remove unused libraries and avoid large, unmaintained packages.
- **Regular Updates**: Schedule monthly dependency reviews and patch updates.

---

## 9. Logging, Monitoring & Incident Response

- **Structured Logging**: Use a library like `pino` or `winston` to emit JSON logs without PII.
- **Error Tracking**: Integrate Sentry or LogRocket to capture exceptions, stack traces, and performance anomalies.
- **Alerting & Metrics**: Monitor API error rates, latency, and infrastructure health. Configure alerts for abnormal spikes.
- **Incident Playbook**: Define roles and escalation paths for security incidents (e.g., token leaks, unauthorized access).

---

By following these guidelines, the **everything-app** will achieve a robust security posture, safeguarding both your infrastructure and your users’ data as you build out powerful AI features.

*Last updated: 2024-06-XX*