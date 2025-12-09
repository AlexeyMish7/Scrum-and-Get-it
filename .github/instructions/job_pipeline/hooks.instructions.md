# Job Pipeline Hooks

> Custom React hooks for job pipeline state management.

---

## Hook Files

| File                   | Purpose                           |
| ---------------------- | --------------------------------- |
| `useJobsPipeline.ts`   | Central pipeline state management |
| `useJobMatch.ts`       | AI match score with caching       |
| `useJobsPagination.ts` | Paginated job list                |
| `useJobsSearch.ts`     | Job search with filters           |

---

## useJobsPipeline

Central source of truth for all jobs state.

### Return Type

```typescript
interface UseJobsPipelineReturn {
  // Data
  allJobs: JobRow[];
  jobsByStage: Record<PipelineStage, JobRow[]>;
  loading: boolean;
  user: { id: string } | null;

  // Statistics
  stats: {
    total: number;
    interested: number;
    applied: number;
    phoneScreen: number;
    interview: number;
    offer: number;
    rejected: number;
    currentByStage: Record<PipelineStage, number>;
  };

  // Operations
  refreshJobs: () => Promise<void>;
  moveJob: (jobId: number, newStage: PipelineStage) => Promise<void>;
  bulkMoveJobs: (jobIds: number[], newStage: PipelineStage) => Promise<void>;
  deleteJobs: (jobIds: number[]) => Promise<void>;
  groupJobsByStage: (jobs: JobRow[]) => Record<PipelineStage, JobRow[]>;
}
```

### Features

- **Cumulative Statistics:** Jobs in later stages count toward earlier stage stats
- **Optimistic Updates:** UI updates immediately, rolls back on error
- **Auto-refresh:** Loads jobs on mount
- **Stage Grouping:** Organizes jobs for kanban display

### Usage

```typescript
const { allJobs, jobsByStage, stats, loading, moveJob, refreshJobs } =
  useJobsPipeline();

// Move job to new stage
await moveJob(jobId, "Interview");

// Refresh all jobs
await refreshJobs();
```

---

## useJobMatch

AI-powered job matching with caching.

### Return Type

```typescript
interface UseJobMatchResult {
  data: MatchData | null;
  loading: boolean;
  error: string | null;
  refetch: (forceRefresh?: boolean) => Promise<void>;
}

interface MatchData {
  matchScore: number; // 0-100
  breakdown: {
    skills: number;
    experience: number;
    education: number;
    culturalFit: number;
  };
  skillsGaps: string[]; // Missing skills (max 5)
  strengths: string[]; // Strong areas (max 5)
  recommendations: string[]; // Improvement steps (max 5)
  reasoning: string; // AI explanation
  artifact: {
    id: string;
    cached: boolean;
  };
  meta: {
    latency_ms: number;
    cached: boolean;
  };
}
```

### Features

- **Supabase Caching:** Checks cache before AI call
- **Request Deduplication:** Prevents parallel requests
- **Profile-Aware:** Invalidates on profile changes
- **Local Fallback:** Calculates score locally if AI fails

### Usage

```typescript
const { data, loading, error, refetch } = useJobMatch(userId, jobId);

// Force refresh (skip cache)
await refetch(true);
```

### Score Calculation

1. Check Supabase `analytics_cache` for cached result
2. If valid cache exists, return immediately
3. Otherwise, call AI backend for analysis
4. Store result in cache with TTL
5. Return match data

---

## useJobsPagination

Paginated job list with infinite scroll support.

### Features

- Limit/offset pagination
- Load more functionality
- Total count tracking

### Usage

```typescript
const { jobs, total, hasMore, loading, loadMore } = useJobsPagination(userId, {
  limit: 20,
});

// Load next page
if (hasMore) {
  await loadMore();
}
```

---

## useJobsSearch

Job search with filtering support.

### Features

- Text search (title, company, description)
- Stage filtering
- Industry/job type filtering
- Debounced search input

### Usage

```typescript
const { results, loading, setSearch, setFilters } = useJobsSearch(userId);

// Update search term
setSearch("software engineer");

// Update filters
setFilters({ stage: "Interview", industry: "Technology" });
```

---

## Hook Dependencies

```
useJobsPipeline
├── useAuth (user context)
├── useErrorHandler (error handling)
├── jobsService (data fetching)
└── pipelineService (stage operations)

useJobMatch
├── analyticsCache (cache management)
├── aiGeneration (AI backend)
└── skillsService (user skills)
```
