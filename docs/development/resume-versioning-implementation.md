# Resume Draft Versioning - Implementation Summary

**Date**: November 11, 2025
**Feature**: Automatic version control for resume drafts with side-by-side comparison

## Overview

Implemented Git-like versioning for resume drafts that automatically creates new versions when content changes during save operations. Users can view version history, compare versions side-by-side, and restore previous versions.

## Database Changes

### Migration: `2025-11-11_add_resume_draft_versioning.sql`

**New Columns Added to `resume_drafts` table:**

- `parent_draft_id` (uuid, nullable): Links to the draft this version was created from
- `origin_source` (text): Tracks how version was created (`manual`, `ai_generation`, `auto_save`, `restore`, `duplicate`, `import`)
- `content_hash` (text): SHA-256 hash for duplicate detection

**Existing Columns Leveraged:**

- `version` (integer): Auto-incremented by trigger for each new version in family
- `is_active` (boolean): Marks the current/latest version (only one active per family)

**Triggers Added:**

1. `trigger_auto_increment_resume_version`: Automatically increments version number based on family lineage
2. `trigger_mark_previous_version_inactive`: Marks parent version as inactive when new version created

**View Created:**

- `v_resume_draft_versions`: Enhanced view with version family information (root_draft_id, total_versions)

**Indexes Created:**

- `idx_resume_drafts_parent_id`: Fast version tree queries
- `idx_resume_drafts_user_active`: Fast "latest versions" queries
- `idx_resume_drafts_content_hash`: Duplicate detection

## Frontend Implementation

### 1. Service Layer: `resumeVersionService.ts`

**Location**: `frontend/src/app/shared/services/resumeVersionService.ts`

**Key Functions:**

```typescript
// Auto-version on save if content changed (via hash comparison)
createVersionIfChanged(draftId, newContent, newMetadata, userId, originSource);

// Get all versions for a draft family
getVersionHistory(draftId, userId);

// Get latest active version
getLatestVersion(rootDraftId, userId);

// Compare two versions side-by-side with difference calculation
compareVersions(versionId1, versionId2, userId);

// Restore previous version (creates new version from old content)
restoreVersion(versionToRestoreId, userId);

// Soft delete version (mark as inactive)
deleteVersion(versionId, userId);

// Update draft in-place without versioning (for metadata-only changes)
updateDraftInPlace(draftId, updates, userId);
```

**Change Detection:**

- Uses SHA-256 content hashing to detect actual changes
- Skips version creation if content hash matches (prevents no-op versions)
- Hash includes all content fields (summary, skills, experience, education, projects)

### 2. UI Components

#### A. VersionHistoryPanel Component

**Location**: `frontend/src/app/workspaces/ai/components/resume-v2/VersionHistoryPanel.tsx`

**Features:**

- Timeline view of all versions in family
- Visual distinction for active version
- Version metadata display (number, date, origin)
- Quick stats (sections present, item counts)
- Compare with previous version button
- Restore version button
- Origin icons and color coding:
  - 🤖 AI Generation (primary)
  - ✏️ Manual (default)
  - 🔄 Restore (warning)
  - 💾 Auto Save (info)

**Usage:**

```tsx
<VersionHistoryPanel
  draftId={currentDraftId}
  onVersionRestored={(newVersionId) => {
    // Reload draft to show restored version
    loadDraft(newVersionId);
  }}
/>
```

#### B. VersionComparisonDialog Component

**Location**: `frontend/src/app/workspaces/ai/components/resume-v2/VersionComparisonDialog.tsx`

**Features:**

- Side-by-side version metadata comparison
- Differences summary with counts
- Section-level change detection:
  - **Summary**: Full text diff (old vs new)
  - **Skills**: Added/removed lists
  - **Experience/Education/Projects**: Count-based diff (added, removed, modified)
- Visual indicators (green for additions, red for removals)
- Restore button to create new version from older content
- Responsive layout (stacks on mobile, side-by-side on desktop)

**Usage:**

```tsx
<VersionComparisonDialog
  open={showComparison}
  onClose={() => setShowComparison(false)}
  versionId1={olderVersion.id}
  versionId2={newerVersion.id}
  onRestore={(restoredVersionId) => {
    // Handle restored version
  }}
/>
```

## Integration Points

### Zustand Store Integration (Planned)

**Update `useResumeDraftsV2.ts` to use versioning:**

1. **On Apply Actions** (applySummary, applySkills, etc.):

   ```typescript
   const newVersionId = await createVersionIfChanged(
     activeDraftId,
     updatedContent,
     updatedMetadata,
     userId,
     "manual" // or "ai_generation" if from AI
   );
   ```

2. **On Edit Section**:

   ```typescript
   const newVersionId = await createVersionIfChanged(
     activeDraftId,
     updatedContent,
     updatedMetadata,
     userId,
     "manual"
   );
   ```

3. **Add Version History Actions**:

   ```typescript
   interface ResumeDraftsStore {
     // ... existing actions

     // Version management
     getVersionHistory: () => Promise<ResumeDraftVersion[]>;
     compareVersions: (
       v1: string,
       v2: string
     ) => Promise<VersionComparison | null>;
     restoreVersion: (versionId: string) => Promise<void>;
   }
   ```

### Resume Editor Integration (Planned)

**Add version history to `ResumeEditorV2/index.tsx`:**

1. Add version history panel as collapsible sidebar or drawer
2. Show version count badge on draft name
3. Add "View History" button in toolbar
4. Auto-refresh history after save operations

**Example UI Placement:**

```tsx
<Stack direction="row">
  <GenerationPanel />
  <DraftPreviewPanel />
  <VersionHistoryPanel draftId={activeDraftId} />
</Stack>
```

## User Workflows

### 1. Automatic Versioning on Save

**Trigger**: User modifies resume content and saves

**Flow**:

1. System calculates SHA-256 hash of new content
2. Compares with current draft's content_hash
3. If different → Creates new version (v2, v3, etc.)
4. If identical → Skips version creation (silent no-op)
5. New version becomes active, previous version marked inactive

**Origin Sources**:

- `manual`: User edited content directly
- `ai_generation`: Content from AI generation
- `auto_save`: Automatic periodic save
- `restore`: Restored from previous version
- `duplicate`: Duplicated from another draft

### 2. View Version History

**Trigger**: User clicks "View History" button

**Flow**:

1. Opens VersionHistoryPanel
2. Displays timeline of all versions
3. Shows metadata (version number, date, origin)
4. Highlights active version
5. Shows quick stats for each version

### 3. Compare Versions

**Trigger**: User clicks "Compare" button on version

**Flow**:

1. Opens VersionComparisonDialog
2. Shows side-by-side metadata
3. Calculates and displays differences:
   - Summary: Full text diff
   - Skills: Added/removed lists
   - Experience/Education/Projects: Count changes
4. User reviews changes
5. Option to restore older version

### 4. Restore Previous Version

**Trigger**: User clicks "Restore" on old version

**Flow**:

1. Fetches content from old version
2. Creates NEW version (not in-place restore)
3. New version has content from old version
4. Origin marked as "restore"
5. Version number increments (preserves history)
6. User's draft updated to show restored content

## Benefits

✅ **Non-Destructive**: All versions preserved, never overwritten
✅ **Change Detection**: Only versions created when content actually changes
✅ **Full History**: Complete audit trail of all changes
✅ **Easy Comparison**: Visual diff between any two versions
✅ **Safe Restore**: Restoring creates new version, preserves original
✅ **Performance**: Indexed queries, efficient hash-based comparison
✅ **User Control**: Manual version creation, restore, and comparison

## Future Enhancements

1. **Branching**: Allow users to create named branches (e.g., "Tech Resume", "Marketing Resume")
2. **Merge**: Combine content from two versions
3. **Export History**: Download full version history as JSON
4. **Diff Visualization**: Inline text diff with highlighting
5. **Auto-Save Versions**: Create versions automatically every N minutes
6. **Version Tags**: User-defined labels for important versions (e.g., "Applied to Google")
7. **Cleanup**: Archive old inactive versions after 90 days

## Testing Checklist

- [ ] Version auto-creation on content change
- [ ] No version created when content identical
- [ ] Version number increments correctly
- [ ] Parent-child relationships tracked
- [ ] Only one active version per family
- [ ] Version history displays all versions
- [ ] Comparison dialog shows accurate diffs
- [ ] Restore creates new version correctly
- [ ] Soft delete marks version inactive
- [ ] Hash calculation consistent
- [ ] Performance with 50+ versions
- [ ] Concurrent saves handle correctly
- [ ] UI responsive on mobile
- [ ] Database triggers fire correctly

## Database Migration Instructions

**To apply the migration:**

```sql
-- From Supabase SQL Editor or psql
\i db/migrations/2025-11-11_add_resume_draft_versioning.sql
```

**To verify:**

```sql
-- Check new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'resume_drafts'
  AND column_name IN ('parent_draft_id', 'origin_source', 'content_hash');

-- Check triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'resume_drafts';

-- Check view exists
SELECT * FROM v_resume_draft_versions LIMIT 1;
```

## Implementation Status

✅ **Database Schema**: Complete (migration file created)
✅ **Service Layer**: Complete (resumeVersionService.ts)
✅ **UI Components**: Complete (VersionHistoryPanel, VersionComparisonDialog)
⏳ **Zustand Integration**: Pending (needs update to call versioning service)
⏳ **Editor Integration**: Pending (needs UI placement and wiring)
⏳ **Testing**: Pending (needs comprehensive test suite)

## Next Steps

1. **Apply Database Migration**: Run migration SQL in Supabase
2. **Integrate with Zustand**: Update `useResumeDraftsV2` to call versioning service
3. **Add to Editor UI**: Place VersionHistoryPanel in resume editor layout
4. **Test Workflows**: Comprehensive testing of all version operations
5. **User Documentation**: Add help text and tooltips explaining versioning
6. **Performance Testing**: Verify performance with large version histories

---

**Questions or Issues?**
Contact: Sprint 2 Development Team
Last Updated: November 11, 2025
