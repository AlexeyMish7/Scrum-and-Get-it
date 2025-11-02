Project TODO (near-term, demo-safe)

This folder contains non-destructive todos and reference steps to implement account deletion safely after demo day.

- [ ] Keep production DB and server unchanged before demo.
- [ ] After demo: follow `ACCOUNT_DELETION_STEPS.md` to implement soft-delete + server endpoints + scheduled job.
- [ ] Add migrations and server code only after testing in staging.
- [ ] Review `frontend/src/context/AuthContext.tsx` for auto-upsert logic before running deletion tests.

Notes

- This folder is informational; no code changes were made to frontend or database now.
