# Resume Drafts Testing Guide

**Date**: 2025-11-10
**Status**: Ready for Testing
**Scope**: Database integration, cache layer, and async operations

## Overview

This guide provides comprehensive testing instructions for the resume drafts database integration and localStorage cache implementation.

## Prerequisites

1. **Database Migration**: Ensure migrations are applied

   - `2025-11-10_add_resume_drafts_table.sql`
   - `2025-11-10_add_resume_drafts_artifact_link.sql`

2. **Environment Setup**:

   - Frontend dev server running: `cd frontend && npm run dev`
   - Supabase connected (check `.env` variables)
   - User logged in with valid session

3. **Browser DevTools**:
   - Console open for logging
   - Network tab for database calls
   - Application tab for localStorage inspection

## Test Suite

### 1. Cache Initialization Tests

#### 1.1 First Load (Empty Cache)

**Steps**:

1. Clear localStorage: `localStorage.clear()` in console
2. Refresh page
3. Watch console logs

**Expected Behavior**:

```
⚡ Loading drafts from cache...
🔄 Syncing with database...
✓ Synced 0 drafts
📝 Creating initial draft...
✓ Created initial draft: <uuid>
```

**Verify**:

- [ ] Page loads instantly (< 100ms)
- [ ] "Loading drafts from database..." appears briefly
- [ ] Initial draft "My Resume" is created
- [ ] localStorage contains cache entry: `resume_drafts_cache_v2`

---

#### 1.2 Second Load (Warm Cache)

**Steps**:

1. With existing drafts, refresh page
2. Watch console logs and page load time

**Expected Behavior**:

```
⚡ Loading drafts from cache...
✓ Loaded N drafts from cache instantly
🔄 Syncing with database...
✓ Synced N drafts from database
```

**Verify**:

- [ ] UI appears instantly (< 50ms) with cached drafts
- [ ] Background sync completes within 1-2 seconds
- [ ] No flash of loading state
- [ ] Draft selector shows all drafts immediately

---

#### 1.3 Cache TTL (5 Minutes)

**Steps**:

1. Load page with warm cache
2. Inspect localStorage: `JSON.parse(localStorage.getItem('resume_drafts_cache_v2'))`
3. Note `lastSyncedAt` timestamp
4. Wait 5+ minutes
5. Refresh page

**Expected Behavior**:

- After 5+ minutes, cache is considered stale
- Background sync fetches fresh data
- Cache updated with new `lastSyncedAt`

**Verify**:

- [ ] Cache age calculation works correctly
- [ ] Stale cache is refreshed from database
- [ ] New `lastSyncedAt` timestamp set

---

### 2. CRUD Operation Tests

#### 2.1 Create Draft

**Steps**:

1. Click "New Draft" button
2. Enter name: "Test Resume"
3. Optionally select a job
4. Click "Create"

**Expected Behavior**:

```console
✓ Created new draft: <uuid>
```

**Database Verification**:

```sql
SELECT * FROM resume_drafts WHERE user_id = '<your-user-id>' ORDER BY created_at DESC LIMIT 1;
```

**Verify**:

- [ ] Success message appears: "✓ Created new draft: Test Resume"
- [ ] New draft appears in selector
- [ ] Database row created
- [ ] localStorage cache updated immediately
- [ ] `created_at` and `updated_at` timestamps set

---

#### 2.2 Rename Draft

**Steps**:

1. Select a draft
2. Click rename/edit name
3. Change name to "Updated Resume"
4. Save

**Expected Behavior**:

- Draft name updates in UI instantly
- Database updated
- Cache updated

**Database Verification**:

```sql
SELECT name, updated_at FROM resume_drafts WHERE id = '<draft-id>';
```

**Verify**:

- [ ] Name changes in draft selector
- [ ] `updated_at` timestamp updated in database
- [ ] Cache contains updated name

---

#### 2.3 Delete Draft

**Steps**:

1. Create a test draft
2. Delete the draft
3. Confirm deletion

**Expected Behavior**:

- Draft removed from UI
- Database row soft-deleted (if implemented) or hard-deleted
- Cache updated

**Database Verification**:

```sql
SELECT * FROM resume_drafts WHERE id = '<draft-id>';
-- Should return 0 rows or show deleted_at timestamp
```

**Verify**:

- [ ] Draft removed from selector
- [ ] Database row deleted/marked deleted
- [ ] Cache no longer contains draft
- [ ] Active draft switches to another if available

---

#### 2.4 Load Specific Draft

**Steps**:

1. Create multiple drafts
2. Select different drafts from dropdown
3. Watch for loading indicator

**Expected Behavior**:

- Draft loads instantly from cache/store
- Content updates in preview panel

**Verify**:

- [ ] Draft selection is instant (no loading spinner)
- [ ] Correct draft content displays
- [ ] `activeDraftId` updated in store

---

### 3. AI Content Application Tests

#### 3.1 Apply Summary

**Steps**:

1. Generate AI resume content for a job
2. Click "Apply Summary"
3. Watch console and UI

**Expected Behavior**:

```console
✓ Summary applied to draft
```

**Database Verification**:

```sql
SELECT content->'summary', metadata->'sections'
FROM resume_drafts
WHERE id = '<draft-id>';
```

**Verify**:

- [ ] Success message appears
- [ ] Summary section shows in preview
- [ ] Database `content.summary` updated
- [ ] `metadata.sections` shows summary as "applied"
- [ ] Cache updated with new content
- [ ] `updated_at` timestamp changed

---

#### 3.2 Apply Skills

**Steps**:

1. With generated AI content, click "Apply Skills"
2. Verify skills appear in preview

**Database Verification**:

```sql
SELECT content->'skills', metadata->'sections'->1
FROM resume_drafts
WHERE id = '<draft-id>';
```

**Verify**:

- [ ] Skills section populated
- [ ] Skills marked as "applied" in metadata
- [ ] Cache updated
- [ ] Database updated

---

#### 3.3 Apply Experience

**Steps**:

1. Click "Apply Experience"
2. Verify experience bullets appear

**Verify**:

- [ ] Experience section populated
- [ ] Marked as "applied"
- [ ] Cache and database updated

---

#### 3.4 Apply All

**Steps**:

1. With generated content, click "Apply All"
2. Verify all sections update

**Expected Behavior**:

```console
✓ All sections applied to draft
```

**Verify**:

- [ ] Summary, skills, and experience all applied
- [ ] All sections marked as "applied" in metadata
- [ ] Single database update (efficient)
- [ ] Cache updated once

---

### 4. Manual Edit Tests

#### 4.1 Edit Section

**Steps**:

1. Click edit on any section (e.g., summary)
2. Modify the text
3. Save changes

**Expected Behavior**:

```console
✓ summary edited
```

**Verify**:

- [ ] Success message appears
- [ ] Changes reflected in preview
- [ ] Section marked as "edited" in metadata
- [ ] Database updated
- [ ] Cache updated
- [ ] `lastUpdated` timestamp set for section

---

#### 4.2 Toggle Section Visibility

**Steps**:

1. Click eye icon to hide a section
2. Verify section disappears from preview
3. Click again to show

**Verify**:

- [ ] Section visibility toggles in preview
- [ ] `metadata.sections[].visible` updated in database
- [ ] Cache updated
- [ ] No error messages

---

### 5. Job Linking Tests

#### 5.1 Link Draft to Job

**Steps**:

1. Generate content for a specific job
2. Verify job info appears in draft metadata

**Expected Behavior**:

```console
✓ AI content generated for <Job Title> @ <Company>
```

**Database Verification**:

```sql
SELECT metadata->'jobId', metadata->'jobTitle', metadata->'jobCompany'
FROM resume_drafts
WHERE id = '<draft-id>';
```

**Verify**:

- [ ] Job ID, title, company stored in metadata
- [ ] Draft shows linked job in UI
- [ ] Cache updated with job info

---

### 6. Error Handling Tests

#### 6.1 Network Offline

**Steps**:

1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Try to apply a section

**Expected Behavior**:

```console
❌ Failed to apply section
Apply section error: <error details>
```

**Verify**:

- [ ] Error message appears in UI
- [ ] Console shows error details
- [ ] App doesn't crash
- [ ] Cache remains intact (last known good state)
- [ ] Can retry when back online

---

#### 6.2 Database Error

**Steps**:

1. Temporarily break database (invalid Supabase URL)
2. Try to create/edit draft

**Verify**:

- [ ] Error message displayed
- [ ] Cache still readable (graceful degradation)
- [ ] App remains functional (read-only from cache)

---

#### 6.3 Corrupted Cache

**Steps**:

1. Manually corrupt cache: `localStorage.setItem('resume_drafts_cache_v2', 'invalid json')`
2. Refresh page

**Expected Behavior**:

- Cache load fails silently
- Falls back to database-only mode
- Continues functioning normally

**Verify**:

- [ ] No crash or blank page
- [ ] Database sync still works
- [ ] New valid cache created

---

### 7. Multi-Device Sync Tests

#### 7.1 Edit on Device A

**Steps**:

1. Open app on Device A (or browser)
2. Edit a draft
3. Save changes

**Verify**:

- [ ] Changes saved to database
- [ ] Cache updated on Device A

---

#### 7.2 View on Device B

**Steps**:

1. Open app on Device B (or different browser)
2. Wait for background sync (1-2 seconds)

**Expected Behavior**:

```console
🔄 Syncing with database...
✓ Synced N drafts from database
```

**Verify**:

- [ ] Changes from Device A appear on Device B within 5 minutes
- [ ] If Device B cache is stale (< 5 min), background sync updates it
- [ ] If cache is fresh, changes appear immediately after sync

---

#### 7.3 Concurrent Edits (Conflict)

**Steps**:

1. Edit same draft on Device A and Device B
2. Save on Device A first
3. Save on Device B second

**Expected Behavior**:

- Last write wins (Device B overwrites A)
- No data corruption

**Known Limitation**:

- ⚠️ No conflict resolution implemented
- Database is source of truth
- Consider adding version locking in future

---

### 8. Performance Tests

#### 8.1 Page Load Time

**Steps**:

1. Open DevTools → Performance tab
2. Start recording
3. Refresh page
4. Stop recording

**Target Metrics**:

- Cache load: < 50ms
- UI render: < 100ms
- Database sync: < 2000ms (background)

**Verify**:

- [ ] User sees UI in < 100ms
- [ ] No blocking database calls
- [ ] Smooth page load experience

---

#### 8.2 Large Draft Performance

**Steps**:

1. Create draft with large content (many sections, long text)
2. Test apply, edit, toggle operations
3. Monitor cache size

**Verify**:

- [ ] Operations remain fast (< 500ms)
- [ ] Cache size reasonable (< 1MB per draft)
- [ ] No browser performance issues

---

#### 8.3 Many Drafts Performance

**Steps**:

1. Create 10+ drafts
2. Test switching between drafts
3. Check cache size

**Verify**:

- [ ] Draft switching is instant
- [ ] Total cache size < 5MB (localStorage limit)
- [ ] No memory leaks

---

### 9. Cache Invalidation Tests

#### 9.1 User Logout

**Steps**:

1. Load page with cached drafts
2. Logout
3. Check localStorage

**Expected Behavior**:

```console
[Cache] Cleared cache for user <user-id>
```

**Verify**:

- [ ] Cache cleared from localStorage
- [ ] No stale user data remains

---

#### 9.2 User Switch

**Steps**:

1. Login as User A
2. Create/edit drafts (cache builds)
3. Logout
4. Login as User B
5. Check cache

**Verify**:

- [ ] User A's cache cleared
- [ ] User B gets fresh cache
- [ ] No cross-user data leakage

---

#### 9.3 Cache Version Change

**Steps**:

1. Manually change cache version:
   ```js
   const cache = JSON.parse(localStorage.getItem("resume_drafts_cache_v2"));
   cache.version = 1; // Old version
   localStorage.setItem("resume_drafts_cache_v2", JSON.stringify(cache));
   ```
2. Refresh page

**Expected Behavior**:

- Old cache invalidated
- Fresh cache created with version 2

**Verify**:

- [ ] Old cache rejected
- [ ] New cache created
- [ ] Data still loads from database

---

## Browser Console Commands

### Inspect Cache

```javascript
// View cache
JSON.parse(localStorage.getItem("resume_drafts_cache_v2"));

// Check cache age
const cache = JSON.parse(localStorage.getItem("resume_drafts_cache_v2"));
const age = Date.now() - new Date(cache.lastSyncedAt).getTime();
console.log(`Cache age: ${Math.floor(age / 1000)}s`);

// Check cache size
const cacheStr = localStorage.getItem("resume_drafts_cache_v2");
console.log(`Cache size: ${(cacheStr.length / 1024).toFixed(2)} KB`);
```

### Clear Cache

```javascript
localStorage.removeItem("resume_drafts_cache_v2");
```

### Force Cache Expiry

```javascript
const cache = JSON.parse(localStorage.getItem("resume_drafts_cache_v2"));
cache.lastSyncedAt = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 min ago
localStorage.setItem("resume_drafts_cache_v2", JSON.stringify(cache));
```

### View Store State

```javascript
// Access Zustand store (if available globally)
useResumeDraftsV2.getState();
```

## Database Queries

### View All Drafts

```sql
SELECT id, name, metadata->'jobTitle' as job_title, created_at, updated_at
FROM resume_drafts
WHERE user_id = '<your-user-id>'
ORDER BY created_at DESC;
```

### View Draft Content

```sql
SELECT
  id,
  name,
  content,
  metadata,
  created_at,
  updated_at
FROM resume_drafts
WHERE id = '<draft-id>';
```

### Check Section States

```sql
SELECT
  name,
  jsonb_array_elements(metadata->'sections') as section
FROM resume_drafts
WHERE id = '<draft-id>';
```

### View Artifact Links

```sql
SELECT
  rd.id as draft_id,
  rd.name as draft_name,
  rd.source_artifact_id,
  aa.kind as artifact_kind,
  aa.created_at as artifact_created_at
FROM resume_drafts rd
LEFT JOIN ai_artifacts aa ON rd.source_artifact_id = aa.id
WHERE rd.user_id = '<your-user-id>';
```

## Common Issues & Troubleshooting

### Issue: Cache Not Loading

**Symptoms**: Page always loads from database, no instant UI

**Checks**:

1. localStorage not blocked by browser
2. Cache key correct: `resume_drafts_cache_v2`
3. No JSON parse errors in console
4. User ID matches cache userId

**Fix**: Clear cache and reload

---

### Issue: Changes Not Saving

**Symptoms**: Edits don't persist, reverted on refresh

**Checks**:

1. Network tab shows database POST requests
2. RLS policies allow user to update
3. No database errors in console
4. User authenticated with valid session

**Fix**: Check Supabase logs, verify RLS policies

---

### Issue: Stale Data Persists

**Symptoms**: Old data shows even after editing elsewhere

**Checks**:

1. Cache TTL (should be < 5 minutes)
2. Background sync completing successfully
3. No network errors blocking sync

**Fix**: Force refresh cache or clear localStorage

---

### Issue: Performance Degradation

**Symptoms**: Slow operations, UI lag

**Checks**:

1. Cache size in localStorage (< 5MB)
2. Number of drafts (< 100 reasonable)
3. Browser memory usage

**Fix**: Archive old drafts, clear cache

---

## Test Checklist Summary

### Critical Path (Must Pass)

- [ ] Page loads with cache instantly (< 100ms)
- [ ] Create draft saves to database
- [ ] Edit draft updates database and cache
- [ ] Apply AI sections works correctly
- [ ] Multi-device sync works within 5 minutes
- [ ] User logout clears cache
- [ ] Error handling prevents crashes

### Performance (Should Pass)

- [ ] Cache load < 50ms
- [ ] Database operations < 500ms
- [ ] Background sync < 2000ms
- [ ] Draft switching instant

### Edge Cases (Nice to Have)

- [ ] Corrupted cache handled gracefully
- [ ] Network offline doesn't crash app
- [ ] 10+ drafts perform well
- [ ] Large content handled efficiently

## Next Steps After Testing

1. **Document Bugs**: Create GitHub issues for any failures
2. **Performance Metrics**: Collect real-world performance data
3. **User Feedback**: Gather feedback on load times
4. **Optimization**: Address any performance bottlenecks
5. **Monitoring**: Add analytics for cache hit rates

## Success Criteria

✅ **Ready for Production** if:

- All critical path tests pass
- No data loss in any scenario
- Page load time < 2 seconds (95th percentile)
- Error handling prevents app crashes
- Multi-device sync reliable

---

**Testing Status**: ⏳ Pending Manual Verification

**Last Updated**: 2025-11-10
