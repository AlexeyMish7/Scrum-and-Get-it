# UI Blueprint — `ui/blueprint`

This README describes the scaffold added to the `ui/blueprint` branch to support Sprint 2 UI work. The goal: provide ready-to-use layout components and per-workspace sidebars so the team can implement feature pages quickly without wiring base layout concerns.

What's included (scaffolded)

- `frontend/src/app/shared/layouts/AppShell.tsx` — AppShell composes the global header, a sidebar slot, the main content container, and the system layer.
- `frontend/src/app/shared/layouts/GlobalTopBar.tsx` — small wrapper that reuses existing `TopNav` and is the anchor point for quick actions.
- `frontend/src/app/shared/layouts/SystemLayer.tsx` — renders centralized `ErrorSnackbar` via the `useErrorHandler` hook so notifications are globally available.
- `frontend/src/app/shared/components/sidebars/AISidebar.tsx` — placeholder AI workspace sidebar with navigation links.
- `frontend/src/app/shared/components/sidebars/JobsSidebar.tsx` — placeholder Jobs workspace sidebar with navigation links.
- `frontend/src/app/shared/components/common/SidebarSection.tsx` — small helper for composing grouped sidebar sections.
- `frontend/src/app/shared/components/common/NavItem.tsx` — small shared nav item used by sidebars.
- `frontend/src/app/workspaces/ai/AiLayout.tsx` — updated to use `AppShell` and `AISidebar`.
- `frontend/src/app/workspaces/jobs/JobsLayout.tsx` — updated to use `AppShell` and `JobsSidebar`.
- `docs/design/implementation-audit.md` — audit of files found and gaps to address.

Developer notes & next steps

1. The scaffold intentionally keeps visuals minimal and non-destructive. `TopNav` is reused inside `GlobalTopBar` to preserve existing navigation until quick action migration is completed.
2. Sidebars are placeholder content (anchor links). Swap anchor-based navigation for `react-router-dom` `Link` components when implementing route-aware highlighting.
3. `SystemLayer` now renders `ErrorSnackbar` using `useErrorHandler()` to centralize snackbar state. Existing pages that also use `useErrorHandler` will continue to work.
4. Next work (recommended):
   - Add AI pages placeholders under `frontend/src/app/workspaces/ai/pages/` with region anchors (`[A]`, `[B]`, …) so designers/devs can populate with feature UCs.
   - Add Jobs pages placeholders (SavedSearches, Documents, Analytics, Automations) and make `PipelinePage`/`NewJobPage` accept `RegionAnchor` components.
   - Remove/hide the old tools dropdown in `TopNav` and move quick actions into `GlobalTopBar` (or a new QuickActions component).
5. Run typecheck and dev server to validate no compile errors:

```powershell
cd frontend; npm run typecheck; npm run dev
```

6. Resume Studio polish tracking: the unified generation card now uses a responsive grid layout so job/tone/focus controls stay readable on phones, and the apply panel surfaces per-segment statuses (including skipped) to reinforce what the AI produced.

Resume Studio polish backlog (todo)

- [ ] Verify the sticky Apply pane spacing on tablet viewport widths (top offset, max-height, scrollbars) so buttons remain visible without awkward over-scroll.
- [ ] Wire the new `sgt:resumeApplication` telemetry into the analytics/logging layer and confirm events fire for skills, summary, merge, and copy actions.
- [ ] Capture inline help or tooltip copy that references the segment status summary and the meaning of “skipped.”
- [ ] Add lightweight tests (component/unit) covering the skip-state rendering in `GenerationCard` and the event listeners in `GenerateResume`.

If you want, I can now scaffold the AI pages placeholders and Jobs pages placeholders, wire new routes in `frontend/src/router.tsx` (guarded by `ProtectedRoute`), and add a small test per new component. Confirm and I'll continue with that next batch.
