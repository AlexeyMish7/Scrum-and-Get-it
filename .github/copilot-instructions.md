# Copilot Guide — Scrum-and-Get-it (Sprint 2)

This guide keeps AI assistants aligned with the current app structure, tech choices, and Sprint 2 scope. Favor simple TypeScript, shared helpers, and consistent UI patterns.

## Project overview

- Stack: React 19 + TypeScript ~5.9 + Vite 7
- UI: MUI v7
- Backend: Supabase (Postgres + Auth)
- Root: `frontend/`
- Node: 20.19.5; npm: >= 10.8.2
- Required env (do NOT commit): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Dev commands (PowerShell):
  - Start: `cd frontend; npm run dev`
  - Typecheck: `cd frontend; npm run typecheck`
  - Lint: `cd frontend; npm run lint`

## App architecture: three workspaces + shared layer

Top-level split under `src/app/workspaces/`:

- Profile workspace: `workspaces/profile/*`
- AI workspace: `workspaces/ai/*`
- Jobs workspace: `workspaces/jobs/*`

Shared foundation (cross-workspace): `src/app/shared/*`

- Layouts: `shared/layouts/AppShell.tsx`, `shared/layouts/SystemLayer.tsx`, `shared/layouts/GlobalTopBar.tsx`
- Sidebars: `shared/components/sidebars/AISidebar`, `.../JobsSidebar`
- Auth: `shared/context/AuthContext.tsx` provides `useAuth()`
- Data: `shared/services/supabaseClient.ts` and `shared/services/crud.ts` (with `withUser(userId)`)
- Feedback: `shared/hooks/useErrorHandler.ts`, `shared/components/common/ErrorSnackbar.tsx`
- Sprint overlay: `shared/components/common/SprintTaskSnackbar.tsx` + `shared/hooks/useSprintTasks.ts` + `shared/utils/pageTaskMap.ts` + `shared/utils/taskOwners.ts`

AppShell renders the global top bar, a sidebar slot (workspace-specific), and a main outlet. SystemLayer is appended once (at the bottom) to host global snackbars, confirmations, and the Sprint task overlay.

## Themes

- Global theme: the app is wrapped at the top level with a `ThemeContextProvider` in `src/main.tsx` which applies the shared `lightTheme` / `darkTheme` from `src/app/shared/theme` (via MUI `ThemeProvider`). Theme selection (light/dark) and a small "radius mode" toggle are persisted in localStorage.
- AI theme: an optional AI-only theme lives at `src/app/workspaces/ai/theme/aiTheme.tsx`. For pages that should showcase an AI look, wrap the page locally with MUI's `ThemeProvider` using that theme.

Tip: Keep theme usage lightweight. Prefer MUI `sx` props for one-off spacing and small layout tweaks.

## Routing (React Router v7)

- Router lives in `src/router.tsx` and uses `createBrowserRouter`.
- Workspaces are nested routes with dedicated layouts:
  - `/ai` → `AiLayout` (wraps with AppShell + AISidebar)
  - `/jobs` → `JobsLayout` (AppShell + JobsSidebar)
  - Profile pages render inside `ProfileLayout` where applicable
- Protected pages use `ProtectedRoute` to enforce auth.

Current AI routes:

- `/ai` (DashboardAI index)
- `/ai/resume` (GenerateResume)
- `/ai/cover-letter` (GenerateCoverLetter)
- `/ai/job-match` (JobMatching)
- `/ai/company-research` (CompanyResearch)
- `/ai/templates` (TemplatesHub)

Current Jobs routes (children under `/jobs`):

- index + `/jobs/pipeline` (Pipeline)
- `/jobs/new` (New Job)
- `/jobs/documents` (Documents & Materials)
- `/jobs/saved-searches`
- `/jobs/analytics`
- `/jobs/automations`

## Sprint 2 focus

Sprint 2 concentrates on AI and Jobs workspaces:

- AI: resume generation, cover letters, job match, company research, templates hub
- Jobs: pipeline (kanban), new job entry/import, documents linking, saved searches, analytics, automations

When building features:

- Use CRUD helpers and scope with `withUser(user.id)` for user-owned tables
- Use `useErrorHandler` + `ErrorSnackbar` for feedback
- Follow the page structure and route keys already present in the router

## Sprint Task Snackbar (use cases + owners)

- Component: `src/app/shared/components/common/SprintTaskSnackbar.tsx`
- Hook: `src/app/shared/hooks/useSprintTasks.ts` (infers a page key from the URL or accepts an explicit `PageTaskKey` when you call the hook from a page)
- Mapping: `src/app/shared/utils/pageTaskMap.ts` (page key → list of UC items)
- Ownership: `src/app/shared/utils/taskOwners.ts` (UC → owner)
- Global placement: `src/app/shared/layouts/SystemLayer.tsx` renders the snackbar for the current page when tasks exist.

Each task item shows: UC code, optional short title, owner (from `taskOwners`), a short description, and an implementation scope label (`[Frontend|Backend|Both]`) for planning. To add or adjust tasks:

1. Add/verify the UC → owner entry in `src/app/shared/utils/taskOwners.ts`
2. Update the page’s task list in `src/app/shared/utils/pageTaskMap.ts` (order items by business priority)
3. If a new route is introduced, add its route → page key inference to `src/app/shared/hooks/useSprintTasks.ts` or pass an explicit key from the page component (e.g., `useSprintTasks("ai:cover-letter")`).

## Auth & data patterns

- `useAuth()` exposes `{ session, user, loading, signIn, signUpNewUser, signInWithOAuth, signOut }`
- Use `withUser(user?.id)` to scope queries/mutations: respects RLS; never trust client-owned IDs without scoping
- Import the single Supabase client from `@shared/services/supabaseClient`
- Prefer `crud.ts` helpers for `listRows`, `getRow`, `insertRow`, `updateRow`, `deleteRow`, etc.

## Error handling

- Use `useErrorHandler()` and render `ErrorSnackbar` once per page tree (already handled by SystemLayer)
- Don’t use `alert()` or custom toast systems

## Path aliases

Configured in `frontend/tsconfig.app.json` (baseUrl `src`) and wired in `vite.config.ts`. Useful aliases include:

- `@/*` → `src/*`
- `@app/*` → `src/app/*`
- `@shared/*` → `src/app/shared/*`
- `@components/*` → `src/app/shared/components/*`
- `@services/*` → `src/app/shared/services/*`
- `@context/*` → `src/app/shared/context/*`
- `@hooks/*` → `src/app/shared/hooks/*`
- `@utils/*` → `src/app/shared/utils/*`
- `@workspaces/*` → `src/app/workspaces/*`
- `@profile/*` → `src/app/workspaces/profile/*`
- `@ai/*` → `src/app/workspaces/ai/*`
- `@jobs/*` → `src/app/workspaces/jobs/*`
- `@theme` → `src/app/shared/theme/index.ts`

## Coding style

- Keep TS simple; avoid heavy generics and type gymnastics
- Favor small, readable functions; lift helpers into `shared/utils` when reused
- Explain intent with short comments for non-obvious blocks
- Use MUI `sx` for minor layout; extract larger style blocks into theme overrides or CSS
- Let ESLint/Prettier formatting guide style

## Common snippets

Auth + user scoping:

```tsx
import { useAuth } from "@shared/context/AuthContext";
import { withUser } from "@shared/services/crud";

const { user } = useAuth();
const userCrud = withUser(user?.id);
```

Error notifications:

```tsx
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "@shared/components/common/ErrorSnackbar";

const { notification, closeNotification, handleError, showSuccess } =
  useErrorHandler();

return (
  <>
    {/* ... */}
    <ErrorSnackbar notification={notification} onClose={closeNotification} />
  </>
);
```

CRUD helpers:

```ts
import { listRows } from "@shared/services/crud";

const res = await listRows("applications", "*", {
  order: { column: "created_at", ascending: false },
});
```

Scoped insert:

```ts
const res = await userCrud.insertRow("documents", { file_name: "resume.pdf" });
```

## Guardrails

- Never commit or hardcode secrets; only use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Always scope user-owned data with `withUser(user.id)`
- Keep routes in sync with `src/router.tsx`
- Reuse shared client and CRUD helpers; don’t hand-roll Supabase logic in pages
- Protect all data-reading/writing pages with `ProtectedRoute`

---

If anything is unclear, inspect nearby files under `src/app/shared/*` or the matching workspace folder to mirror existing patterns. Keep implementations straightforward and commented with intent.
