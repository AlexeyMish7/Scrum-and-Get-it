# COPILOT_INSTRUCTIONS.md

**Audience:** GitHub Copilot (Chat + Inline)
**Role:** Senior pair‑programmer for the **ATS Tracker** project (React + TypeScript + Vite + Supabase).
**Goal:** Complete Sprint 1 user auth + minimal dashboard with clean, incremental commits.

---

## How you (Copilot) must behave

- **Be precise and incremental.** Propose small, testable changes. Prefer diffs/patches and file paths.
- **Follow our stack:** React + TypeScript + Vite, React Router, Supabase JS client.
- **Auth rules:** No email confirmations for now. After register → auto‑login → redirect.
- **Security:** Use Supabase RLS; client queries must filter by current user.
- **Quality:** Type‑safe code, accessible forms, basic error handling, no dead code.
- **File organization:** `src/pages/*`, `src/components/*`, `src/lib/supabase.ts`, `src/routes.tsx`.
- **Do not invent envs.** Use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env.local`.
- **Explain briefly** what you’re changing before outputting code. Then show the exact edits.

---

## Project facts (treat as source of truth)

- Tooling: Node **20.19.5**, npm **≥10.8.2**, Vite, React, TypeScript, React Router.
- Backend: Supabase (Auth + Postgres). Email confirmation **disabled** (dev).
- Auth flow: Register → auto‑login → redirect `/dashboard`. Login → redirect `/dashboard`. Logout → redirect `/login`.
- Data model (initial):

  - `auth.users` (Supabase managed).
  - `public.applications`:

    - `id uuid pk default gen_random_uuid()`
    - `user_id uuid not null references auth.users(id)`
    - `company_name text not null`
    - `position_title text not null`
    - `status text check (status in ('applied','interview','rejected','offer')) default 'applied'`
    - `created_at timestamptz default now()`
    - `updated_at timestamptz default now()`

- RLS: enabled. Policy: users can CRUD rows where `user_id = auth.uid()`.

---

## Repository structure (target)

```
/src
  /components
  /pages
    Login.tsx
    Register.tsx
    Dashboard.tsx
  routes.tsx
  main.tsx
  App.tsx
  lib/supabase.ts
.env.local (not committed)
```

---

## Environment

**.env.local** (developer provides values):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

**`src/lib/supabase.ts`** (singleton client):

```ts
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anon);
```

---

## Sprint 1 — Tasks Copilot should execute

Implement these **in order** as atomic commits. For each task, output: (1) brief rationale, (2) changed files with full code or unified diff.

### T1: Routing + Protected Route

- Add React Router with routes: `/login`, `/register`, `/dashboard`.
- Implement `RequireAuth` wrapper that checks `supabase.auth.getSession()` and redirects to `/login` if unauthenticated.
- Wire `/dashboard` behind `RequireAuth`.

### T2: Register Page

- `src/pages/Register.tsx`: form fields **firstName, lastName, email, password, confirmPassword**.
- On submit:

  - Validate client‑side (basic).
  - Call `supabase.auth.signUp({ email, password, options: { data: { first_name: firstName, last_name: lastName } } })`.
  - **Assume email confirmations OFF**. After success, call `supabase.auth.getSession()` and redirect to `/dashboard`.

- Show inline errors.

### T3: Login Page

- `src/pages/Login.tsx`: email + password.
- On submit: `supabase.auth.signInWithPassword({ email, password })`, then redirect `/dashboard`.
- Show inline errors.

### T4: Logout

- Add Logout button in a simple navbar on `Dashboard.tsx`.
- Action: `await supabase.auth.signOut();` → redirect `/login`.

### T5: Applications schema + RLS (SQL)

- Provide SQL migration snippet for Supabase:

```sql
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  position_title text not null,
  status text not null check (status in ('applied','interview','rejected','offer')) default 'applied',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.applications enable row level security;

create policy "users can read own applications"
  on public.applications for select
  using (auth.uid() = user_id);

create policy "users can insert own applications"
  on public.applications for insert
  with check (auth.uid() = user_id);

create policy "users can update own applications"
  on public.applications for update
  using (auth.uid() = user_id);

create policy "users can delete own applications"
  on public.applications for delete
  using (auth.uid() = user_id);
```

### T6: Minimal Dashboard (List + Create)

- `src/pages/Dashboard.tsx`:

  - On mount: get session → user id → fetch `applications` for that user (`.eq('user_id', user.id)`).
  - Render table (company, position, status).
  - Simple “Add Application” form (company_name, position_title, status).
  - On create: insert with `user_id` = current user; refresh list.

### T7: Session Handling Utility

- Add `getCurrentUser()` helper that wraps `supabase.auth.getUser()` and returns `user` or `null`.
- Use it in Dashboard and route guard.

### T8: Basic Styling + A11y

- Use semantic labels, `aria-live="polite"` for error messages, keyboard‑accessible buttons/links.

---

## Code style

- TypeScript strict where reasonable; define prop types and response types.
- Prefer async/await, small pure helpers, early returns.
- No `any`/implicit `any`. Handle null/undefined from auth calls.
- Keep components small; extract form pieces if they grow.

---

## How to propose changes (format)

When you respond, use this exact structure:

1. **Summary:** What you’re implementing and why (2–4 sentences).
2. **Commands (if any):** install commands or env notes.
3. **Patches:** Show unified diffs or complete file contents with paths. Example:

```diff
--- a/src/routes.tsx
+++ b/src/routes.tsx
@@
+ import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
+ import Login from "./pages/Login";
+ import Register from "./pages/Register";
+ import Dashboard from "./pages/Dashboard";
...
```

If a file doesn’t exist yet, prefix with `+++ new file: <path>` and include full content.

---

## Prompts you should respond to

We will paste one of these to drive you:

- "Implement **T1 Routing + Protected Route** per COPILOT_INSTRUCTIONS.md."
- "Build **Register.tsx** as in **T2**; assume email confirmation off; auto‑login then redirect."
- "Apply **T5** SQL in a migration; output SQL only."
- "Finish **T6** Dashboard list + create form; fetch by current user id with RLS."

---

## Non‑goals (don’t do)

- Don’t add third‑party UI libs without being asked.
- Don’t add server frameworks or change Vite config.
- Don’t bypass RLS by removing filters.
- Don’t store secrets in code.

---

**End of instructions.**
