# ARCHITECTURE — Scrum-and-Get-it

Last updated: 2025-11-03

This document summarizes the repository architecture, conventions, and how to extend the app safely. It is a high-level reference intended for contributors preparing Sprint 2 work.

## Overview

- Purpose: Candidate-facing ATS (applications tracker) to record applications, profile, employment, education, projects, certifications and files.
- High-level data flow:
  1. UI (React + MUI) renders pages and components.
 2. Auth handled by Supabase Auth (client-side anon key). Sessions are kept in `AuthContext`.
 3. Frontend calls Supabase via a single `supabaseClient` and a lightweight `crud` wrapper and domain `services/*` modules.
 4. RLS (Row-Level Security) is enforced in Postgres. The frontend must scope queries to the current user (use `crud.withUser(user.id)` or pass `eq: { user_id: user.id }`).

### Main user journeys

- Sign up / Sign in / OAuth → profile upsert → dashboard.
- Add/Edit/Delete profile sections (employment, education, skills, projects, certifications).
- Upload documents & avatars → stored in Supabase Storage buckets with access controlled by RLS and bucket settings.
- Account deletion: frontend triggers a server-side RPC (privileged function) that removes dependent rows and the auth user (requires privileged migration to be applied).

## Frontend

### Stack

- React + TypeScript + Vite
- Material-UI v5 (MUI) for components and theming
- React Router for routing
- Centralized Supabase client at `frontend/src/lib/supabaseClient.ts`
- Central CRUD wrapper at `frontend/src/services/crud.ts` and domain services in `frontend/src/services/*.ts`

### Routing & pages

- `frontend/src/router.tsx` wires public and protected routes. Use `ProtectedRoute` for pages that require auth.

### State management

- Lightweight local state in components (useState/useReducer) and React Context for auth lifecycle (`AuthContext`).
- Cross-page refreshes use custom DOM events (e.g., `skills:changed`) — services should dispatch these after mutations.

### Component conventions

- Small, focused components under `frontend/src/components/`.
- Pages under `frontend/src/pages/` (domain folders like `education`, `skills`, `profile`, etc.).
- Always use centralized `useErrorHandler()` and the `ErrorSnackbar` component for errors and success messages.
- Avoid inline styles; prefer theme tokens or external CSS files in `frontend/src/styles` or page-level CSS files.

### Hooks

- `useAuth()` in `frontend/src/context/AuthContext.tsx` — canonical source for session/user state.
- `useErrorHandler()` — centralized notification and error mapping.

### Forms & validation

- Basic client-side validation in forms (required fields, date logic). Complex validation or business rules are enforced server-side where possible.
- Prefer normalized mappers in `frontend/src/services/dbMappers.ts` to translate UI form data → DB payloads.

### Error snackbar pattern

- Use `useErrorHandler()` and `ErrorSnackbar` instead of `alert()` or ad-hoc error state. This centralizes user-facing messaging and keeps ARIA live regions consistent.

### Loading / empty states

- Use consistent components for loading (e.g., `LoadingSpinner`) and empty states (illustration + action). Ensure `aria-live` announcements for state changes where appropriate.

### Testing strategy

- Unit tests for pure mappers and utilities.
- Add small integration tests (Vitest/Jest) for services with a mocked Supabase client where possible.

## Styling & Theme

### Philosophy

- Glass morphism with subtle gradients and soft radii. Use theme tokens instead of hard-coded values.

### Theme tokens

- Colors: primary, secondary, success, warn, error, text.primary, text.secondary, surfaces (glass, paper), borders
- Spacing: use theme spacing scale (theme.spacing(n) / design tokens)
- Radius: standardized radii (sm, md, lg)
- Shadows: surface, glow, focus

### Application

- All stylistic primitives must come from `frontend/src/theme/theme.tsx`.
- Prefer external CSS files per page (e.g., `frontend/src/pages/skills/SkillsOverview.css`) for layout and small helpers.

### Dark mode

- Theme should include matching dark tokens. Use MUI's palette mode and tokens to switch.

### Do / Don't

- Do: use `className` and token-driven styles.
- Don't: inline hard-coded colors or per-component one-off `sx` unless the theme cannot express the need.

## Backend / Services

### Supabase schema highlights

- Canonical schema is under `db/migrations/2025-10-26_recreate_full_schema.sql`.
- Important tables: `profiles`, `applications`, `education`, `employment`, `skills`, `projects`, `documents`.

### RLS & auth

- RLS policies enforce `user_id = auth.uid()` for user-scoped tables. Never bypass this in client code.
- Privileged operations (e.g., deleting `auth.users`) must be implemented as security-definer SQL functions and applied by a privileged operator (migrations present in `db/migrations/` but must be run in the Supabase project).

### Storage

- Avatars and documents are stored in Supabase Storage buckets. Bucket lifecycle and delete policies must be mirrored in DB triggers where needed.

### Service layer patterns

- Use `frontend/src/services/*.ts` domain modules that call into the central `crud` wrapper.
- Centralize DB → UI mapping in `dbMappers.ts`.

### DTOs / mappers

- Map DB rows (snake_case) to UI models (camelCase) in `dbMappers.ts` and typed domain `types/` files. Keep mapping functions small and testable.

### API error shapes

- `crud.ts` returns `Result<T>` shapes: `{ data: T | null; error: CrudError | null; status?: number | null }`.

## Types & Contracts

- Keep shared types in `frontend/src/types/` (one file per domain). Import `type { X }` rather than re-declaring locally.
- Normalization rules
  - DB date strings → parse to ISO or Date in mappers.
  - Enum fields (e.g., `proficiency_level`) must be normalized to canonical values in `dbMappers.ts`.
  - Null handling: prefer `null` (DB) → `null` or omitted in UI models, avoid `undefined` crossing the network boundary.

### Versioning tips

- When you change a public contract, add a migration and update mappers and types together. Maintain backward compatibility when possible.

## Directory Layout

Top-level folders (short tree):

- `frontend/` — React app
  - `src/`
    - `components/` — shared UI components
    - `pages/` — page-level components organized by domain
    - `services/` — domain services & `crud.ts`
    - `context/` — `AuthContext` and other contexts
    - `hooks/` — shared hooks like `useErrorHandler`
    - `lib/` — shared clients such as `supabaseClient.ts`
    - `theme/` — theme tokens and design system
    - `types/` — centralized TypeScript types

- `db/` — SQL migrations
- `docs/` — onboarding and feature docs (Education.md, Skills.md, etc.)

## Cross-cutting Concerns

- Logging: Keep console logs out of production. Use dev-only checks or a lightweight logger that can be silenced.
- Feature flags: none present; if added, keep them behind a single `config/features.ts` file.
- Env/config: Use Vite's `import.meta.env` for client-environment values. Keep secrets out of the client.

## How to Extend (new page / feature)

1. Add types to `frontend/src/types/`.
2. Add mappers (if DB shape differs) to `frontend/src/services/dbMappers.ts`.
3. Add domain service in `frontend/src/services/` using `crud` wrappers.
4. Add page under `frontend/src/pages/<feature>/` and styles in a CSS file beside it.
5. Use `useAuth()` and `crud.withUser(user.id)` for user-scoped operations.
6. Add unit tests for mappers and small integration tests for the service.

## Conventions Checklist (for PR reviewers)

- Types: avoid `any`; prefer explicit domain types or `unknown` with validation.
- Mappers: DB → UI mapping in `dbMappers.ts`.
- Errors: surface user-friendly messages via `useErrorHandler()` and `ErrorSnackbar`.
- Theme: use tokens from `theme.tsx`; avoid hard-coded colors.
- Accessibility: labels, `aria-live` for error messages, focus management for dialogs.

## Known Gaps / TODOs for Sprint 2

- Full typing and refactor of `frontend/src/services/crud.ts` to remove `any` (in-progress).
- Audit and remove inline styles and `sx` usages that violate theme patterns.
- Add unit tests for mappers, reorder helpers, and the delete-account RPC flow (mocked where necessary).
- Apply server-side migrations in Supabase for privileged delete operations.

---

If you'd like, I can now create a PR branch with the minimal diffs I propose (small, high-impact changes) and add the suggested unit test skeletons next.
