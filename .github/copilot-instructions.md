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
- `frontend/src/services/crud.ts` — small, reusable CRUD helpers (listRows, getById, insertRow, upsertRow, updateById, deleteById).
- `frontend/src/services/profileService.ts` — example use of `crud` and how profiles are upserted by user id.
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
- Preview production build: `npm run preview`.

Small examples to follow

- Use `supabase` from `supabaseClient.ts` everywhere, e.g. `supabase.from('profiles').upsert([...], { onConflict: 'id' })`.
- Use `crud` helpers for table work: `await crud.listRows<T>('applications', '*', { eq: { user_id: userId } })`.

When proposing changes

- Be incremental: small commits and focused diffs. Prefer modifying or adding one file at a time.
- Keep TypeScript types strict; avoid `any` unless unavoidable and justified.
- Respect RLS: do not craft queries that bypass `user_id` filters.
- Use accessible markup: visible labels, `aria-live` for errors, keyboard focus management for dialogs.

If you need to add features quickly

- Follow existing patterns: add services under `frontend/src/services/`, pages under `frontend/src/pages/`, and wire routes in `frontend/src/router.tsx`.
- For auth flows, reuse `useAuth()` and `AuthContext` helpers rather than reimplementing direct supabase calls.

Questions / missing info

- If anything about backend schemas or RLS policies is unclear, ask for the Supabase migration SQL or check project docs (Sprint1 PRD in `docs/`).

End of file
