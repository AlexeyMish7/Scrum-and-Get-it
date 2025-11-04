# Certifications — Section Guide

This document explains the Certifications section: UI structure, key logic, data flow, styling, and where to look when making changes. It is written for a developer new to the codebase.

Files of interest

- Frontend page: `frontend/src/pages/certifications/Certifications.tsx`
- Page styles: `frontend/src/pages/certifications/Certifications.css`
- Service layer: `frontend/src/services/certifications.ts` (DB + storage helpers)
- Types: `frontend/src/types/certification.ts`
- Shared helpers: `frontend/src/context/AuthContext.tsx`, `frontend/src/services/crud.ts`, `frontend/src/hooks/useErrorHandler.ts`, `frontend/src/components/common/ErrorSnackbar.tsx`, `frontend/src/components/common/ConfirmDialog.tsx`

Overview

- Purpose: let authenticated users add, edit, view, verify, and delete professional certifications. Supports optional file uploads (certificate images/PDFs), verification state, expiry warnings, and filtering/search.
- Primary responsibilities of the page:
  - Load a user's certifications and resolve signed URLs for attached files
  - Provide UI dialogs for adding and editing metadata
  - Handle file uploads via the `certificationsService` (which may create a `documents` row + store file in Supabase Storage)
  - Perform optimistic UI updates and surface success/error notifications via `useErrorHandler`

Data flow & services

- Loading: on mount (and when `user` changes) the page calls `certificationsService.listCertifications(user.id)` to fetch DB rows. Each row is mapped with `certificationsService.mapRowToCertification` into the UI model.
- Media resolution: if a row contains a storage `media_path`, the page calls `certificationsService.resolveMediaUrl(media_path)` to get a signed URL for display/opening.
- Create: `certificationsService.insertCertification(userId, payload, file)` handles insertion and optional file upload. The service returns the created DB row and may also return created document metadata.
- Update: `certificationsService.updateCertification(userId, certId, payload)` is used for metadata edits and verification state updates.
- Delete: `certificationsService.deleteCertification(userId, certId)` removes the DB row and attempts to clean up any storage files.

Key UI components & logic (in the page)

- Local state
  - `certifications` array: UI model list
  - `isLoading` boolean while fetching data
  - `search` filter string for organization search
  - `newCert`, `editForm`: controlled form state for add/edit dialogs
  - dialog open flags: `addOpen`, `editOpen`, `confirmDeleteOpen`
- Filtering: `useMemo` produces `filteredCerts` from `certifications` using `search`.
- Dialog flows:
  - Add dialog: validates required fields (name, issuing organization, date earned), uploads file (if provided), inserts DB row, maps/loads media URL, updates local list and fires `window.dispatchEvent(new Event('certifications:changed'))`.
  - Edit dialog: edits metadata only (file replacement not supported in current implementation), calls update service, optimistic local update.
  - Delete flow: shows `ConfirmDialog`, calls delete service, removes entry client-side.
- Verification: a `Mark as Verified` button calls `updateCertification(..., { verification_status: 'verified' })` and performs optimistic UI update.

Styling & theme

- Styles live in `frontend/src/pages/certifications/Certifications.css` and follow project guidelines:
  - BEM-like class names scoped to the page (`.cert-page`, `.cert-card`, `.glossy-btn`)
  - Glass/brand accents for primary actions via `.glossy-btn` (gradient + elevated shadow)
  - Card variants are visualized with a colored left border: `.cert-card.default`, `.cert-card.verified`, `.cert-card.expiring`.
  - Accessibility: buttons include focus-visible styles, icons inherit color, dialogs use MUI components that are accessible by default.

Types & shape

- DB rows → UI model is handled by `certificationsService.mapRowToCertification`.
- Typical UI Certification type fields (from `src/types/certification.ts`):
  - `id`, `name`, `organization`, `category`, `dateEarned`, `expirationDate`, `doesNotExpire`, `certId`, `media_path`, `mediaUrl`, `verification_status` ("unverified" | "pending" | "verified").

Edge cases & validations

- Required fields for add/edit: `name`, `organization`, `dateEarned`.
- File handling:
  - Add flow supports a single file; the service handles storage upload and may create a `documents` row.
  - Edit flow does not replace files (explicit limitation). If you add file-replacement support, update `certificationsService.updateCertification` and ensure storage cleanup of old file.
- Expiration handling: `isExpiringSoon` flags certs that will expire within 30 days and applies `.expiring` styling.

Events & cross-page integration

- The page listens for neither events nor subscriptions itself, but it fires `window.dispatchEvent(new Event('certifications:changed'))` after create/update/delete so other parts of the app can refresh lists if desired.

Error handling

- All async operations call `useErrorHandler()` to surface friendly messages via `ErrorSnackbar`.
- For service failures the code logs and calls `handleError(err, 'Friendly message')`.

Security & RLS

- All DB operations must be performed with the current user's scope; the `certificationsService` should use `crud.withUser(userId)` or equivalent to ensure `eq: { user_id: userId }` is present, and RLS policies must be configured in the DB.
- File upload and storage access: the service should store files in a user-specific bucket or prefix and ensure only authorized users can access the signed URLs.

Testing & verification checklist

1. Load page as an authenticated user and verify list shows rows from DB.
2. Add a certification with and without a file. Verify:
   - New item appears in UI
   - If file attached: `media_path` stored in DB and `mediaUrl` resolves to a signed URL
3. Edit metadata and confirm optimistic UI update.
4. Delete an item and ensure storage is cleaned (if applicable) and DB row removed.
5. Toggle `Mark as Verified` and confirm status and visual badge update.

Common changes & examples

- Add file-replace support: update UI dialog + `certificationsService.updateCertification` to accept an optional file upload; ensure old storage object is deleted.
- Add filtering by category: add a select input bound to `search` or a new `categoryFilter` state and update `filteredCerts`.
- Add server-side verification flow: if cert verification requires third-party checks, add a backend webhook or worker and switch verification status to `pending` while awaiting external validation.

Where to look next

- UI: `frontend/src/pages/certifications/Certifications.tsx`
- Styles: `frontend/src/pages/certifications/Certifications.css`
- Service: `frontend/src/services/certifications.ts`
- Types: `frontend/src/types/certification.ts`
- Shared: `frontend/src/services/crud.ts`, `frontend/src/context/AuthContext.tsx`, `frontend/src/hooks/useErrorHandler.ts`

If you want, I can also generate a small sequence diagram (Mermaid) for add/edit/delete flows or create a short unit-test scaffold for `certificationsService` using the project's test tooling.
