# Centralized Jobs Pipeline State Management

**Created**: November 17, 2025
**Purpose**: Fix synchronization issues and statistics bugs in Jobs workspace

## Problem Statement

### Issues Identified

1. **Statistics Bug - "Applied" Count Decrements**

   - **Problem**: When a job moves from "Applied" → "Phone Screen", the applied count goes down
   - **Root Cause**: Statistics counted jobs CURRENTLY in each stage, not jobs that REACHED each stage
   - **Impact**: Misleading conversion metrics (e.g., 40% applied, but then drops to 30% when jobs progress)

2. **State Synchronization Issues**

   - **Problem**: Multiple state variables (`allJobs`, `jobsByStage`, `filteredJobs`) updated separately
   - **Root Cause**: Manual state updates scattered across event handlers
   - **Impact**: UI inconsistencies, race conditions, stale data

3. **Duplicate Logic**
   - **Problem**: Same grouping/filtering logic repeated in multiple places
   - **Root Cause**: No centralized state management
   - **Impact**: Code duplication, inconsistent behavior

## Solution: `useJobsPipeline` Hook

### Architecture

```
┌─────────────────────────────────────────────────┐
│          useJobsPipeline Hook                    │
│  (Single Source of Truth)                       │
│                                                  │
│  State:                                          │
│  - allJobs: JobRow[]                            │
│  - jobsByStage: Record<Stage, JobRow[]>        │
│  - loading: boolean                             │
│                                                  │
│  Computed:                                       │
│  - stats: CumulativeStatistics                  │
│                                                  │
│  Operations:                                     │
│  - refreshJobs()                                │
│  - moveJob(id, stage)                           │
│  - bulkMoveJobs(ids[], stage)                   │
│  - deleteJobs(ids[])                            │
│  - groupJobsByStage(jobs?)                      │
└─────────────────────────────────────────────────┘
           │
           ├──> PipelineView (consumer)
           ├──> PipelineAnalytics (consumer)
           └──> Future components...
```

### Key Features

#### 1. Cumulative Statistics

**OLD BEHAVIOR** (Buggy):

```typescript
// Counted jobs CURRENTLY in each stage
const byStage = { Applied: 5, "Phone Screen": 3, Interview: 2 };
// When a job moves: Applied → Phone Screen
// Result: { "Applied": 4, "Phone Screen": 4 }  ❌ Applied count decreased!
```

**NEW BEHAVIOR** (Fixed):

```typescript
// Counts jobs that REACHED each stage
const STAGE_PROGRESSION = {
  Interested: ["Interested"],
  Applied: ["Interested", "Applied"],
  "Phone Screen": ["Interested", "Applied", "Phone Screen"],
  Interview: ["Interested", "Applied", "Phone Screen", "Interview"],
  // ...
};

// A job in "Interview" counts as:
// - Interested ✓ (started there)
// - Applied ✓ (had to apply to get interview)
// - Phone Screen ✓ (had to pass screen)
// - Interview ✓ (current stage)

// When a job moves: Applied → Phone Screen
// Result: Applied count STAYS THE SAME ✓
```

#### 2. Optimistic Updates with Rollback

```typescript
// 1. Save current state (for rollback)
preDragRef.current = jobsByStage;

// 2. Update UI immediately (optimistic)
setJobsByStage(newState);
setAllJobs(updatedJobs);

// 3. Call API
try {
  await pipelineService.moveJob(userId, jobId, newStage);
  // Success - keep optimistic update
} catch (err) {
  // Error - rollback to saved state
  setJobsByStage(preDragRef.current);
  setAllJobs(previousJobs);
}
```

#### 3. Automatic Synchronization

All state updates flow through the hook:

- `moveJob()` → updates `allJobs` AND `jobsByStage` atomically
- `bulkMoveJobs()` → updates both states, then regroups
- `deleteJobs()` → removes from both states simultaneously
- Statistics automatically recompute when `allJobs` or `jobsByStage` change

## Usage

### Before (Manual State Management)

```tsx
function PipelineView() {
  const [allJobs, setAllJobs] = useState<JobRow[]>([]);
  const [jobsByStage, setJobsByStage] = useState<Record<Stage, JobRow[]>>({});

  // Manual grouping
  function groupJobs(jobs: JobRow[]) {
    const grouped = {};
    STAGES.forEach(s => grouped[s] = []);
    jobs.forEach(job => {
      const stage = job.job_status ?? "Interested";
      grouped[stage].push(job);
    });
    setJobsByStage(grouped);
  }

  // Manual move logic
  async function handleDrop(result) {
    // ... complex drag-drop logic
    setJobsByStage(optimisticUpdate);
    try {
      await pipelineService.moveJob(...);
      setAllJobs(prev => prev.map(...)); // Manual sync
    } catch (err) {
      setJobsByStage(rollback); // Manual rollback
    }
  }

  // Manual statistics (BUGGY)
  const applied = jobsByStage["Applied"]?.length ?? 0; // ❌ Decrements on move
}
```

### After (Centralized Hook)

```tsx
function PipelineView() {
  const {
    allJobs,
    jobsByStage,
    loading,
    stats,          // ✓ Cumulative statistics (auto-computed)
    moveJob,        // ✓ Optimistic updates with rollback
    bulkMoveJobs,   // ✓ Bulk operations
    deleteJobs,     // ✓ Cascade delete
    refreshJobs,    // ✓ Manual refresh
  } = useJobsPipeline();

  // Drag-drop is now simple
  async function handleDrop(result) {
    const jobId = Number(result.draggableId);
    const newStage = result.destination.droppableId;
    await moveJob(jobId, newStage); // ✓ Everything handled internally
  }

  // Statistics always correct
  <PipelineAnalytics
    jobs={allJobs}
    cumulativeStats={stats} // ✓ Uses cumulative counts
  />

  // Stats display
  <Typography>Applied: {stats.applied}</Typography> // ✓ Never decrements
}
```

## Statistics Explained

### Current vs. Cumulative

**Current Count** (for Kanban display):

```typescript
stats.currentByStage["Applied"] = 5; // Jobs CURRENTLY in "Applied" stage
```

**Cumulative Count** (for conversion metrics):

```typescript
stats.applied = 12; // Jobs that REACHED "Applied" or beyond (including those now in later stages)
```

### Conversion Rate Calculations

```typescript
// Application Rate: % of total jobs applied to
const applicationRate = (stats.applied / stats.total) * 100;
// Example: 12 applied out of 20 total = 60%

// Phone Screen Rate: % of applied jobs that got phone screens
const phoneScreenRate = (stats.phoneScreen / stats.applied) * 100;
// Example: 8 phone screens out of 12 applied = 67%

// Interview Rate: % of phone screens that converted to interviews
const interviewRate = (stats.interview / stats.phoneScreen) * 100;
// Example: 5 interviews out of 8 screens = 63%

// Offer Rate: % of interviews that converted to offers
const offerRate = (stats.offer / stats.interview) * 100;
// Example: 2 offers out of 5 interviews = 40%
```

### Example Scenario

**Pipeline State**:

- 3 jobs in "Interested"
- 2 jobs in "Applied"
- 1 job in "Phone Screen"
- 1 job in "Interview"
- 1 job in "Offer"
- **Total: 8 jobs**

**Cumulative Statistics** (what the hook returns):

```typescript
{
  total: 8,
  interested: 8,      // All jobs started here
  applied: 5,         // 2 + 1 + 1 + 1 (Applied + later stages)
  phoneScreen: 3,     // 1 + 1 + 1 (Phone Screen + later stages)
  interview: 2,       // 1 + 1 (Interview + Offer)
  offer: 1,           // Jobs in Offer
  rejected: 0,
  currentByStage: {
    "Interested": 3,  // Jobs CURRENTLY in each stage
    "Applied": 2,
    "Phone Screen": 1,
    "Interview": 1,
    "Offer": 1,
    "Rejected": 0,
  }
}
```

**User moves a job**: Applied → Phone Screen

**NEW Cumulative Statistics**:

```typescript
{
  total: 8,
  interested: 8,      // ✓ Same (all jobs still started interested)
  applied: 5,         // ✓ Same (5 jobs still REACHED applied)
  phoneScreen: 3,     // ✓ Same (still 3 jobs reached phone screen)
  interview: 2,
  offer: 1,
  rejected: 0,
  currentByStage: {
    "Interested": 3,
    "Applied": 1,     // ✓ Decreased (moved out)
    "Phone Screen": 2, // ✓ Increased (moved in)
    "Interview": 1,
    "Offer": 1,
    "Rejected": 0,
  }
}
```

**Conversion Metrics**:

- Application Rate: `(5 / 8) * 100 = 62.5%` ✓ Stays consistent
- Phone Screen Rate: `(3 / 5) * 100 = 60%` ✓ Accurate funnel conversion

## Migration Guide

### Step 1: Update PipelineView

**Replace**:

```tsx
const [allJobs, setAllJobs] = useState<JobRow[]>([]);
const [jobsByStage, setJobsByStage] = useState<Record<Stage, JobRow[]>>({});

useEffect(() => {
  async function loadJobs() {
    const res = await jobsService.listJobs(user.id);
    setAllJobs(res.data);
    groupJobs(res.data);
  }
  loadJobs();
}, [user]);
```

**With**:

```tsx
const {
  allJobs,
  jobsByStage,
  loading,
  stats,
  moveJob,
  bulkMoveJobs,
  deleteJobs,
  refreshJobs,
} = useJobsPipeline();
```

### Step 2: Update Event Handlers

**Replace**:

```tsx
async function handleDrop(result: DropResult) {
  // 50+ lines of manual state management
}
```

**With**:

```tsx
async function handleDrop(result: DropResult) {
  if (!result.destination) return;
  const jobId = Number(result.draggableId);
  const newStage = result.destination.droppableId as PipelineStage;
  await moveJob(jobId, newStage);
}
```

### Step 3: Update Analytics

**Replace**:

```tsx
<PipelineAnalytics jobs={allJobs} />
```

**With**:

```tsx
<PipelineAnalytics jobs={allJobs} cumulativeStats={stats} />
```

## Testing Checklist

- [ ] Statistics don't decrement when moving jobs forward
- [ ] Application rate stays consistent across stage movements
- [ ] Conversion rates calculate correctly (applied → phone → interview → offer)
- [ ] Drag-drop updates UI immediately (optimistic)
- [ ] Failed drag-drop reverts to previous state (rollback)
- [ ] Bulk move updates all selected jobs
- [ ] Delete removes jobs from both allJobs and jobsByStage
- [ ] Kanban columns show correct current counts
- [ ] Analytics show correct cumulative counts

## Benefits

1. **Bug Fixes**

   - ✓ Statistics never decrement incorrectly
   - ✓ Conversion rates accurately reflect funnel progression
   - ✓ No race conditions or stale data

2. **Code Quality**

   - ✓ 200+ lines removed from PipelineView
   - ✓ Single source of truth for all jobs state
   - ✓ Reusable across multiple components

3. **Developer Experience**

   - ✓ Simple API (`moveJob`, `deleteJobs`, etc.)
   - ✓ Auto-syncing (no manual state management)
   - ✓ Built-in error handling and rollback

4. **Performance**
   - ✓ Optimistic updates (instant UI feedback)
   - ✓ Memoized computations (stats only recalculate when needed)
   - ✓ Single database fetch on mount

## Future Enhancements

- [ ] Add real-time updates (Supabase subscriptions)
- [ ] Add undo/redo for job movements
- [ ] Cache statistics in localStorage
- [ ] Add bulk edit operations
- [ ] Track stage transition history (audit log)
