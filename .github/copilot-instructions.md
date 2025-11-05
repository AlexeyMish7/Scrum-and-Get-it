# PR Review Focus (for Copilot)

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
- `frontend/src/theme/theme.tsx` — comprehensive design system with glass morphism, gradients, and design tokens.
- `.github/instructions/theme_design.instructions.md` — theme design principles and component styling standards.
- Example pages: `frontend/src/pages/Register.tsx`, `Login.tsx`, `ProfilePage.tsx`.
- Database schema (canonical): `db/migrations/2025-10-26_recreate_full_schema.sql` — the full Postgres schema (tables, enums, RLS policies, triggers and storage bucket setup). Read this before making schema or RLS changes.

Core rules (must follow)

- Respect Supabase RLS: always scope queries to the current user for public tables (use `withUser(user.id)` or `.eq('user_id', user.id)`).
- Use the shared `supabase` client from `supabaseClient.ts` everywhere.
- Use `AuthContext` / `useAuth()` for session/user state; normalize emails with `trim().toLowerCase()`.
- Prefer `services/crud.ts` wrappers over ad-hoc `supabase.from(...)` calls in pages/components.
- Keep TypeScript strict where practical and make UI accessible (labels, `aria-live` for errors).
- **ALWAYS use centralized error handling**: Import and use `useErrorHandler` hook + `ErrorSnackbar` component instead of `alert()` or manual error states.
- **ALWAYS follow theme design principles**: Use glass morphism, design tokens, and helper classes from the theme system. Avoid manual styling that conflicts with the design system.
- **ALWAYS use external CSS files**: Never use `sx` props or inline styles. Create `.css` files with consistent class naming (e.g., `.component-name-element`).
- **ALWAYS use centralized types**: Import types from `src/types/` instead of creating local type definitions.

Component modernization patterns

When fixing/updating components, follow this checklist:

1. **Error Handling**: Replace `alert()`, `console.error()` patterns with:

   ```tsx
   import { useErrorHandler } from "../../hooks/useErrorHandler";
   import { ErrorSnackbar } from "../../components/common/ErrorSnackbar";

   const { notification, closeNotification, handleError, showSuccess } =
     useErrorHandler();

   // In JSX: <ErrorSnackbar notification={notification} onClose={closeNotification} />
   // Usage: handleError(error), showSuccess("Success message")
   ```

2. **Theme Design System**: Follow glass morphism principles and use design tokens:

   ```tsx
   // ❌ Bad: <Box sx={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 2 }}>
   // ✅ Good: <Box className="glass-card">
   // ✅ Good: <Button variant="primary">Submit</Button>
   // ✅ Good: <Typography className="techy-gradient">Hero Title</Typography>
   ```

3. **External CSS**: Move all `sx` props to external CSS files or use helper classes:

   ```tsx
   // ❌ Bad: <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
   // ✅ Good: <Box className="component-container">
   // ✅ Good: <Box className="floating-container">
   ```

4. **Centralized Types**: Remove local type definitions:

   ```tsx
   // ❌ Bad: type EducationEntry = { id: string; ... }
   // ✅ Good: import type { EducationEntry } from "../../types/education";
   ```

5. **Consistent Messaging**: Use specific, user-friendly messages:
   ```tsx
   // ❌ Bad: alert("Error occurred")
   // ✅ Good: handleError(error) // Auto-converts CrudError to user-friendly message
   // ✅ Good: showSuccess("Education updated successfully")
   ```

Reference implementations

- `frontend/src/pages/education/AddEducation.tsx` — Perfect example of all patterns
- `frontend/src/pages/education/EducationOverview.tsx` — Timeline component with proper error handling
- `frontend/src/hooks/useErrorHandler.ts` — Centralized error handling system
- `frontend/src/components/common/ErrorSnackbar.tsx` — Reusable notification component

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

## Branch-specific standards and inner-workings (read before editing)

- Architecture overview (frontend): React + TypeScript (Vite). The app uses a single Supabase client at `frontend/src/lib/supabaseClient.ts` and a lightweight CRUD wrapper at `frontend/src/services/crud.ts` that centralizes common DB access patterns.
- RLS and user scoping: All public table reads/writes must be scoped to the authenticated user. Use `const userCrud = crud.withUser(user.id)` for inserts/updates/deletes. Never send `service_role` keys to the client or perform admin operations from UI code.
- Types, mappers and utils:
  - Types: centralize shared row and view-model types in `frontend/src/types/` (one file per domain: `skill.ts`, `employment.ts`, `document.ts`, `education.ts`, `project.ts`, etc.). Prefer `import type { X } from '../../types/x';` in components/pages.
  - DB mappers: any transformation from UI form data → DB payload (normalizing dates, enums, column names) belongs in `frontend/src/services/dbMappers.ts` (or a domain-specific file under `services/`). Components should call `mapX(form)` and then pass the result to `crud.withUser(user.id).insertRow(...)`.
  - Shared helpers: place generally useful helpers (formatters, validators, enum maps) in `frontend/src/utils/` so they can be re-used without duplication.

## Refactor / PR rules for this branch

- Make only small, reviewable changes per PR (1–3 files). Each PR must include a brief verification checklist.
- If you move or rename types/helpers, update all imports and run `npm run typecheck` and `npm run lint` before pushing.
- Avoid changing core business logic unless fixing a clear bug. If a logic change is necessary, explain the reason in the PR body and include tests.

## Commenting and code clarity guidelines

- Keep comments short and purposeful. Aim for 1–2 line comments above non-obvious blocks (why, not what). Example:

  // Map user-facing form to DB columns; normalizes dates to YYYY-MM-DD
  const mapped = mapEmployment(form);

- Use JSDoc-style comments only for exported functions/types that need extra context. Do not add comments for trivial getters/setters or obvious React JSX.
- When code uses advanced TypeScript generics or utility types, add a short explanatory comment describing the intent and the inputs/outputs.

## Testing, verification and CI checks

- Local checks to run before opening a PR (PowerShell):

  cd frontend
  npm run typecheck
  npm run lint
  npm run test # if tests exist

- Add unit tests when moving mappers or adding non-trivial helpers (jest/vitest depending on repo setup). Keep tests small: one happy-path and one failure/edge-case per mapper.

## Accessibility & UX must-haves

- Always add labels for form inputs and ensure error messages are announced (use `aria-live` or ErrorSnackbar).
- Add disabled and loading states for buttons during async operations to prevent double-submits.

## PR checklist (add to PR description)

- Small change summary (one line)
- Files changed (list)
- Typecheck/lint status
- Manual verification steps (what UX flows you tested)
- Migration notes (if database schema or RLS changes required)

---

Keep this file updated as the app grows—it's the single source of truth for how AI assistants and contributors should work in this repo.
