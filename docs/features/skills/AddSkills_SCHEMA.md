# AddSkills Component — Schema

Path: `frontend/src/pages/skills/AddSkills.tsx`

Short purpose
- UI for adding, editing and removing user skills.
- Provides an Autocomplete with a static suggestions list, category and proficiency selectors, and an editable list of skill chips.
- Uses centralized services and error handling; keeps styling in `AddSkills.css` and reuses the global glossy theme.

Export
- Default export: React functional component `AddSkills`.

Hooks & services used
- useAuth() — gets current user and loading state.
- useErrorHandler() — centralized error/success snackbar (handleError, showSuccess, notification, closeNotification).
- skillsService — CRUD operations against the `skills` backend (listSkills, createSkill, updateSkill, deleteSkill).
- useEffect — loads user skills when the authenticated user becomes available.

Main state variables
- userSkills: SkillItem[] — local list of skills shown on the page.
- selectedSkill: string — currently selected skill name (value saved to DB).
- inputValue: string — raw text shown in the Autocomplete input (keeps typing separate from selection).
- selectedCategory: string — category dropdown value.
- selectedLevel: string — proficiency dropdown value.
- selectedSkillIndex: number | null — index of the skill being edited (opens edit dialog).
- tempEditLevel: string — temporary value inside edit dialog.
- isAdding / isUpdating: boolean — flags to prevent double submits and show busy state.
- confirmDeleteIndex: number | null — used to open the confirm-delete dialog.

Events & side effects
- On successful add/update/delete (server or local), the component dispatches a `CustomEvent("skills:changed")` so other parts of the app can refresh if needed.
- The component listens for user changes via `useEffect` to load skills from the server when `user` becomes available.

UI pieces
- Autocomplete (freeSolo) with `suggestedSkillList` for quick selection.
- Category select (skillCategoryOptions).
- Proficiency select (skillLevelOptions).
- Add button — uses theme variant `primary`.
- Skill chips — clickable to open the Edit dialog; keyboard accessible (Enter/Space) via onKeyDown handler.
- Edit dialog — allows changing proficiency and removing the skill (uses tertiary/primary/destructive theme variants).
- Confirm-delete dialog — shown when Remove is triggered; calls performDelete after confirmation.
- ErrorSnackbar — centralized notification component used for errors/success.

Accessibility
- Buttons and chips include `aria-label` and `role` where appropriate.
- Keyboard handlers are provided for chips so keyboard users can open the edit dialog.
- Dialogs use MUI's accessible `Dialog` and `DialogTitle` components.

Styling
- Component imports `./AddSkills.css` which contains the page-specific layout and spacing.
- Reuses global `.glossy-card`, `.glossy-title`, and `.glossy-btn` helpers from the theme.
- Main CSS classes used in the component:
  - `skills-page-container`, `skills-card`, `title-block`, `header-title`, `header-note`,
  - `form-row`, `input-wide`, `input-field`, `add-btn`, `chips-row`, `skill-chip`, `back-btn`, `save-btn`.

Edge cases & validation
- Client-side validation: ensures skill, category, and level are provided before adding.
- Duplicate prevention: checks `userSkills` for case-insensitive name equality before saving.
- Network errors: uses `useErrorHandler` to surface errors. If `skillsService` returns an error, the operation is aborted and the user is notified.

Testing suggestions
- Unit test the normalization and duplicate-checking logic (empty/whitespace-only names, case-insensitive matches).
- E2E test: add skill → verify it appears as a chip; edit skill level → verify change saved; delete skill → confirm chip removed.
- Accessibility checks: tab navigation to chips, Enter/Space triggers edit dialog, dialogs are announced.

Notes / Next improvements
- Normalize/trim the input before duplicate checking / saving (recommended to avoid duplicate entries like `React` vs ` react `).
- Consider fetching suggestions from the server for dynamic suggestions based on usage.
- If `useErrorHandler()` returns non-stable callbacks, consider stabilizing them (useRef) to avoid re-running the load `useEffect`.

Generated: 2025-11-02
