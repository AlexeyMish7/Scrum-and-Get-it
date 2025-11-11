# Resume Export Section Ordering Fix + Save Button Consolidation

**Date**: November 11, 2025
**Issues Fixed**:

1. ❌ **Export ignores section order** - PDF/DOCX exports render sections in hardcoded order instead of user's custom order
2. ❌ **Too many save buttons** - Multiple "Save Draft" buttons confusing users (auto-save already works)

---

## Problem 1: Export Section Ordering

### Root Cause

`exportResumePDF.ts` and `exportResumeDOCX.ts` have hardcoded section rendering:

```typescript
// Always renders in this order:
1. Summary
2. Skills
3. Experience
4. Education
5. Projects
```

But users can reorder sections in the preview panel via drag/drop.

### Solution

**Updated `exportResumePDF_v2.ts`** to:

1. Read `draft.metadata.sections` array (contains user's preferred order)
2. Filter for `visible: true` sections only
3. Render sections in that order using a switch statement

**Key Code Change**:

```typescript
// Get visible sections in user-defined order
const visibleSections = draft.metadata.sections
  ?.filter((s) => s.visible)
  .map((s) => s.type) || [
  "summary",
  "skills",
  "experience",
  "education",
  "projects",
];

// Render each section in order
visibleSections.forEach((sectionType) => {
  switch (sectionType) {
    case "summary":
      /* render summary */ break;
    case "skills":
      /* render skills */ break;
    case "experience":
      /* render experience */ break;
    case "education":
      /* render education */ break;
    case "projects":
      /* render projects */ break;
  }
});
```

**Same fix needed for**:

- ✅ `exportResumePDF_v2.ts` (DONE)
- ⏳ `exportResumeDOCX.ts` (TODO - apply same pattern)
- ⏳ `exportResumeHTML.ts` (TODO if exists)
- ⏳ `exportResumeTXT.ts` (TODO if exists)

---

## Problem 2: Too Many Save Buttons

### Current State

**Save buttons appear in**:

1. DraftPreviewPanel top toolbar (line ~990)
2. DraftPreviewPanel bottom actions (line ~1300)
3. Possibly other places

**User Confusion**:

- Drafts auto-save on every edit/apply action (via Zustand)
- Manual "Save Draft" button is redundant
- Users don't know when/why to click Save

### Solution: Integrate with Versioning

**Option A: Remove Save Buttons, Add Auto-Version Indicator**

```tsx
// Replace "Save Draft" button with version indicator
<Chip
  icon={<HistoryIcon />}
  label={`v${currentVersion} • Auto-saved`}
  size="small"
  color="success"
  onClick={() => setShowVersionHistory(true)}
/>
```

**Option B: Convert Save to "Save Version"**

```tsx
// Make save explicit version creation
<Button
  variant="outlined"
  startIcon={<SaveIcon />}
  onClick={handleCreateVersion}
>
  Save Version
</Button>
```

**Option C: Single Export+Save Flow** (RECOMMENDED)

```tsx
// Remove standalone save, integrate with export
<Button variant="contained" onClick={handleExport}>
  Export & Save Version
</Button>
```

### Recommended Implementation

**Remove these save buttons**:

- ❌ Top toolbar "Save" button
- ❌ Bottom "Save Draft" button

**Add version-aware UI**:

- ✅ Version indicator showing current version number
- ✅ "View History" button to see all versions
- ✅ Auto-version on export (export creates a snapshot)
- ✅ Status chip showing "Auto-saved • v3"

**Update Export Flow**:

```typescript
const performExport = async (format: "pdf" | "docx") => {
  // 1. Export the file
  await exportResume(format);

  // 2. Auto-create version if content changed
  const newVersionId = await createVersionIfChanged(
    activeDraftId,
    draft.content,
    draft.metadata,
    userId,
    "export"
  );

  // 3. Show success message with version
  if (newVersionId) {
    setSuccessMessage(
      `✓ Exported as ${format.toUpperCase()} • Saved as v${newVersion}`
    );
  } else {
    setSuccessMessage(
      `✓ Exported as ${format.toUpperCase()} • No changes to save`
    );
  }
};
```

---

## Implementation Plan

### Step 1: Fix Export Section Ordering ✅

**Files to update**:

1. ✅ `exportResumePDF_v2.ts` - Created with section ordering
2. ⏳ Replace old `exportResumePDF.ts` with v2
3. ⏳ Update `exportResumeDOCX.ts` with same pattern
4. ⏳ Update any other export utilities

### Step 2: Consolidate Save Buttons

**DraftPreviewPanel.tsx changes**:

1. Remove standalone "Save Draft" button
2. Add version indicator chip
3. Add "View History" button
4. Update export buttons to auto-version

**ResumeEditorV2 index.tsx changes**:

1. Update `handleSaveDraft` to create version
2. Wire up version history panel
3. Add version indicator to draft selector

### Step 3: Testing

- [ ] Test section reordering + export matches
- [ ] Test version creation on export
- [ ] Test no duplicate versions for unchanged content
- [ ] Test version history display
- [ ] Verify auto-save still works

---

## Next Steps (Priority Order)

1. **IMMEDIATE**: Replace `exportResumePDF.ts` with `exportResumePDF_v2.ts`
2. **IMMEDIATE**: Apply same fix to `exportResumeDOCX.ts`
3. **HIGH**: Remove redundant save buttons from DraftPreviewPanel
4. **HIGH**: Add version indicator and history button
5. **MEDIUM**: Wire up export-creates-version flow
6. **LOW**: Add version comparison to editor UI

---

**Status**:

- Export ordering: 50% done (PDF done, DOCX pending)
- Save consolidation: 0% done (planning complete)
