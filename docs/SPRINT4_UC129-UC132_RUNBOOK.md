# Sprint 4 Runbook — Finish UC-129 / UC-130 / UC-131 / UC-132 (Beginner Step-by-Step)

This is a practical checklist you can follow to fully **complete** the Sprint 4 production-readiness items that require _you_ to do setup in dashboards (Vercel/Render/Supabase/GitHub).

If anything in a dashboard looks slightly different, that’s normal—UIs change. The **names of the settings and the intent** are what matters.

---

## What these 4 UCs mean (simple)

- **UC-131 (Environment config)**: keep “dev vs staging vs prod” settings separate so you don’t accidentally use the wrong keys.
- **UC-130 (DB migration)**: make sure the production database actually has the right tables + seed data.
- **UC-129 (Deploy)**: put frontend + backend online (free tier) with HTTPS and correct CORS.
- **UC-132 (CI/CD)**: GitHub Actions runs tests automatically; deployments run automatically per branch once you connect secrets.

---

## Before you start (10 minutes)

### Accounts you’ll need

- GitHub (you already have)
- Supabase (database + auth)
- Vercel (frontend hosting)
- Render (backend hosting)

Why: each part of your app lives somewhere different. You’re “wiring” them together using environment variables.

### Terms you’ll see

- **Environment variables**: secret settings like API keys and URLs (never commit these to git).
- **Build-time vs runtime**:
  - Frontend (Vite) reads `VITE_*` **during build** → if you change these, you must redeploy the frontend.
  - Backend (Node) reads env vars **at runtime** → changing these typically restarts the service.

---

## Step 0 — Make sure your repo is ready (local)

### 0.1 Pull the latest `main`

Why: you want the exact code GitHub is deploying.

- In PowerShell:
  - `git checkout main`
  - `git pull`

### 0.2 Confirm the workflows exist

These files should exist:

- `.github/workflows/ci.yml`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-production.yml`

Why: if the workflow files are not on `main`, GitHub Actions can’t run them.

### 0.3 Run the same checks CI runs (optional but recommended)

Why: if it fails on your machine, it will fail on GitHub too.

- Tests:

  - `cd tests`
  - `npm ci`
  - `npm run test:all`

- Frontend build:

  - `cd ../frontend`
  - `npm ci`
  - `npm run build`

- Server build:
  - `cd ../server`
  - `npm ci`
  - `npm run build`

---

## UC-131 — Environment Configuration Management (finish checklist)

### 1) Create local env files (DO NOT commit)

Why: you need real keys locally, but you must not leak them.

Create these files if you don’t already have them:

- `frontend/.env.development.local`
- `frontend/.env.staging.local`
- `frontend/.env.production.local`
- `server/.env.development.local`
- `server/.env.staging.local`
- `server/.env.production.local`

Copy from the matching `.env.*.example` files and fill in real values.

### 2) Understand which keys go where

**Frontend (safe to expose because it uses Supabase anon key):**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL` (the backend URL)
- `VITE_DEV_MODE=false` in production

**Backend (server-only secrets):**

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (NEVER in frontend)
- `CORS_ORIGIN` (your frontend origin)
- `AI_API_KEY` or `OPENAI_API_KEY` (if AI enabled)
- `ALLOW_DEV_AUTH=false` in production
- `FEATURE_AI_ROUTES=true|false`

### 3) Logging levels (what you should do)

Why: debug logs are useful locally, but noisy in production.

- Dev: set `NODE_ENV=development`
- Prod: set `NODE_ENV=production`

(Your server already behaves more “prod-like” under `NODE_ENV=production`.)

### UC-131 “done” verification

- You can run dev/staging/prod locally by pointing the app at different `.env.*.local` files.
- No secrets are committed.

---

## UC-130 — Database Migration to Production (Supabase)

You have two realistic “class project” options:

- **Option B (simplest; what you already chose earlier): reuse your existing Supabase project** as “production”.
  - You mostly verify schema + re-run seed scripts if missing.
- **Option A (cleanest): create a fresh Supabase project** and apply the full migration bundle.

### 1) Decide: Option A or Option B

If your current Supabase project already has all tables and you’re happy with it → pick **Option B**.

If you want the strongest “production migration” proof → pick **Option A**.

### 2) Get your Supabase keys (click-by-click)

Why: you need the URL + keys for frontend and backend.

- Supabase dashboard → your project
- Left sidebar → **Project Settings** (gear)
- **API**
- Copy:
  - **Project URL** → `SUPABASE_URL` (server) and `VITE_SUPABASE_URL` (frontend)
  - **anon public** key → `VITE_SUPABASE_ANON_KEY`
  - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server only)

### 3) Apply migrations

#### Option A (fresh project): run the full bundle

Why: this is the most “textbook” migration.

- Build a single SQL file:
  - `./scripts/db-build-migration-bundle.ps1 -OutputFile ./db/out/prod_migrations_bundle.sql`
- Supabase → **SQL Editor** → paste/run `db/out/prod_migrations_bundle.sql`

#### Option B (reuse existing project): verify + re-run seeds if needed

Why: your DB already exists; you’re making sure it matches the schema requirements.

- Run the verifier:
  - `./scripts/db-verify-supabase.ps1 -EnvFilePath ./server/.env.production.local`
- If it says seed defaults are missing, re-run these in Supabase SQL Editor:
  - `db/migrations/2025-11-18_seed_default_templates.sql`
  - `db/migrations/2025-11-19_seed_default_themes.sql`
  - `db/migrations/2025-11-20_seed_cover_letter_templates.sql`

### 4) Backups + pooling (free tier reality)

Why: UC asks for it, but free tiers vary.

- In Supabase: look for anything like “Backups / PITR / Point-in-time restore”.
  - If free tier doesn’t allow it, **document that limitation** (that still counts as “done” for class).
- Connection pooling:
  - If you’re using Supabase’s platform features, enable pooling if available.
  - If not available, document the limitation.

### UC-130 “done” verification

- Your Supabase project has the required tables.
- Seed templates/themes exist.
- The backend can connect using `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.

---

## UC-129 — Deploy frontend + backend (Vercel + Render) and verify

### 1) Deploy backend to Render

Why: the frontend needs a public API URL to talk to.

#### Create the Render service (click-by-click)

- Render dashboard → **New +** → **Web Service**
- Connect your GitHub repo
- Configure:
  - **Name**: e.g. `flowats-api`
  - **Branch**: `main`
  - **Root Directory**: `server`
  - **Build Command**: `npm install; npm run build`
  - **Start Command**: `node dist/src/index.js`

#### Set Render environment variables

Render service → **Environment** tab → add:

- `NODE_ENV=production`
- `SUPABASE_URL=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `CORS_ORIGIN=https://<your-vercel-domain>`
- `ALLOW_DEV_AUTH=false`
- `FEATURE_AI_ROUTES=true` (or `false`)

If AI is enabled:

- `AI_API_KEY=...` (or `OPENAI_API_KEY=...`)

#### Verify backend health

Open:

- `https://<your-render-service>.onrender.com/api/health`

Expected: HTTP 200.

### 2) Deploy frontend to Vercel

Why: this gives you the public website URL.

#### Create the Vercel project (click-by-click)

- Vercel dashboard → **Add New…** → **Project**
- Import your GitHub repo
- Configure:
  - **Root Directory**: `frontend`
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`

#### Set Vercel environment variables

Vercel project → **Settings** → **Environment Variables**:

- `VITE_SUPABASE_URL=...`
- `VITE_SUPABASE_ANON_KEY=...`
- `VITE_API_BASE_URL=https://<your-render-service>.onrender.com`
- `VITE_DEV_MODE=false`

Redeploy after changing env vars.

### 3) CORS (common “it deployed but API fails” issue)

Why: browsers block requests across domains unless the backend allows it.

- Your backend uses `CORS_ORIGIN`.
- It must match your Vercel site origin **exactly**, like:
  - `https://your-app.vercel.app`

### 4) HTTPS + domain

Why: HTTPS is required for modern browsers + security.

- Vercel and Render automatically provide HTTPS.
- Your “custom subdomain” is typically the default:
  - `https://<project>.vercel.app`

### UC-129 “done” verification

- Your Vercel URL loads.
- Signup/login works.
- Features that call the backend work.
- Browser console shows no CORS errors.

---

## UC-132 — CI/CD Pipeline Configuration (GitHub Actions)

### 1) CI: tests on every push/PR

Why: this stops broken code from being merged.

- GitHub → repo → **Actions**
- You should see workflow “CI”.
- Push any commit → see it run.

### 2) Protect `main` so broken code can’t merge

Why: without branch protection, CI can fail and you can still merge.

GitHub → **Settings** → **Branches** → **Add rule**:

- Branch pattern: `main`
- Enable:
  - Require PR before merge
  - Require status checks
  - Select `CI / test-build`

### 3) Staging vs production branches

Why: staging is where you test before production.

- Create `develop` branch if needed.
- When you’re ready: protect it with the same rule.

### 4) Deploy workflows (when you’re ready)

Why: deploy workflows need secrets to talk to Vercel/Render.

GitHub → **Settings** → **Secrets and variables** → **Actions**:

Vercel:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Render (deploy hooks):

- `RENDER_DEPLOY_HOOK_URL_STAGING`
- `RENDER_DEPLOY_HOOK_URL_PRODUCTION`

Optional:

- `DEPLOYMENT_WEBHOOK_URL` (Slack/Discord webhook)

### 5) Rollback (simple)

Why: sometimes a deploy breaks; rollback gets you back to the last working version.

- Vercel: Project → **Deployments** → select older → “Promote / Redeploy”
- Render: Service → **Deploys** → rollback to previous successful deploy

### UC-132 “done” verification

- CI runs on PRs and pushes.
- Merging to `main` triggers a production deploy workflow.
- Deploy does not run if tests fail.
- You can redeploy an older commit.

---

## What I recommend you do next (exact order)

1. Get CI green on `main` (Actions → newest CI run → fix any errors)
2. Deploy backend (Render) and confirm `/api/health`
3. Deploy frontend (Vercel) and confirm login works
4. Set `CORS_ORIGIN` correctly (fixes most production issues)
5. Run the Supabase verification script for UC‑130
6. Add GitHub branch protection rules (so UC‑132 is truly enforced)

---

## If you want, I can guide you live (fastest path)

Send me these 3 things and I’ll tell you the exact clicks/values for your case:

1. Your Vercel URL (or project name)
2. Your Render backend URL
3. Whether you are doing Supabase Option A (new project) or Option B (reuse existing)
