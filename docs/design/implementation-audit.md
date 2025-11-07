# Implementation Audit — Blueprint kickoff

Generated: 2025-11-07

Purpose: record existing frontend files we can reuse for the `ui/blueprint` work and list gaps so scaffolding creates minimal, compatible components.

---

## Found (candidate reuse)

- `frontend/src/app/workspaces/ai/AiLayout.tsx`

  - Existing AI layout component; currently renders AI pages under the shared top nav. Use as starting point and refactor to import `AppShell` and the new `AISidebar`.

- `frontend/src/app/workspaces/jobs/JobsLayout.tsx`

  - Existing Jobs layout used by routes. Update to accept a sidebar prop and render `AppShell`.

- `frontend/src/app/workspaces/profile/ProfileLayout.tsx`

  - Useful to copy pattern for consistency (top nav + content + sidebar behavior).

- `frontend/src/router.tsx`

  - Routes already import `AiLayout`, `JobsLayout`, `ProtectedRoute`, `PipelinePage`, and `NewJobPage`. We'll wire new routes for AI pages and re-use the `JobsLayout` wrapper.

- `frontend/src/app/shared/components/common/ProtectedRoute.tsx`

  - Existing protected route wrapper. Continue to use for new AI and Jobs routes.

- `frontend/src/app/shared/components/common/ErrorSnackbar.tsx`

  - Feedback layer already used across profile pages. Keep as the global system toast/snackbar component.

- `frontend/src/app/workspaces/jobs/pages/PipelinePage/PipelinePage.tsx`

  - Pipeline page exists; update to render region anchors and accept a `sidebar` prop where useful.

- `frontend/src/app/workspaces/jobs/pages/NewJobPage/` (index + NewJobPage)

  - New Job page exists and is wired in `router.tsx` at `/jobs/new`.

- `frontend/src/app/shared/components/TopNav/TopNav.tsx`

  - Top navigation already includes quick links (New Job, Pipeline). We'll migrate quick actions into `GlobalTopBar` and remove/hide old tools dropdown.

- `frontend/src/app/shared/services/dbMappers.ts`
  - Contains pipeline defaults and mapping utilities helpful for job creation flows.

## Quick notes from grep

- `router.tsx` already defines `/jobs/pipeline` and `/jobs/new` routes using `JobsLayout`.
- `ProtectedRoute` wraps several routes; continue to use for auth gating.
- `ErrorSnackbar` is used in many profile pages — good global reuse for feedback.

---

## Gaps (to scaffold)

- AppShell + SystemLayer + GlobalTopBar

  - No single component that composes the global top bar, workspace sidebar slot, and system layer exists yet. Create `frontend/src/app/shared/layouts/AppShell.tsx`, `GlobalTopBar.tsx`, and `SystemLayer.tsx`.

- Workspace-specific Sidebars

  - Create `JobsSidebar`, `AISidebar`, and `ProfileSidebar` under `frontend/src/app/shared/components/sidebars/`.

- AI pages

  - `AiLayout.tsx` exists but individual AI pages (DashboardAI, JobMatching, CompanyResearch, GenerateResume, GenerateCoverLetter, TemplatesHub) are not present; scaffold placeholders under `frontend/src/app/workspaces/ai/pages/`.

- Jobs pages missing: SavedSearches, Documents, Analytics, Automations

  - Create placeholders for these under `frontend/src/app/workspaces/jobs/pages/` and reuse `NewJobPage` and `PipelinePage`.

- Shared small UI atoms/utilities

  - `SidebarSection.tsx`, `NavItem.tsx`, `RegionAnchor.tsx`, `QuickActionButton.tsx` — helpful for consistent UI and internal docs.

- Theme adjustments

  - Small MUI theme work to ensure sidebars and AppShell align with `aiTheme` and app-level theme.

- Tests and docs
  - Add basic render tests for new components and update blueprint README.

---

## Recommended immediate actions (this sprint's first commits)

1. Add `docs/design/implementation-audit.md` (this file) to repo (done).
2. Create `frontend/BLUEPRINT_README.md` describing region/component mapping and step-by-step integration notes.
3. Scaffold `AppShell`, `GlobalTopBar`, and `SystemLayer` components with minimal markup and exports.
4. Refactor `AiLayout` and `JobsLayout` to render `AppShell` (keep existing behavior while wiring placeholder sidebars).
5. Add placeholder AI pages and Jobs new pages (SavedSearches, Documents, Analytics, Automations).

---

If you want, I will now scaffold the first set of components: `AppShell`, `GlobalTopBar`, `SystemLayer`, and placeholder `AISidebar` and `JobsSidebar` under `frontend/src/app/shared/` and wire `AiLayout`/`JobsLayout` to use them with minimal visual styles. This will let the team see the new sidebars and remove the old tools dropdown.
