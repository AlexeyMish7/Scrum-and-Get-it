## Skills — Overview

This document explains how the Skills feature is implemented in the frontend and backend, how styling follows the project's design system, validation rules, events and hooks used across the app, and how to verify behavior locally and in CI.

### Purpose

- Allow users to add, edit, reorder and remove skills.
- Group skills into categories (Technical, Soft, Languages, etc.).
- Persist skills for authenticated users and provide a demo/unauthenticated mode locally.

### Files of interest

- Frontend UI

  - `frontend/src/pages/skills/SkillsOverview.tsx` — main overview UI with drag-and-drop reorder, search, export and optimistic updates.
  - `frontend/src/pages/skills/AddSkills.tsx` — add/edit/remove skills page with autocomplete suggestions, confirmation dialogs and inline editing.
  - `frontend/src/pages/skills/SkillsOverview.css` — layout and responsive styles for the overview.
  - `frontend/src/pages/skills/AddSkills.css` — styles for the add/edit form and chips UI.

- Shared code
  - `frontend/src/services/skills.ts` — CRUD functions used by the pages (list/create/update/delete / batchUpdate). (If this file is named differently in your branch, use the `services` file containing `skillsService`.)
  - `frontend/src/constants/skills.ts` — shared labels and category lists used by both pages.
  - `frontend/src/hooks/useErrorHandler.ts` and `frontend/src/components/common/ErrorSnackbar.tsx` — centralized error/success UI patterns used throughout.

### Data model (frontend view)

- SkillItem (UI shape)

  - `id: string` — row id or temporary local id for unauthenticated mode.
  - `name: string` — display name for the skill.
  - `category: string` — category slug/name.
  - `level: number | string` — normalized to a 1..4 numeric scale in many places but sometimes presented as label strings in forms.
  - `meta?: Record<string, unknown>` — optional metadata (e.g., position used for ordering).

- DB row (typical)
  - `id` (uuid)
  - `user_id` (uuid) — foreign key to `auth.users.id`
  - `skill_name` (text)
  - `skill_category` (text / enum)
  - `proficiency_level` (text enum: beginner|intermediate|advanced|expert)
  - `meta` (jsonb) — optional, used to store `position` or other UI ordering hints

> Note: RLS requires queries to be scoped to `user_id = auth.uid()`; all frontend writes must be performed using the user id from `useAuth()` or the centralized `crud.withUser(user.id)` helpers.

### UX & Styling

- Follow theme rules (glass morphism, gradients) from `frontend/src/theme/theme.tsx`.
- Avoid inline `sx` styling — use the shared CSS files above and theme tokens.
- Buttons: use semantic variants (e.g., `variant="primary"`, `variant="destructive"`) where available. Keep destructive actions (delete) visually distinct.
- Accessibility:
  - All interactive lists use proper `role=list` / `role=listitem` attributes.
  - Inputs have labels and `aria-label` where appropriate (`Search skills` on overview).
  - Error and success messages use `ErrorSnackbar` with `aria-live` to be announced by screen readers.

### Drag & Drop behavior (ordering)

- `SkillsOverview.tsx` implements drag-and-drop across category columns using the app's drag library (see file). Key rules:
  - Reordering inside the same category is allowed.
  - Moving across categories is forbidden — the UI snaps back and a short error is shown.
  - At drag start the component snapshots the current layout for safe rollback.
  - Updates are applied optimistically and persisted via `skillsService.batchUpdateSkills(userId, updatesPayload)`.
  - On batch save failure the UI rolls back to the snapshot and surfaces an error.

### Backend/service expectations

- Use the centralized `skillsService` (or `crud` wrappers) to perform DB operations. Examples of expected service functions:
  - `listSkills(userId)` — returns rows for the user.
  - `createSkill(userId, payload)` — inserts a skill row scoping `user_id`.
  - `updateSkill(userId, skillId, updates)` — updates a single skill.
  - `deleteSkill(userId, skillId)` — removes a skill row.
  - `batchUpdateSkills(userId, updatesArray)` — compactly applies multiple updates (used for reordering); expected to return `{ data, error }` shape like other CRUD helpers.

Always scope queries to the current user (either via `withUser(user.id)` or `eq('user_id', user.id)`) so RLS policies allow access.

### Validation rules

- Add / create:
  - `skill_name` required, trimmed.
  - `skill_category` required and must be one of the canonical categories from `constants/skills.ts`.
  - `proficiency_level` required (string), and normalized to one of `beginner|intermediate|advanced|expert` on the server.
- Update / batch update:
  - `meta.position` when used must be an integer >= 0.
  - `skill_category` must not be changed by batch reorder (reorder should only change `meta.position`; if implementing cross-category moves, add server-side validation).

### Events & cross-page coordination

- Pages dispatch a simple custom DOM event on changes so other pages can refresh when needed:
  - `window.dispatchEvent(new CustomEvent('skills:changed'))` — fired after create/update/delete or reordering success.
  - Other components/pages can listen for this event and re-fetch data.

### Error handling patterns

- Use `useErrorHandler()` and `ErrorSnackbar` rather than `alert()` or raw `console.error()`.
- For optimistic updates, always keep a `prev` snapshot and revert on failure.

### Tests & verification

- Manual verification checklist:

  1. Logged-in flow:

     - Go to `/skills` (or the route used by your app) and confirm your stored skills load.
     - Use search to filter skills; ensure results are correct and keyboard accessible.
     - Drag to reorder inside a category — observe optimistic UI update and network call. Reload page and verify the order persisted.
     - Attempt to drag a skill into another category — UI must snap back and show an error message.
     - Add a skill via `AddSkills` page and confirm it appears in the overview and persists after reload.
     - Edit a skill's proficiency and confirm the change persists.
     - Delete a skill and confirm it is removed for the current user and other pages refresh when the `skills:changed` event fires.

  2. Unauthenticated/demo mode:
     - Start the app without signing in (if demo mode exists) and confirm adding skills uses local ids and does not call the server.
     - Confirm no console errors and that UI still behaves predictably.

- Unit tests to add (suggested):
  - `skillsMapper` test: ensure server row → UI SkillItem mapping handles missing `meta` or numeric/label level shapes.
  - Reorder logic: pure helper test that given source list and destination index computes the correct final ordering.
  - Validation: create payloads with invalid category/levels and assert the service rejects them (mock service or run integration tests against a test DB).

### Common pitfalls / notes for contributors

- Don't allow cross-category reorder without server support (RLS or business rules). The UI explicitly prevents it — keep that behavior consistent.
- Keep `skill` level normalization centralized (convert label → numeric or numeric → label in `constants/skills.ts` or service mapper).
- Keep `skillsService.batchUpdateSkills` compact: only send changed rows (id + changed fields) to reduce DB writes.

### How to add or change categories

1. Update `frontend/src/constants/skills.ts` with the new category name and label.
2. Update any server-side enum or validation (if you use an enum column) and add a DB migration under `db/migrations/`.
3. Update unit tests and any UI copy.

### How to run quick local checks

From the `frontend/` folder run the usual dev server and optionally typecheck/lint:

```powershell
cd frontend
npm run dev
npm run typecheck
npm run lint
```

Then open the app in a browser and exercise the Skills pages according to the checklist above.

---

If you'd like, I can also add the unit tests skeleton for the mapper and reorder helper next — say the word and I will create a test file and the minimal mocks.
