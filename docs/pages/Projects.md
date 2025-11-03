# Projects — Schema, Styling & App Logic

This document explains the Projects section end-to-end for a new contributor: canonical schema and data shape, frontend components and responsibilities, styling and theme guidance, backend interactions (including storage), events used for cross-component communication, validation rules, recommended tests, and a short verification checklist.

Files to inspect

- `frontend/src/pages/projects/ProjectPortfolio.tsx` — main grid/portfolio page (list, search, filters, dialogs, delete)
- `frontend/src/pages/projects/ProjectDetails.tsx` — detailed view for a single project (route: `/projects/:id`)
- `frontend/src/pages/projects/AddProjectForm.tsx` — add/edit form including image upload, client-side cropping, validation, and saving
- `frontend/src/pages/projects/Projects.css` — styling for projects pages (glossy theme, cards, responsive grid)
- `frontend/src/services/projects.ts` (or `projectsService`) — service wrapper used to call CRUD ops and resolve media URLs
- `frontend/src/services/crud.ts` — centralized DB helpers; use `crud.withUser(user.id)` to enforce RLS
- Shared helpers: `useAuth()`, `useErrorHandler()`, `dbMappers` for mapping, and Supabase client in `lib/supabaseClient.ts`

1. Canonical data shape (Project row)

Database column names are snake_case; frontend UI uses camelCase in mapped objects. The typical project row (fields used by the frontend) includes:

- id: string (UUID)
- user_id: string (UUID) — owner (auth.users.id)
- proj_name / projectName: string
- proj_description / description: string | null
- role: string | null
- start_date / startDate: string (ISO date, YYYY-MM-DD)
- end_date / endDate: string | null
- tech_and_skills / technologies: string[] | string (UI may store as CSV) — normalized to array in service
- project_url / projectUrl: string | null
- team_size / teamSize: number | null
- team_details / teamDetails: string | null
- industry_proj_type / industry: string | null
- proj_outcomes / outcomes: string | null
- status: string (enum: planned | ongoing | completed)
- media_path / mediaPath: string | null — storage path in Supabase Storage
- meta: jsonb | null — used for preview shape metadata (e.g., { previewShape: 'rounded'|'circle' })
- created_at, updated_at: timestamps

Notes:

- The UI expects `projectsService.mapRowToProject` (or similar) to convert DB rows into a UI-friendly Project shape and to resolve `mediaPath` into `mediaUrl` when needed.

2. Frontend responsibilities & flow

ProjectPortfolio.tsx — portfolio grid and controls

- Responsibilities:
  - Load all projects for the signed-in user by calling `projectsService.listProjects(user.id)`.
  - Support search and filters (technology, industry), and sort order (newest/oldest).
  - Render projects in a responsive CSS grid (`.projects-grid`) using `Projects.css`.
  - Provide Add Project button (navigates to `/projects/new` or same form route) and Print/Share actions.
  - Open Project Details in a Dialog (or navigate to /projects/:id) when a card is clicked.
  - Handle deletion with confirmation and call `projectsService.deleteProject(user.id, projectId)`; on success dispatch `projects:changed` and show notification.
  - Listen for global `projects:notification` events to display success/error snackbars (used by Add/Edit forms to broadcast results).

AddProjectForm.tsx — create/edit form with media handling

- Responsibilities:
  - Render controlled inputs for project fields and maintain local state for file uploads and cropping.
  - Validate required inputs (projectName & startDate), check date ranges, and validate file inputs (type image/\*, size <= 10MB).
  - Handle image cropping with an interactive crop UI, generate a cropped Blob and convert to a File for upload.
  - Upload files to Supabase Storage (bucket `projects`), use a unique path (`${user.id}/${Date.now()}_${file.name}`), and set `media_path` in the payload.
  - Insert or update project rows using `projectsService.insertProject(user.id, payload)` or `updateProject(...)`.
  - On success, create a `documents` row (using `crud.withUser(user.id).insertRow('documents', {...})`) to link uploaded media to the project (so storage files are discoverable and deletable alongside project deletions).
  - Dispatch `projects:notification` and `projects:changed` events and navigate to the portfolio view.

ProjectDetails.tsx — single project page

- Responsibilities:
  - Fetch a single project by id (`projectsService.getProject(user.id, id)`) and map it for display.
  - Resolve `mediaPath` to a usable URL via `projectsService.resolveMediaUrl` (download URL from storage).
  - Render project sections (role, technologies, dates, description, team, outcomes, industry, status, project link).

3. Styling & theme notes

- `Projects.css` implements the glossy theme used across the projects section:
  - `.projects-container` sets a light gradient background and subtle decorative SVG overlay.
  - `.projects-grid` uses CSS grid with `minmax(400px, 1fr)` to create responsive cards.
  - `.project-card` uses glass morphism: semi-opaque white background, `backdrop-filter: blur(10px)`, rounded corners, and a subtle hover lift.
  - Buttons: `.projects-btn-glossy`, `.projects-btn-secondary`, `.projects-btn-danger`, and `.projects-btn-large` exist for consistent styling across actions.
  - Dialogs use `.projects-dialog` with blurred backdrop and glassy dialog paper.

Styling best-practices in this repo

- Prefer MUI theme tokens for spacing/colors where appropriate. Use external CSS for component layout and tokens from `frontend/src/theme/theme.tsx` for gradients/shadows.
- Keep classes semantic and small. Avoid duplicating inline `sx` overrides — move them to the CSS file or theme tokens.

4. Backend interactions & security

- Data access pattern:

  - Use `projectsService` to encapsulate Supabase calls (select/insert/update/delete) and to map results to UI shapes.
  - For all user-scoped operations, call the helper `const userCrud = crud.withUser(user.id)` or make the service call with `user.id` so queries include `eq('user_id', user.id)` and satisfy RLS.

- Storage:

  - Uploads go to Supabase Storage bucket `projects`. The service should use `supabase.storage.from('projects').upload(filePath, file)` and then `getPublicUrl`/`resolveMediaUrl` as needed.
  - After upload, create a `documents` row linking the file to the project (kind: 'portfolio', file_path: mediaPath, project_id: <projectId>). This simplifies cleanup on project deletion.

- RLS & privileged ops:
  - Ensure `public.projects` has RLS policies allowing only the owner (`user_id = auth.uid()`) to read and modify their projects.
  - Do not use service role keys in client code.

5. Validation & edge cases (extracted from AddProjectForm.tsx)

- Required fields: `projectName`, `startDate`.
- Date validation: ensure `startDate` and `endDate` are valid dates and `startDate <= endDate` if `endDate` provided.
- File validation: only image types accepted; reject files > 10MB and show friendly messages. After upload failure, the code attempts to clean up the uploaded file if the DB insert fails.
- Tech list: `technologies` are parsed from a CSV into an array for DB storage.

6. Events & cross-component communication

- `projects:changed` — simple Event dispatched after add/edit/delete so the portfolio list reloads.
- `projects:notification` — CustomEvent with { detail: { message, severity } } used to show centralized snackbars in the portfolio component. Add/Edit forms dispatch this event so the portfolio can surface success messages consistently.

7. Tests to add (recommended)

- Unit tests:

  - `projectsService.mapRowToProject` — ensure DB → UI mapping (mediaPath -> mediaUrl resolution stubbed).
  - `AddProjectForm` validation logic: missing required fields, invalid dates, file validation (size/type).
  - File cropping helpers (getCroppedImg) — assert Blob and dataUrl are created.

- Integration / E2E tests:
  - Add project (with image): submit valid form → assert project appears in list and `documents` row exists.
  - Edit project: change values and image → assert updates and that old storage objects are cleaned if replaced.
  - Delete project: confirm deletion → assert project removed, storage file deleted, and `documents` row removed.

8. Local verification checklist

Commands (PowerShell):

```powershell
cd frontend; npm install
cd frontend; npm run dev
cd frontend; npm run typecheck
cd frontend; npm run lint
```

Manual checklist

1. Sign in as a test user.
2. Visit the portfolio page (component: `ProjectPortfolio`) — ensure projects load and the grid responds to screen size.
3. Use the search and filters — assert filtering and sorting behavior.
4. Add a new project with a valid image (<=10MB) and perform a crop. Submit and confirm the project appears in the list and a success notification is shown.
5. Open Project Details for a project — confirm `mediaUrl` loads and all sections render.
6. Edit a project (change fields and image) and confirm updates and notifications.
7. Delete a project — confirm deletion dialog, result, and that `documents` & storage file are removed.

9) Small improvements & follow-ups

- Centralize file-upload error handling and cleanup in `projectsService` so AddProjectForm is leaner and all storage cleanup happens in one place.
- Consider a dedicated `media` or `documents` service to centralize linking uploaded files to domain objects and handling deletions.
- Add optimistic UI updates for faster feedback on the portfolio page when adding small projects.
- Add unit tests for cropping and `getCroppedImg` to prevent regressions.

Where to look next

- `frontend/src/services/projects.ts` (or wherever project CRUD is implemented)
- `frontend/src/services/crud.ts` for `withUser` usage and standard DB patterns
- `db/migrations/2025-10-26_recreate_full_schema.sql` for canonical `projects` table definition

If you want, I can:

- Add unit tests for `AddProjectForm` validation (happy path + file validation failure).
- Extract upload & cleanup logic into `projectsService` and add tests.

Document created and placed at: `docs/pages/Projects.md`
