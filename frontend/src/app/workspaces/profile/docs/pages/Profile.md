# Profile — Schema, Styling & App Logic

This document explains the Profile section end-to-end for a new contributor: the canonical schema and data shape, frontend components and responsibilities, styling rules, validation and UX flows, how the frontend talks to the backend (and RLS expectations), cross-component events, recommended tests, and a verification checklist.

Files to inspect

- `frontend/src/pages/profile/ProfileDetails.tsx` — primary profile view/edit page (loads the profile, renders the edit form and view-mode summary)
- `frontend/src/pages/profile/Settings.tsx` — container for profile settings; includes `DeleteAccount` component
- `frontend/src/pages/profile/DeleteAccount.tsx` — delete-account UI and flow (re-auth, delete profile and dependent rows, calls server RPC to delete auth user)
- `frontend/src/pages/profile/ProfileDetails.css` — styles for the profile page (glossy cards, responsive layout, button variants)
- `frontend/src/services/profileService.ts` (or `services/profile.ts`) — service layer that maps UI shapes to DB payloads and performs upsert/select operations
- Shared utilities: `useAuth()` (AuthContext), `useErrorHandler()`, `crud` helper and `dbMappers` (if present) for mapping between UI and DB shapes

1. Canonical data shape (profile row)

The UI expects a user profile with the following fields. DB columns are snake_case; UI uses camelCase. `profileService` or `dbMappers` handle mapping.

- Typical `profiles` row fields:
  - id: string (UUID) — PK, should match `auth.users.id`
  - first_name: string | null
  - last_name: string | null
  - full_name: string | null (derived client-side or stored)
  - email: string (normalized lowercase)
  - phone: string | null
  - city: string | null
  - state: string | null
  - headline: string | null (professional headline)
  - bio: string | null
  - industry: string | null
  - experience: string | null (Entry/Mid/Senior/Executive)
  - avatar_url / avatar_path: string | null (if storage is used)
  - created_at, updated_at: timestamps (DB-managed)

Notes and expectations

- The frontend `ProfileDetails` expects `profileService.getProfile(user.id)` to return a mapped UI object (`ProfileData`) with `fullName`, `email`, `phone`, `city`, `state`, `headline`, `bio`, `industry`, `experience`.
- The email field is treated as read-only in the UI because the auth system (Supabase) owns it.

2. Frontend responsibilities & flows

ProfileDetails.tsx — edit and view modes

- Responsibilities:
  - Load the profile for the current `user.id` via `profileService.getProfile(user.id)` and map it to UI shape with `profileService.mapRowToProfile`.
  - Provide an editable form with client-side validation and a read-only view mode.
  - Use `ProfilePicture` (component referenced in file) to manage avatar upload/display.
  - Show success and error snackbars via `useErrorHandler()` or component-level `Snackbar`/`Alert`.
  - Keep the email input read-only and disabled to avoid confusion.

Form behavior and save flow

- Local form state is stored in `formData`. Changes are validated via `validateForm()` before save.
- `handleSave()` builds a payload and calls `profileService.upsertProfile(user.id, formData)` — the service is responsible for normalizing email (lowercase) and splitting `fullName` into `first_name`/`last_name` if the DB requires those.
- On success: show success snackbar and switch out of edit mode. On error: show error snackbar.

Settings.tsx + DeleteAccount.tsx

- `Settings.tsx` hosts account-level actions. It includes `DeleteAccount`, which does the following:
  - Re-authenticate the user by calling `supabase.auth.signInWithPassword({ email, password })` before destructive actions.
  - Attempt to delete the `profiles` row via `crud.deleteRow('profiles', { eq: { id: user.id } })`.
  - If cascade deletes aren't configured, fall back to explicit deletion of user-scoped rows (education, employment, skills, projects, certifications, documents) using `crud.withUser(user.id)`.
  - Call a server-side RPC `delete_user_userid(user_id uuid)` which wraps a privileged `delete_user(p_user_id uuid)` function to remove the `auth.users` record. This RPC must be applied via migrations and granted EXECUTE to `authenticated`.
  - Sign out the client and navigate to login on success.

3. Validation rules and UX decisions (from ProfileDetails)

- Client-side validation performed in `validateForm()` checks:
  - fullName is present
  - email present and matches a simple regex
  - phone present and normalized to 10 digits
  - city, state required
  - headline, industry, experience required
- These checks are primarily UX-focused (catch obvious mistakes). The server must still validate inputs and enforce DB constraints.

Accessibility & UX considerations

- Email input is read-only with `InputProps={{ readOnly: true }}` and `aria-readonly` set — good for screen readers.
- Bio textarea enforces a 500-character limit; the UI shows a live character count (`bioCount`) to the user.
- `ProfilePicture` should include accessible labels, a visible preview, and keyboard-focusable controls.

4. Styling & theme rules

- Styles live in `ProfileDetails.css` and follow repo theme patterns:
  - Use design tokens where possible (e.g., gradients defined at top of file) and keep visual rules in CSS instead of using inline `sx` for major layout/styling.
  - `.profile-paper` is a centered container with a max width and glass-like radius.
  - Buttons use `.btn-primary` and `.btn-secondary` helper classes. Prefer the MUI theme button variants when creating new components (variant="primary", variant="destructive").
  - Responsive layout: `.profile-row` uses flex-wrap so fields stack on small screens; media queries make buttons full width on mobile.

Styling best-practices in this repo

- Avoid inline style overrides; use `ProfileDetails.css` or theme tokens in `frontend/src/theme/theme.tsx`.
- Keep semantic classes small and re-usable across profile subcomponents.

5. Backend interaction, mapping & security

- Service layer responsibilities:

  - `profileService.getProfile(userId)` — fetch profile row and map DB columns to UI shape.
  - `profileService.upsertProfile(userId, formData)` — normalize and upsert the profile row. Normalization includes `email.trim().toLowerCase()` and splitting `fullName` into `first_name` and `last_name` if DB requires those columns.
  - `profileService.mapRowToProfile(row)` — mapping helper used by the UI.

- RLS expectations:

  - The `profiles` table should have Row-Level Security policies that permit the authenticated user to SELECT/UPDATE/DELETE the row where `id = auth.uid()` (or `user_id = auth.uid()` depending on schema). The client must use the anon key, and all queries should be scoped by `user.id` when required.

- Security notes on DeleteAccount:
  - Deleting `auth.users` must be performed by a privileged operation. The repo contains migrations adding `delete_user(p_user_id uuid)` with `security definer` and a wrapper `delete_user_userid(user_id uuid)` that is granted to `authenticated`. The migration must be applied to Supabase by a privileged user.
  - The client should never include service role keys or perform privileged deletes.

6. Cross-component communication

- Current patterns:
  - `ProfileDetails` updates UI locally and shows snackbars; if other pages rely on profile changes, consider dispatching a small event (e.g., `window.dispatchEvent(new Event('profile:updated'))`) so other pages can react.
  - `DeleteAccount` manages its own confirmations and redirects to login on success.

7. Edge cases & gotchas

- Multiple identity sources: users who sign in via OAuth may not have all profile fields populated. The UI should gracefully show placeholders and let the user complete them.
- Race conditions: two concurrent profile saves may cause last-write-wins behavior. Consider adding `updated_at` checks if this becomes a problem.
- Phone validation currently strips non-digits and requires 10 digits; if you support international numbers, update validation and storage accordingly.

8. Recommended tests

- Unit tests:

  - `profileService.mapRowToProfile` — assert DB -> UI mapping for missing and present fields.
  - `profileService.upsertProfile` normalization unit test for `fullName` split and email lowercasing.
  - `validateForm()` in `ProfileDetails` — happy path and multiple invalid fields.

- Integration / E2E tests:
  - Edit profile: save valid changes and assert success snackbar.
  - Upload avatar (if `ProfilePicture` exists): upload small image and verify preview + saved URL.
  - Delete account: create test user, ensure profile and dependent rows exist, call Delete Account flow and assert user cannot sign in and rows are removed (this must be run in a test DB with proper cleanup).

9. Verification steps (quick local checklist)

Commands (PowerShell):

```powershell
cd frontend; npm install
cd frontend; npm run dev
cd frontend; npm run typecheck
cd frontend; npm run lint
```

Manual checklist

1. Sign in as a test user (or register) so `user.id` exists and `profiles` row is present.
2. Open Profile page (`/profile`) — confirm values load into the form.
3. Edit fields (full name, phone, city, headline, bio) — click Save → confirm success snackbar and that values display in view mode.
4. Test invalid inputs (e.g., remove required fields) and confirm validation errors appear.
5. Test avatar upload if `ProfilePicture` exists — verify preview and successful save.
6. Go to Settings → Delete Account and test the delete flow using a disposable test account (requires migrations to be applied in DB). Ensure dependent rows are removed and user is signed out.

10) Small improvements & follow-ups

- Add `profile:updated` event dispatch after a successful save so other pages can refresh if needed.
- Extract `splitFullName(fullName)` into `profileService` and add unit tests for edge cases (single name, multiple parts, prefixes).
- Add server-side validation and sanitize inputs before writing to DB.
- Consider soft-deletes or audit log for account deletions to meet compliance requirements; document the retention policy.

Where to look next

- `frontend/src/services/profileService.ts` (or wherever profile upsert/get is implemented)
- `db/migrations/2025-10-26_recreate_full_schema.sql` for canonical `profiles` table definition
- `frontend/src/components/profile/ProfilePicture.tsx` (if present) for avatar upload details

If you want, I can:

- Add unit tests for `validateForm()` and `profileService.mapRowToProfile` now.
- Create a small `profile` mapper file and unit tests.

Document created and placed at: `docs/pages/Profile.md`
