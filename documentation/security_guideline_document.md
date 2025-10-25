# Security Guidelines for everything-app

This document provides comprehensive security guidelines tailored for the **everything-app** repository, which serves as a starter kit for building AI-powered web applications using Next.js. Adhering to these practices will help ensure the application is resilient, trustworthy, and secure by design.

---

## 1. Authentication & Access Control

- **Strong Password Policies**  
  • Enforce minimum length (e.g., 12 characters) with a mix of uppercase, lowercase, digits, and symbols.  
  • Use `bcrypt` or `Argon2` (with per-user salts) for hashing—avoid deprecated algorithms (e.g., MD5, SHA1).  

- **Session Management**  
  • Rely on `better-auth` but verify that cookies use `Secure`, `HttpOnly`, and `SameSite=Lax/Strict`.  
  • Configure both idle and absolute session timeouts (e.g., 15 min idle, 24 hr max).  
  • Implement logout endpoints that destroy server-side sessions and invalidate session tokens.  

- **Role-Based Access Control (RBAC)**  
  • Define explicit roles (e.g., `user`, `admin`) and map them to permissions.  
  • On every protected API route (`/api/chat`, `/api/keys`, etc.), verify the user’s role before proceeding.  
  • Deny by default—avoid overly permissive or missing authorization checks.  

- **Multi-Factor Authentication (MFA)** *(Optional but Recommended)*  
  • Offer TOTP or push-based second factors for elevated privileges (e.g., API key creation).  

---

## 2. Input Validation & Output Encoding

- **Schema Validation**  
  • Use a schema validator (e.g., Zod or Yup) on every API route to validate request bodies and query parameters.  
  • Example: Validate chat payloads (`sessionId: string`, `message: { role: 'user'|'assistant', content: string }`).  

- **Prevent Injection**  
  • Leverage Drizzle ORM’s parameterized queries to eliminate SQL injection.  
  • Never interpolate user input into raw SQL—always use prepared statements.  

- **Mitigate XSS**  
  • Escape or sanitize any user-generated content before rendering (e.g., chat messages) using libraries like `DOMPurify` or React’s default escaping.  
  • Implement a Content Security Policy (CSP) via Next.js custom headers to restrict inline scripts and untrusted domains.  

- **Safe Redirects**  
  • If the app ever redirects based on a URL parameter, maintain an allow-list of permitted hosts or paths.  

---

## 3. Data Protection & Privacy

- **Encryption in Transit & At Rest**  
  • Enforce HTTPS (TLS 1.2+) for all client⇄server and server⇄database connections.  
  • Ensure PostgreSQL connections use SSL with certificate verification.  

- **Secrets Management**  
  • Store all secrets (DB credentials, AI API keys, `better-auth` secret) in a secure vault or environment variables managed by your cloud provider (e.g., Vercel Secrets, AWS Secrets Manager).  
  • Avoid checking any secret values into version control.  

- **Sensitive Data Handling**  
  • Do not log raw PII or API tokens.  
  • Mask or redact sensitive fields in logs (e.g., show only the last 4 digits of a key).  

- **Data Retention & Deletion**  
  • Provide mechanisms for users to delete their data (chat history, API keys) and enforce data-retention policies aligned with GDPR/CCPA.  

---

## 4. API & Service Security

- **Rate Limiting & Throttling**  
  • Implement per-user or per-IP rate limits on critical endpoints (`/api/chat`, `/api/auth`).  
  • Consider using Next.js middleware or an API Gateway (e.g., Cloudflare, AWS API Gateway) for built-in throttling.  

- **CORS Configuration**  
  • Restrict origins to only your official domains.  
  • Disallow wildcard (`*`) unless absolutely necessary for public APIs.  

- **Least Privilege for API Keys**  
  • When generating customer API keys, scope them to the minimal set of operations (e.g., read-only vs. read-write).  

- **API Versioning**  
  • Expose endpoints under `/api/v1/...` to allow future changes without breaking clients.  

---

## 5. Web Application Security Hygiene

- **CSRF Protection**  
  • Use anti-CSRF tokens (Synchronizer Token Pattern) for all state-changing forms and fetch requests.  
  • NextAuth or `better-auth` may provide CSRF safeguards—ensure they are enabled.  

- **Security Headers**  
  Configure these in `next.config.js` or a custom server:
  • `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`  
  • `X-Content-Type-Options: nosniff`  
  • `X-Frame-Options: DENY`  
  • `Referrer-Policy: no-referrer-when-downgrade`  
  • `Content-Security-Policy`: permits only necessary script/style sources and blocks everything else.  

- **Secure Cookies**  
  • Set `Secure` (HTTPS only), `HttpOnly` (JavaScript inaccessible), and `SameSite=Lax` or `Strict` attributes on session cookies.  

- **Third-Party Assets**  
  • Use Subresource Integrity (SRI) when loading external scripts or styles.  

---

## 6. Infrastructure & Configuration Management

- **Environment Hardening**  
  • Disable debugging and verbose error pages in production.  
  • Turn off Next.js’s `next dev` features and source maps in production builds.  

- **Server Configuration**  
  • Only open necessary ports (e.g., 443 for HTTPS).  
  • Disable unused services and close admin interfaces.  

- **Software Updates**  
  • Regularly upgrade Next.js, Node.js, and dependencies to patch known vulnerabilities.  
  • Automate dependency checks using GitHub Dependabot or Snyk.  

- **Container Security**  
  • If using Docker, build minimal images (e.g., `node:18-alpine`), scan images for CVEs, and run containers as non-root users.  

---

## 7. Dependency Management

- **Lockfiles & Deterministic Builds**  
  • Commit `package-lock.json` (or `yarn.lock`) to ensure predictable installs.  

- **Vulnerability Scanning**  
  • Integrate SCA tools (e.g., **npm audit**, **Snyk**, **Dependabot**) in your CI pipeline to detect vulnerable dependencies.  

- **Minimal Footprint**  
  • Audit and remove unused packages to reduce attack surface.  

- **Review & Approval**  
  • Establish a dependency-change review process—avoid merging unvetted upgrades.  

---

## Conclusion
By embedding these security practices into the **everything-app** from day one—covering authentication, data protection, input validation, API security, and infrastructure hardening—you ensure a robust, maintainable foundation for your AI-powered platform. Regularly revisit these guidelines, conduct security audits, and update dependencies to keep the application secure over time.