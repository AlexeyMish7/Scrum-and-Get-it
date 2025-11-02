Account deletion — condensed implementation steps (demo-safe)

Purpose: Keep this as a short in-repo plan to implement account deletion with a 30-day soft-delete policy. Do NOT run migrations or server code before demo.

1. Add soft-delete fields (post-demo)

   - Add `deletion_requested_at timestamptz` to `public.profiles` (optional: `deleted_at`).
   - Optionally add `public.account_deletions` for scheduling/audit.

2. Server-side "request deletion" endpoint

   - Server endpoint records the deletion request, sets `deletion_requested_at`, inserts schedule, revokes sessions, optionally cleans storage, and sends a confirmation email.
   - Use SUPABASE_SERVICE_ROLE_KEY only on server; protect endpoint with auth.

3. Frontend: require password confirmation and call server

   - Re-authenticate the user locally; then POST to `/api/request-account-deletion`.
   - On success: call client `signOut()` and show confirmation + scheduled date.

4. Prevent access during 30-day grace

   - Server revokes sessions immediately.
   - App checks `deletion_requested_at` and blocks normal usage if set.

5. Scheduled permanent deletion job

   - Daily job queries scheduled deletions and calls `supabaseAdmin.auth.admin.deleteUser(userId)` to permanently remove `auth.users` (server-only). This cascades DB deletes.

6. Cancelation (optional)

   - Provide a secure cancel endpoint to clear `deletion_requested_at` within 30 days.

7. Safeguards
   - Do not expose service role key in frontend.
   - Log requests and emails, rate-limit endpoint, and test thoroughly in staging.
   - Update `AuthContext` auto-upsert logic to avoid re-creating profiles while deletion is scheduled.

Quick testing checklist (staging)

- Re-authenticate user -> request deletion -> verify `deletion_requested_at` is set.
- Verify sessions are revoked and client is signed out.
- Manually run scheduled job in staging to confirm `auth.users` deletion and cascade removal.
- Test cancellation flow.

Comments

- This document is intentionally concise. For full implementation details, follow the longer plan stored elsewhere or ask me to scaffold the server and migration files after demo day.
