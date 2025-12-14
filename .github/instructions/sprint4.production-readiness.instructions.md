# Sprint 4 — Production Readiness UCs (UC-129/130/131/132/133/134/135/139/145/148/150)

This file is the focused implementation guide for the 11 production-readiness use cases. It is meant to be used as the team’s working checklist for Sprint 4 deployment.

**Owner (All UCs in this file)**: @AlexeyMish7

---

## Recommended Order (Do These In This Sequence)

This order is dependency-first (earlier items unblock later items) and risk-first (get a working production system early, then harden/optimize).

1. **UC-131 — Environment Configuration Management**
2. **UC-130 — Database Migration to Production**
3. **UC-129 — Production Environment Setup (frontend + backend)**
4. **UC-132 — CI/CD Pipeline Configuration**
5. **UC-133 — Production Monitoring and Logging**
6. **UC-135 — Production Security Hardening**
7. **UC-134 — Production Performance Optimization**
8. **UC-139 — Domain and DNS Configuration**
9. **UC-145 — Security Penetration Testing**
10. **UC-150 — Sprint 4 Complete Test Suite (CI-enforced)**
11. **UC-148 — Final Pre-Launch Checklist and Go-Live**

---

## UC Checklists

### UC-131: Environment Configuration Management

**Goal**: Separate dev/staging/prod configs so deployments are predictable and secrets are not committed.

**Deliverables**:

- Committed env templates (no secrets):
  - `frontend/.env.example`, `frontend/.env.development.example`, `frontend/.env.staging.example`, `frontend/.env.production.example`
  - `server/.env.example`, `server/.env.development.example`, `server/.env.staging.example`, `server/.env.production.example`
- Documented environment variable map for:
  - frontend (Vite)
  - server (Node/Express)
- Logging levels by env (debug in dev, error in prod)
- Feature flags strategy (minimal: boolean env flags), including `FEATURE_AI_ROUTES` (server)

**Verification**:

- App runs locally with dev vars
- Staging/prod builds do not require editing source code to switch environments
- `npm run dev:staging` works for both frontend and server when staging env files are present

---

### UC-130: Database Migration to Production

**Goal**: Provision production Postgres and apply the full schema + required seeds.

**Deliverables**:

- Production DB created on Supabase or Neon (free tier)
- All SQL migrations applied (in correct order)
- Reference seed data applied (templates/defaults required for app to function)
- Backups configured if free-tier supports it
- Connection pooling configured (platform feature if available)

**Verification**:

- Confirm tables, indexes, constraints exist
- Confirm seed rows exist where required
- Backend can connect successfully using production credentials

---

### UC-129: Production Environment Setup on Free-Tier Cloud

**Goal**: Publicly accessible deployment using only free-tier services.

**Deliverables**:

- Frontend deployed (Vercel or Netlify)
- Backend deployed (Render, Railway, or Fly)
- HTTPS enabled by platform
- CORS configured to allow the frontend origin(s)
- Deployment process documented for future updates

**Verification**:

- Public URL loads the app
- Core flows work in production (login/signup + key CRUD paths)

---

### UC-132: CI/CD Pipeline Configuration

**Goal**: Automated tests + deployments based on branch rules.

**Deliverables**:

- GitHub Actions runs tests on every PR/push
- Deploy to production on merge to `main`
- Deploy to staging on merge to `develop` (or an agreed staging branch)
- Deployment blocked if tests fail
- Notifications configured (minimal: GitHub/Email or Slack/Discord webhook)
- Rollback strategy documented (platform rollback or redeploy previous build)

**Verification**:

- PR triggers tests
- Merge triggers the correct deployment

---

### UC-133: Production Monitoring and Logging

**Goal**: Detect and debug real production problems.

**Deliverables**:

- Sentry project(s) configured (frontend + backend if applicable)
- UptimeRobot check(s) configured for:
  - frontend URL
  - backend health endpoint
- Structured logging approach documented (fields like env, requestId, userId when safe)
- Incident response notes (where to look first, who gets notified)

**Verification**:

- Trigger a known error and confirm it appears in Sentry
- UptimeRobot shows service status and alerts on downtime

---

### UC-135: Production Security Hardening

**Goal**: Reduce common web-app security risks before wide exposure.

**Deliverables**:

- CSRF protection plan (if using cookies/sessions)
- XSS protections (sanitize/escape user input, safe rendering)
- SQL injection protections (parameterized queries only)
- Secure session handling (cookie flags, token storage guidance)
- HTTP security headers (CSP, HSTS, etc.)
- Dependency update process established

**Verification**:

- Basic security checks pass (manual + automated)

---

### UC-134: Production Performance Optimization

**Goal**: Improve load times and runtime responsiveness.

**Deliverables**:

- Frontend code splitting/lazy loading where appropriate
- Bundle minimized (tree shaking, dead code removed)
- Server gzip enabled (or platform compression)
- Browser caching strategy defined for static assets
- Lighthouse score target: > 90
- TTFB target: < 600ms (where measurable)

**Verification**:

- Lighthouse run on production URL meets targets

---

### UC-139: Domain and DNS Configuration

**Goal**: Professional domain/subdomain with valid SSL.

**Deliverables**:

- Domain/subdomain configured (CNAME/A/TXT as required)
- HTTPS verified (automatic cert)
- Redirect policy set (www → non-www or the reverse)
- DNS documentation captured (records and what they do)

**Verification**:

- Domain loads correctly from multiple networks

---

### UC-145: Security Penetration Testing

**Goal**: Basic OWASP Top 10 validation and fixes.

**Deliverables**:

- Test plan and results recorded (what was tested + outcomes)
- Fixes for critical/high findings

**Verification**:

- No critical findings remain

---

### UC-150: Sprint 4 Complete Test Suite

**Goal**: Automated tests and coverage gates appropriate for production.

**Deliverables**:

- Unit/integration/E2E/perf/security tests as applicable
- Coverage reporting in CI
- Target: 90%+ coverage for Sprint 4 components (or documented exception)

**Verification**:

- CI shows all tests green and coverage report produced

---

### UC-148: Final Pre-Launch Checklist and Go-Live

**Goal**: Confirm readiness and launch with confidence.

**Deliverables**:

- Bug triage completed
- Monitoring + alerting confirmed
- Security review completed
- Deployment stable
- Support plan prepared

**Verification**:

- Final checklist is complete and signed off by the team
