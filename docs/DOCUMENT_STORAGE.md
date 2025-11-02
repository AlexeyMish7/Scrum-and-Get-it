Document & File Storage — design and migration notes

## Overview

This project stores user-uploaded files in Supabase Storage buckets and stores metadata in the `public.documents` table. Projects also store an optional `media_path` that points at a storage object (the file lives only in the storage bucket).

Primary buckets

- resumes (private)
- projects (private)
- certifications (private)

## Naming convention and RLS

- Files are namespaced per-user by prefixing the object name with their user id: `${userId}/${timestamp}_${originalName}`.
- Storage object policies (see `db/migrations/2025-10-26_recreate_full_schema.sql`) enforce that only the user (auth.uid()) can insert/select objects under their user-id prefix.
  Example policy check: `(split_part(name,'/',1))::uuid = auth.uid()`.

## Database wiring

- `projects.media_path` (text): stores the storage `name`/`path` returned by Supabase when uploading (e.g. `user-uuid/163..._screenshot.png`).
- `documents` table stores metadata about uploaded files: `file_name`, `file_path`, `mime_type`, `bytes`, `meta`, `uploaded_at`.
- New migration `db/migrations/2025-11-02_add_documents_project_fk.sql` adds a nullable `project_id uuid` to `documents`, referencing `projects(id)` (ON DELETE SET NULL) and an index `idx_documents_project_id`.
  - Rationale: linking a document to its source project (optional) makes UI listing and management easier.
  - The FK is nullable to avoid breaking existing rows and to allow documents that are not project-related (resumes, certificates, other uploads).

## Frontend behavior (current)

- Upload path: `const filePath = `${user.id}/${Date.now()}\_${file.name}`;`
- Upload call: `supabase.storage.from(bucket).upload(filePath, file)`
- After upload success, the `data.path` (the storage object name) is saved into either `projects.media_path` (for project images) or used as `file_path` when creating a `documents` row.
- For documents: after a successful projects insert/update the UI optionally calls the user-scoped CRUD helper and creates a `documents` row that looks like:
  {
  kind: 'portfolio',
  file_name: mediaFile.name,
  file_path: mediaPath,
  mime_type: mediaFile.type,
  bytes: mediaFile.size,
  meta: { source: 'project', project_id: <the project id> }
  }
- UI emits `window.dispatchEvent(new Event('documents:changed'))` on successful documents insert so other pages can refresh.

## Serving files to the browser

- Important: buckets in the canonical migration are created with `public = false` (private). To render images/files in the browser for private buckets you must use signed URLs (temporary):
  - `const { data } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);`
  - `data.signedUrl` can then be used as an `<img src=.../>` or to download.
- Current code in `ProjectPortfolio.tsx` uses `getPublicUrl()` which only works for public buckets. Recommend switching to `createSignedUrl()` when buckets are private.

## Cleanup and failure handling

- If upload succeeds but the DB insert fails, the AddProjectForm attempts to remove the uploaded object: `supabase.storage.from(bucket).remove([mediaPath])`.
- Documents insertion is non-blocking: if documents insertion fails after project creation, the project is kept; the UI surfaces a snackbar error. Consider adding a retry mechanism or a background job if the documents row is critical.

## Recommended additions / hardening

1. Use signed URLs for private bucket rendering

   - Implement a frontend helper `storage.getSignedUrl(bucket, path, expires)` in a central service (e.g., `frontend/src/services/storage.ts` or in `projectsService`).
   - Cache short-lived signed URLs (e.g., 60–300s) per page render.

2. Strengthen documents ↔ projects link (optional)

   - Migration already added `project_id` FK to `documents` (nullable). Consider backfilling existing `documents` rows that have `meta->'project_id'` into `project_id` (one-time job) if useful.

3. Retention / garbage collection

   - Orphaned files: periodically check for storage objects that have no row in `documents` and are older than X days; either remove or flag for review. This prevents storage costs from accumulating when DB inserts fail and cleanup misses.

4. UI consistency
   - Always create a `documents` row when users upload files via forms that manage documents (certifications, projects, resume) so Documents UI can be the single source of truth for file listings.

## How to run the migration

- The repository stores SQL under `db/migrations/`. How you run migrations depends on your DB workflow. Two quick options:

  1. psql (generic):
     - Ensure you have a Postgres connection string or environment variables to connect.
     - Run:

```powershell
# Windows PowerShell example
PS> psql "postgres://<user>:<pass>@<host>:<port>/<db>" -f db/migrations/2025-11-02_add_documents_project_fk.sql
```

2. Supabase SQL Editor / Migrations
   - Open your Supabase project -> SQL editor and paste the contents of `db/migrations/2025-11-02_add_documents_project_fk.sql` and run it.

## Rollback (manual)

- The migration includes rollback statements in comments. To rollback manually run:

```sql
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_project_fkey;
DROP INDEX IF EXISTS idx_documents_project_id;
ALTER TABLE public.documents DROP COLUMN IF EXISTS project_id;
```

If you'd like, I can:

- Implement `createSignedUrl()` usage across the UI (change `ProjectPortfolio.tsx` to request signed URLs). This requires no DB change and I can add an optional helper in `projectsService`.
- Add a backfill script that moves `meta->project_id` into the new `project_id` column for existing rows.
- Add a small periodic cleanup script (Node or serverless) that finds orphaned storage objects and deletes or reports them.

## Next step

Tell me whether you want me to:

- Run the migration SQL in this workspace (I can't run it against your remote DB from here). I can, however, add instructions or a script.
- Implement signed URL helper and update `ProjectPortfolio.tsx` to use it (recommended when buckets are private).
- Add a backfill script to move `meta.project_id` into `documents.project_id`.

Which option should I implement next?
