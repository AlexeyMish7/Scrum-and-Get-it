## Authorization & Authentication — Overview for new contributors

This document explains how authentication and authorization are implemented in this project (frontend + Supabase backend), how the pieces fit together, and where to look when you need to change or debug auth behavior. It is written for someone seeing the project for the first time.

Contents

- Purpose & high-level flow
- Key frontend files (what they do)
- Auth lifecycle and hooks
- Login / Register / OAuth flows
- Password reset flow
- Server-side pieces (RLS, DB functions, migrations)
- Security model & important constraints
- Debugging & verification checklist
- Common changes and examples

---

## Purpose & high-level flow

- Auth is provided by Supabase (Postgres + Auth). The frontend calls Supabase through a single shared client (`frontend/src/lib/supabaseClient.ts`).
- The app uses a centralized AuthContext to manage session state and provide helper functions (signIn, signUp, signOut, OAuth, etc.) to pages and components.
- Authorization to database rows uses Postgres Row-Level Security (RLS). The frontend never directly supplies `service_role` credentials — all DB operations run via the client anon key and RLS policies. The code uses helper wrappers in `frontend/src/services/crud.ts` to automatically scope queries to the current user where needed.

High-level sequence (login/register):

1. User interacts with a page (Login/Register/Sign-in with Google).
2. Frontend calls a helper in `AuthContext` which calls Supabase auth APIs.
3. On success, the session is available to the frontend and components that use `useAuth()`.
4. For DB operations, the app uses `crud.withUser(user.id)` or `crud.*` helpers which inject `eq: { user_id: user.id }` so RLS lets the query succeed.

---

## Key frontend files (where to look)

- `frontend/src/lib/supabaseClient.ts` — single Supabase client instance used everywhere.
- `frontend/src/context/AuthContext.tsx` — central auth lifecycle, exposes `useAuth()` hook. (Primary place to change session handling.)
- `frontend/src/services/crud.ts` — centralized DB helpers (list/get/insert/update/delete + `withUser(userId)`). Always prefer these for table access.
- `frontend/src/pages/auth/*` — pages for login, register, OAuth callback, forgot/reset password flows:
  - `Login.tsx`, `Register.tsx`, `AuthCallback.tsx`, `ForgetPassword.tsx`, `ResetPassword.tsx`
- `frontend/src/hooks/useErrorHandler.ts` and `frontend/src/components/common/ErrorSnackbar.tsx` — centralized error UI patterns.
- `db/migrations/*.sql` — database schema, RLS policies and the `delete_user` RPC created in `db/migrations/2025-11-03_delete_user_function.sql` and wrapper migration `delete_user_userid`.

---

## Auth lifecycle and hooks

- The `AuthContext` provides:
  - `user` object (or null) representing the logged-in user (`user.id`, `user.email` etc.)
  - `loading` boolean while session is being initialized
  - helpers like `signIn(email, password)`, `signUpNewUser(...)`, `signOut()`, and `signInWithOAuth(provider)`.
- Components call `useAuth()` to get the current `user` and helpers. `AuthContext` listens to Supabase auth state changes (via `onAuthStateChange`) and keeps the React state in sync.

Important guidance:

- Always normalize emails on input with `.trim().toLowerCase()` before calling sign-up or sign-in.
- When calling DB helpers that operate on user-scoped tables, prefer `const userCrud = crud.withUser(user.id); userCrud.listRows('education', ...)` — this injects `eq: { user_id: user.id }` so RLS is satisfied.

---

## Login / Register / OAuth flows

Login (`frontend/src/pages/auth/Login.tsx`)

- Calls `signIn(email, password)` from `AuthContext`.
- On success navigates to the profile page. On failure shows a user-friendly error (generic for security).

Register (`frontend/src/pages/auth/Register.tsx`)

- Uses `signUpNewUser(...)` wrapper from `AuthContext` which calls `supabase.auth.signUp(...)`.
- On successful registration the code upserts a `profiles` row using `supabase.from('profiles').upsert(...)` with `onConflict: 'id'` using the new `user.id` (from Supabase session). This keeps `profiles` in sync with `auth.users`.
- Register handles two cases: immediate session available (no confirmation required) and `requiresConfirmation` (email confirmation flows). The UI reflects both.

OAuth (`AuthCallback.tsx` and `AuthContext`)

- OAuth sign-in (e.g., Google) is initiated from the client; the provider redirects back with session tokens in URL fragment.
- `AuthCallback.tsx` attempts to read the session (`supabase.auth.getSession()`) and then navigates to `/profile` if a session exists.

Important notes:

- OAuth and password flows both end with a Supabase session that the `AuthContext` picks up and stores in React state.
- Always use centralized error handling (`useErrorHandler`) rather than `alert()`.

---

## Password reset flow

- Forgot password page (`ForgetPassword.tsx`) calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })`.
- Supabase sends an email containing a link; the link includes a fragment the client uses to complete the reset.
- `ResetPassword.tsx` reads the fragment, validates it is a recovery link, and calls `supabase.auth.updateUser({ password })` to complete the reset.

UX security detail: The frontend intentionally shows a generic success message for password reset email requests to avoid account enumeration.

---

## Server-side pieces (RLS, migrations, RPCs)

- Row-Level Security (RLS): the Postgres schema in `db/migrations/2025-10-26_recreate_full_schema.sql` defines tables and RLS policies. The frontend code relies heavily on those policies to protect rows by `user_id`.
- CRUD helpers: the frontend `crud.ts` file exposes `withUser(userId)` which injects `eq: { user_id: userId }` into queries — this pattern is used throughout the app and expected by the RLS rules.
- delete_user RPC: to support complete account deletion (including removal of the `auth.users` row), a server-side SQL function `public.delete_user(p_user_id uuid)` was added in `db/migrations/2025-11-03_delete_user_function.sql`. Because deleting from `auth.users` requires elevated privileges, the function is `security definer` and performs an authorization check (it ensures `auth.uid() = p_user_id`). A small SQL wrapper `delete_user_userid` was created to provide a stable `user_id` param name for clients.

Important: the frontend calls the RPC via `supabase.rpc('delete_user_userid', { user_id: user.id })` only after removing profile/child rows. The function must be applied in Supabase by a privileged user (migration runner) and granted to the `authenticated` role.

---

## Security model & important constraints

- NEVER expose service_role keys in the frontend. All client calls use the anon key.
- Use `crud.withUser(user.id)` for any operation that reads/writes user-owned tables. This prevents accidental cross-user data access and matches RLS.
- The `delete_user` RPC runs as `security definer` and is powerful — treat it as admin-level code:
  - Deploy it via migrations by a privileged account.
  - The function checks that the caller's `auth.uid()` matches the requested `user_id` to avoid allowing one user to delete another.
- Error messages shown to end users should be user-friendly and avoid leaking internal error details. Use `useErrorHandler` for consistent handling.

---

## Debugging & verification checklist

When auth fails or behaves unexpectedly, follow this checklist:

1. Verify the frontend session
   - In browser console: `supabase.auth.getSession()` and inspect the returned session.
2. Confirm `AuthContext` state
   - Ensure `useAuth()` returns expected `user` and `loading` flags.
3. Check RLS failures
   - If a query returns a permission error or empty result, check DB RLS policies and whether `crud.withUser` or `eq: { user_id }` was used.
4. For account deletion issues
   - Confirm `public.delete_user` and `public.delete_user_userid` exist in Supabase SQL editor (run `SELECT pg_get_functiondef(p.oid)` to inspect)
   - Ensure migrations were applied by a privileged user and `grant execute` succeeded for `authenticated`.
5. Use logs and errors
   - Inspect frontend console logs and network tab for the failing RPC/requests. For server errors, Supabase SQL editor may show more details.

---

## Common changes and examples

- Add a new user-scoped table:

  1. Create the table in `db/migrations/` and add RLS policies that restrict access to `user_id = auth.uid()`.
  2. Use `crud.withUser(user.id).insertRow('mytable', payload)` from the frontend.

- Add server-side cleanup on account deletion:

  - Edit the `delete_user` function (migration) to delete any new child tables.

- Replace inline Supabase table calls:
  - If you find `supabase.from('education')...` in pages, prefer `crud.withUser(user.id).listRows('education')` — this preserves RLS scoping.

---

## Where to look next (file map)

- Frontend client: `frontend/src/lib/supabaseClient.ts`
- Auth lifecycle: `frontend/src/context/AuthContext.tsx`
- Central DB helpers: `frontend/src/services/crud.ts`
- Auth pages: `frontend/src/pages/auth/*` (`Login.tsx`, `Register.tsx`, `ForgetPassword.tsx`, `ResetPassword.tsx`, `AuthCallback.tsx`)
- Error handling: `frontend/src/hooks/useErrorHandler.ts`, `frontend/src/components/common/ErrorSnackbar.tsx`
- Theme/styles: `frontend/src/theme/theme.tsx` (MUI theme variants and design tokens)
- Migrations & RLS: `db/migrations/*.sql` (main schema and created `delete_user` function and wrapper)

---

If you'd like, I can:

- Generate a small diagram (sequence steps) for each flow (register/login/delete) and add it to this doc.
- Create a short checklist to safely apply the `delete_user` migration in Supabase (step-by-step with SQL snippets).

If you want either of those, say which and I will add it.
