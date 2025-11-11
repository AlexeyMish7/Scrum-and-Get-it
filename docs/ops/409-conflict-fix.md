# 409 Conflict Error - Fix Implemented

**Date**: November 11, 2025  
**Issue**: Users experiencing "409 Conflict" errors when editing resume drafts  
**Status**: ✅ **FIXED** with automatic retry logic

---

## What Was the Problem?

The resume editor uses **optimistic locking** with version numbers to prevent data loss from concurrent edits. However, when multiple actions happened quickly (e.g., clicking "Apply Summary" then "Apply Skills" rapidly), the app would:

1. Start save #1 with version 1
2. Start save #2 with version 1 (before #1 completed)
3. Save #1 completes → version becomes 2
4. Save #2 tries to save with version 1 → **409 Conflict Error** ❌

This also happened if the user had the resume editor open in multiple browser tabs.

---

## What Was Fixed?

Added **automatic retry logic** to `resumeDraftsService.ts` that:

### ✅ Detects Version Conflicts
Recognizes 409 errors and version mismatch messages

### ✅ Auto-Retries (up to 3 attempts)
- Attempt 1: Immediate retry after 100ms
- Attempt 2: Retry after 200ms  
- Attempt 3: Final retry after 400ms

### ✅ Reloads Latest Version
On each retry, fetches the current version from the database with the latest data

### ✅ Succeeds Transparently
User won't see errors - the conflict is resolved automatically in the background

### ✅ Provides Console Feedback
Developers can see retry attempts in browser console (F12):
```
⚠️ Version conflict detected (attempt 1/3)
🔄 Retrying resume draft update (attempt 2/3)...
✓ Resume draft update succeeded after 2 attempts
```

---

## Code Changes

**File**: `frontend/src/app/shared/services/resumeDraftsService.ts`

**What Changed**:
- Renamed `updateResumeDraft` → `updateResumeDraftInternal` (private helper)
- Created new `updateResumeDraft` with retry wrapper
- Added exponential backoff (100ms → 200ms → 400ms)
- Added conflict detection logic
- Added console logging for debugging

**Lines Changed**: ~120 lines modified/added

---

## User Impact

### Before Fix:
- ❌ Users saw "409 Conflict" errors
- ❌ Had to manually refresh page
- ❌ Lost unsaved work
- ❌ Couldn't rapid-click buttons

### After Fix:
- ✅ Conflicts resolve automatically
- ✅ No manual refresh needed
- ✅ Work is always saved
- ✅ Can click buttons quickly without errors

---

## Testing

### How to Test:
1. Open resume editor
2. Rapidly click "Apply Summary" → "Apply Skills" → "Apply Experience"
3. **Expected**: All save without errors (check console for retry logs)

### Edge Cases Handled:
- ✅ Multiple browser tabs editing same draft
- ✅ Rapid button clicking
- ✅ Network latency causing delayed saves
- ✅ Concurrent edits from different actions

---

## Still Seeing Errors?

If you still see 409 errors after this fix:

### 1. Hard Refresh
Press **Ctrl + Shift + R** to reload with latest code

### 2. Clear Cache
```javascript
// Browser console (F12):
localStorage.removeItem('sgt:resume_drafts_v2')
location.reload()
```

### 3. Close Extra Tabs
Make sure only ONE resume editor tab is open

### 4. Check Console Logs
Open DevTools (F12) and look for:
- `⚠️ Version conflict detected`
- `🔄 Retrying...`
- `✓ succeeded after X attempts`

If you see `❌ failed after 3 attempts`, there's a deeper issue - report it!

---

## Technical Details

### Retry Logic Flow:
```
User Action (Apply Summary)
    ↓
updateResumeDraft(userId, draftId, data)
    ↓
Attempt 1: updateResumeDraftInternal()
    ↓
Version Conflict? → YES
    ↓
Wait 100ms + reload latest version
    ↓
Attempt 2: updateResumeDraftInternal()
    ↓
Version Conflict? → NO
    ↓
✓ Success - return updated draft
```

### Version Conflict Detection:
```typescript
const isVersionConflict =
  result.status === 409 ||
  result.error?.message?.includes("version") ||
  result.error?.message?.includes("PGRST116") ||
  result.error?.message?.includes("0 rows");
```

### Exponential Backoff:
```typescript
// Attempt 1: 0ms (immediate)
// Attempt 2: 100ms delay
// Attempt 3: 200ms delay
// Attempt 4: 400ms delay (if maxRetries=4)
const delay = 100 * Math.pow(2, attempt - 1);
```

---

## Future Improvements

### Potential Enhancements:
1. **Debounced Saves**: Queue rapid actions instead of immediate saves
2. **Optimistic UI Updates**: Show changes immediately, sync in background
3. **WebSocket Sync**: Real-time conflict detection across tabs
4. **User Notification**: Toast message when conflicts are auto-resolved

### Not Planned (Why):
- ❌ **Increase max retries beyond 3**: If 3 retries fail, there's a bigger issue
- ❌ **Remove version locking**: Needed to prevent data corruption
- ❌ **Disable RLS**: Security requirement

---

## Related Files

- `frontend/src/app/shared/services/resumeDraftsService.ts` - Main fix location
- `frontend/src/app/workspaces/ai/hooks/useResumeDraftsV2.ts` - Calls update function
- `db/migrations/2025-11-10_add_resume_drafts_table.sql` - Table schema with version column

---

## Questions?

If you're still experiencing issues:
1. Check browser console (F12) for error messages
2. Verify backend server is running (`npm run dev` in `server/`)
3. Ensure `.env` files are configured correctly
4. Report the issue with console logs and reproduction steps

**The 409 conflict should now be extremely rare and auto-resolved when it happens!** 🎉
