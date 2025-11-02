# EducationOverview.tsx — component schema

Purpose

- Human-readable schema/reference for the `frontend/src/pages/education/EducationOverview.tsx` file.
- Helps future contributors understand the component's responsibilities, data flow, state, side-effects, and integration points.

Location

- Source: `frontend/src/pages/education/EducationOverview.tsx`
- CSS: `frontend/src/pages/education/EducationOverview.css`

Overview / Responsibilities

- Render the user's education timeline as an alternating vertical timeline.
- Provide actions for adding (navigates to `/education/manage`), editing and deleting education entries.
- Load education data from the shared `educationService` and refresh when changes occur.
- Surface validation and backend errors through the centralized `useErrorHandler` hook.
- Use Material-UI components for layout and dialogs.

Top-level imports and dependencies

- React hooks: useState, useEffect, useCallback
- useAuth (AuthContext) — provides `user` and `loading`
- useErrorHandler — centralized error/notification handling
- educationService — shared service with methods like `listEducation`, `updateEducation`, `deleteEducation`
- Types: `EducationEntry` (from `frontend/src/types/education`)
- MUI components: Box, Typography, Button, Paper, Dialog, TextField, Switch, Stack, Chip, Avatar
- MUI Lab: Timeline components
- Router: useNavigate (navigates to `/education/manage` when adding)
- Local CSS: `EducationOverview.css`

State (local)

- education: EducationEntry[] — list displayed in the timeline
- isLoading: boolean — indicates loading state for network requests
- error: string | null — temporary string that gets forwarded to `useErrorHandler`
- editingEntry: EducationEntry | null — controls the Edit dialog; when set, `EditEducationDialog` is rendered
- confirmDeleteId: string | null — when set, the Delete confirmation dialog is rendered

Helpers & Core functions

- dateToMs(s?: string) => number
  - Converts a partial date like `YYYY-MM` to a ms timestamp (returns 0 for invalid/missing input).
  - Used to sort the entries by start date.

- loadEducation() (useCallback)
  - Calls `educationService.listEducation(user.id)` to fetch rows for the current user.
  - Sets `isLoading`, sorts results (most recent start first), and populates `education` state.
  - On failures, sets `error` which is then forwarded to `useErrorHandler`.

- handleSaveEntry(updatedEntry: EducationEntry)
  - Validation: performs client-side checks (GPA range 0–4, date format YYYY-MM, start <= end).
  - Calls `educationService.updateEducation(user.id, id, formData)`.
  - Checks the service response for `error` and only calls `showSuccess` when no error occurred.
  - Reloads the list on success.

- handleDeleteEntry(id: string)
  - Calls `educationService.deleteEducation(user.id, id)` and reloads the list on success.
  - Uses `showSuccess` / `handleError` for feedback.

Side-effects

- useEffect(initial load)
  - When auth finishes and `user.id` is present, calls `loadEducation()`.

- useEffect(event listener)
  - Subscribes to `window` event `education:changed` and triggers reload while component is mounted.
  - Unsubscribes on cleanup.

- useEffect(error)
  - Forwards local `error` strings to `handleError` and then clears the local `error`.

UI structure (JSX)

- Outer Box with class `education-overview-container` (applies overall padding/background via CSS)
- Header section (`education-header-section`)
  - Left: Title + subtitle
  - Right: Add Education button (variant `primary`, navigates to `/education/manage`)

- Content section (`education-content-section`)
  - Paper wrapper `education-timeline-container` (centered, constrained width)
  - Timeline (MUI Lab) with position="alternate"
    - Empty state: single timeline item telling the user to add an entry
    - For each education entry:
      - TimelineOppositeContent: shows `startYear - endYear` and an optional "Current" label
      - TimelineDot + TimelineConnector for visual flow
      - TimelineContent: A white card (`education-card`) with:
        - Honors chip (if present)
        - Degree (title), Institution, Field of study
        - GPA (if present and not private)
        - Action buttons: Edit (opens dialog) and Delete (opens confirmation)

- ErrorSnackbar component tied to `useErrorHandler` notification state

- EditEducationDialog (rendered when `editingEntry` set)
  - Local form state `editedEntry` (initialized from `entry` prop)
  - Fields: Degree, Institution, Field of Study, Start Date (YYYY-MM), Currently Enrolled (Switch), End Date, GPA (number), Hide GPA (Switch), Achievements/Honors
  - Buttons: Cancel, Delete, Save Changes
  - On Save: calls `onSave(editedEntry)` which invokes `handleSaveEntry` in parent

- DeleteConfirmationDialog (rendered when `confirmDeleteId` set)
  - Asks user to confirm; calls `onConfirm` to run deletion

Types and contracts

- EducationEntry (refer to `frontend/src/types/education.ts` for canonical shape)
  - Common fields used by this component:
    - id: string
    - userId / user_id: string (owned by current user)
    - degree: string
    - institution: string
    - fieldOfStudy: string
    - startDate: string (YYYY-MM or empty)
    - endDate: string | undefined (YYYY-MM or undefined for ongoing)
    - gpa: number | undefined
    - gpaPrivate: boolean | undefined
    - honors: string | undefined
    - active: boolean | undefined

Integration notes / conventions

- Use the shared `educationService` (not direct supabase client). This centralizes DB access and respects RLS.
- Use `useErrorHandler` and `ErrorSnackbar` to show errors/success messages consistently across the app.
- Normalize dates on the frontend as `YYYY-MM` strings for compact storage/display; use `dateToMs` for comparisons.
- Event-driven reloads: code triggers refreshes via `window.dispatchEvent(new Event('education:changed'))` elsewhere (other pages/components) — this file listens to that event and reloads.
- Dialogs are conditionally rendered; consider switching to controlled `open` props if you prefer a single declarative pattern.

Testing guidance

- Unit tests:
  - Mock `educationService` to return lists and assert `loadEducation()` populates `education` and sorts correctly.
  - Test `handleSaveEntry` validation logic with invalid GPAs, bad dates, and date order.
  - Verify that error messages go through `handleError` rather than `showSuccess` when saving fails.

- E2E / manual tests:
  - Edit an entry with invalid values (GPA 9, startDate after endDate) — confirm the UI shows validation error and keeps the dialog open.
  - Delete an entry and confirm removal and notification.
  - Add an entry (via `/education/manage`) and confirm it appears after `education:changed` is triggered.

Suggested follow-ups

- Convert dialog field errors to per-field validation (show helperText + error state on TextField) for better UX.
- Tighten TypeScript types for `educationService` responses so callers don't need `any` casts when checking `res.error`.
- Move inline empty-state styles into a CSS class for consistency.

README / quick pointer

- File: `frontend/src/pages/education/EducationOverview.tsx`
- CSS: `frontend/src/pages/education/EducationOverview.css`
- Service: `frontend/src/services/education` (use this, not direct DB queries)
- Types: `frontend/src/types/education.ts`

---

If you'd like, I can also:
- Extract the exact `EducationEntry` type from `frontend/src/types/education.ts` and paste it here, or
- Add a small Mermaid diagram showing the component subtrees and data flow.

Which would you like next? (type: "fields" for exact type, "diagram" for Mermaid, or "both")