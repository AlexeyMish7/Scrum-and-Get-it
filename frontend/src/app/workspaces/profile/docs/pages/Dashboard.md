# Dashboard — Section Guide

This document explains the Dashboard section: what files and components make it up, the key logic and data flow, styling notes, and how frontend and backend interact. It's written for a developer seeing the project for the first time.

Files to inspect

- `frontend/src/pages/dashboard/Dashboard.tsx` — main page implementation (loaders, handlers, dashboard layout)
- `frontend/src/components/profile/*` — modular widgets used on the dashboard (SummaryCards, RecentActivityTimeline, CareerTimeline, ProfileCompletion, SkillsDistributionChart, ProfileStrengthTips)
- `frontend/src/services/crud.ts` — centralized DB helpers and `withUser` scoping
- `frontend/src/services/dbMappers.ts` — mappers that convert form values into DB payloads (`mapEmployment`, `mapSkill`, `mapEducation`, `mapProject`)
- `frontend/src/context/AuthContext.tsx` — provides `useAuth()` to get `user` and `loading` state and auth helpers
- `frontend/src/components/common/LoadingSpinner.tsx` — spinner used while data is loading

Overview

- Purpose: present a personalized profile overview that aggregates the user's documents, employment, skills, education, projects and shows visual summaries (cards, charts, timelines).
- The Dashboard is a composition of smaller, focused widgets. The page is responsible for loading the data and passing it to the child widgets, and exposing small helper functions the widgets can call to add items.
- The page emphasizes optimistic UI updates for fast feedback on adds/edits.

High-level data flow

1. On mount, Dashboard reads `user` from `useAuth()`.
2. If the user exists, it calls `crud.getUserProfile(user.id)` and `crud.withUser(user.id).listRows(...)` in parallel to fetch documents, employment, skills, education, and projects.
3. Responses are mapped to view-friendly models using `dbMappers` and small helpers (e.g., proficiency enums → numeric values for charts).
4. Local state (`activities`, `skills`, `careerEvents`, `counts`) is updated and passed into child components.
5. When child widgets add content, they call the handler props the Dashboard exported (e.g., `onAddEmployment`) which call backend via scoped CRUD helpers and update local state optimistically.

Key functions & handlers (what they do)

- `handleAddEmployment(formData)`

  - Validates `formData` using `mapEmployment`.
  - Calls `crud.withUser(user.id).insertRow('employment', payload, '*')`.
  - On success: builds a `CareerEventType` object and unshifts it into `careerEvents`, increments `employmentCount` in `counts`.

- `handleAddSkill(formData)`

  - Validates payload using `mapSkill`.
  - Inserts using `userCrud.insertRow('skills', payload)`.
  - On success: converts `proficiency_level` enum to numeric for charts and updates `skills` and `counts.skillsCount`.

- `handleAddEducation(formData)`

  - Uses `mapEducation`, inserts into `education`, increments `educationCount` and dispatches `window.dispatchEvent(new Event('education:changed'))` so other pages (EducationOverview) can refresh.

- `handleAddProject(formData)`

  - Uses `mapProject`, inserts into `projects`, increments `projectsCount` and dispatches `projects:changed` event.

- `handleExport()`
  - Gathers `counts`, `activities`, `skills`, `careerEvents` and creates a JSON blob for download.

Widgets & child components

- SummaryCards — small actionable summary board that passes add callbacks back to Dashboard (the source of truth for adds). Rendered near the top.
- ProfileCompletion & ProfileStrengthTips — visual tips and completion score driven by `counts` object.
- SkillsDistributionChart — visualizes `skills` numeric values.
- RecentActivityTimeline — renders `activities` (derived from documents list and mapped to date/description).
- CareerTimeline — renders `careerEvents` (from employment rows).

State design

- `displayName`, `displayEmail` — header values derived from `profiles` row or `auth.user` metadata.
- `activities` — array derived from `documents` rows via `docsToActivities` helper.
- `skills` — numeric chart-friendly mapping from `skills` rows.
- `careerEvents` — array mapped from `employment` rows.
- `counts` — small object { employmentCount, skillsCount, educationCount, projectsCount } used by SummaryCards and ProfileCompletion.

Styling & layout

- Page-level styling uses MUI's `sx` props and the site's theme tokens (via `useTheme()`): background color, header card, spacing.
- Dashboard uses a responsive flex layout (wrap) for widgets: most widgets are `flex: 1 1 300-400px` to stack nicely on small screens.
- Child components (SummaryCards, charts, timelines) should follow the project's theme tokens and external CSS files if present. Prefer theme helpers in `frontend/src/theme/theme.tsx` for colors, gradients and glass effects.

Migration & backend considerations

- Dashboard relies on canonical table names used in `crud.*` calls: `documents`, `employment`, `skills`, `education`, `projects`, and `profiles`.
- Ensure RLS policies allow the authenticated user to select/insert/delete rows where `user_id = auth.uid()`. Use `crud.withUser(user.id)` to inject `eq: { user_id }` automatically.

Events & cross-component communication

- The Dashboard listens for global events to refresh parts of the UI:
  - `skills:changed` → refresh skills list
  - `education:changed` → refresh education count
  - `projects:changed` → refresh projects count
- The Education / Skills / Projects pages dispatch these events after changes. This is a simple pub-sub pattern used across the app.

Error handling & UX

- Dashboard surfaces errors via console logging currently and avoids blocking the page; this keeps the dashboard resilient if some reads fail.
- For improvements, consider adding `useErrorHandler` to show non-intrusive snackbars for partial failures.

Testing & verification checklist

1. Sign in as a test user with records in all tables.
2. Visit `/dashboard` and verify:
   - Header shows correct name/email (from `profiles` or `auth.user` metadata).
   - Summary counts reflect DB rows.
   - Skills chart shows mapped numeric values.
   - RecentActivityTimeline lists uploaded documents.
3. Use a child widget (SummaryCards) to add employment, skill, education, and project. Verify counts update and events are emitted.
4. Trigger the exported JSON and verify the contents are correct and well-formed.

Development tips

- When adding a new user-scoped table, add RLS rule in DB and update Dashboard's loadAll listRows parallel call to include it if you want it in the overview counts.
- Prefer `dbMappers` for validation and payload mapping for inserts/updates — they centralize transforms and keep the page code concise.
- For large parallel fetches, the page currently runs them in Promise.all and maps results — consider adding a small retry/backoff if occasional read flaps are observed in CI.

Where to look next

- `frontend/src/pages/dashboard/Dashboard.tsx` (this file)
- `frontend/src/services/dbMappers.ts` (mappers used by the add handlers)
- `frontend/src/services/crud.ts` (`withUser` scoping and delete/list helpers)
- `frontend/src/components/profile/*` (child widgets used in the UI)

If you'd like, I can generate similar docs for Education/Skills/Employment/Projects/Profiles (I already started Certifications). Tell me which to prioritize next and I'll add them with consistent structure.
