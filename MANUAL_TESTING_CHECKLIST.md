# Job Pipeline Migration - Manual Testing Checklist

**Status**: Ready for manual verification before deleting old `/jobs` folder

## Pre-Delete Verification (Complete These Steps)

### ✅ 1. Build & Compilation Checks

- [ ] **TypeScript Compilation**

  ```bash
  cd frontend
  npm run typecheck
  ```

  Expected: No errors

- [ ] **Dev Server Starts**
  ```bash
  npm run dev
  ```
  Expected: No import errors, server starts successfully

### ✅ 2. Route Verification (Test in Browser)

Navigate to each route and verify it loads without errors:

- [ ] `/jobs/pipeline` - Pipeline kanban board loads
- [ ] `/jobs/analytics` - Analytics dashboard loads
- [ ] `/jobs/documents` - Documents page loads
- [ ] `/jobs/new` - New job form loads
- [ ] `/jobs/saved-searches` - Saved searches page loads
- [ ] `/jobs/automations` - Automations page loads
- [ ] `/jobs/archived` - Archived jobs page loads

### ✅ 3. Core Functionality Tests

#### Job Creation

- [ ] Navigate to `/jobs/new`
- [ ] Fill in job form with required fields:
  - Job Title: "Test Engineer"
  - Company Name: "Test Corp"
- [ ] Click Save
- [ ] Verify job appears in pipeline

#### Pipeline Management

- [ ] Navigate to `/jobs/pipeline`
- [ ] Verify jobs appear in correct stages
- [ ] Drag a job from "Interested" to "Applied"
- [ ] Verify status updates
- [ ] Verify status_changed_at timestamp updates

#### Job Analytics (AI Integration)

- [ ] Click "Analytics" button on a job
- [ ] **First click**: Verify AI generates match analysis (takes 2-5 seconds)
- [ ] Verify match score displays (0-100)
- [ ] Verify skills gaps and strengths show
- [ ] Close dialog
- [ ] **Second click**: Verify cached data loads instantly (< 100ms)
- [ ] Verify "Cached" indicator shows

#### Profile Change Detection

- [ ] Navigate to `/profile/skills`
- [ ] Add a new skill (e.g., "Python")
- [ ] Navigate back to `/jobs/pipeline`
- [ ] Click "Analytics" on a job
- [ ] Verify AI regenerates (not cached) - should take 2-5 seconds
- [ ] Verify new skill appears in analysis

#### Job Details

- [ ] Click on a job card in pipeline
- [ ] Verify job details page loads (`/jobs/:id`)
- [ ] Verify all job information displays
- [ ] Edit job title
- [ ] Save changes
- [ ] Verify updates persist

#### Documents Linking

- [ ] Navigate to `/jobs/documents`
- [ ] Upload a resume (if file upload is implemented)
- [ ] Link resume to a job application
- [ ] Verify link appears in job details

### ✅ 4. Error Handling Tests

- [ ] Try creating job with empty title
- [ ] Verify validation error shows
- [ ] Try accessing non-existent job ID
- [ ] Verify error message displays gracefully

### ✅ 5. Console Checks

Open browser DevTools console:

- [ ] No import errors
- [ ] No 404 errors for @job_pipeline imports
- [ ] No React warnings
- [ ] No Supabase RLS policy violations

### ✅ 6. Network Tab Verification

Open DevTools Network tab:

- [ ] Job create/update calls succeed (200/201 status)
- [ ] Job list queries return data
- [ ] AI artifact queries work
- [ ] No failed requests to old `/jobs` paths

### ✅ 7. Database Verification

Check Supabase dashboard:

- [ ] New jobs appear in `jobs` table
- [ ] `user_id` is correctly set (RLS scoping)
- [ ] Status changes update `status_changed_at`
- [ ] AI artifacts stored in `ai_artifacts` table
- [ ] Job materials linked in `job_materials` table

## Automated Checks (Run These Commands)

### TypeScript Compilation

```bash
cd frontend
npm run typecheck
```

**Expected**: Exit code 0, no errors

### Import Resolution

```powershell
# Check for old @jobs imports in job_pipeline
Get-ChildItem -Path frontend\src\app\workspaces\job_pipeline -Recurse -Include *.ts,*.tsx | Select-String 'from "@jobs'
```

**Expected**: No matches found

### File Structure

```powershell
# Verify critical files exist
Test-Path frontend\src\app\workspaces\job_pipeline\index.ts
Test-Path frontend\src\app\workspaces\job_pipeline\types\index.ts
Test-Path frontend\src\app\workspaces\job_pipeline\services\jobsService.ts
Test-Path frontend\src\app\workspaces\job_pipeline\hooks\useJobMatch.ts
```

**Expected**: All return `True`

### Router Configuration

```powershell
# Verify router imports job_pipeline
Select-String -Path frontend\src\router.tsx -Pattern "@workspaces/job_pipeline"
```

**Expected**: Multiple matches found

## Quick Verification Script

Run the automated verification:

```powershell
.\scripts\quick-verify.ps1
```

Expected output:

```
✓ TypeScript compilation passed
✓ All imports updated to @job_pipeline
✓ All critical files exist
✓ Router imports job_pipeline
```

## Sign-Off Checklist

Before deleting the old `/jobs` folder, confirm:

- [ ] ✅ All 7 route pages load without errors
- [ ] ✅ Job creation works
- [ ] ✅ Job editing works
- [ ] ✅ Pipeline drag-and-drop works
- [ ] ✅ AI analytics generation works (first click)
- [ ] ✅ AI analytics caching works (second click)
- [ ] ✅ Profile change triggers regeneration
- [ ] ✅ No console errors
- [ ] ✅ No import errors
- [ ] ✅ TypeScript compiles cleanly
- [ ] ✅ All automated checks pass

## Delete Old Folder

**Only after ALL checks above pass:**

```powershell
Remove-Item -Recurse -Force frontend\src\app\workspaces\jobs
```

Then commit the change:

```bash
git add -A
git commit -m "Remove old jobs workspace - migration to job_pipeline complete"
```

## Rollback Plan (If Issues Found)

If you encounter problems:

1. **Restore old jobs folder**:

   ```bash
   git checkout HEAD -- frontend/src/app/workspaces/jobs
   ```

2. **Revert router changes**:

   ```bash
   git checkout HEAD -- frontend/src/router.tsx
   ```

3. **Revert path aliases**:
   ```bash
   git checkout HEAD -- frontend/tsconfig.app.json frontend/vite.config.ts
   ```

## Known Issues / Notes

- ✅ All imports updated to @job_pipeline paths
- ✅ Router configured for job_pipeline
- ✅ Path aliases configured in tsconfig and vite
- ✅ Export conflicts resolved
- ✅ Component paths corrected (analytics folder structure)

## Testing Summary

**Total Manual Tests**: 30+ verification points
**Automated Checks**: 4 PowerShell scripts
**Estimated Testing Time**: 15-20 minutes

---

**Tester**: ********\_********
**Date**: ********\_********
**Result**: PASS / FAIL
**Notes**: **********************\_\_\_**********************
