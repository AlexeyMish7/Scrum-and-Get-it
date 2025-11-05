# Copilot Guide — Scrum-and-Get-it (Sprint 2)

This is a quick, practical guide for AI assistants working in this repo. Keep code simple, clearly commented, and aligned with how the app is structured today.

## Project overview

- Frontend: React + TypeScript + Vite (Node 20.19.5, npm >= 10.8.2)
- Backend: Supabase (Postgres + Auth)
- Root: `frontend/`
- Dev commands (PowerShell):
  - Start: `cd frontend; npm run dev`
  - Typecheck: `cd frontend; npm run typecheck`
  - Lint: `cd frontend; npm run lint`
- Required env (do NOT commit): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Folder map (current)

- `frontend/src/app/shared/`
  - `context/AuthContext.tsx` — global auth provider + `useAuth()` hook
  - `services/supabaseClient.ts` — single Supabase client
  - `services/crud.ts` — DB helpers (list/get/insert/update/upsert/delete + `withUser(userId)`)
  - `hooks/useErrorHandler.ts` — central notifications + error mapping
  - `components/common/` — shared UI (e.g., `ProtectedRoute`, `ErrorSnackbar`)
- `frontend/src/app/workspaces/profile/` — profile workspace (pages, theme)
  - `theme/theme.tsx` — main app theme used globally in `main.tsx`
- `frontend/src/app/workspaces/ai/` — AI workspace (separate area for Sprint 2)
  - `pages/` — AI features (CompanyResearch, JobMatching, GenerateResume, GenerateCoverLetter, DashboardAI)
  - `theme/` — AI-only theme and showcase
    - `AiThemeShowcase.tsx` — available at `/ai/theme` (demo route added)
    - `aiTheme.tsx` — AI theme (wrap AI pages locally with a ThemeProvider)
- `frontend/src/router.tsx` — routes (React Router)
- `frontend/src/main.tsx` — app entry; wraps Router with global profile theme and `AuthContextProvider`
- `frontend/tsconfig.app.json` — path aliases:
  - `@shared/*` → `src/app/shared/*`
  - `@profile/*` → `src/app/workspaces/profile/*`
  - `@workspaces/*` → `src/app/workspaces/*`
  - `@/*` → `src/*`

## How auth works

- The app uses Supabase Auth and provides auth state globally.
- Use `useAuth()` from `@shared/context/AuthContext` to access `{ session, user, loading, signIn, signUpNewUser, signInWithOAuth, signOut }`.
- Emails should be normalized with `trim().toLowerCase()` (already handled in auth helpers).
- Wrap protected pages with `ProtectedRoute` so anonymous users redirect to `/login`.

## Supabase + CRUD patterns

- Always import the shared client from `@shared/services/supabaseClient`.
- Prefer the CRUD helpers in `@shared/services/crud` over raw `supabase.from(...)` calls.
- For user-owned tables, scope with `withUser(user.id)`:
  - Example (listing rows):
    ```ts
    const { user } = useAuth();
    const userCrud = withUser(user?.id);
    const res = await userCrud.listRows(
      "documents",
      "id,file_name,uploaded_at",
      { order: { column: "uploaded_at", ascending: false } }
    );
    if (res.error) handleError(res.error);
    ```
- For one-off queries:
  - Example:
    ```ts
    const res = await listRows("applications", "*", {
      order: { column: "created_at", ascending: false },
    });
    ```

## Error handling (always use this)

- Use the centralized hook and snackbar:
  - `import { useErrorHandler } from "@shared/hooks/useErrorHandler"`
  - `import { ErrorSnackbar } from "@shared/components/common/ErrorSnackbar"`
- In components:

  ```tsx
  const { notification, closeNotification, handleError, showSuccess } =
    useErrorHandler();

  // Render once near the root of the component
  <ErrorSnackbar notification={notification} onClose={closeNotification} />;

  // Use these in async flows
  try {
    // ... do work
    showSuccess("Saved!");
  } catch (e) {
    handleError(e);
  }
  ```

- Do not use `alert()` or custom error toasts.

## Routing (accurate to current app)

- Router is defined in `src/router.tsx` with React Router’s `createBrowserRouter`.
- Protected routes wrap content with:
  ```tsx
  <ProtectedRoute>
    <MainLayout>
      <YourPage />
    </MainLayout>
  </ProtectedRoute>
  ```
- Public routes are plain elements.
- AI workspace lives under `/ai/...` paths. The theme showcase is wired at `/ai/theme` and renders `AiThemeShowcase`.
- When adding AI feature pages, prefer protected routes if they read/write user data (so the user must be logged in).

Example additions (keep style consistent with `router.tsx`):

```tsx
// Public AI showcase (already added)
{ path: "/ai/theme", element: <AiThemeShowcase /> },

// Protected AI tools (example)
{
  path: "/ai/dashboard",
  element: (
    <ProtectedRoute>
      <MainLayout>
        <AIDashboard />
      </MainLayout>
    </ProtectedRoute>
  ),
},
```

## Themes

- The global app uses the Profile theme: `@profile/theme/theme.tsx` (applied in `main.tsx`).
- The AI workspace can use its own theme. Wrap AI pages with a local ThemeProvider when needed:

  ```tsx
  import { ThemeProvider } from "@mui/material/styles";
  import aiTheme from "@workspaces/ai/theme/aiTheme";

  export default function AIPage() {
    return <ThemeProvider theme={aiTheme}>{/* AI UI here */}</ThemeProvider>;
  }
  ```

## Sprint 2 focus (AI section)

Build the core job-search and AI features under `src/app/workspaces/ai/`:

- Pages to extend: `pages/CompanyResearch`, `pages/JobMatching`, `pages/GenerateResume`, `pages/GenerateCoverLetter`, `pages/DashboardAI`
- Add routes under `/ai/...` for these pages.
- Use shared CRUD helpers for data and scope writes/reads to `user_id` (via `withUser`).
- Use `useErrorHandler` + `ErrorSnackbar` for all feedback.
- Keep code readable and avoid overly advanced TypeScript.

## Coding style (keep it simple)

- Keep TypeScript simple: avoid advanced generics or complex utility types.
- Prefer small, readable functions; break work into helpers in `shared/utils` when reusable.
- Comment briefly above non-obvious blocks explaining the purpose in plain language (why, not how).
- Use clear names for files, components, and variables.
- Formatting: keep files neat and consistent. The repo uses ESLint configs; let formatters handle style.
- UI styling:
  - It’s fine to use MUI props and small `sx` blocks for layout/spacing.
  - If styles get large or repeated, move them into a small CSS file or a theme override.

## Common snippets

Auth and user scoping:

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

Simple list with ordering:

```ts
import { listRows } from "@shared/services/crud";

const res = await listRows("applications", "*", {
  order: { column: "created_at", ascending: false },
});
if (res.error) handleError(res.error);
```

Insert with user scope:

```ts
const res = await userCrud.insertRow("documents", { file_name: "resume.pdf" });
if (res.error) handleError(res.error);
else showSuccess("Uploaded");
```

## Guardrails

- Do not hardcode service keys in the client. Only use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Respect RLS: for public tables, scope by `user_id` using `withUser(user.id)`.
- Keep routes accurate to `src/router.tsx` and the current folder structure.
- Prefer the shared client and CRUD helpers; do not duplicate DB logic in pages.
- Use `ProtectedRoute` for any page that needs the current user.

---

If something is unclear in the codebase, take a quick look at the nearby files in `src/app/shared/*` or the corresponding workspace folder to match existing patterns. Keep the implementation straightforward and well-commented.
