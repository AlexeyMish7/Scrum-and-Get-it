# Shared Types

**Purpose**: TypeScript type definitions organized by architectural layer (database, domain, API).

**Import Pattern**: Always import from the barrel (`@shared/types`) for consistency:

```typescript
// ✅ Correct - use barrel export
import type { Job, JobRow, GenerateResumeRequest } from "@shared/types";

// ❌ Avoid - bypasses barrel and couples to internal structure
import type { JobRow } from "@shared/types/database";
```

---

## 🏗️ Three-Layer Type System

### 1️⃣ Database Layer (`database.ts`)

**Raw PostgreSQL row types** matching Supabase schema exactly.

- **Naming**: `snake_case` (matches database columns)
- **Dates**: `string` (ISO 8601 from Postgres)
- **Nullability**: Mirrors database constraints
- **Use when**: Direct Supabase queries, service layer operations

```typescript
import type { JobRow } from "@shared/types";

const row: JobRow = {
  id: 123,
  user_id: "uuid",
  job_title: "Software Engineer",
  created_at: "2024-01-15T10:00:00Z", // string from DB
  application_deadline: "2024-02-01", // SQL date string
};
```

**Available Types**:

- `UserOwnedRow` - Base type with `user_id` field
- `ProfileRow` - User profile data
- `EducationRow` - Education history entries
- `EmploymentRow` - Work experience entries
- `SkillRow` - User skills and proficiencies
- `ProjectRow` - Portfolio projects
- `CertificationRow` - Professional certifications
- `JobRow` - Job opportunities and applications
- `DocumentRow` - Uploaded files (resumes, cover letters)
- `AIArtifactRow` - AI-generated content (resumes, cover letters, etc.)
- `JobMaterialRow` - Links jobs to documents/artifacts
- `JobNoteRow` - Application notes and contact info

---

### 2️⃣ Domain Layer (`domain.ts`)

**UI-friendly business entities** with computed fields and type-safe dates.

- **Naming**: `camelCase` (JavaScript convention)
- **Dates**: `Date` objects (type-safe date operations)
- **Computed Fields**: Derived properties (e.g., `duration`, `isExpired`)
- **Use when**: React components, UI logic, business rules

```typescript
import type { Job } from "@shared/types";

const job: Job = {
  id: 123,
  userId: "uuid",
  jobTitle: "Software Engineer",
  createdAt: new Date("2024-01-15"), // Date object
  applicationDeadline: new Date("2024-02-01"),

  // Computed fields
  daysUntilDeadline: 15,
  isExpired: false,
};
```

**Available Types**:

- `Profile` - User profile with full name computed field
- `Education` - Education entry with duration calculation
- `Employment` - Work experience with current position flag
- `Skill` - User skill with proficiency level
- `Project` - Portfolio project with status tracking
- `Certification` - Professional cert with expiration logic
- `Job` - Job opportunity with deadline calculations
- `Document` - Uploaded file with size formatting
- `AIArtifact` - AI-generated content with metadata
- `JobMaterial` - Application materials linkage
- `JobNote` - Application notes with contact details

**Computed Field Examples**:

```typescript
// Education: duration calculation
education.duration; // → "Aug 2020 - May 2024" or "Aug 2020 - Present"

// Certification: expiration check
certification.isExpired; // → true if past expiration_date

// Job: deadline urgency
job.daysUntilDeadline; // → 5 (days remaining)
job.isExpired; // → false
```

---

### 3️⃣ API Layer (`api.ts`)

**Request/response contracts** for API communication.

- **Generic Wrappers**: `ApiResponse<T>`, `PaginationResponse<T>`
- **Request Types**: Parameters for API endpoints
- **Response Types**: Expected API return structures
- **Use when**: API services, HTTP client configuration

```typescript
import type {
  ApiResponse,
  PaginationResponse,
  GenerateResumeRequest,
} from "@shared/types";

// Generic API response wrapper
const response: ApiResponse<Job> = {
  data: job,
  error: null,
  status: 200,
};

// Paginated list response
const jobs: PaginationResponse<Job> = {
  data: [job1, job2],
  meta: {
    total: 150,
    page: 1,
    pageSize: 20,
    pageCount: 8,
  },
};

// AI generation request
const request: GenerateResumeRequest = {
  jobId: 123,
  templateId: "chronological",
  options: { tone: "professional" },
};
```

**Available Types**:

**Generic Wrappers**:

- `ApiResponse<T>` - Standard API response structure
- `ApiError` - Error details with code and message
- `PaginationMeta` - Pagination metadata (total, page, pageSize)
- `PaginationResponse<T>` - Paginated data with meta
- `ListParams` - Query parameters for list endpoints

**AI Generation Types**:

- `GenerateResumeRequest` / `GenerateResumeResponse`
- `GenerateCoverLetterRequest` / `GenerateCoverLetterResponse`
- `GenerateCompanyResearchRequest` / `GenerateCompanyResearchResponse`
- `GenerateJobMatchRequest` / `GenerateJobMatchResponse`

**Utility Types**:

- `SortParams` - Sorting configuration
- `FilterParams` - Filtering configuration

---

## 🔄 Type Transformations

When data flows through the application, it transforms between layers:

```
Database (Supabase)
    ↓
JobRow (database.ts)
    ↓ [Service Layer Transformation]
Job (domain.ts)
    ↓
React Component
    ↓
GenerateResumeRequest (api.ts)
    ↓
API Endpoint
```

### Example Transformation

```typescript
// Service layer: Transform DB row → Domain model
function mapJobRowToJob(row: JobRow): Job {
  return {
    id: row.id,
    userId: row.user_id,
    jobTitle: row.job_title,
    createdAt: new Date(row.created_at),
    applicationDeadline: row.application_deadline
      ? new Date(row.application_deadline)
      : null,

    // Computed fields
    daysUntilDeadline: row.application_deadline
      ? Math.ceil(
          (new Date(row.application_deadline).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      : null,
    isExpired: row.application_deadline
      ? new Date(row.application_deadline) < new Date()
      : false,
  };
}
```

---

## 📋 Form Data Types

Many entities have corresponding `FormData` types for form handling:

```typescript
import type { JobFormData } from "@shared/types";

// FormData types have optional fields for partial updates
const formData: JobFormData = {
  jobTitle: "Software Engineer", // required
  companyName: "Tech Corp", // required
  salary: 120000, // optional
};
```

**Available FormData Types**:

- `ProfileFormData`
- `EducationFormData`
- `EmploymentFormData`
- `SkillFormData`
- `ProjectFormData`
- `CertificationFormData`
- `JobFormData`
- `DocumentFormData`
- `JobNoteFormData`
- `JobMaterialFormData`

---

## 🧪 Type Safety Best Practices

### 1. Use Domain Types in UI Components

```typescript
// ✅ Good - uses domain type with Date objects
function JobCard({ job }: { job: Job }) {
  const daysLeft = job.daysUntilDeadline;
  const deadline = job.applicationDeadline.toLocaleDateString();
}

// ❌ Avoid - uses database type, requires manual parsing
function JobCard({ job }: { job: JobRow }) {
  const deadline = new Date(job.application_deadline!);
}
```

### 2. Transform at Service Boundaries

```typescript
// Service layer handles transformation
export async function getJob(id: number): Promise<Job> {
  const { data } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  return mapJobRowToJob(data); // Transform here
}
```

### 3. Use Type Guards for Validation

```typescript
function isValidJob(job: unknown): job is Job {
  return (
    typeof job === "object" &&
    job !== null &&
    "id" in job &&
    "jobTitle" in job &&
    job.createdAt instanceof Date
  );
}
```

---

## 📝 Adding New Types

1. **Determine layer**: Database, Domain, or API?
2. **Add to appropriate file** with JSDoc documentation
3. **Export from barrel** in `index.ts`
4. **Add transformation logic** if bridging layers
5. **Update this README** with usage examples

---

## 🔍 Quick Reference

| Need                  | Use                     | Example                   |
| --------------------- | ----------------------- | ------------------------- |
| Database query result | `*Row` type             | `JobRow`, `ProfileRow`    |
| UI component prop     | Domain type             | `Job`, `Profile`          |
| API request payload   | `*Request` type         | `GenerateResumeRequest`   |
| API response          | `ApiResponse<T>`        | `ApiResponse<Job>`        |
| Form submission       | `*FormData` type        | `JobFormData`             |
| Paginated list        | `PaginationResponse<T>` | `PaginationResponse<Job>` |

---

**Last Updated**: Sprint 2 Refactoring (November 2025)
