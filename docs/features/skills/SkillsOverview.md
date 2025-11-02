# SkillsOverview — Feature Schema

Short description

- Purpose: Show a user's skills grouped by category, allow reordering within a category, and persist ordering to the backend. Prevents moving skills across categories.
- Location: `frontend/src/pages/skills/SkillsOverview.tsx`

Contract (what this component expects and produces)

- Inputs:
  - Authenticated user (via `useAuth()` hook)
  - Backend skills rows from `services/skills` (rows may contain name, category, level, and optional meta.position)
- Outputs / side-effects:
  - Renders columns of skills grouped by category
  - Emits `skills:changed` CustomEvent on successful save
  - Shows snackbars via centralized `useErrorHandler()` for errors and success
  - Calls `skillsService.batchUpdateSkills(user.id, updates)` to persist order

High-level behavior

- Loading: shows a spinner when skills are being loaded.
- Display: categories are shown as columns. Empty categories are rendered so users can drop items (but cross-category drops are disallowed by policy).
- Reordering: drag & drop is enabled; only in-category moves are accepted.
- Persistence: on a successful reorder, the component sends an array of small update objects (id + meta.position and optionally skill_category) to `batchUpdateSkills`.
- Rollback: a snapshot of the list is taken on drag-start. If saving fails or an invalid cross-category drop occurs, the UI is restored from the snapshot.

Non-technical notes / UX rules

- Cross-category moves: not allowed. If attempted, the item snaps back and an error snackbar explains the policy.
- Success feedback: after a successful save a short success snackbar appears.
- Ordering survives refresh by storing a `position` value per skill.

Key places to look when changing behavior

- Drag handlers:
  - `handleDragStart` — takes the snapshot used for rollback.
  - `handleDragUpdate` — updates the visual preview while dragging.
  - `handleDragEnd` — validates the drop, applies final UI changes, builds the `updatesPayload`, and persists changes.
- Data loading:
  - The `useEffect` at the bottom of the file loads skills via `skillsService.listSkills(user.id)` and maps them into simple `Category[]` structures.
- Notifications:
  - The file uses `useErrorHandler()` and renders `ErrorSnackbar` to surface errors and success messages.

Types and small glossary

- Category: { id, name, skills: Skill[] }
- Skill: { id, name, level: number, position?: number }
- `meta.position`: the small per-row metadata property used to preserve ordering across refreshes.

Quick dev checklist

- To change the policy for cross-category moves: edit `handleDragEnd` and `handleDragUpdate`.
- To switch to a backend-driven ordering field (recommended for production), add an integer `position` column in the DB and update `services/skills.batchUpdateSkills` to write it directly.
- To debug saves: open browser devtools and look for the `console.debug("skills:update-payload", ...)` and the network request triggered by `batchUpdateSkills`.

Notes

- This file aims to be friendly and conservative: optimistic updates for a snappy UI, with quick rollback on error to avoid surprising users.
- For any larger change that affects data shape, also update `frontend/src/services/skills.ts` and the central types file `frontend/src/types/skill.ts`.

```text
Path: frontend/src/pages/skills/SkillsOverview.tsx
Related: frontend/src/services/skills.ts
Related types: frontend/src/types/skill.ts
```
