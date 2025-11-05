# Education — Schema, Styling & App Logic

This document explains the Education section end-to-end: the schema and data shape, frontend components and styles, important logic and validation, how the frontend calls the backend, event patterns used for cross-component updates, and verification steps for new contributors. It's written for someone opening this project for the first time.

Quick pointers

- Frontend pages:
  - `frontend/src/pages/education/EducationOverview.tsx` — timeline view (read / edit / delete)
  - `frontend/src/pages/education/AddEducation.tsx` — add / create form and local temporary storage when unauthenticated
  - `frontend/src/pages/education/EducationOverview.css` — timeline and page styling (glass morphism, responsive rules)
  - `frontend/src/pages/education/AddEducation.css` — add form styling (glass card, gradients, responsive)
- Backend helpers: `educationService` (in `frontend/src/services/`) exposes methods used by these pages: `listEducation`, `createEducation`, `updateEducation`, `deleteEducation` (used by the pages; see service for exact signatures).
- Shared UX helpers: `useAuth()` (AuthContext), `useErrorHandler()` (centralized notifications), `crud` wrapper (for SQL scoping / RLS-safe operations) and `dbMappers` for payload normalization.

1. Canonical data shape (what the app expects)
   Note: the exact DB columns are defined in the repo SQL migrations; below are the fields inferred from the frontend code and the UI. If you change the DB schema, update `db/migrations/*` and the service layer.

- Education row (EducationEntry) — typical fields used in UI and service calls:
  - id: string (UUID) — primary key
  - user_id: string (UUID) — owner (auth.users.id)
  - institution: string
  - degree: string
  - field_of_study / fieldOfStudy: string
  - start_date / startDate: string (YYYY-MM format)
  - end_date / endDate: string | null (YYYY-MM) — optional; blank if ongoing
  - gpa: number | null
  - gpa_private / gpaPrivate: boolean
  - honors: string | null
  - active: boolean — denotes currently enrolled / ongoing
  - created_at, updated_at: timestamps (DB-side)

Assumptions and notes:

- I inferred JS property names from the frontend (camelCase). The DB uses snake_case; `dbMappers` and `educationService` handle mapping where needed.
- Always verify the canonical SQL in `db/migrations/2025-10-26_recreate_full_schema.sql` for exact column names and constraints before changing the server schema.

2. Frontend architecture — responsibilities and flow

Files of interest

- `EducationOverview.tsx` — Main timeline page. Responsibilities:

  - Load the user's education rows (via `educationService.listEducation(user.id)` or `crud` wrapper)
  - Sort and present entries as an alternating vertical timeline (preserves existing UI semantics)
  - Provide edit flow via `EditEducationDialog` (modal) and delete confirmation modal (`DeleteConfirmationDialog`)
  - Use `useErrorHandler()` to surface errors and `LoadingSpinner` while loading
  - Subscribe to a global event `education:changed` to refresh when other pages change education records

- `AddEducation.tsx` — Add / Create page. Responsibilities:
  - Provide a form with degree, institution, field of study, start/end dates, GPA, honors, and `active` (current) flag
  - Validate inputs client-side (required fields + date ordering) before submit
  - If not authenticated, store entries locally (temporary) and show success message; if authenticated, call `educationService.createEducation(user.id, payload)` and append the returned row to the local list
  - Emit `window.dispatchEvent(new Event('education:changed'))` after successfully creating a row so other pages (e.g., EducationOverview) can refresh

Shared patterns

- Centralized error handling: both pages call `useErrorHandler()` and forward caught errors to `handleError(error)` instead of using `alert()` or inline error messages.
- Auth scoping: all server calls should be scoped by `user.id` (via `educationService` or `crud.withUser(user.id)`) to respect Row-Level Security (RLS).

3. Validation rules and logic (extracted from `AddEducation.tsx`)

- Required fields before submit: `institution`, `startDate`, and either `degree` or `fieldOfStudy`. This avoids accidental blank entries.
- Date validation: when `active` is false and both `startDate` and `endDate` are present, the code enforces `endDate` occurs after `startDate`. The helper `isMonthAfter(start, end)` is used.
- GPA handling: optional; `gpaPrivate` toggles whether GPA is shown publicly. The UI stores `gpa` as a numeric field when provided.
- Local-only mode: when the user is unauthenticated (or auth still initializing), the add flow stores entries locally with a generated temporary ID (via `crypto.randomUUID()`); these entries are not persisted to the DB until the user signs in.

4. Editing and deleting entries (from `EducationOverview.tsx`)

- Edit flow:

  - Clicking edit opens `EditEducationDialog` with a cloned `EducationEntry` — the dialog updates local state and calls `onSave(editedEntry)` which triggers a service `update` call and then reloads the list.
  - After edit success, show a success notification via `useErrorHandler().showSuccess` and close the dialog.

- Delete flow:
  - Clicking delete sets a `confirmDeleteId` and opens `DeleteConfirmationDialog`.
  - On confirm, `educationService.deleteEducation(user.id, id)` (or `crud.withUser(user.id).deleteRow('education', { id })`) is called and the list reloads.
  - After successful deletion the UI triggers `showSuccess` and optionally emits `education:changed` for cross-page updates.

5. Styling and theme notes

- Primary styles:

  - The timeline page styling lives in `EducationOverview.css` and uses a light glass/techy theme: glass-morphism hints (soft backgrounds, subtle borders, shadows), gradient accents and a techy primary blue.
  - The timeline uses MUI Timeline components; CSS targets `.MuiTimelineDot-root` and `.MuiTimelineConnector-root` to align the dot size, colors, and connector width.
  - Cards use `.education-card` with 12px radius, subtle border and hover lift animation (translateY + shadow).
  - Responsive rules collapse alternating offsets on narrow screens: the left/right offset is removed and date column hides under 900px.

- Add form styling:
  - `AddEducation.css` defines `.education-form-container` with a glass card look (backdrop-filter blur, semi-opaque white background, gradient submit button).
  - Inputs are themed by targeting `.MuiInputBase-root` for hover/focus states so MUI components keep consistent behavior with the design system.

Styling best-practices in this repo

- Prefer MUI theme tokens from `frontend/src/theme/theme.tsx` for colors, gradients and animation tokens when changing or creating components.
- Avoid inline styles. Move any custom visual rules into the component's CSS file and prefer helper classes like `.glass-card`, `.floating-container` if available in the theme.

6. Backend interaction & security

- How the frontend talks to DB: most pages call domain services (like `educationService`) which in turn call the centralized `crud` helpers or `supabase.from(...).select(...)` using the client Supabase instance.
- RLS: The backend enforces Row-Level Security so all client queries should scope by owner. The pattern in this repo is `const userCrud = crud.withUser(user.id)` which automatically sets `.eq('user_id', user.id)` for reads/writes.
- Privileged actions: anything that affects `auth.users` (deleting a user, etc.) requires a server-side RPC with a privileged migration. The education flows only manipulate `public.education` rows, which are safe for client-side authenticated calls when RLS rules exist.

7. Events and cross-component updates

- Event name: `education:changed`
  - Emitted by `AddEducation` after successful create.
  - Listened to by `EducationOverview` to trigger `loadEducation()` and refresh the displayed list.

8. Contract & developer checklist (short)

- Contract (what components expect):

  - Inputs: Authenticated user (user.id), EducationEntry objects from the DB/service
  - Outputs: UI lists (sorted), success/error notifications, emitted `education:changed` events on create/delete
  - Error modes: network failure, validation failure, permission (RLS) rejection. All surfaced to `useErrorHandler()`.

- Edge cases to keep in mind:
  1. Missing dates or malformed YYYY-MM inputs — `parseMonthToMs` returns 0 for invalid/missing input, so sorting still works but may place entries unexpectedly.
  2. Simultaneous edits — last-writer-wins unless you introduce optimistic locking.
  3. Local-only entries (unauthenticated) are ephemeral; consider UX to convert them to persisted entries after sign-in.
  4. Partial failures — one API failing shouldn't blank the whole dashboard; show partial results and a snackbar.

9. Tests to add (recommended)

- Unit tests

  - Validation tests for `validate()` in `AddEducation` (happy path, missing required fields, endDate before startDate).
  - Mapper tests for `dbMappers.mapEducation(form)` (if you have mappers) to ensure DB payload shapes.

- Integration / E2E tests
  - Add education (authenticated): fills form → asserts new row appears in timeline and `education:changed` event fired.
  - Edit education: open edit dialog → change fields → assert updated values in timeline.
  - Delete education: confirm deletion → assert removal and counts updated.

10. How to run & verify locally

Commands (PowerShell):

```powershell
cd frontend; npm install   # ensure deps are installed
cd frontend; npm run dev   # start dev server (vite)
cd frontend; npm run typecheck
cd frontend; npm run lint
```

Quick verification checklist

1. Sign in as test user (or register). Ensure your `profiles` row exists and user.id is available.
2. Navigate to `/education` (the Overview) — page should show Loading spinner then the timeline.
3. Open Add Education page, add an education with valid dates and verify it appears on the Overview after submit.
4. Edit an entry: change the degree or dates; verify change shows in Overview and a success snackbar appears.
5. Delete entry: confirm deletion and verify it's removed and the Overview refreshes.
6. Test unauthenticated add: open AddEducation while logged out and submit; verify local-only entry is added and you get the local success message.

11) Small improvements & follow-ups (low-risk suggestions)

- Show an explicit conversion flow for local entries created while unauthenticated (e.g., allow users to claim/import local entries after signing up).
- Add `aria-live` regions on the timeline list for better a11y when items are added/removed.
- Add stronger date normalization in `dbMappers` and surface a clear format helper in the UI (placeholder: YYYY-MM).
- Add unit tests for `isMonthAfter()` and `parseMonthToMs()` helpers.

Where to look next

- `frontend/src/services/education.ts` or `frontend/src/services/crud.ts` (service implementation)
- `db/migrations/2025-10-26_recreate_full_schema.sql` for the canonical DB schema
- `frontend/src/utils/date.ts` and `dateUtils.ts` for date parsing helpers

If you want, I can:

- Create the unit tests for `AddEducation` validation now (one happy path, one failure). Mark it and implement them in the frontend test framework.
- Create a short PR-ready verification checklist that you can copy into a PR description.

---

Document created and placed at: `docs/pages/Education.md`
