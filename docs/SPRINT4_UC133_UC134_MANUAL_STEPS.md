# Sprint 4 — UC-134 (Production Monitoring & Logging) + Other Manual Steps

This doc is the “do this next” checklist for the items that cannot be completed purely in code.

Note on UC numbering: In some Sprint 4 lists, “monitoring & logging” is labeled UC-133; in this checklist we treat it as UC-134 because that’s the acceptance criteria you’re submitting against.

---

## Before you start (5 minutes)

1. Gather your production URLs

   - Frontend (Vercel): `https://<your-app>.vercel.app` (or custom domain)
   - Backend (Render): `https://<your-service>.onrender.com`

2. Confirm your backend health endpoint works
   - Open: `https://<backend>/api/health`
   - You should get a 200 JSON response.

---

## UC-134 — Production Monitoring and Logging (Manual Steps)

### What’s already implemented in code

- Structured JSON logs + log levels already exist.
- Sentry integration exists in both frontend and backend.
- Uptime monitoring is intentionally external (UptimeRobot).
- API response time + error rate tracking exists via a token-protected metrics endpoint.
- Incident response procedures are documented.

### UC-134 Acceptance Criteria mapping (quick checklist)

- Implement application logging with appropriate levels ✅ (`LOG_LEVEL`)
- Implement structured logging with searchable fields ✅ (JSON logs w/ `requestId`, `http_*`, etc.)
- Set up error tracking with Sentry (free tier) ✅ (manual setup required)
- Monitor application uptime with UptimeRobot (free tier) ✅ (manual setup required)
- Track API response times and error rates ✅ (`GET /api/metrics`)
- Set up alerts for critical errors and downtime ✅ (manual setup required)
- Create dashboard for key metrics ✅ (Sentry dashboard + UptimeRobot dashboard + `/api/metrics`)
- Document incident response procedures ✅ (below)
- Frontend verification: trigger error in production, verify logged + alert sent ✅ (below)

This document contains all required UC-134 steps; you should not need any other UC-134 docs.

### Step 1 — Create Sentry projects (free tier)

1. Create a Sentry account (free tier).
2. Create two projects (recommended):
   - Frontend project: React
   - Backend project: Node.js
3. Copy both DSNs.

Why: this is what enables error tracking + alerting.

### Step 2 — Set Sentry env vars (Render + Vercel)

#### 2A) Backend (Render)

In Render → your backend service → Environment:

1. Set:
   - `SENTRY_DSN=<backend DSN>`
   - `SENTRY_ENVIRONMENT=production`
2. Optional (recommended):
   - `SENTRY_RELEASE=<git SHA or version>`
   - `SENTRY_TRACES_SAMPLE_RATE=0`
3. Deploy/restart the service.

#### 2B) Frontend (Vercel)

In Vercel → Project Settings → Environment Variables:

1. Set:
   - `VITE_SENTRY_DSN=<frontend DSN>`
2. Optional:
   - `VITE_SENTRY_RELEASE=<git SHA or version>`
   - `VITE_SENTRY_TRACES_SAMPLE_RATE=0`
3. Redeploy the frontend.

Important: Vite `VITE_*` env vars are build-time; redeploy is required.

### Step 3 — Configure Sentry alerts (required)

In Sentry → Alerts:

1. Create an alert rule:
   - Simplest: “New issue created”
   - Or: “Error count > 0 in 5 minutes”
2. Add notification destinations:
   - Email is sufficient for Sprint 4
   - Slack/Discord optional

Why: UC-133 requires alerting, not just error collection.

### Step 4 — Configure UptimeRobot monitors (free tier)

In UptimeRobot:

1. Add a monitor for the frontend URL

   - Type: HTTPS
   - URL: `https://<frontend>`
   - Interval: 5 minutes

2. Add a monitor for the backend health URL

   - Type: HTTPS
   - URL: `https://<backend>/api/health`

3. Configure alert contacts (email/team).

Optional:

- Add `https://<backend>/api/health?deep=1` only if you can tolerate occasional false alarms (rate limits/network).

### Step 5 — Enable metrics endpoint (recommended)

In Render → backend Environment:

1. Set:
   - `METRICS_TOKEN=<random secret>`
2. Deploy/restart.

Verify:

- Request: `GET https://<backend>/api/metrics?window=300`
- Header: `Authorization: Bearer <METRICS_TOKEN>`

Why: this is your lightweight “dashboard feed” for request counts, 4xx/5xx, p95 latency, etc.

Optional helper scripts (local):

- `scripts/monitoring/fetch-metrics.ps1`
- `scripts/monitoring/trigger-sentry-test-error.ps1`

### Step 6 — Incident response procedure (required)

When something breaks in production, use this exact order:

1. Confirm if it’s downtime (fast triage)

   - Check UptimeRobot (frontend + backend)
   - Manually load `https://<backend>/api/health`

2. Check Sentry first (root cause)

   - Find the newest issue spike
   - Confirm environment is `production`
   - Open the stack trace and identify the failing endpoint/page

3. Check backend logs (Render)

   - Filter by error level if available (`LOG_LEVEL` should usually be `info` or `warn` in production)
   - Use timestamps + request IDs to correlate with Sentry events

4. Mitigate

   - If the issue is severe, rollback:
     - Vercel: Deployments → pick a previous deployment → Promote
     - Render: Deploys → Rollback

5. Follow-up
   - Write a short note: what happened, how it was fixed, and how you’ll prevent it next time.

### Step 7 — UC-134 Frontend verification (required)

UC-134 requires: “Trigger error in production, verify it’s logged and alert is sent.”

Recommended order:

1. In Render → set:
   - `MONITORING_TEST_TOKEN=<random secret>`
2. Deploy/restart backend.
3. Trigger the intentional backend error:
   - `POST https://<backend>/api/monitoring/test-error`
   - Header: `Authorization: Bearer <MONITORING_TEST_TOKEN>`
4. Confirm all 3 outcomes:
   - Response is HTTP 500
   - A new issue appears in Sentry (backend project)
   - The Sentry alert notification is delivered

Optional frontend error verification:

- Trigger a UI error in a staging deploy/branch and confirm it appears in Sentry (frontend project).

---

## UC-134 — Production Performance Optimization (Manual Steps)

### What’s already implemented in code

- Route-level code splitting / lazy loading in the router
- Tree shaking + chunk splitting via Vite
- Gzip negotiation for JSON API responses
- Browser caching headers for `/assets/*` on Vercel

This document contains all required UC-134 steps; you should not need any other UC-134 docs.

### Step 1 — Confirm you are deploying the latest build

1. Deploy frontend (Vercel) and backend (Render) with the latest branch/commit you intend to submit.
2. After deployment, do a hard refresh in the browser.

Why: Lighthouse/TTFB results must reflect what you actually submitted.

### Step 2 — CDN for static assets (Cloudflare free tier)

Cloudflare is only meaningful if you have a custom domain.

If you have a custom domain:

1. Create a Cloudflare account (free).
2. Add your domain.
3. In your domain registrar, change nameservers to the ones Cloudflare provides.
4. In Cloudflare:
   - Enable “Always Use HTTPS”
   - Enable “Brotli” compression
   - Keep caching defaults (fine for class)
5. In Vercel:
   - Point the custom domain to Vercel (per Vercel domain instructions)

If you do NOT have a custom domain:

- Note in your submission that Vercel already serves static assets from an edge network/CDN-like infrastructure, and Cloudflare can’t be placed in front of a `*.vercel.app` domain without a custom domain.

### Step 3 — Optimize images and assets

Minimum “done for class” steps:

1. Identify large images (logos, screenshots, marketing images if any).
2. Convert large PNG/JPG assets to WebP (or AVIF) and replace them in the repo.
3. Confirm the site still renders correctly.

Tip: start with the biggest image files you can find and keep dimensions reasonable.

### Step 4 — Verify browser caching headers

In Chrome DevTools → Network:

1. Load the production site.
2. Click a `/assets/*.js` entry.
3. Confirm response header:
   - `Cache-Control: public, max-age=31536000, immutable`

Why: caching is required by UC-134.

### Step 5 — Verify gzip on server responses

From PowerShell:

1. Warm backend:
   - `curl -s https://<backend>/api/health > $null`
2. Request with gzip:
   - `curl -I -H "Accept-Encoding: gzip" https://<backend>/api/metrics?window=300`

Confirm:

- Response headers include `Content-Encoding: gzip` (compression is only applied once payload size is large enough).

### Step 6 — Lighthouse audit (required)

1. Open production frontend URL in Chrome.
2. DevTools → Lighthouse.
3. Run Performance (Mobile + Desktop).
4. Save/export the report.

Target:

- Performance score > 90

### Step 7 — Measure TTFB (required)

1. Warm backend first:
   - Hit `https://<backend>/api/health`
2. In DevTools → Network:
   - Click the main document request
   - Timing tab → confirm TTFB < 600ms

Important note for free tier:

- Render cold starts can push TTFB over 600ms on the first request.
- For submission, measure after warm-up and document cold-start behavior honestly.

---

## UC-139 — Domain and DNS Configuration (Manual Steps)

Goal: access the app via a professional custom domain with correct DNS, valid HTTPS, and a consistent www/non-www redirect.

### What’s already implemented in code

- Nothing special is required in code for domains; this UC is mostly platform + DNS configuration.
- The frontend is compatible with Vercel custom domains.
- If you change the frontend origin (domain), remember to update backend `CORS_ORIGIN` to match.

### Step 1 — Decide your domain + the canonical URL (www vs non-www)

Pick one “canonical” public URL:

- Option A (common): `https://example.com` is canonical, `https://www.example.com` redirects to it
- Option B: `https://www.example.com` is canonical, `https://example.com` redirects to it

Write down:

- **Domain**: `______________`
- **Canonical**: `https://______________`
- **Redirect**: `https://______________` redirects to `https://______________`

Why: you need one canonical origin for SSL, cookies, CORS, and sharing.

### Step 2 — Add the domain to Vercel (frontend)

In Vercel → your frontend project:

1. Settings → Domains
2. Add the domain (both apex and `www` recommended)
   - Add: `example.com`
   - Add: `www.example.com`
3. Vercel will show the exact DNS records it expects. Keep that page open.

### Step 3 — Configure DNS records (A / CNAME / TXT)

In your domain registrar / DNS host:

1. **A record (apex/root)**

   - Name/Host: `@`
   - Type: `A`
   - Value: `76.76.21.21` (Vercel common apex IP)

2. **CNAME record (www)**

   - Name/Host: `www`
   - Type: `CNAME`
   - Value/Target: `cname.vercel-dns.com`

3. **TXT record (verification / ownership)**
   - Add the TXT record Vercel requests (it may look like `_vercel` or similar)

Important:

- Some DNS providers require trailing dots, some don't. Follow your provider's format.
- If your DNS is managed by Cloudflare, you may need to set the record to **DNS only** (not proxied) until verification passes.

Why: UC-139 requires A/CNAME/TXT configured and domain ownership verified.

### Step 4 — Verify domain ownership in Vercel

Back in Vercel → Domains:

1. Wait for DNS to propagate (typically minutes; can be up to 24h depending on TTL).
2. Click verify/re-check.
3. Ensure the domain status becomes "Valid".

### Step 5 — Enable HTTPS / SSL certificate

Vercel provisions SSL automatically after domain verification.

Verify in a browser:

1. Open your canonical URL.
2. Confirm the site loads over `https://`.
3. Click the lock icon → certificate info → confirm it's valid for your domain.

### Step 6 — Configure www → non-www redirect (or vice versa)

In Vercel → Domains:

1. Set the **Primary Domain** to your canonical choice.
2. Ensure the other variant redirects to the primary domain.

Verify:

- `https://www.example.com` redirects to `https://example.com` (or the reverse)

Why: UC-139 requires one consistent redirect direction.

### Step 7 — (Recommended) Align backend CORS with the new domain

If your frontend domain changed, update Render (backend) env var:

- `CORS_ORIGIN=https://<your-canonical-frontend-domain>`

Then redeploy/restart the backend.

Why: browsers enforce CORS; production should not use `*`.

### Step 8 — (Optional) Custom domain for the backend API

If you want the backend to also look professional:

1. Pick an API subdomain: `api.example.com`
2. In Render → your backend service → Custom Domains:
   - Add `api.example.com`
   - Follow Render's DNS instructions (usually a CNAME)
3. In DNS, add the requested `CNAME` for `api` pointing to Render's target.
4. Wait for SSL to provision on Render, then verify:
   - `https://api.example.com/api/health`
5. Update frontend env var (Vercel):
   - `VITE_API_BASE_URL=https://api.example.com`
6. Redeploy the frontend.

If you don't do this, it's OK to keep using `https://<your-service>.onrender.com` for API calls.

### Step 9 — Email forwarding (optional)

If your registrar/DNS host supports it, set up forwarding like:

- `careers@yourdomain.com` → your personal email
- `support@yourdomain.com` → team/shared inbox

Note: some providers require MX records or a paid email product (Google Workspace, Microsoft 365). This is acceptable to mark as "not available on free tier" if your registrar doesn't support forwarding.

### Step 10 — Document the final DNS configuration (required)

Fill this in so the team can reproduce it later:

- DNS host / registrar: `______________`
- Nameservers used: `______________`
- Records:
  - `@` → `A` → `76.76.21.21`
  - `www` → `CNAME` → `cname.vercel-dns.com`
  - `__________` → `TXT` → `__________` (Vercel verification)
  - (optional) `api` → `CNAME` → `__________` (Render)

### Step 11 — Test from multiple locations (required)

UC-139 requires you to confirm the domain works from more than one network.

Do at least 2 of these:

1. Your normal network (home/campus) → load the site
2. Mobile hotspot / phone LTE → load the site
3. Use a DNS propagation checker (e.g., "What's My DNS") to confirm A/CNAME resolve globally

---

## Quick “done” checklist

UC-133 is done when:

- Sentry issues appear for real errors
- Alert notifications are delivered
- Uptime monitors exist for frontend + backend
- You can fetch `/api/metrics` with a token
- You can trigger `POST /api/monitoring/test-error` and see an alert

UC-134 is done when:

- Lighthouse performance score > 90 (saved report)
- TTFB < 600ms after warm-up (documented)
- Asset caching headers are confirmed
- CDN approach is documented (Cloudflare w/ custom domain, or justified limitation)

UC-139 is done when:

- The app is accessible via your custom domain
- HTTPS is enabled and the browser shows a valid SSL certificate
- DNS records are set correctly (A, CNAME, TXT) and Vercel domain verification is "Valid"
- `www` redirects to non-`www` (or vice versa) consistently
- DNS configuration is documented (filled in above)
- Domain accessibility is tested from multiple locations/networks
