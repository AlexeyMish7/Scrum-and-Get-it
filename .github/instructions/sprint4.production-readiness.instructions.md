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

**Implementation Notes (Supabase strategy)**:

- For this school project we are using **Option B (reuse the current Supabase project)** as “production”.
- That means you typically **do not** re-run the full migration history; instead you verify the current schema and (re)apply only what’s missing.

**Implementation Notes (How to verify + apply what’s missing)**:

- Verify schema in Supabase SQL Editor:
  - Run `db/migrations/query_full_database_schema.sql` (or `query_full_schema_single_run.sql`) and spot-check tables/indexes/constraints.
- Verify required tables + seed rows (recommended):
  - Run `./scripts/db-verify-supabase.ps1 -EnvFilePath ./server/.env`.
  - Defaults validate the current PRD-aligned schema (teams + documents + generation + analytics + templates/themes).
- If system defaults are missing:
  - Re-run these seed migrations (they are designed to be re-runnable for system defaults):
    - `db/migrations/2025-11-18_seed_default_templates.sql`
    - `db/migrations/2025-11-19_seed_default_themes.sql`
    - `db/migrations/2025-11-20_seed_cover_letter_templates.sql`

**Implementation Notes (How to run migrations on a brand-new DB)**:

- Preferred (works on any machine):
  - Build one SQL bundle: `./scripts/db-build-migration-bundle.ps1 -OutputFile ./db/out/prod_migrations_bundle.sql`
  - In Supabase: SQL Editor → paste/run `db/out/prod_migrations_bundle.sql`
- Optional (if you have `psql` installed):
  - `./scripts/db-apply-migrations-psql.ps1 -DatabaseUrl "$env:DATABASE_URL"`

**Notes**:

- Reusing an existing Supabase project is acceptable for class, but treat it like “prod”: keep keys out of git, and don’t use your dev keys in deployed hosting.
- Backups/pooling are platform features; document what your Supabase tier supports and what you enabled.

---

### UC-129: Production Environment Setup on Free-Tier Cloud

**Goal**: Publicly accessible deployment using only free-tier services.

**Deliverables**:

- Frontend deployed (Vercel or Netlify)
- Backend deployed (Render, Railway, or Fly)
- HTTPS enabled by platform
- CORS configured to allow the frontend origin(s)
- Deployment process documented for future updates

**Implementation notes (this repo)**:

- Frontend no longer hard-codes `http://localhost:8787` anywhere.
  - Configure `VITE_API_BASE_URL` in production (preferred) to point at the deployed backend.
  - Local dev can use same-origin `/api/...` with Vite proxy (default).
- Backend CORS default allows `PUT,PATCH,DELETE` to avoid browser preflight failures.
- Recommended free-tier pairing: Vercel (frontend) + Render (backend) + Supabase (DB/Auth).

**Required env vars (minimum)**:

- Frontend (Vercel): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`, `VITE_DEV_MODE=false`
- Backend (Render): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AI_API_KEY` (or `OPENAI_API_KEY`), `CORS_ORIGIN=<frontend origin>`, `ALLOW_DEV_AUTH=false`, `FEATURE_AI_ROUTES=true`

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
- Notifications configured (minimal: webhook to Slack/Discord/Teams)
- Rollback capability (manual deploy of a previous ref + platform rollback)

**Verification**:

- PR triggers tests
- Merge triggers the correct deployment

**What’s implemented in this repo**:

- `.github/workflows/ci.yml`
  - Runs tests + builds on every push + pull request.
- `.github/workflows/deploy-staging.yml`
  - Runs on pushes to `develop` (staging).
  - Also supports manual deploy from the GitHub UI via `workflow_dispatch` (used for redeploy/rollback).
- `.github/workflows/deploy-production.yml`
  - Runs on pushes to `main` (production).
  - Also supports manual deploy from the GitHub UI via `workflow_dispatch` (used for redeploy/rollback).

**Outside-the-code setup (click-by-click)**:

1. Create the `develop` branch (if you don’t have it)

- In GitHub repo page → **Code** tab
- Click the branch dropdown (shows `main`)
- Type `develop` → click **Create branch: develop from main**

2. Create GitHub Environments (to see deployment history)

- Repo → **Settings** → **Environments**
- Click **New environment** → create:
  - `staging`
  - `production`

3. Add GitHub Secrets (required for deploy workflows)

- Repo → **Settings** → **Secrets and variables** → **Actions**
- Click **New repository secret** and add:

Vercel (frontend deploy via CLI):

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Render (backend deploy via deploy hook):

- `RENDER_DEPLOY_HOOK_URL_STAGING`
- `RENDER_DEPLOY_HOOK_URL_PRODUCTION`

Optional (notifications + nicer dashboards):

- `DEPLOYMENT_WEBHOOK_URL` (Slack/Discord/Teams webhook URL)
- `STAGING_BACKEND_URL` (example: `https://your-staging-backend.onrender.com`)
- `PRODUCTION_BACKEND_URL` (example: `https://your-prod-backend.onrender.com`)

4. Where to get the Render deploy hook URLs

- Render dashboard → click your backend service
- Go to **Settings**
- Find **Deploy Hook** (or “Deploy hooks”) → click **Generate Deploy Hook**
- Copy the URL and paste it into GitHub secrets:
  - staging service → `RENDER_DEPLOY_HOOK_URL_STAGING`
  - production service → `RENDER_DEPLOY_HOOK_URL_PRODUCTION`

5. Where to get the Vercel IDs/token

- Vercel → **Account Settings** → **Tokens** → create token → copy
  - set GitHub secret `VERCEL_TOKEN`
- Vercel → your project → **Settings** → **General**
  - copy **Project ID** → set `VERCEL_PROJECT_ID`
  - copy **Team ID** (or “Org ID”) → set `VERCEL_ORG_ID`

6. (Strongly recommended) Add branch protection so bad code can’t be merged

- GitHub repo → **Settings** → **Branches** → **Add branch protection rule**
- Branch name pattern: `main`
- Check:
  - **Require a pull request before merging**
  - **Require status checks to pass before merging**
  - Select the CI check (from `CI / test-build`)
- Repeat for `develop` if you want staging protected too.

**How to do a rollback (beginner-friendly)**:

- If a deployment is broken, you have 2 practical rollback options:
  1. **Platform rollback**:
     - Render: service → **Deploys** → select a previous successful deploy → **Rollback**.
     - Vercel: project → **Deployments** → select a previous deployment → **Promote to Production** (or redeploy).
  2. **Manual GitHub Actions redeploy of an older ref**:
     - GitHub repo → **Actions**
     - Open `Deploy (Staging)` or `Deploy (Production)`
     - Click **Run workflow**
     - Optional: fill `ref` with an older commit SHA (from the commits list)

Notes:

- The deploy workflows upload a small `deployment-metrics.json` artifact for basic timing/traceability.
- Deployment history is visible under **Environments** and in the workflow run summaries.

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
