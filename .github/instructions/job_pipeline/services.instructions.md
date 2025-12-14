# Job Pipeline Services

> Service layer for job CRUD, pipeline operations, and analytics caching.

---

## Service Files

| File                 | Purpose                  |
| -------------------- | ------------------------ |
| `jobsService.ts`     | Core job CRUD operations |
| `pipelineService.ts` | Kanban stage operations  |
| `analyticsCache.ts`  | AI analytics caching     |

---

## Jobs Service (`jobsService.ts`)

Centralized service for Jobs table CRUD operations.

### Key Functions

| Function                         | Purpose                                    |
| -------------------------------- | ------------------------------------------ |
| `listJobs(userId, filters?)`     | List jobs with optional filters/pagination |
| `getJob(userId, jobId)`          | Get single job by ID                       |
| `createJob(userId, data)`        | Create new job                             |
| `updateJob(userId, jobId, data)` | Update job                                 |
| `deleteJob(userId, jobId)`       | Delete job                                 |
| `bulkDeleteJobs(userId, jobIds)` | Delete multiple jobs                       |
| `archiveJob(userId, jobId)`      | Archive job                                |
| `getJobStats(userId)`            | Get pipeline statistics                    |

### Filters Interface

```typescript
interface JobFilters {
  search?: string;
  stage?: PipelineStage | "All";
  industry?: string;
  jobType?: string;
  minSalary?: number;
  maxSalary?: number;
  deadlineBefore?: string;
  deadlineAfter?: string;
  createdBefore?: string;
  createdAfter?: string;
  limit?: number;
  offset?: number;
  sortBy?: "created_at" | "application_deadline" | "company_name" | "job_title";
  sortOrder?: "asc" | "desc";
}
```

### Caching

- Primary cache: app-wide React Query core cache (`coreKeys.jobs(userId)`) with long stale times (prefetched on login via `AppBootstrapPrefetch`)
- `jobsService.listJobs()` reads from the core cache via `queryClient.ensureQueryData()` and applies filters/sort/pagination client-side
- Job materials drafts are also cached app-wide:
  - `coreKeys.resumeDrafts(userId)` (table: `resume_drafts`)
  - `coreKeys.coverLetterDrafts(userId)` (table: `cover_letter_drafts`)
- Legacy: still maintains a 5-minute in-memory TTL cache for older call sites
- Cache stays consistent on create/update/delete via `setQueryData()` + invalidation
- Request deduplication for parallel fetches

---

## Pipeline Service (`pipelineService.ts`)

Specialized service for kanban board operations.

### Key Functions

| Function                                 | Purpose                   |
| ---------------------------------------- | ------------------------- |
| `moveJob(userId, jobId, newStage)`       | Move job to new stage     |
| `getJobsByStage(userId)`                 | Get jobs grouped by stage |
| `bulkMoveJobs(userId, jobIds, newStage)` | Move multiple jobs        |
| `getStageStats(userId)`                  | Get count per stage       |

### Stage Movement

```typescript
const result = await pipelineService.moveJob(userId, jobId, "Interview");
```

**Side Effects:**

- Updates `job_status` column
- Updates `status_changed_at` timestamp
- Triggers achievement check (for team features)

### Stage Grouping

```typescript
const grouped = await pipelineService.getJobsByStage(userId);
// Returns: { "Interested": JobRow[], "Applied": JobRow[], ... }
```

---

## Analytics Cache Service (`analyticsCache.ts`)

Manages AI analytics caching in Supabase.

### Analytics Types

```typescript
type AnalyticsType =
  | "match_score" // Job-profile compatibility
  | "skills_gap" // Skills development recommendations
  | "company_research" // Company culture and insights
  | "interview_prep"; // Interview preparation strategy
```

### Key Functions

| Function                                            | Purpose              |
| --------------------------------------------------- | -------------------- |
| `getAnalytics(userId, jobId, type)`                 | Get cached analytics |
| `setAnalytics(userId, jobId, type, data, ttlDays?)` | Store analytics      |
| `invalidateAnalytics(userId, jobId, type?)`         | Clear cache          |
| `getAllAnalytics(userId, jobId?)`                   | Get all analytics    |
| `getBatchMatchScores(userId, jobIds)`               | Batch fetch scores   |
| `getCurrentProfileVersion()`                        | Get profile version  |

### Profile-Aware Caching

Cache auto-invalidates when user profile changes:

```typescript
// Cache entry stores profile_version
// On read, compares with current version
// Mismatch = automatic invalidation
```

### Usage Pattern

```typescript
// Check cache first
const cached = await getAnalytics(userId, jobId, "match_score");
if (!cached) {
  // Call AI backend
  const result = await callAIBackend();
  // Store with 7-day TTL
  await setAnalytics(userId, jobId, "match_score", result, 7);
}
```

---

## Common Patterns

### Result Type

```typescript
interface Result<T> {
  data: T | null;
  error: { message: string; status: number | null } | null;
  status: number | null;
}
```

### User-Scoped Operations

```typescript
// All operations use withUser() for RLS
const userCrud = crud.withUser(userId);
const result = await userCrud.listRows<JobRow>("jobs", "*");
```

### Optimistic Updates

```typescript
// UI updates immediately
setJobsByStage(newState);
try {
  await pipelineService.moveJob(userId, jobId, newStage);
} catch (error) {
  // Rollback on error
  setJobsByStage(previousState);
}
```
