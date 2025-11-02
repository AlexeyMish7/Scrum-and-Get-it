## Copilot instructions — Scrum-and-Get-it (concise)

Audience

- Automated coding assistants (Copilot / AI pair programmer)

Goal

- Get productive quickly on the frontend (React + TypeScript + Vite) using Supabase for auth and data.

Quick facts

- Frontend root: `frontend/`.
- Node: 20.19.5, npm >= 10.8.2 (see `frontend/package.json`).
- Required env (do NOT commit): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

Top files to read

- `frontend/src/supabaseClient.ts` — single Supabase client.
- `frontend/src/context/AuthContext.tsx` — auth/session lifecycle; use `useAuth()`.
- `frontend/src/services/crud.ts` — centralized DB helpers (list/get/insert/update/upsert/delete + `withUser(userId)`). Prefer these for table access.
- `frontend/src/router.tsx`, `frontend/src/components/ProtectedRoute.tsx` — routing and guards.
- Example pages: `frontend/src/pages/Register.tsx`, `Login.tsx`, `ProfilePage.tsx`.
- Database schema (canonical): `db/migrations/2025-10-26_recreate_full_schema.sql` — the full Postgres schema (tables, enums, RLS policies, triggers and storage bucket setup). Read this before making schema or RLS changes.

Core rules (must follow)

- Respect Supabase RLS: always scope queries to the current user for public tables (use `withUser(user.id)` or `.eq('user_id', user.id)`).
- Use the shared `supabase` client from `supabaseClient.ts` everywhere.
- Use `AuthContext` / `useAuth()` for session/user state; normalize emails with `trim().toLowerCase()`.
- Prefer `services/crud.ts` wrappers over ad-hoc `supabase.from(...)` calls in pages/components.
- Keep TypeScript strict where practical and make UI accessible (labels, `aria-live` for errors).

Developer commands (PowerShell)

- Start dev: `cd frontend; npm run dev`
- Build: `cd frontend; npm run build`
- Lint: `cd frontend; npm run lint`

Common patterns / examples

- User-scoped list (preferred):
  const userCrud = crud.withUser(user.id);
  const res = await userCrud.listRows('documents', 'id,file_name,uploaded_at');

- Unscoped admin-like list:
  const res = await crud.listRows('applications', '\*', { order: { column: 'created_at', ascending: false } });

- Upsert profile by auth id:
  await crud.upsertRow('profiles', { id: user.id, first_name, last_name }, 'id');

PR guidance

- Be incremental: one small change per PR with a short verification list.
- If changing DB schema, add a migration under `db/migrations/` and include rollback/notes.

If you need more context

- See the canonical DB schema at `db/migrations/2025-10-26_recreate_full_schema.sql` (includes table definitions, enums, RLS policies, views and storage bucket notes).
- Ask for the Supabase migration SQL or `docs/Sprint1PRD.md` for additional schema and RLS expectations.

End.
