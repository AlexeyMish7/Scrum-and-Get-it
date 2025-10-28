# Sprint 1 Demo Plan

## Preparation Checklist
- Devices
  - Primary demo machine: ensure Node/npm + Chrome/Edge are installed and updated.
  - Backup machine: browser screenshots / video ready.
- Accounts / Emails
  - Prepare 2 demo accounts (emails + plain-text passwords) in a text file for quick copy/paste:
    - demo1@example.com / DemoPass1!
    - demo2@example.com / DemoPass2!
  - Prepare a Google account (if you will attempt OAuth during demo).
- Images
  - One profile photo (jpg/png, < 2 MB) for upload testing.
  - One project screenshot for portfolio upload demo.
- Seeded text (copy/paste)
  - First name / Last name: "Alex / Demo"
  - Headline: "Frontend Engineer — React"
  - Bio: 1–2 short paragraphs (keep ready in Notepad)
  - Employment entry: title, company, dates, description
  - Education entry: degree, institution, graduation date
  - Project entry: title, technologies, description
  - Skills list: "TypeScript, React, SQL, Communication, Leadership"
- Fallback internet / network
  - Have tethering/hotspot ready in case venue Wi‑Fi is unreliable.
  - If demoing OAuth, ensure internet connectivity is stable (OAuth requires network).
- Screen resolution / browser checks
  - Use Chrome or Edge for consistent devtools behavior.
  - Verify favicon and title are visible before starting.
  - Set browser width presets (Desktop: 1366+; Tablet: 768–1024; Mobile: 375).
- Demo data reset notes
  - Local dev: if running locally, have a clean seed or know how to remove demo rows from Supabase.
  - If using hosted Supabase: have a prepared “demo” user or admin SQL script to reset profile rows between runs.
- Known local-run caveats (important)
  - The frontend is Vite-based; start dev server with `cd frontend; npm run dev`.
  - There are known local typecheck/dev script mismatches in the repo used during development; test the dev server in advance on the device chosen for the demo.
  - Skills DELETE RLS: a migration exists (db/migrations/2025-10-28_add_skills_delete_policy.sql) but must be applied to your Supabase/Postgres instance if you expect server-side delete to work under RLS. If not applied, client refetch is in place and will show correct UI but DB may reject deletes depending on RLS.
- Files to keep open
  - A text file with the prepared account credentials and copy/paste content.
  - Browser devtools (Network tab) minimized and ready for Act 4.

---

## Act 1: Brand Identity & Responsive Design

### Demo Objective
Show the polished brand identity, consistent logo & favicon, design system (colors & typography), responsive layout, and a small set of UI components.

### Implemented Features (base on repo)
- Logo & favicon updated in `frontend/index.html`; navbar uses assets from `frontend/src/assets/logo/`.
- Consistent header/navbar across pages (`NavigationBar/*`).
- Themed color/typography via `frontend/src/theme/theme.tsx`.
- Branded loading spinner component: `frontend/src/components/LoadingSpinner.tsx`.
- Accessible form components exist across pages (labels, aria attributes in many pages).
- Responsive layouts in main pages: header/nav collapse to a mobile-friendly structure (hamburger behaviors in `Navbar.tsx`).

### Gaps vs Script (what’s missing/partial)
- Full formal color contrast audit may not be finished (colors are documented in `docs/COLORS.md`, but spot-check in demo recommended).
- Some components/styles may be work-in-progress on very small screens (test before demo).
- Some UI affordances (drag-and-drop reordering for skills) may be present as dependencies (`@hello-pangea/dnd`) but not fully wired for all screens.

### Workaround / Talking Point
- If any micro visual inconsistency appears, present it as "polish planned in Sprint 2" and emphasize the design system and tokens are already in place.
- For any missing reordering demo, show adding/removing skills and highlight that DnD is planned and the drag library is already added.

### Live Steps (click-by-click path we’ll demo)
1. Open app root (http://localhost:5173 or hosted URL).
2. Show browser tab title + favicon.
3. Click through top nav to: Home → Register → Login → Dashboard.
4. Show the navbar and logo on at least two pages (Home, Dashboard).
5. Resize the browser to Tablet and Mobile widths (use DevTools device toolbar) and demonstrate the nav collapsing and form layout adapting.
6. Click into a form (Register) and show input styles and button hover/disabled states.
7. Trigger loading spinner by navigating between pages (or simulate network throttle in DevTools to emphasize spinner).

### Risk Level (Low/Med/High)
- Low. Mostly static assets and CSS; main risk is screen-layout differences on the demo machine if not tested in advance.

### Assigned Presenter: [Name]

---

## Act 2: Authentication & Security

### Demo Objective
Demonstrate registration, login, OAuth (Google), logout and protected route behavior, and password recovery.

### Implemented Features
- Auth client: `frontend/src/supabaseClient.ts` (single Supabase client).
- Auth lifecycle: `frontend/src/context/AuthContext.tsx` exposes `user`, `session`, and `loading`.
- Register and Login pages: `frontend/src/pages/Register.tsx`, `Login.tsx` with validation and redirects to `/dashboard`.
- ProtectedRoute: `frontend/src/components/ProtectedRoute.tsx` guards authenticated routes and shows branded `LoadingSpinner` while auth initializes.
- OAuth UI: `AuthCallback.tsx` and social-signin UI exist (Google button present in pages).
- Forgot/Reset Password flows: `ForgetPassword.tsx` and `ResetPassword.tsx` present; password-reset success shows non-disclosing message.
- Logout: navigation exposes logout and redirects to homepage/login.

### Gaps vs Script
- OAuth: UI buttons exist; end-to-end Google OAuth requires proper provider configuration in Supabase and internet access. Confirmed OAuth code paths exist but test one full OAuth flow on the demo device beforehand.
- Password reset email delivery depends on Supabase/email config (may not work in a local dev environment). The UI shows success messages, but email delivery should be verified prior.
- Local dev server tooling: some dev machines may show `npm run dev` issues (verify on the device prior). The repository had earlier notes of dev server exit code on one machine.

### Workaround / Talking Point
- If OAuth fails during live demo, present a prepared screenshot or short video of a successful OAuth flow; emphasize the UI and the server-side wiring are implemented and ready to enable with provider keys.
- For password reset if email sending is not configured, demonstrate the "request" step and show the UI message (explain that email delivery is environment-specific and configured in Supabase project settings).

### Live Steps
1. From home page, click "Register".
2. Fill the registration form using prepared seed text and click Submit. Expect redirect to `/dashboard`.
3. Click Logout (verify session ended).
4. Attempt to access `/profile` or `/dashboard` directly in address bar; show redirect to `/login`.
5. From `/login`, enter invalid credentials — show error message: "Invalid email or password".
6. Log in with valid credentials — show redirect to `/dashboard`.
7. (If available) Click "Sign in with Google" and complete OAuth flow; show auto-created profile on first sign-in.
8. Go to "Forgot Password" link, enter demo email, and show the success message.

### Risk Level
- Medium. Auth flows rely on network and Supabase configuration. OAuth and email flows are the most fragile live-demo elements.

### Assigned Presenter: [Name]

---

## Act 3: Profile Management System

### Demo Objective
Demonstrate the dashboard and core profile CRUD: basic profile info, profile picture upload, employment history (add/edit/delete), skills management, education/certifications, projects, and profile completeness indicators.

### Implemented Features
- Dashboard: `frontend/src/pages/Dashboard.tsx` shows profile summary and quick-add cards.
- Profile page & edits: `frontend/src/pages/ProfilePage.tsx`, `ProfileDetails.tsx` (basic info form).
- Profile picture upload and preview: `frontend/src/components/ProfilePicture.tsx` with preview and blob cleanup; signed-URL caching logic implemented to reduce flicker.
- Employment: `AddEmployment.tsx`, `EmployementHistoryList.tsx`, `EditEmploymentModal.tsx` — add/edit/delete UI present.
- Skills: `AddSkills.tsx`, `SkillsOverview.tsx` — add skill, delete, manage flow with a "Manage skills" CTA and improved delete reliability with client-side refetch. Skills delete RLS policy exists as a migration file (db/migrations/2025-10-28_add_skills_delete_policy.sql) but must be applied server-side if required.
- Education & Certifications: `AddEducation.tsx`, `EducationOverview.tsx`, `Certifications.tsx` present for add/view flows.
- Projects: `AddProjectForm.tsx`, `ProjectPortfolio.tsx`, `ProjectDetails.tsx` exist to add and view projects.
- Profile completeness UI: `ProfileCompletion.tsx`, `ProfileStrengthTips.tsx`, and `SummaryCards.tsx` supply completion indicators and suggestions.

### Gaps vs Script
- Skills: category reordering/drag-and-drop may be partially implemented; not all DnD flows may be complete.
- RLS for delete: while client-side fixes were made in code, server-side RLS for deleting skills requires applying the included migration to Supabase to allow user-owned deletes.
- Some features (e.g., certification expiry reminders, export functionality) may be scaffolding or partially implemented and not fully production-ready.
- Full E2E edit/delete flows should be tested on the demo device (server RLS and signed URLs are environment-sensitive).

### Workaround / Talking Point
- For features that are partially implemented (DnD, automated reminders), frame them as "scheduled for Sprint 2" while showing the working add/edit/delete flows and the UI that will be extended.
- For delete RLS issues, mention the migration that exists; show the UI performing a client-side refetch so the list reflects the intended state (and say server migration is the final step).

### Live Steps
1. From Dashboard, click "Profile" or "Edit Profile".
   - Fill headline, bio; upload the profile image and show the preview. Save and show immediate update in the dashboard.
2. Open Employment → Add Employment:
   - Fill title, company, start date, and description. Save and show the new entry in the list and the Career Timeline visualization.
   - Edit the newly-added entry and save; show updated content.
   - Delete an employment entry; confirm the confirmation dialog and removal.
3. Skills:
   - Click "Manage skills".
   - Add a couple skills with proficiency levels; show they appear as tags/badges.
   - Delete a skill and show the list refetches and updates.
   - If reordering is available, demonstrate drag-and-drop; otherwise, explain it's planned in Sprint 2 and show the tech already added (library present).
4. Education & Certifications:
   - Add an education entry (degree + institution + grad date).
   - Add a certification; show it displays correctly.
5. Projects:
   - Add a project entry including technologies and description.
   - Open Portfolio view and show the project card and details view.
6. Profile completeness:
   - Show the completeness indicator on the dashboard; point out suggestions in `ProfileStrengthTips`.

### Risk Level
- Medium. CRUD flows are implemented but depend on Supabase and file storage (profile images). Skills delete depends on server migration in some environments.

### Assigned Presenter: [Name]

---

## Act 4: Technical Excellence

### Demo Objective
Show API consistency, data persistence, and describe the testing & QA approach (and current status).

### Implemented Features
- Central Supabase client: `frontend/src/supabaseClient.ts`.
- Centralized DB helpers: `frontend/src/services/crud.ts` including `withUser(user.id)` pattern for RLS-safe queries.
- Consistent JSON handling and error propagation in services; client pages show standardized messages.
- Migration folder: `db/migrations/` includes the canonical schema `2025-10-26_recreate_full_schema.sql` and a skills DELETE policy migration `2025-10-28_add_skills_delete_policy.sql`.
- Logging and diagnostic statements added to critical flows (useful for live debugging in developer tools).

### Gaps vs Script (e.g., 4.3 Testing & Quality Assurance)
- Test suite: the repo currently does not show an executed test suite with 90%+ coverage. There are no prescriptive coverage reports to demo.
- CI/test integration: not fully visible or configured to produce the coverage report during demo.
- Local developer scripts: there have been intermittent issues running `npm run dev` or `npm run typecheck` on some machines — verify script availability on your demo device.

### Workaround / Talking Point
- If tests cannot be executed live, prepare a short slide or a short recorded run showing:
  - Unit tests skeleton and examples (what's implemented).
  - Intent to add Jest + React Testing Library test coverage in Sprint 2.
- Emphasize design of testable modules:
  - Services (`crud.ts`) centralize DB access and simplify unit testing.
  - AuthContext decouples auth state and is trivially unit-testable.
  - UI components are small and keyboard accessible — good candidates for RTL tests.

### Live Steps
1. Open Browser DevTools → Network tab.
2. Trigger a profile update or add job entry and show the POST/PUT to Supabase and JSON response status codes.
3. Refresh the page; show data persists (re-read from Supabase).
4. If feasible and quick, run a single focused unit test or npm script (only if confirmed working on the demo device). Otherwise, show prepared test result screenshot.

### Risk Level
- Medium–High (for live test execution). Showing network/API calls and prepared test artifacts is lower risk.

### Assigned Presenter: [Name]

---

## Backup Plan (If Auth/Network Breaks)
- Pre-recorded short video (30–90s clips) of each demo action:
  - Register → Dashboard.
  - OAuth sign-in.
  - Profile picture upload.
  - Add/Edit/Delete employment and skills.
  - Network/API devtools showing status codes.
- Local screenshots: keep a folder of annotated screenshots for each demo step.
- Local static build: run `cd frontend; npm run build` ahead of time and serve with a local static server if dev server fails.
- Seeded local JSON (mock): have a local HTML/slide that shows mocked API responses and UI state to narrate through flows.
- Fallback accounts:
  - Keep demo credentials and tokens in a secure local file to bypass lengthy sign-up steps.
  - If Supabase is unreachable, use the pre-recorded video or screenshots.

---

## Timing Map (15–20 minutes)
- Act 1: Brand & Responsive — ~3 minutes
- Act 2: Authentication & Security — ~4 minutes
- Act 3: Profile Management System — ~7 minutes
- Act 4: Technical Excellence — ~2 minutes
- Q&A: ~2–4 minutes

Total: 18–20 minutes recommended.

---

## Summary Table (Acts vs Risk)
| Act | Objective | Risk | Owner |
|-----|-----------|------|-------|
| 1   | Brand & Responsive | Low | [Name] |
| 2   | Auth & Security    | Medium | [Name] |
| 3   | Profile Mgmt       | Medium | [Name] |
| 4   | Technical Excellence | Medium-High | [Name] |

---

## Post-Demo Next Steps (Sprint 2 targets)
1. Testing & CI: Add unit + integration tests (Jest + React Testing Library), aim for >80% coverage, and wire coverage reporting into CI.
2. RLS & migrations: Apply and verify DB migrations in the team Supabase instance (ensure skills DELETE policy is applied and confirm delete flows).
3. OAuth & Email verification: Complete provider configuration & test OAuth and password-reset email flows end-to-end on a hosted Supabase instance.
4. Mobile polish & DnD: Finish drag-and-drop reordering for skills and test across mobile/tablet breakpoints; address any small responsive issues.
5. E2E automation: Add Cypress or Playwright scripts for core happy paths (register/login/profile CRUD) to avoid demo flakiness.

---

Good luck with the demo — test the full flow on the exact demo device at least once, and keep the short backup video/screenshots available in case of any live-network surprises.
