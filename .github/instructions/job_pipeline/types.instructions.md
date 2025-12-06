# Job Pipeline Types

> TypeScript type definitions for the job pipeline workspace.

---

## Type Files

| File                  | Purpose                     |
| --------------------- | --------------------------- |
| `job.types.ts`        | Core job entity types       |
| `pipeline.types.ts`   | Pipeline stages and filters |
| `analytics.types.ts`  | Analytics data structures   |
| `navigation.types.ts` | Navigation types            |

---

## Job Types (`job.types.ts`)

### JobRow

Base job entity from database (re-exported from `@shared/types/database`).

### JobWithMetadata

```typescript
interface JobWithMetadata extends JobRow {
  daysInStage?: number;
  isOverdue?: boolean;
  daysUntilDeadline?: number;
}
```

### JobFormData

```typescript
interface JobFormData {
  // Required fields
  job_title: string;
  company_name: string;

  // Location fields (optional)
  street_address?: string;
  city_name?: string;
  state_code?: string;
  zipcode?: string;

  // Salary range (optional)
  start_salary_range?: number | null;
  end_salary_range?: number | null;

  // Application details (optional)
  job_link?: string | null;
  application_deadline?: string | null;
  job_description?: string | null;
  industry?: string | null;
  job_type?: string | null;

  // Pipeline status
  job_status?: string; // defaults to "Interested"
}
```

---

## Pipeline Types (`pipeline.types.ts`)

### PipelineStage

```typescript
type PipelineStage =
  | "Interested"
  | "Applied"
  | "Phone Screen"
  | "Interview"
  | "Offer"
  | "Rejected";

const PIPELINE_STAGES = [
  "Interested",
  "Applied",
  "Phone Screen",
  "Interview",
  "Offer",
  "Rejected",
] as const;
```

### JobFilters

```typescript
interface JobFilters {
  // Search query
  search?: string;

  // Filter by stage
  stage?: PipelineStage | "All";

  // Filter by category
  industry?: string;
  jobType?: string;

  // Salary range
  minSalary?: number;
  maxSalary?: number;

  // Date ranges (ISO strings)
  deadlineBefore?: string;
  deadlineAfter?: string;
  createdBefore?: string;
  createdAfter?: string;

  // Pagination
  limit?: number;
  offset?: number;

  // Sorting
  sortBy?: "created_at" | "application_deadline" | "company_name" | "job_title";
  sortOrder?: "asc" | "desc";
}
```

### PaginatedJobs

```typescript
interface PaginatedJobs {
  jobs: JobRow[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
```

---

## Analytics Types (`analytics.types.ts`)

### JobStats

```typescript
interface JobStats {
  total: number;
  byStage: Record<PipelineStage, number>;
  responseRate: number;
  avgDaysInStage: Record<PipelineStage, number>;
}
```

### AnalyticsCacheEntry

```typescript
interface AnalyticsCacheEntry {
  userId: string;
  jobId: number;
  analyticsType: string;
  data: unknown;
  createdAt: Date;
  expiresAt?: Date;
}
```

### MatchData

```typescript
interface MatchData {
  overallScore: number;
  skillsMatch: {
    score: number;
    matched: string[];
    missing: string[];
    total: number;
  };
  experienceMatch: {
    score: number;
    relevantBullets: string[];
    totalBullets: number;
  };
  strengthsAndGaps: {
    strengths: string[];
    gaps: string[];
  };
}
```

---

## Hook Return Types

### UseJobMatchResult

```typescript
interface UseJobMatchResult {
  data: MatchData | null;
  loading: boolean;
  error: string | null;
  refetch: (forceRefresh?: boolean) => Promise<void>;
}
```

### UseJobsPipelineReturn

```typescript
interface UseJobsPipelineReturn {
  // Data
  allJobs: JobRow[];
  jobsByStage: Record<PipelineStage, JobRow[]>;
  loading: boolean;
  user: { id: string } | null;

  // Statistics (cumulative counts)
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

---

## Stage Progression

Jobs that reach later stages count in previous stage statistics:

```typescript
const STAGE_PROGRESSION: Record<Stage, Stage[]> = {
  Interested: ["Interested"],
  Applied: ["Interested", "Applied"],
  "Phone Screen": ["Interested", "Applied", "Phone Screen"],
  Interview: ["Interested", "Applied", "Phone Screen", "Interview"],
  Offer: ["Interested", "Applied", "Phone Screen", "Interview", "Offer"],
  Rejected: ["Rejected"], // Doesn't count toward progression
};
```

**Example:** A job in "Interview" counts as: Interested, Applied, Phone Screen, Interview.
