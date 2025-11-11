# Resume Drafts Database Integration Verification

**Date**: 2025-11-10
**Purpose**: Verify complete database schema setup for resume_drafts table

---

## ✅ Database Schema Checklist

### Table: `resume_drafts`

**Columns**:

- [x] `id` - uuid PRIMARY KEY (auto-generated)
- [x] `user_id` - uuid NOT NULL (FK to profiles)
- [x] `name` - text NOT NULL
- [x] `template_id` - text (default 'classic')
- [x] `source_artifact_id` - uuid (FK to ai_artifacts, nullable)
- [x] `content` - jsonb NOT NULL
- [x] `metadata` - jsonb NOT NULL
- [x] `version` - integer NOT NULL (default 1)
- [x] `is_active` - boolean NOT NULL (default true)
- [x] `created_at` - timestamptz NOT NULL
- [x] `updated_at` - timestamptz NOT NULL
- [x] `last_accessed_at` - timestamptz (nullable)

**Foreign Keys**:

- [x] `resume_drafts_user_id_fkey` → `profiles(id)` ON DELETE CASCADE
- [x] `resume_drafts_source_artifact_fkey` → `ai_artifacts(id)` ON DELETE SET NULL

**Indexes**:

- [x] `idx_resume_drafts_user_id` - On user_id (for listing user drafts)
- [x] `idx_resume_drafts_updated_at` - On updated_at DESC (for sorting)
- [x] `idx_resume_drafts_is_active` - Partial index WHERE is_active = true
- [x] `idx_resume_drafts_template` - On template_id (for filtering by template)
- [x] `idx_resume_drafts_source_artifact` - Partial index WHERE source_artifact_id IS NOT NULL

**Triggers**:

- [x] `resume_drafts_updated_at_trigger` - Auto-updates updated_at on row update

**RLS Policies**:

- [x] `Users can view own resume drafts` - SELECT using auth.uid() = user_id
- [x] `Users can insert own resume drafts` - INSERT with check auth.uid() = user_id
- [x] `Users can update own resume drafts` - UPDATE using/with check auth.uid() = user_id
- [x] `Users can delete own resume drafts` - DELETE using auth.uid() = user_id

---

## ✅ TypeScript Integration Checklist

### Interface: `ResumeDraftRow`

**Matches Database Columns**:

- [x] `id: string` → uuid
- [x] `user_id: string` → uuid
- [x] `name: string` → text
- [x] `template_id: string` → text
- [x] `source_artifact_id?: string | null` → uuid (nullable)
- [x] `content: {...}` → jsonb
- [x] `metadata: {...}` → jsonb
- [x] `version: number` → integer
- [x] `is_active: boolean` → boolean
- [x] `created_at: string` → timestamptz
- [x] `updated_at: string` → timestamptz
- [x] `last_accessed_at?: string` → timestamptz (nullable)

### Service Functions

**CRUD Operations**:

- [x] `listResumeDrafts(userId)` - Uses withUser().listRows()
- [x] `getResumeDraft(userId, draftId)` - Uses withUser().getRow()
- [x] `createResumeDraft(userId, input)` - Uses withUser().insertRow()
  - [x] Accepts `source_artifact_id` in input
  - [x] Sets default `template_id` to 'classic'
  - [x] Initializes `version` to 1
  - [x] Sets `is_active` to true
- [x] `updateResumeDraft(userId, draftId, input)` - Uses withUser().updateRow()
  - [x] Increments `version` for optimistic locking
  - [x] Can update `source_artifact_id`
  - [x] Checks current version before update
- [x] `deleteResumeDraft(userId, draftId)` - Soft delete (sets is_active = false)
- [x] `permanentlyDeleteResumeDraft(userId, draftId)` - Hard delete
- [x] `restoreResumeDraft(userId, draftId)` - Sets is_active = true
- [x] `duplicateResumeDraft(userId, draftId, newName?)` - Creates copy
- [x] `listArchivedDrafts(userId)` - Lists where is_active = false

**All functions**:

- [x] Return `Result<T>` pattern (no throwing)
- [x] Use `withUser(userId)` scoping
- [x] Take `userId` as first parameter

---

## 🔗 Relationship Verification

### resume_drafts → profiles (user_id)

- **Constraint**: `resume_drafts_user_id_fkey`
- **On Delete**: CASCADE (delete drafts when user deleted)
- **TypeScript**: `user_id: string`
- **Purpose**: Every draft belongs to exactly one user

### resume_drafts → ai_artifacts (source_artifact_id)

- **Constraint**: `resume_drafts_source_artifact_fkey`
- **On Delete**: SET NULL (preserve draft if artifact deleted)
- **TypeScript**: `source_artifact_id?: string | null`
- **Purpose**: Track which drafts originated from AI generation
- **Scenarios**:
  - `NULL` - Manually created draft
  - `uuid` - Draft created from AI artifact

---

## 📊 Data Flow Architecture

```
User Profile (profiles)
    ↓
    ├── Creates Resume Draft (resume_drafts)
    │       ↓
    │       ├── Manual creation (source_artifact_id = NULL)
    │       │
    │       └── AI generation flow:
    │               1. User generates AI content → ai_artifacts created
    │               2. Draft created with source_artifact_id → links to artifact
    │               3. User edits draft (content changes, artifact link remains)
    │
    └── Applies to Job (job_materials)
            ↓
            └── Links to documents OR ai_artifacts for submission
```

---

## 🧪 Testing Scenarios

### Scenario 1: Manual Draft Creation

```typescript
const result = await createResumeDraft(userId, {
  name: "Manual Resume",
  source_artifact_id: null, // or omit
  content: { summary: "..." },
});
// Expected: Draft created with source_artifact_id = NULL
```

### Scenario 2: AI-Generated Draft

```typescript
// 1. AI generates content (creates ai_artifacts row)
const artifactId = "uuid-from-ai-generation";

// 2. Create draft linked to artifact
const result = await createResumeDraft(userId, {
  name: "AI-Generated Resume for JobCo",
  source_artifact_id: artifactId,
  content: aiGeneratedContent,
});
// Expected: Draft created with source_artifact_id = artifactId
```

### Scenario 3: Optimistic Locking

```typescript
// User A reads draft (version 1)
const draft1 = await getResumeDraft(userId, draftId);

// User B updates draft (version becomes 2)
await updateResumeDraft(userId, draftId, { name: "Updated by B" });

// User A tries to update (version check fails)
const result = await updateResumeDraft(userId, draftId, {
  name: "Updated by A",
});
// Expected: Error - version mismatch
```

### Scenario 4: Soft Delete & Restore

```typescript
// Archive draft
await deleteResumeDraft(userId, draftId);
// Expected: is_active = false, draft not in listResumeDrafts()

// Restore draft
await restoreResumeDraft(userId, draftId);
// Expected: is_active = true, draft appears in listResumeDrafts()
```

### Scenario 5: AI Artifact Deleted

```typescript
// Draft linked to artifact
const draft = await createResumeDraft(userId, {
  name: "Resume",
  source_artifact_id: artifactId,
});

// AI artifact gets deleted
// Expected: Draft still exists, source_artifact_id becomes NULL
```

---

## 🔒 Security Verification

### RLS Enforcement

All operations automatically scoped to authenticated user via:

1. `withUser(userId)` helper injects `user_id` filter
2. RLS policies verify `auth.uid() = user_id`
3. Even direct SQL queries enforced at database level

### Test RLS

```sql
-- As User A, try to access User B's draft (should fail)
SELECT * FROM resume_drafts WHERE id = 'user-b-draft-id';
-- Expected: No rows (RLS blocks access)

-- As User A, try to update User B's draft (should fail)
UPDATE resume_drafts SET name = 'Hacked' WHERE id = 'user-b-draft-id';
-- Expected: 0 rows affected (RLS blocks update)
```

---

## ✅ Migration Files Applied

1. `2025-11-10_add_resume_drafts_table.sql` ✓

   - Created table, indexes, trigger, RLS policies

2. `2025-11-10_add_resume_drafts_artifact_link.sql` ✓
   - Added source_artifact_id column
   - Added foreign key constraint
   - Added index

---

## 🎯 Next Steps

1. **Update Zustand Store** - Replace localStorage with database calls
2. **Add Migration Trigger** - Run localStorage→DB migration on first load
3. **End-to-End Testing** - Test all CRUD operations in UI
4. **Performance Monitoring** - Verify query performance with indexes

---

## 📝 Notes

- **Idempotent migrations**: Both migration files use `IF NOT EXISTS` and conditional constraint creation
- **Optimistic locking**: Version field prevents concurrent edit conflicts
- **Soft delete**: Archive functionality preserves drafts without data loss
- **Multi-device sync**: Database storage enables access from any device
- **AI traceability**: source_artifact_id maintains audit trail of AI-generated content
