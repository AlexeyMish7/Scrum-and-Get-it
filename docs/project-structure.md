# Project structure — Scrum-and-Get-it

This file maps the repository layout and provides a concise explanation of what each top-level folder and important file contains. It's intended to help new teammates quickly understand where to look for code, configuration, themes, and database migrations.

Top-level tree (trimmed for clarity):

- README.md — project overview and high-level instructions.
- db/ — database migrations and SQL utilities
  - migrations/ — ordered SQL migration files and helpers (use these to modify schema)
    - apply_migration.sql — helper to apply migrations
    - \*.sql — migration files with dates in name (source of truth for schema changes)
- docs/ — documentation and onboarding guides
  - development/ — developer-focused docs
  - getting-started/ — setup instructions
  - project-management/ — sprint PRDs, demos, planning docs
- frontend/ — main React + TypeScript app (Vite + MUI)
  - package.json — npm scripts and dependencies
  - tsconfig.\*.json — TypeScript configuration and path aliases
  - vite.config.ts — Vite config
  - src/ — application source code
    - main.tsx — app entry: mounts React app, wraps providers (theme, auth)
    - router.tsx — React Router routes for pages and workspaces
    - App.tsx, index.html — main wiring and SPA shell
    - MIGRATION_SCHEMA.md — notes on schema mapping used by frontend
    - app/ — application code organized by domain
      - shared/ — reusable utilities, hooks, services, and components used across workspaces
        - components/common/ — shared UI primitives (ErrorSnackbar, ProtectedRoute, ConfirmDialog, etc.)
        - context/AuthContext.tsx — global auth provider + `useAuth()` hook (Supabase-backed)
        - hooks/useErrorHandler.ts — central error/notification helper used throughout UI
        - services/ — small client-side helpers
          - supabaseClient.ts — singleton Supabase client configured with VITE\_ env vars
          - crud.ts — lightweight CRUD helpers (list/get/insert/update/delete) and `withUser(userId)` scoping
          - dbMappers.ts — optional mappers between DB rows and frontend types
          - types.ts — shared TypeScript types for data models
        - theme/ — theming system (tokens, palettes, factory, ThemeContext)
          - palettes/ — `lightPalette.ts`, `darkPalette.ts` token definitions
          - factory.ts — converts token objects into MUI Theme and component overrides
          - THEME_GUIDE.md / PALETTE_BLUEPRINT.md — docs describing tokens and how to customize
      - workspaces/ — feature grouped areas (profile, ai, jobs, etc.)
        - profile/ — profile workspace: pages, theme, services for user profile UI
        - ai/ — AI workspace: pages and components for resume/cover letter generation and research
        - jobs/ — job-tracking workspace (job entry, pipeline, job details)
          - pages/ — per-route pages (organized into folders per page)
          - components/ — jobs-specific components

Key frontend patterns and conventions

- The app uses MUI (Material UI) for UI primitives. Visuals are driven by a tokenized theme system: edit palette token files (in `theme/palettes`) and the `factory.ts` maps tokens to the MUI Theme.
- Avoid hardcoding colors or radii in feature components. Use `sx` for layout only and MUI props (`variant`, `color`, `size`) to pick visual variants defined in the theme. See `THEMING_GUIDE.md` for rules.
- Authentication uses Supabase. The `AuthContext` exposes `useAuth()` with `{ user, session, signIn, signOut, ... }` and is the recommended way to scope DB requests.
- For DB access, prefer `@shared/services/crud` helpers and use `withUser(user.id)` to scope writes/reads for user-owned tables (see `docs` and `db/migrations` for schema).

Development workflow (quick)

1. Install dependencies (Node 20+ recommended):

   ```powershell
   cd frontend; npm install
   ```

2. Start dev server:

   ```powershell
   cd frontend; npm run dev
   ```

3. Typecheck and lint:

   ```powershell
   cd frontend; npm run typecheck
   cd frontend; npm run lint
   ```

4. Database migrations:

   - Migrations live in `db/migrations/`. Use your local Supabase instance or CI-managed database to apply them. Consult `docs/getting-started/setup.md` for environment and secrets.

Where to look when you’re lost

- UI issues / theming surprises: `frontend/src/app/shared/theme/factory.ts` and palettes under `theme/palettes`.
- API / DB schema confusion: `db/migrations/*` and `docs/project-management`.
- Auth bugs: `AuthContext.tsx` and `services/supabaseClient.ts`.
- Common UI components: `shared/components/common/` for snackbars, protected routes, and small utilities.

Notes for contributors

- Keep changes small and focused: add feature pages under `workspaces/<feature>/pages` and shared components under `shared/components` if reusable.
- Respect RLS and user scoping: always use `withUser(user?.id)` for user-owned table operations.
- Update docs: when you add new top-level folders or important build/run steps, add a short note here or a linked doc under `docs/`.

If you want, I can expand this file with a full `tree` output (including file counts) or add a short “how it maps to PRD use cases” section per workspace.

---

Generated: a concise project-structure overview for quick team onboarding.
