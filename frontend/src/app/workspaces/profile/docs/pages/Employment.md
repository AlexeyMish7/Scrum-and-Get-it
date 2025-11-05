# Employment — Schema, Styling & App Logic

This document describes the Employment section end-to-end: the canonical data shape, frontend components and their responsibilities, styling notes, validation and edit/delete flows, how the frontend calls the backend (including RLS expectations), cross-component communication patterns, recommended tests, and a short verification checklist for new contributors.

Files to inspect

- `frontend/src/pages/employment/EmploymentHistoryList.tsx` — list/overview page (loads rows, handles edit/delete and success messages)
- `frontend/src/pages/employment/AddEmployment.tsx` — form page to add a new employment entry (validates and posts to backend)
- `frontend/src/pages/employment/EditEmploymentModal.tsx` — modal used to edit an existing entry; focuses first input for accessibility
- `frontend/src/pages/employment/employment.css` — page and form styling for employment components
- `frontend/src/services/employment.ts` (or similar) — service wrapper used to interact with backend tables via `crud` helpers
- Shared utilities: `useAuth()`, `useErrorHandler()`, `crud.withUser(user.id)`, `dbMappers` (if present)

1. Canonical data shape (what the UI expects)

The frontend code uses the following fields for employment rows. Database column names are snake_case; UI/form shapes are camelCase. Mappers convert between them.

- Employment row (DB columns / UI mapping):
  - id: string (UUID)
  - user_id: string (UUID) — owner (auth.users.id)
  - job_title / jobTitle: string
  - company_name / companyName: string
  - location: string | null
  - start_date / startDate: string (YYYY-MM-DD for date inputs)
  - end_date / endDate: string | null
  - current_position / isCurrent boolean — indicates ongoing role
  - job_description / description: string | null
  - created_at, updated_at: timestamps (managed by DB)

Notes:

- The UI uses HTML date inputs or date strings (ISO-style YYYY-MM-DD) for start/end. When the end date is blank or `isCurrent` is true, `end_date` is stored as null in the DB.
- The service layer should always map camelCase → snake_case when sending payloads to the DB, and the reverse when returning results.

2. Frontend responsibilities & flow

EmploymentHistoryList.tsx — overview/list page

- Responsibilities:
  - Load employment rows for the signed-in user via `employmentService.listEmployment(user.id)` (or `crud.withUser(user.id).listRows('employment', ...)`).
  - Show a delayed spinner (spinnerDelayMs) to avoid flicker on fast loads.
  - Render rows as `.employment-item` elements using `employment.css` styles.
  - Provide edit and delete actions for each entry.
  - Use a `prevUserIdRef` to avoid refetching unnecessarily across quick auth transitions.
  - Use navigation state to display centralized success messages: Add/Edit flows navigate back to this page using `navigate('/employment-history', { state: { success: '...' } })`.

AddEmployment.tsx — add form page

- Responsibilities:
  - Provide a controlled form for job title, company name, location, start date, end date, current toggle, and job description.
  - Validate required fields (jobTitle, companyName, startDate) and date ordering (endDate >= startDate unless current).
  - If user is not authenticated, block or show a friendly error (the current code uses `handleError('Please sign in...')`).
  - On success, call `employmentService.insertEmployment(user.id, payload)` and navigate to list with success message in location state.

EditEmploymentModal.tsx — edit dialog

- Responsibilities:
  - Map DB row (snake_case) into form shape (camelCase) and render `EmploymentForm`.
  - Focus first input on open for accessibility.
  - Validate required fields and date ordering before update.
  - Build explicit payload using DB column names and call `employmentService.updateEmployment(user.id, entry.id, payload)`.
  - Delegate showing success notification to the list view using navigation state, keeping UI notifications centralized.

Shared UX patterns

- Centralized error handling: use `useErrorHandler()` to surface errors rather than alerts.
- Mapping: keep UI components dealing with camelCase shapes; perform the snake_case ↔ camelCase translation in the modal/add page or a mapper utility.

3. Validation rules and logic (extracted from components)

- Required fields:
  - jobTitle (job title) — required
  - companyName (company) — required
  - startDate — required
- Date logic:
  - If `isCurrent` is true or end date is empty, `end_date` is set to null.
  - If endDate is provided and `isCurrent` is false, enforce endDate >= startDate. The code compares date strings because both are YYYY-MM-DD; this works lexicographically.
- Inline errors: `handleError('Please correct the highlighted fields.')` and field-level helper texts are used to guide users.

Important nuance: the code uses simple string comparisons for date order (startDate > endDate). For correctness and to avoid timezone/date-format issues, prefer normalizing the values to Date objects or ISO YYYY-MM-DD before comparison.

4. Delete flow and confirmations

- Deletion is always confirmed via `ConfirmDialog` (see `EmploymentHistoryList`).
- On confirm, the list calls `employmentService.deleteEmployment(user.id, entryId)` (or `crud.withUser(user.id).deleteRow('employment', { id })`), refreshes the list, and shows a centralized snackbar via `showSuccess`.
- The delete operation should be scoped by the user id to respect RLS.

5. Styling and theme notes

- Styles are in `frontend/src/pages/employment/employment.css`.

  - Container spacing: `.employment-container` and `.employment-top`.
  - List item styles: `.employment-item` with subtle border, radius, and hover shadow.
  - Form paper: `.employment-form-paper` (max-width 600px, centered, padding, 12px radius) and `.glossy-card` used in dialogs.
  - Actions and layout helper classes: `.employment-actions`, `.employment-form-actions`, `.employment-form-fields`.

- Theme guidelines in this repo:
  - Prefer tokens from `frontend/src/theme/theme.tsx` for colors, spacing and button variants.
  - Avoid inline `sx` for major styles; use the CSS file for layout, and MUI `sx` minimally for fine-grained adjustments.

6. Backend interaction & security

- How the frontend talks to DB:
  - Domain services (e.g., `employmentService`) wrap CRUD operations and call the centralized `crud` helper or `supabase.from(...)` directly.
  - The pattern `const userCrud = crud.withUser(user.id)` ensures `.eq('user_id', user.id)` is applied to queries and writes, matching RLS policies.
- RLS expectations:
  - Ensure the `public.employment` table has an RLS policy allowing authenticated users to SELECT/INSERT/UPDATE/DELETE rows where `user_id = auth.uid()`.
  - Never send or rely on `service_role` keys in client code.

7. Cross-component communication & navigation state

- Notifications pattern: Add and Edit flows use router navigation state to centralize success messages on the list page. Example:

  navigate('/employment-history', { state: { success: 'Employment entry added successfully!' } });

- This keeps notifications from being duplicated across modals and pages and avoids UI fragmentation. The list checks `location.state` on mount and calls `showSuccess`.

8. Edge cases & known pitfalls

- Date comparison by string works for YYYY-MM-DD but will fail if the format changes. Normalize dates to ISO or use a date helper for comparisons.
- Concurrency: no optimistic locking — simultaneous updates from multiple tabs can overwrite each other. If this becomes a problem, add `updated_at` checks.
- Partial failures: when list reload fails, show a non-blocking error and keep the existing list if possible.

9. Tests to add (recommended)

- Unit tests:

  - `AddEmployment` validation: missing required fields, endDate before startDate, current position handling.
  - Mapper tests: snake_case ↔ camelCase mapping for payloads used by `EditEmploymentModal` and `AddEmployment`.
  - `EmploymentHistoryList` fetch behaviour: spinner delay logic with mocked slow/fast responses.

- Integration / E2E tests:
  - Add employment (authenticated): submit valid form → assert navigation to list and snackbar appears.
  - Edit employment: open edit modal → change fields → assert update in list.
  - Delete employment: confirm deletion → assert row removed.

10. Quick local verification steps

Commands (PowerShell):

```powershell
cd frontend; npm install
cd frontend; npm run dev    # start the app locally
cd frontend; npm run typecheck
cd frontend; npm run lint
```

Manual verification checklist

1. Sign in as a test user (or register).
2. Visit `/employment-history` — ensure the delayed spinner behaviour looks correct (no flicker on fast loads).
3. Click Add → fill form with valid data → submit. Confirm you were navigated back and a success snackbar appears.
4. Click Edit on a row → change required fields and dates → save. Confirm update appears on the list and no errors are shown.
5. Click Delete on a row → confirm in dialog. Confirm the row is removed and a success snackbar appears.

11) Small improvements & follow-ups (low-risk)

- Replace lexicographic date comparisons with a normalized date helper to avoid subtle bugs.
- Extract the mapper (snake_case↔camelCase) into a small `services/mappers/employment.ts` for reuse and unit tests.
- Consider emitting an optional `employment:changed` event (instead of relying on navigation state) if you want other parts of the app to react to changes without navigating.
- Add aria-live announcements for add/edit/delete so screen-reader users get explicit updates.

Where to look next

- `frontend/src/pages/employment/EmploymentHistoryList.tsx`
- `frontend/src/pages/employment/AddEmployment.tsx`
- `frontend/src/pages/employment/EditEmploymentModal.tsx`
- `frontend/src/pages/employment/employment.css`
- `frontend/src/services/employment.ts` and `frontend/src/services/crud.ts`

If you'd like, I can:

- Add unit tests for `AddEmployment` validation (one happy path, one failure) and wire them into the frontend test runner.
- Implement a `employment` mapper and add mapper tests.

Document created and placed at: `docs/pages/Employment.md`
