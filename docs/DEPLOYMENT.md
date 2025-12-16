# Deployment Guide (UC-129)

If you want a single beginner-friendly checklist that covers **UC-129/130/131/132 end-to-end** (deploy + migrations + GitHub Actions), use:

- [docs/SPRINT4_UC129-UC132_RUNBOOK.md](SPRINT4_UC129-UC132_RUNBOOK.md)

For monitoring/logging, performance, and domains (UC-133/UC-134/UC-139), use:

- [docs/SPRINT4_UC133_UC134_MANUAL_STEPS.md](SPRINT4_UC133_UC134_MANUAL_STEPS.md)

This project can be deployed now (even if other Sprint 4 UCs aren’t finished). Treat it as a “prod-like” environment: don’t commit secrets, keep `VITE_DEV_MODE=false`, and verify the database schema/seeds.

## How deployment works (platform-managed deploys + optional GitHub Actions)

This repo supports two common deployment styles:

1. **Platform-managed deploys** (simplest)

- Vercel and Render pull your GitHub repo and run the build commands you configure.
- Deploys are triggered either:
  - automatically when you push commits (if “Auto Deploy” is enabled), or
  - manually by clicking “Deploy / Redeploy” in the platform UI.

2. **GitHub Actions CI/CD** (optional; UC-132)

- CI runs tests/builds on every push and pull request.
- Deploy workflows can automatically deploy to staging/production.
- If you do not set the required secrets, the deploy jobs will **skip** (so Actions doesn’t show a failing deployment).

Workflows:

- `.github/workflows/ci.yml`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-production.yml`

Most teams use either approach. For a class project, either is acceptable as long as you can document the process and verify production works.

Important implications:

- **Frontend env vars are build-time** (Vite reads `VITE_*` during `npm run build`). If you change `VITE_API_BASE_URL`, you must redeploy the frontend.
- **Backend env vars are runtime** (Node reads `process.env` at runtime). On Render, changing env vars typically triggers a restart/redeploy.
- If you use GitHub Actions deploy workflows, deployments are gated on tests/builds, and you’ll have a deployment record in the GitHub UI.

## What you’re deploying

- **Frontend**: Vercel (static Vite build)
- **Backend**: Render (Node.js service)
- **Database/Auth**: Supabase

The frontend calls the backend using `VITE_API_BASE_URL` (see [frontend/src/app/shared/services/apiUrl.ts](../frontend/src/app/shared/services/apiUrl.ts)).

---

## 0) Pre-flight checklist (do this first)

1. **Builds are green locally**

   - Frontend: `cd frontend; npm install; npm run build`
   - Server: `cd server; npm install; npm run build`

2. **Supabase schema + required seeds exist (UC-130)**

   - Recommended verification:
     - `./scripts/db-verify-supabase.ps1 -EnvFilePath ./server/.env`
   - If it reports missing defaults, re-run seed migrations in Supabase SQL Editor:
     - `db/migrations/2025-11-18_seed_default_templates.sql`
     - `db/migrations/2025-11-19_seed_default_themes.sql`
     - `db/migrations/2025-11-20_seed_cover_letter_templates.sql`

3. **Secrets are NOT in git**
   - Use `.env.*.local` files locally.
   - Never put `SUPABASE_SERVICE_ROLE_KEY` into the frontend.

---

## 0.5) (If needed) Find your Supabase keys (click-by-click)

You’ll need three values from Supabase:

- `SUPABASE_URL` (server)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (frontend)

Steps:

1. Open the Supabase dashboard.
2. Click your project.
3. Left sidebar → **Project Settings** (gear icon).
4. Click **API**.
5. Copy:
   - **Project URL** → use as `SUPABASE_URL` (server) and `VITE_SUPABASE_URL` (frontend)
   - **Project API keys → anon public** → use as `VITE_SUPABASE_ANON_KEY`
   - **Project API keys → service_role** → use as `SUPABASE_SERVICE_ROLE_KEY` (server only)

Do not paste the service role key into Vercel.

---

## 1) Deploy the backend to Render

### Create the service (click-by-click)

1. Open https://dashboard.render.com
2. In the top nav, click **New +**.
3. Click **Web Service**.
4. Under “Connect a repository”, click **GitHub** and authorize if prompted.
5. Find your repo and click **Connect**.
6. Configure the service:
   - **Name**: pick something like `flowats-api`
   - **Region**: pick the closest region
   - **Branch**: choose the branch you want deployed (often `main`)
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install; npm run build`
   - **Start Command**: `node dist/src/index.js`
7. Click **Create Web Service**.

### Required environment variables (Render)

Set these in Render:

1. Open your new Render service.
2. Click the **Environment** tab.
3. Click **Add Environment Variable** for each item below.

- `NODE_ENV=production`
- `APP_ENV=production` (optional; keeps naming consistent)
- `SUPABASE_URL=...`
- `SUPABASE_SERVICE_ROLE_KEY=...` (server-only)
- `CORS_ORIGIN=https://<your-vercel-domain>` (no trailing slash)
- `ALLOW_DEV_AUTH=false`
- `FAKE_AI=false`
- `FEATURE_AI_ROUTES=true` (set `false` if you want AI endpoints disabled)

AI provider key (only if AI routes are enabled):

- `AI_API_KEY=...` **or** `OPENAI_API_KEY=...`

### Verify backend is up

After Render deploys, verify the health endpoint:

- `https://<your-render-backend-domain>/api/health`

You should get HTTP 200.

To verify database connectivity (UC-130), you can also run the deep health check:

- `https://<your-render-backend-domain>/api/health?deep=1`

Expected: HTTP 200 with a payload that includes a Supabase connectivity check.

If you don’t:

- Open the Render service → **Logs** tab and look for the first crash.
- Confirm your **Start Command** matches the compiled output: `node dist/src/index.js`.

---

## 2) Deploy the frontend to Vercel

### Create the project (click-by-click)

1. Open https://vercel.com/dashboard
2. Click **Add New…** → **Project**.
3. Under “Import Git Repository”, choose **GitHub** and authorize if prompted.
4. Find your repo and click **Import**.
5. In “Configure Project”:
   - **Framework Preset**: Vite (or “Other” is fine; we’re setting commands explicitly)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Do not click Deploy yet if you haven’t set env vars—set them first.

### Required environment variables (Vercel)

Set these in Vercel:

1. Go to your Vercel project.
2. Click **Settings**.
3. Click **Environment Variables**.
4. Add each variable below.

- `VITE_SUPABASE_URL=...`
- `VITE_SUPABASE_ANON_KEY=...`
- `VITE_API_BASE_URL=https://<your-render-backend-domain>` (no trailing slash)
- `VITE_DEV_MODE=false`

Now click **Deploy** (or **Redeploy** if you already deployed once).

---

## 3) Smoke test (end-to-end)

1. Open your Vercel site and try:
   - Login / Signup
2. Confirm the frontend can reach the backend:
   - Backend health: `GET https://<backend>/api/health`
3. Confirm at least one server-backed feature works:
   - AI (if enabled), or
   - analytics endpoints (if used in your UI)

If you see CORS errors in the browser console:

- Ensure `CORS_ORIGIN` on Render exactly matches your Vercel site origin (including `https://`).
- Ensure `VITE_API_BASE_URL` is the backend origin (no `/api` suffix).

If the frontend loads but API calls fail:

- Re-check `VITE_API_BASE_URL` in Vercel (must be the Render domain).
- Re-deploy the frontend after changing env vars.

---

## Should you wait until everything else is done?

You do **not** need to wait.

Deploying now is useful because:

- It proves UC-129 is complete.
- It gives you real URLs to use for UC-132/133/135 (CI/CD, monitoring, security hardening).

The main reasons to wait would be if:

- You plan a major schema rewrite (not the case if UC-130 verification is passing), or
- You don’t have your Supabase project keys ready.

---

## Appendix: What to do when you change code (no CI/CD)

If you enabled the GitHub Actions deploy workflows, merges to `main` (production) and `develop` (staging) can deploy automatically once secrets are configured.

- When you change frontend code:

  - `cd frontend; npm run build` locally
  - push to GitHub
  - Vercel will deploy automatically (if connected), or click **Deployments → Redeploy**

- When you change server code:
  - `cd server; npm run build` locally
  - push to GitHub
  - Render will deploy automatically (if Auto Deploy enabled), or click **Manual Deploy → Deploy latest commit**
