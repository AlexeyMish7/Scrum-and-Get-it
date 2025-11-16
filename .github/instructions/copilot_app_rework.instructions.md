# Refactor & Cleanup Copilot Instructions

> File: `.instructions.md`
> Purpose: Guide Copilot through a structured, readable refactor of this app.

---

## 1. Overall goals

When helping in this repo, prioritize:

- Understanding how the app **currently** works before changing it.
- Designing a **clear refactor plan** instead of random edits.
- Improving:
  - File/folder structure and naming
  - UI/UX flow and navigation
  - Backend–frontend connections and data flow
  - Shared logic (error handling, auth, API access)
  - Test coverage and basic performance

You’re allowed to **rename and move things**. You are **not** allowed to make the code unreadable.

---

## 2. Style and constraints

When generating or editing code:

- Prefer **simple, idiomatic, easy-to-read** code.
- Avoid:
  - Overly advanced TypeScript types (complex generics, conditional types, etc., unless truly needed).
  - Obscure patterns or micro-optimizations that make the code hard to follow.
- It is explicitly OK to:
  - Rename files, components, hooks, and variables for clarity.
  - Move files into a better folder structure.
- Keep changes **small and incremental**, as if preparing a sequence of pull requests:
  - One logical concern per change (e.g., “move API calls into services”, “unify layout”, etc.).

When you introduce a structural or UX change, explain briefly in comments or commit-style summaries **what changed and why**.

---

## 3. Refactor workflow you should follow

Whenever the user asks you to work on this app’s structure, flow, or cleanup, follow this pattern:

### 3.1 Phase 1: Discovery (no edits)

Before editing code, **analyze the repo**:

1. **Project structure**

   - Identify top-level folders (e.g. `src/pages`, `src/components`, `src/features`, `src/services`, `api`, `db`, etc.).
   - Find the router/route configuration to see how navigation is wired.
   - Locate shared layout components (navbars, shells, layout wrappers) and shared UI components.

2. **Data and API layer**

   - Find where API/DB calls are made.
   - Detect whether there is a service layer or if components call APIs directly.
   - Identify types/interfaces/models used for core entities.
   - Identify how auth/authorization is handled (hooks, helpers, context, etc.).

3. **Feature areas & flows**

   - List the main features (e.g. profile, jobs, resumes, cover letters, dashboard, analytics, etc.) based on routes and components.
   - For each feature, map:
     - Main pages/components
     - Services/API calls they use
     - Core types/interfaces involved

4. **UI/UX and navigation**

   - Describe the current navigation:
     - Where the user starts
     - How they move between major areas
     - Any dead-ends or confusing jumps
   - Note duplicated or inconsistent UI patterns (buttons, cards, forms, typography).

5. **Error handling, performance, tests**
   - Observe how errors are handled (alerts, toasts, error boundaries, bare `console.error`, etc.).
   - Spot obvious performance anti-patterns (repeated fetches, heavy rerenders, no debouncing).
   - Identify the existing test setup and which important features have no tests.

**Output for this phase:**
Create or update `docs/refactor-plan.md` with:

- “Current structure” section (folders, key files, routing).
- “Current UI/UX flow” section (navigation, main user journeys).
- “Major issues” section grouped by:
  - File structure
  - UI/UX and navigation
  - Data/API layer
  - Error handling/performance
  - Testing

Do **not** modify application code in this phase.

---

### 3.2 Phase 2: Refactor plan (still no edits)

Extend `docs/refactor-plan.md` with a concrete plan for the refactor.

The plan should define:

1. **Target file/folder structure**

   - Propose a clearer structure, e.g.:
     - Feature-based: `src/features/jobs`, `src/features/profile`, etc.
     - Or layer-based: `src/pages`, `src/components`, `src/services`, `src/hooks`, `src/types`, etc.
   - For each major feature, specify:
     - Where its pages/components should live.
     - Where its service/API code should live.
     - Where its shared types/interfaces should live.

2. **Backend–frontend data flow**

   - Plan how to centralize data-access logic:
     - Introduce or refine service modules for core domains (jobs, profile, resumes, etc.).
     - Components should call services instead of raw APIs where possible.
   - Ensure data types are consistent from API → service → UI.

3. **UI/UX flow and navigation**

   - Propose an improved navigation model:
     - Single shared layout (e.g. top nav + optional sidebar + content area).
     - Clear paths between related screens (e.g. dashboard → job → resume/cover letter → back).
   - Identify and list specific UX fixes:
     - Normalized button styles, cards, form patterns, dialogs, loading states, and empty states.

4. **Shared logic & components**

   - Plan to centralize:
     - Error handling (shared hook + shared notification/toast/snackbar).
     - Auth/authorization checks.
     - Common hooks (fetching, mutations, forms).
     - Common UI components (buttons, cards, modals, spinners, skeletons).

5. **Testing and performance**

   - Choose critical flows that require tests first (e.g. core CRUD, main user flows).
   - Identify simple performance wins:
     - Debounce search inputs.
     - Avoid repeated fetches on every render.
     - Memoize heavy lists where appropriate.

6. **Order of execution**
   - Order the phases from low-risk/high-value to higher-risk:
     - Example: introduce service modules → shared UI components → file reorg → navigation/UX changes.

The plan should be explicit enough that each phase can be implemented in a small set of changes.

Do **not** change application code yet.

---

### 3.3 Phase 3+: Implementation pattern

Once a plan exists and the user approves it, implement it incrementally.

For each refactor step or phase:

1. **Announce scope**

   - List which files/folders will be touched.
   - State what you are changing (e.g. “move job-related API calls into a `jobsService`”, “create shared layout and use it across pages”).

2. **Apply changes**

   - Reorganize files according to the plan (move/rename folders and files).
   - Update all imports and references consistently.
   - Introduce or update services, hooks, and shared components.
   - Adjust navigation and UI flow where planned.

3. **Maintain readability**

   - Keep functions, components, and types understandable.
   - Avoid introducing complicated abstractions unless clearly justified by repeated patterns.

4. **Tests**

   - If you significantly touch a module or feature:
     - Add tests if none exist.
     - Or update existing tests to match the new behavior/names.
   - Ensure the test runner for this repo (e.g. `npm test`, `pnpm test`, or equivalent) can pass after changes.

5. **Verification notes**
   - For each change, describe how to manually verify it:
     - Which route/page to open.
     - What actions to perform.
     - What the expected behavior is.

Always favor many small, focused improvements over a single massive rewrite.

---

## 4. File structure guidelines

When reorganizing files:

- Group related code together:
  - Feature modules should contain their pages, feature-specific components, hooks, and services where appropriate.
- Separate **shared** from **feature-specific**:
  - Shared UI components go in a shared/components folder.
  - Shared hooks (e.g. `useFetch`, `useErrorHandler`) go in a shared/hooks folder.
  - Shared types/interfaces live in a shared/types folder or similarly clear location.
- Keep names descriptive:
  - Prefer `JobDetailsPage` over `Page2`.
  - Prefer `jobsService.ts` over `api2.ts`.

---

## 5. UI/UX guidelines

When modifying UI/UX:

- Use the **existing theme system** (if present) instead of hard-coded styles.
- Unify:
  - Layout structure (consistent header/nav/content areas).
  - Button styles, form fields, card components, dialogs, and loading states.
- Improve flow:
  - Make related screens easy to navigate between (e.g. from a list to a details page and back).
  - Avoid dead-ends; provide clear navigation anchors (breadcrumbs, back buttons, tabs, etc.).
- Always consider loading and error states:
  - Show explicit loading indicators while fetching.
  - Use a shared error display pattern (toast/snackbar/message component).

---

## 6. Data/API and shared logic guidelines

When touching data and logic:

- Centralize API calls in **service modules** instead of scattering them in components.
- Use clear, typed interfaces/models at the boundaries between:
  - API responses
  - Service functions
  - UI components
- Avoid duplicating:
  - Error handling behavior
  - Auth checks
  - Fetching logic for the same resource

If you see repeated patterns, propose and create a shared abstraction only after you can name the pattern clearly.

---

## 7. Tests and performance

- Prioritize tests for:
  - Core user journeys
  - Core CRUD operations
  - Critical transformations (mappers, helpers)
- Prefer small, focused tests that are easy to understand.
- For performance:
  - Avoid unnecessary re-renders and repeated network calls.
  - Use memoization and debouncing where it improves user experience and code remains understandable.

---

By following these instructions, you should help turn this app from “messy and fragile” into something structured, consistent, and maintainable, without sacrificing readability.
