# Employment section — architecture & data flow

This document summarizes how the Employment section of the app is organized (DB → services → UI), the data shapes, validation rules and UX patterns to keep in mind when extending or testing the feature.

## High-level flow

- Backend: `public.employment` table stores employment rows (owned by `auth.users`). Row-level security (RLS) restricts access to rows where `user_id = auth.uid()`.
- Frontend services: `frontend/src/services/employment.ts` provides typed wrappers around `services/crud.ts` using `withUser(userId)` (list/insert/update/delete).
- UI: pages under `frontend/src/pages/employment/` consume services and types: `EmploymentHistoryList`, `AddEmployment`, `EditEmploymentModal`, and the shared `EmploymentForm` fragment.

## Database table (canonical fields)

Table: `employment`

- `id`: UUID, PK
- `user_id`: UUID, FK → `auth.users.id` (RLS-scoped)
- `job_title`: text (required)
- `company_name`: text (required)
- `location`: text (nullable)
- `start_date`: date (required)
- `end_date`: date (nullable) — null when `current_position` is true
- `current_position`: boolean (default false)
- `job_description`: text (nullable)
- `created_at`, `updated_at`: timestamps (managed by DB triggers)

Constraints enforced in migration:

- `start_date` NOT NULL
- `end_date >= start_date` when end_date is not null
- `end_date IS NULL` when `current_position = true`

## Frontend types

- `EmploymentRow` — mirrors DB (snake_case). Used for data returned from services.
- `EmploymentFormData` — UI/camelCase shape used by form components.

Mapping: service functions convert form/camelCase values into the DB payload (snake_case) before calling `crud` helpers.

## Services

- `listEmployment(userId)` — returns rows ordered by `start_date` desc.
- `insertEmployment(userId, payload)` — inserts a new row (payload uses DB column names).
- `updateEmployment(userId, id, payload)` — updates a row by id (scoped via `withUser`).
- `deleteEmployment(userId, id)` — deletes the row by id (scoped via `withUser`).

All service calls should be scoped to the currently authenticated user via `withUser(user.id)` to satisfy RLS.

## UI components and responsibilities

- `EmploymentHistoryList.tsx`
  - Lists entries; reads `location.state.success` to display centralized success snackbars.
  - Shows delayed spinner (120ms) to avoid UI flicker on fast loads.
  - Opens `EditEmploymentModal` and `ConfirmDialog` for edit/delete flows.
- `AddEmployment.tsx`
  - Uses `EmploymentForm` (controlled) for input; client-side validation and maps form values to payload.
  - On success navigates back to `/employment-history` with `{ state: { success: string } }` so the list shows a single snackbar.
- `EditEmploymentModal.tsx`
  - MUI `Dialog` that focuses the first input on open. Validates and calls `updateEmployment` then closes and triggers the centralized success flow.
- `EmploymentForm.tsx`
  - Controlled fragment; mark required fields, show inline helper text. When `endDate` is cleared it auto-sets `isCurrent = true`.
- `ConfirmDialog.tsx`
  - Replaces native `confirm()`; used for delete confirmation.

## Validation rules (client-side)

- `jobTitle`, `companyName`, `startDate` are required.
- If `isCurrent` is false, `endDate` may be required — when present it must be >= `startDate`.
- Empty `endDate` implies `isCurrent = true` and payload sets `end_date = null`.

## UX & accessibility patterns

- Delayed spinner (120ms) reduces flicker on quick loads.
- Modal focuses the first input on open; a follow-up accessibility improvement is to restore focus to the opener on close.
- Inputs use MUI `TextField` with `InputLabelProps={{ shrink: true }}` for dates; theme also forces label float with `:has` for modern browsers.

## Theming

- The global theme (`frontend/src/theme/theme.tsx`) exposes helper classes via `MuiCssBaseline` such as `.glossy-card`, `.glossy-btn`, `.glossy-title`.
- Employment pages import `employment.css` for layout and apply `.glossy-card` / `.glossy-title` where appropriate to get the glossy look.

## Security

- Always scope DB calls with the authenticated user's id (`withUser(user.id)`) to satisfy RLS policies defined in the DB migration.

## Testing suggestions

- Unit: validate mapping between `EmploymentFormData` and DB payload (snake_case), validate client-side date rules.
- E2E: Add flow (create → list), Edit flow (edit → list sees updated), Delete flow (confirm → removed), and ensure unauthorized users cannot access another user's rows.

## How to run locally (quick)

1. Start frontend dev server:

```powershell
cd frontend
npm run dev
```

2. Typecheck / build:

```powershell
cd frontend
npm run typecheck
npm run build
```

If you want, I can add a small test harness (Jest + React Testing Library) that covers the mapping and validation rules.

---

Last updated: 2025-11-02
