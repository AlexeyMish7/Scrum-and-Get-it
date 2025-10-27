## Copilot instructions — Scrum-and-Get-it (concise)

Audience: automated coding assistants (Copilot / AI pair programmer)

Goal: get productive quickly on the frontend (React + TypeScript + Vite) using Supabase for auth and data.

Quick facts

- Frontend root: `frontend/`. Node 20.19.5, npm >= 10.8.2 (see `frontend/package.json` -> `engines`).
- Env required (do NOT commit): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

Top files to read first

- `frontend/src/supabaseClient.ts` — singleton Supabase client; throws if env missing.
- `frontend/src/context/AuthContext.tsx` — canonical auth helpers and session subscription; use `useAuth()`.
  -- NOTE: the modular `services/crud.ts` helper was removed from the repo. For now use direct
  `supabase.from(...).select/insert/update` calls from the frontend. When reintroducing a
  centralized CRUD module, add it under `frontend/src/services/` and update calls accordingly.
- `frontend/src/router.tsx` and `frontend/src/components/ProtectedRoute.tsx` — routing and auth guards.
- Example pages: `frontend/src/pages/Register.tsx`, `Login.tsx`, `ProfilePage.tsx`.

Concrete repo rules (do not skip)

- Always respect Supabase RLS: filter queries by the current user (e.g. `.eq('user_id', user.id)`).
- Use the shared `supabase` client from `supabaseClient.ts` everywhere.
- Use `AuthContext` / `useAuth()` for user/session state; emails must be normalized (trim + toLowerCase).
- Prefer `services/*` helpers (CRUD, profileService) over direct table calls in pages.
- Keep TypeScript strict (avoid `any`) and accessible markup (`label`, `aria-live` for error messages).

Developer commands (frontend)

- Start dev server (PowerShell):
  - cd frontend; npm run dev
- Build: `npm run build` (runs `tsc -b` then `vite build`).
- Lint: `npm run lint`. Preview: `npm run preview`.

Examples (copy/paste patterns)

- Upsert profile by auth id:
  `await supabase.from('profiles').upsert({ id: user.id, first_name, last_name, email }, { onConflict: 'id' })`.
- List current user's applications (direct query):
  `await supabase.from('applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false })`.

When proposing changes

- Be incremental and small (one feature/change per PR). Provide a short rationale and a focused patch (unified diff).
- Include files changed and short verification steps (e.g., "ran dev server and smoke-tested register/login").

If something is unclear

- Ask for the Supabase migration SQL or check `docs/Sprint1PRD.md` for schema/RLS expectations.

End.

# Copilot instructions for this repository

Audience: automated coding assistants (Copilot / AI pair programmer)

Goal: help the agent become immediately productive in the ATS Tracker frontend (React + TypeScript + Vite + Supabase).

Key facts

- Stack: React 19 + TypeScript + Vite. Frontend folder: `frontend/`.
- Node/npm: Node 20.19.5, npm >= 10.8.2 (see `frontend/package.json` -> `engines`).
- Supabase: client in `frontend/src/supabaseClient.ts`. Required env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

Where to look first (high value files)

- `frontend/src/supabaseClient.ts` — single shared supabase client; throws early if env missing.
- `frontend/src/context/AuthContext.tsx` — canonical auth flows (signUpNewUser, signIn, signInWithOAuth, signOut); keeps session and subscription via `onAuthStateChange`.
- `frontend/src/router.tsx` — contains app routes and shows use of `ProtectedRoute` and `NavBar` wrappers.
- Pages: `frontend/src/pages/Register.tsx`, `Login.tsx`, `ProfilePage.tsx` demonstrate established patterns (form validation, email normalization, redirect targets).

Project conventions and patterns (concrete)

- Auth and sessions: always use `AuthContext`/`useAuth()` for user state; `AuthContext` normalizes emails to lowercase and writes first/last name into user metadata and `profiles` table.
- RLS and queries: Supabase Row Level Security is enabled. Always filter reads/writes by the current user id (e.g. `.eq('user_id', user.id)`) when hitting `public.*` tables.
- Profile persistence: `profiles` table uses the auth user id as primary key; code uses `upsert` with `onConflict: 'id'` (see `Register.tsx`).
- CRUD pattern: prefer `services/crud.ts` helpers rather than calling supabase directly from pages where possible.
- Error handling: return and show Supabase error messages when available; forms use `aria-live` / `role=alert` for accessibility.
- Email normalization: callers trim and `toLowerCase()` emails before sending to Supabase.

Scripts & dev workflow (frontend)

- Start dev server: from `frontend` run `npm run dev` (Vite). Use PowerShell syntax when giving commands on Windows.
- Build: `npm run build` (runs `tsc -b` then `vite build`).
- Lint: `npm run lint`.

## Copilot instructions — Scrum-and-Get-it (concise)

Audience: automated coding assistants (Copilot / AI pair programmer)

Goal: help an agent become productive on the frontend (React + TypeScript + Vite) and understand the Supabase schema and conventions.

Quick facts

- Frontend root: `frontend/`. Node 20.19.5, npm >= 10.8.2.
- Env required (do NOT commit): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

Key files to read

- `frontend/src/supabaseClient.ts` — single shared Supabase client.
- `frontend/src/context/AuthContext.tsx` — session + auth helpers; use `useAuth()`.
- `frontend/src/services/crud.ts` — shared DB helpers (use these instead of ad-hoc queries).
- `frontend/src/router.tsx` and `frontend/src/components/ProtectedRoute.tsx` — routing and guards.

Database summary (what you need to know)

- Migrations: `db/migrations/*.sql` (includes `2025-10-26_recreate_full_schema.sql` and `2025-10-26_add_profile_related_tables.sql`).
- Tables: `profiles`, `documents`, `employment`, `certifications`, `skills`, `projects`, `education`.
- Important columns:
  - `profiles(id uuid PK = auth.users.id)`, contact and bio fields, `meta jsonb`, `created_at/updated_at`.
  - `documents` holds uploaded file metadata (`file_path` stores storage object key).
  - Domain tables use `user_id` FK → `profiles(id)` and have `created_at/updated_at`.
- Enums added: `experience_level_enum`, `proficiency_level_enum`, `project_status_enum`, `verification_status_enum`, `education_level_enum` — prefer these canonical values client-side.
- Storage buckets created: `resumes`, `projects`, `certifications` (owner-only policies applied).
- RLS: policies rely on `auth.uid()`; frontend must query while authenticated and always filter by `user_id = user.id`.
- View: `public.vw_profile_with_counts` provides profile + counts (employment/skills/projects).
- Triggers: `set_updated_at()` updates `updated_at` on row updates.

How frontend should interact (patterns)

- Always use `useAuth()` to get current user ID and call `supabase.from(...).eq('user_id', user.id)`.
- Use `services/crud.ts` wrappers for consistency and to respect RLS.
- Upload flow: upload to Supabase Storage (bucket) then store the returned object key in `file_path`/`media_path`.

Developer commands

- Start dev: `cd frontend; npm run dev` (PowerShell friendly).
- Build: `npm run build`. Lint: `npm run lint`. Preview: `npm run preview`.

Examples

- Upsert profile: `await supabase.from('profiles').upsert({ id: user.id, first_name, last_name, email }, { onConflict: 'id' })`.
- List employment: `await crud.listRows('employment', '*', { eq: { user_id: user.id } })`.

When proposing changes

- Be incremental: one feature per PR, include unified diffs and short verification steps.
- If changing DB schema, update `db/migrations/` and include a non-destructive alternative or migration notes for existing data.

If something is unclear

- Ask for the current Supabase migration SQL or a data-export before running destructive migrations.

End.
