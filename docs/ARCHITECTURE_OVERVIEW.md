# ARCHITECTURE_OVERVIEW

## 1️⃣ Big Picture Overview

- Scrum-and-Get-it is a candidate-focused mini-ATS: a single-page application where candidates manage their profile, skills, employment and project history, upload documents, and track application-related artifacts.
- The app is built as a React + TypeScript frontend (Vite) that talks directly to Supabase for authentication, Postgres persistence, and private storage. There is no separate backend server in this repository.
- At runtime the frontend authenticates users with Supabase, uses a small `crud` service layer to read/write Postgres rows and storage objects, and relies on Postgres Row-Level Security (RLS) to enforce per-user access.

---

## 2️⃣ Backend / Supabase Logic

### Purpose

- Supabase handles authentication (email/password + OAuth), persistent storage (Postgres), and file storage (buckets). The frontend delegates data operations to Supabase through a thin abstraction so pages don't need to know DB specifics.

### Important files (what they do and why they matter)

- `frontend/src/supabaseClient.ts`

  - Exposes a single configured Supabase client used throughout the app. Centralizing the client ensures consistent auth tokens and a single source of truth for network calls.

- `frontend/src/services/crud.ts`

  - Central data access layer wrapping Supabase queries into a small, consistent API: `listRows`, `getRow`, `insertRow`, `upsertRow`, `updateRow`, `deleteRow`.
  - Provides `applyFilters()` to accept flexible filter objects (eq/neq/like/ilike/in, order, pagination).
  - Normalizes responses into `{ data, error, status }` and maps provider errors into a stable shape for the UI.
  - `withUser(userId)` returns user-scoped helpers that automatically inject `user_id = userId` into filters and payloads — this is how client code aligns with RLS.

- `frontend/src/services/types.ts`

  - Lightweight type definitions for `Result<T>` and filtering options, improving TS ergonomics across CRUD calls.

- `db/migrations/2025-10-26_recreate_full_schema.sql`

  - Canonical DB setup: tables, enums, triggers, and RLS policies. This file documents how the DB is structured and how RLS is intended to protect data.

- `db/migrations/2025-10-28_add_skills_delete_policy.sql`
  - An idempotent migration added to create the missing DELETE policy for `skills`. The migration file is present in the repo; it must be run against the target DB to take effect.

### Authentication flows (high level)

- Registration: frontend calls Supabase `signUp` (wrapped by `crud.registerWithEmail`), which creates an auth user in `auth.users`. The app then creates or upserts a `profiles` row with `id = auth.uid()` so the user has an application-level profile.
- Login: frontend calls `signInWithPassword` and, on success, the `AuthContext` picks up the session and exposes the current `user` and `session` to pages.
- Password reset / OAuth: Supabase performs provider flows and email-based reset; frontend pages trigger and display flow results.

### Row-Level Security (RLS)

- RLS is enabled on all user-facing tables. Policies generally allow only owner access: `user_id = auth.uid()` (profiles use `id = auth.uid()` because `profiles.id` mirrors `auth.users.id`).
- The client complements RLS by always scoping requests via `withUser(user.id)` and by forcing `user_id` into inserted payloads. If a required policy is missing on the server, client deletes/updates will be rejected with permission errors.

### Integrations

- Storage buckets (private) are configured for resumes/projects/certifications. Signed URLs and storage RLS policies are used to provide secure, temporary access to files.
- OAuth is supported via Supabase; the frontend triggers provider sign-in and handles the callback flow.

---

## 3️⃣ Frontend / React Logic

### Purpose

- The frontend is responsible for the user experience: forms, validation, pages, local state, and orchestration of Supabase calls. It keeps UI logic simple by relying on the `crud` service layer.

### Key pieces and how they fit together

- `AuthContext` (`frontend/src/context/AuthContext.tsx`)

  - The single source of truth for auth state. It listens to Supabase auth changes and exposes `useAuth()` returning `{ user, session, loading }`.
  - Why it matters: every protected page relies on `useAuth()` to know whether to fetch user-scoped data and to avoid flashes of default data during initialization.

- `crud` service (`frontend/src/services/crud.ts`)

  - Pages call `crud.withUser(user.id)` to get scoped helpers. This centralization avoids repeated filter/payload mistakes and aligns frontend code with DB RLS.

- Routing (`frontend/src/router.tsx`) and `ProtectedRoute`

  - Routes are declared in `router.tsx` and sensitive pages are wrapped by `ProtectedRoute` which shows a `LoadingSpinner` while auth initializes and redirects unauthenticated users to `/login`.

- Layout (`MainLayout` / `Navbar`)

  - `MainLayout` is the page shell. `Navbar` shows user info (avatar, links) and reads a cached signed-avatar URL synchronously to avoid flicker while the signed URL is fetched.

- Representative pages and their roles
  - `Register.tsx` / `Login.tsx`: collect credentials and call Supabase; navigate to dashboard on success.
  - `Dashboard.tsx`: aggregates counts and lists; fetches data via `crud.withUser(user.id)` and renders summary cards and charts.
  - `AddSkills.tsx`: manage skills; performs create/update/delete and refetches the authoritative list after server mutations to keep UI in sync.
  - `SkillsOverview.tsx`: grouped skill display with drag-and-drop; useful for visualization/export.
  - `AddEducation.tsx`, `AddEmployment.tsx`, `AddProjectForm.tsx`, `Certifications.tsx`: similar CRU(D) pages for other profile entities.

### State & sync patterns

- Global: `AuthContext` for auth/session.
- Local: pages use `useState` + `useEffect` for data and `isLoading` flags. Common pattern: wait for `auth.loading` to be false and the page's own `isLoading` to be false before rendering main content.
- Cross-component updates: `window.dispatchEvent(new CustomEvent('...:changed'))` is used to broadcast changes (e.g., `skills:changed`) and let dashboard or other pages refresh.

### UI libraries

- Material-UI (MUI) provides components and styling.
- Drag-and-drop uses `@hello-pangea/dnd` in `SkillsOverview`.

⚠️ Needs confirmation

- Confirm where the `profiles` upsert occurs (some projects do this in `Register.tsx`; others in `AuthContext`). The architecture expects an immediate upsert to ensure `profiles.id === auth.uid()`.

---

## 4️⃣ Database Schema (summary & purpose)

_All user-owned tables reference `profiles.id` as the owner (which mirrors `auth.users.id`). RLS policies restrict operations to the owning user._

- `profiles`

  - Holds the canonical user profile: id (uuid PK, ties to auth.users), name fields, email, phone, title, summary, experience level, city/state, meta JSON, timestamps.
  - Used to render account pages and as the join anchor for all other user resources.

- `skills`

  - Schema: id, user_id, skill_name, proficiency_level (enum), skill_category, meta, timestamps.
  - Use: quick, tag-like entries attached to a profile and used by the dashboard and profile pages.
  - RLS: select/insert/update and (after migration) delete allowed for owner only.

- `employment`

  - Schema: job_title, company_name, location, start/end dates, description, current_position, timestamps.
  - Use: employment history entries for profile and resume generation.

- `education`

  - Schema: institution_name, degree_type, graduation_date, gpa, education_level enum, honors.
  - Use: education history for profile/resume.

- `projects`

  - Schema: proj_name, description, role, tech_and_skills[], status enum, media_path, meta.
  - Use: portfolio entries.

- `certifications`

  - Schema: name, issuing_org, date_earned, expiration_date, media_path, verification_status.
  - Use: certs list and optional verification metadata.

- `documents`
  - Schema: file metadata linking to storage objects (file_name, file_path, mime_type, bytes, uploaded_at).
  - Use: resumes and uploaded documents; storage buckets and RLS secure access.

_Additional DB details_

- Enums: proficiency_level, experience_level, project_status, verification_status, education_level.
- Triggers: `set_updated_at()` keeps `updated_at` current.
- Indexes: per-user indexes (e.g., `(user_id, skill_name)`), optimizing common queries.

Diagram (conceptual)

```
auth.users
   ↑
profiles (id)
  ├─ skills (user_id)
  ├─ employment (user_id)
  ├─ education (user_id)
  ├─ projects (user_id)
  ├─ certifications (user_id)
  └─ documents (user_id)
```

---

## 5️⃣ Example Flow — User Registration → Dashboard (step-by-step)

1. User fills and submits register form

   - File: `frontend/src/pages/Register.tsx`
   - Action: validate input, call `crud.registerWithEmail(email, password, metadata)` or `supabase.auth.signUp(...)`.

2. Supabase creates an auth user

   - `auth.users` row is created and Supabase may return a session.

3. Frontend picks up session

   - File: `frontend/src/context/AuthContext.tsx`
   - `AuthContext` listens to auth changes, sets `user` and `session`, and flips `loading` → false.

4. Create or upsert `profiles` row

   - Code pattern: `crud.withUser(user.id).upsertRow('profiles', payload, 'id')` ensures a profile row exists and that `profiles.id === auth.uid()`.
   - This step is essential so the rest of the app has an application-level user record to reference for `user_id` foreign keys.

5. Redirect to dashboard and fetch data
   - `Register.tsx` or `AuthContext` triggers `navigate('/dashboard')` after success.
   - `frontend/src/pages/Dashboard.tsx` runs `crud.withUser(user.id).listRows(...)` for skills/employment/projects and renders the results.

Responsibilities by layer

- Frontend: input validation, UX, orchestration of sign-up/upsert and redirect.
- Supabase Auth: user creation and session management.
- Postgres (RLS): protects resources and enforces ownership.

---

## 6️⃣ Key Takeaways

- Centralization: `supabaseClient` + `crud.ts` centralize network and DB access. The `withUser(user.id)` wrapper is the primary pattern that keeps client calls RLS-safe.
- Auth-first: `AuthContext` is the backbone — make sure pages wait for `auth.loading` before firing user-scoped requests.
- DB-driven security: RLS (server-side) is the final gate. Client scoping is necessary but not sufficient — the server must expose policies for all intended operations (insert/update/delete).
- Simple sync model: pages fetch/ mutate/ refetch and use `CustomEvent` broadcasts for coarse-grained synchronization — readable, simple, and suitable at this project scale.
- Developer checklist: ensure `user_id` is present on inserts, run migrations (especially the skills DELETE policy), and gate user-scoped calls on `auth.loading`.

⚠️ Needs confirmation

- Confirm where profile upsert is performed after registration (Register vs AuthContext). This determines ordering and failure modes during signup.
- Confirm migrations are applied to staging/production (particularly the skills DELETE policy).

---

If you'd like, I can now:

- Add an "Onboarding" section with step-by-step local setup (env vars, running migrations, dev server commands).
- Produce a short migration checklist for deployments.
