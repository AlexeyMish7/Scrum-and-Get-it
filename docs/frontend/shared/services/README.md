# Shared Services Layer

**Location**: `src/app/shared/services/`
**Purpose**: Database operations, API clients, and data utilities shared across all workspaces
**Pattern**: Thin service layer wrapping Supabase with type-safe CRUD helpers

## Architecture Overview

The services layer provides three main capabilities:

1. **Database Operations** - Type-safe CRUD with automatic user scoping
2. **External APIs** - Company news fetching, future integrations
3. **Data Management** - Caching, transformations, versioning

All services follow these principles:

- Return `Result<T>` objects (never throw)
- Use RLS-scoped queries via `withUser()`
- Maintain immutable audit trails where needed
- Keep business logic in components/hooks

---

## Core Services

### supabaseClient.ts

**Single Supabase client instance for the entire application**

**Exports**:

- `supabase` - Configured Supabase client

**Configuration**:

```typescript
{
  auth: {
    autoRefreshToken: true,    // Auto-refresh before expiry
    persistSession: true,       // localStorage persistence
    detectSessionInUrl: true,   // OAuth callback handling
  },
  global: {
    headers: { 'x-application-name': 'scrum-and-get-it' }
  }
}
```

**Usage**:

```typescript
import { supabase } from "@shared/services/supabaseClient";

// Auth operations
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// Direct queries (prefer crud.ts helpers)
const { data } = await supabase.from("profiles").select("*").eq("id", userId);
```

**Key Features**:

- Extended session lifetime for demo stability
- Aggressive token refresh (5min before expiry)
- Environment validation (throws if VITE*SUPABASE*\* missing)

**71 imports across codebase** - Most imported service

---

### crud.ts

**Type-safe database CRUD operations with automatic RLS scoping**

**Core Exports**:

- `listRows<T>()` - Fetch multiple rows with filters/pagination
- `getRow<T>()` - Fetch single row
- `insertRow<T>()` - Create new record
- `upsertRow<T>()` - Insert or update
- `updateRow<T>()` - Update existing records
- `deleteRow<T>()` - Delete records
- `withUser(userId)` - Scoped CRUD helpers for user-owned data

**Auth Helpers**:

- `getUserProfile(userId)` - Fetch profile by ID
- `updateUserProfile(userId, payload)` - Update profile
- `registerWithEmail()`, `loginWithEmail()`, `logout()`

**Return Type**:

```typescript
type Result<T> = {
  data: T | null; // Returned data or null
  error: CrudError | null; // Standardized error or null
  status?: number | null; // HTTP-like status code
};
```

**Usage Patterns**:

**Direct CRUD (global tables)**:

```typescript
import { listRows, getRow, insertRow } from "@shared/services/crud";

// List with filters
const jobs = await listRows("jobs", "*", {
  eq: { status: "active" },
  order: { column: "created_at", ascending: false },
  limit: 10,
});

// Single row
const job = await getRow("jobs", "*", {
  eq: { id: jobId },
  single: true,
});
```

**User-Scoped CRUD (recommended)**:

```typescript
import { withUser } from "@shared/services/crud";
import { useAuth } from "@shared/context/AuthContext";

const { user } = useAuth();
const userCrud = withUser(user?.id);

// All operations auto-scope to user_id
const myJobs = await userCrud.listRows("jobs", "*");
const newJob = await userCrud.insertRow("jobs", { title: "Engineer" });
```

**Filter Options**:

```typescript
{
  eq: { status: "active", user_id: "123" },     // Equality
  neq: { archived: true },                       // Not equal
  like: { title: "Engineer%" },                  // Case-sensitive LIKE
  ilike: { email: "%@gmail.com" },              // Case-insensitive LIKE
  in: { status: ["active", "pending"] },        // IN clause
  order: { column: "created_at", ascending: false },
  limit: 20,
  offset: 40,
  single: true  // Use maybeSingle() instead of array
}
```

**Key Features**:

- **Automatic user scoping**: `withUser()` injects `user_id` filter to all queries
- **RLS enforcement**: Respects Postgres Row-Level Security policies
- **Consistent error handling**: Standardized `CrudError` shape
- **TypeScript safety**: Full generic type support
- **Pagination**: Limit/offset support
- **Flexible filtering**: Multiple operators (eq, neq, like, ilike, in)

**54 imports across codebase** - Second most used service

**Design Philosophy**:

- Thin wrapper over Supabase (no business logic)
- User scoping prevents data leaks
- Result<T> pattern avoids try/catch boilerplate
- Generic types preserve table-specific typing

---

### types.ts

**Shared TypeScript types for service layer**

**Exports**:

**Error Types**:

```typescript
type CrudError = {
  message: string; // Human-readable error message
  code?: string; // Optional error code (e.g., "23505")
  status?: number | null; // HTTP-like status (400, 401, 500)
};

type Result<T> = {
  data: T | null;
  error: CrudError | null;
  status?: number | null;
};
```

**Query Types**:

```typescript
type OrderOption = {
  column: string;
  ascending?: boolean;
};

type FilterOptions = {
  eq?: Record<string, string | number | boolean | null>;
  neq?: Record<string, string | number | boolean | null>;
  like?: Record<string, string>;
  ilike?: Record<string, string>;
  in?: Record<string, Array<string | number>>;
};

type ListOptions = FilterOptions & {
  order?: OrderOption;
  limit?: number;
  offset?: number;
  single?: boolean;
};
```

**Database Row Types**:

```typescript
interface ProfileRow {
  id: string;
  email: string;
  first_name?: string | null;
  full_name?: string | null;
  professional_title?: string | null;
  summary?: string | null;
  experience_level?: string | null;
  city?: string | null;
  state?: string | null;
  meta?: Record<string, unknown> | null; // Avatar info, etc.
}

interface Project {
  id: string;
  projectName: string;
  description: string;
  role: string;
  startDate: string;
  endDate: string;
  technologies: string;
  status: "Completed" | "Ongoing" | "Planned";
}
```

**Usage**:

```typescript
import type { Result, ListOptions, ProfileRow } from "@shared/services/types";

async function loadProfile(userId: string): Promise<Result<ProfileRow>> {
  const opts: ListOptions = {
    eq: { id: userId },
    single: true,
  };
  return getRow<ProfileRow>("profiles", "*", opts);
}
```

**Type Subfolder**:

- `types/aiArtifacts.ts` - AI artifact-specific types (detailed content shapes)

---

### dbMappers.ts

**Form payload → database payload transformations + CRUD helpers**

**Purpose**:

- Validate and normalize user input before database writes
- Map UI field names to database column names
- Enforce required fields and constraints
- Provide convenience CRUD wrappers for common tables

**Exported Mappers**:

**Employment**:

```typescript
mapEmployment(formData) → { payload } | { error }
```

- **Required**: job_title, company_name, start_date
- **Normalizes**: Date formats, current position flag
- **Maps**: position→job_title, company→company_name

**Skills**:

```typescript
mapSkill(formData) → { payload } | { error }
```

- **Required**: skill_name
- **Normalizes**: Proficiency (1-5 → beginner/intermediate/advanced/expert)
- **Defaults**: category = "Technical"

**Education**:

```typescript
mapEducation(formData) → { payload } | { error }
```

- **Required**: institution_name, start_date
- **Normalizes**: Date formats, GPA (0-4 range)
- **Maps**: degree→degree_type, major→field_of_study

**Projects**:

```typescript
mapProject(formData) → { payload } | { error }
```

- **Required**: proj_name (or title), start_date
- **Normalizes**: Tech stack (comma-separated → array)
- **Status**: is_ongoing → "ongoing" | "planned"

**Jobs**:

```typescript
mapJob(formData) → { payload } | { error }
```

- **Required**: job_title, company_name
- **Normalizes**: Salary ranges, deadline dates
- **Auto-sets**: status_changed_at timestamp
- **Default**: job_status = "Interested"

**Job Notes**:

```typescript
mapJobNote(formData) → { payload } | { error }
```

- **No required fields** (notes can be sparse)
- **Normalizes**: application_history JSON parsing
- **Fields**: recruiter info, interview notes, salary notes

**Cover Letter Drafts**:

```typescript
mapCoverLetterDraft(formData) → { payload } | { error }
```

- **Required**: name
- **Normalizes**: content/metadata JSON parsing
- **Defaults**: template_id="formal", metadata with tone/length/culture

**CRUD Helper Functions**:

Jobs:

- `listJobs(userId, opts?)`
- `getJob(userId, jobId)`
- `createJob(userId, formData)`
- `updateJob(userId, jobId, formData)` - Supports partial updates
- `deleteJob(userId, jobId)`

Job Notes:

- `listJobNotes(userId, opts?)`
- `getJobNote(userId, noteId)`
- `createJobNote(userId, formData)`
- `updateJobNote(userId, noteId, formData)` - Partial updates allowed
- `deleteJobNote(userId, noteId)`

Cover Letter Drafts:

- `listCoverLetterDrafts(userId, opts?)`
- `getCoverLetterDraft(userId, draftId)`
- `createCoverLetterDraft(userId, formData)`
- `updateCoverLetterDraft(userId, draftId, formData)`
- `deleteCoverLetterDraft(userId, draftId)`

**Date Normalization Helper**:

```typescript
formatToSqlDate(value: unknown) → string | null
```

- Accepts: Date objects, "YYYY-MM-DD", "YYYY-MM" (adds -01)
- Returns: SQL date string or null
- Validates: Regex patterns for format enforcement

**Usage Pattern**:

```typescript
import { mapJob, createJob } from "@shared/services/dbMappers";

// Manual mapping
const mapped = mapJob({ title: "Engineer", company: "Acme" });
if (mapped.error) {
  handleError(mapped.error);
} else {
  await insertRow("jobs", mapped.payload);
}

// Or use convenience wrapper
const result = await createJob(user.id, formData);
if (result.error) handleError(result.error);
```

**Update Behavior**:

- `updateJob()`: Uses mapper if core fields present, otherwise passes through (allows status-only updates)
- `updateJobNote()`, `updateCoverLetterDraft()`: Allow partial patches (no mapper)

**Test Coverage**:

- `dbMappers.test.ts` - Unit tests for date normalization and mapper validation

**14 imports across codebase**

**Key Design Decisions**:

- Mappers return `{ payload }` or `{ error }` (never throw)
- Validation errors are user-friendly strings
- Partial updates supported for flexible UI flows
- User-scoped CRUD wrappers prevent accidental data leaks

---

## Specialized Services

### aiArtifacts.ts

**Manage AI-generated content (resumes, cover letters, match scores, etc.)**

**Purpose**: CRUD operations for `ai_artifacts` table with specialized helpers

**Artifact Types** (AiArtifactKind):

- `resume` - Tailored resume content
- `cover_letter` - Generated cover letters
- `skills_optimization` - Skill recommendations
- `company_research` - Company info and news
- `match` - Job match scores and breakdowns
- `gap_analysis` - Skill gap identification

**Core Functions**:

```typescript
// Create artifact
insertAiArtifact(userId, payload: {
  kind: AiArtifactKind,
  content: Record<string, unknown>,  // Kind-specific content
  title?: string,
  job_id?: number,
  prompt?: string,
  model?: string,
  metadata?: Record<string, unknown>
}) → Result<AiArtifactRow>

// Fetch single artifact
getAiArtifact(userId, id) → Result<AiArtifactRow | null>

// List with filters
listAiArtifacts(userId, opts?) → Result<AiArtifactRow[]>

// List for specific job
listAiArtifactsForJob(userId, jobId, opts?) → Result<AiArtifactRow[]>

// Update metadata/title (content updates should create new artifacts)
updateAiArtifactMeta(userId, id, { title?, metadata? }) → Result<AiArtifactRow>

// Clone artifact with optional overrides
cloneAiArtifact(userId, source, overrides?) → Result<AiArtifactRow>

// Link/unlink artifact to job
linkArtifactToJob(userId, artifactId, jobId) → Result<AiArtifactRow>
unlinkArtifactFromJob(userId, artifactId) → Result<AiArtifactRow>

// Get latest materials for a job
getLatestMaterialsForJob(userId, jobId) → Result<{
  resume: AiArtifactRow | null,
  cover_letter: AiArtifactRow | null
}>
```

**Content Structure**:
Each artifact kind has a specific content shape (defined in `types/aiArtifacts.ts`):

**Resume**:

```typescript
{
  bullets: [{ text, impact_score?, source_employment_id? }],
  variants?: [{ id, name, bullets, relevance_score? }],
  summary?: string
}
```

**Cover Letter**:

```typescript
{
  sections: { opening, body, closing },
  variants?: [{ id, tone, content, relevance_score? }],
  highlighted_experiences?: [{ employment_id, snippet, reason }]
}
```

**Match Score**:

```typescript
{
  overall_score: number,
  breakdown: { skills, experience, education },
  matched_skills: [{ skill_name, match_level }],
  missing_skills: [{ skill_name, impact }],
  explanation: string
}
```

**Usage**:

```typescript
import aiArtifacts from "@shared/services/aiArtifacts";

// Create resume artifact
const resume = await aiArtifacts.insertAiArtifact(user.id, {
  kind: "resume",
  title: "Software Engineer - Acme Corp",
  job_id: 123,
  prompt: "Tailor my resume for this job...",
  model: "gpt-4",
  content: {
    bullets: [{ text: "Led team of 5 engineers", impact_score: 0.9 }],
  },
  metadata: { template: "modern", generated_at: Date.now() },
});

// Get latest materials
const { data } = await aiArtifacts.getLatestMaterialsForJob(user.id, jobId);
console.log(data.resume, data.cover_letter);
```

**4 imports** - Used by AI workspace hooks

**Design Notes**:

- Content is versioned via new artifact rows (immutable history)
- Metadata stores generation config, UI state, scores
- Linking to jobs enables material history tracking

---

### jobMaterials.ts

**Track which resume/cover letter versions were used for job applications**

**Purpose**: Maintain audit trail of materials associated with each job

**Database Pattern**:

- Insert-only history (no updates/deletes)
- Each material change = new `job_materials` row
- Latest selection retrieved via `v_job_current_materials` view

**Interface**:

```typescript
interface JobMaterialsRow {
  id: string;
  user_id: string;
  job_id: number;
  resume_document_id?: string | null; // Uploaded document
  resume_artifact_id?: string | null; // AI-generated artifact
  cover_document_id?: string | null;
  cover_artifact_id?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
```

**Functions**:

```typescript
// Add new material selection (creates history entry)
addJobMaterials(userId, {
  job_id,
  resume_document_id?,
  resume_artifact_id?,
  cover_document_id?,
  cover_artifact_id?,
  metadata?
}) → Result<JobMaterialsRow>

// Get full history for a job (newest first)
listJobMaterialsHistory(userId, jobId, opts?) → Result<JobMaterialsRow[]>

// Get current materials (latest selection)
getCurrentJobMaterials(userId, jobId) → Result<JobMaterialsRow | null>
```

**Usage Pattern**:

```typescript
import {
  addJobMaterials,
  getCurrentJobMaterials,
} from "@shared/services/jobMaterials";

// User selects new resume for job
await addJobMaterials(user.id, {
  job_id: 123,
  resume_artifact_id: "abc-123", // AI-generated resume
  cover_document_id: "def-456", // Uploaded cover letter
});

// Get current selection
const { data } = await getCurrentJobMaterials(user.id, 123);
console.log(data?.resume_artifact_id);

// View history
const history = await listJobMaterialsHistory(user.id, 123);
history.data.forEach((entry) => {
  console.log(`${entry.created_at}: Resume ${entry.resume_artifact_id}`);
});
```

**Flexibility**:

- Can link to uploaded documents OR AI artifacts
- Supports partial updates (only resume, only cover letter)
- Metadata field for future extensions (submission status, notes, etc.)

**3 imports** - Used by Jobs workspace and LinkDocumentDialog

---

### documents.ts

**Manage uploaded files (resumes, cover letters, portfolios)**

**Purpose**: CRUD operations for `documents` table + signed URL generation

**Document Types**:

```typescript
type DocumentKind = "resume" | "cover_letter" | "portfolio" | "other";
```

**Interface**:

```typescript
interface DocumentRow {
  id: string;
  user_id: string;
  kind: DocumentKind;
  file_name: string;
  file_path: string; // Format: "bucket/key" or just "key"
  mime_type?: string | null;
  bytes?: number | null;
  meta?: Record<string, unknown> | null;
  uploaded_at: string;
}
```

**Functions**:

```typescript
// List user's documents
listDocuments(userId, opts?) → Result<DocumentRow[]>

// Get single document
getDocument(userId, id) → Result<DocumentRow | null>

// Generate signed download URL
getSignedDownloadUrl(filePath, expiresInSeconds?, defaultBucket?) → Result<{ url: string }>
```

**Storage Path Parsing**:

- Format 1: `"bucket/path/to/file.pdf"` → `{ bucket: "bucket", key: "path/to/file.pdf" }`
- Format 2: `"file.pdf"` + `defaultBucket` → `{ bucket: defaultBucket, key: "file.pdf" }`

**Usage**:

```typescript
import {
  listDocuments,
  getSignedDownloadUrl,
} from "@shared/services/documents";

// List resumes
const resumes = await listDocuments(user.id, {
  eq: { kind: "resume" },
  order: { column: "uploaded_at", ascending: false },
});

// Get download URL
const doc = resumes.data[0];
const { data } = await getSignedDownloadUrl(doc.file_path, 3600); // 1 hour expiry
window.open(data.url);
```

**Storage Integration**:

- Uses Supabase Storage buckets
- Signed URLs for secure downloads
- Supports custom expiry times

**2 imports** - Used by Jobs workspace

---

### cache.ts

**In-memory data caching layer for performance optimization**

**Purpose**: Reduce redundant API calls with TTL-based caching

**Class**: `DataCache`

**Methods**:

```typescript
// Store data with optional TTL
set(key: string, data: unknown, ttl?: number): void

// Retrieve cached data (auto-removes expired)
get<T>(key: string): T | null

// Remove specific entry
invalidate(key: string): boolean

// Remove entries matching regex
invalidatePattern(pattern: RegExp): number

// Clear all cache
clear(): void

// Get cache statistics
getStats(): { size, expired, valid }

// Manual cleanup of expired entries
cleanup(): number
```

**Configuration**:

- **Default TTL**: 5 minutes (300,000ms)
- **Storage**: In-memory Map (cleared on page refresh)
- **Eviction**: Lazy (on access) + manual cleanup

**Usage**:

```typescript
import { dataCache, getCacheKey } from "@shared/services/cache";

// Cache jobs for user
const cacheKey = getCacheKey("jobs", user.id);
dataCache.set(cacheKey, jobsData, 5 * 60 * 1000);

// Retrieve cached data
const cached = dataCache.get<JobRow[]>(cacheKey);
if (cached) return cached;

// Invalidate on mutation
dataCache.invalidate(cacheKey);

// Invalidate all jobs caches
dataCache.invalidatePattern(/^jobs-/);
```

**Helper Functions**:

```typescript
// Generate user-scoped cache key
getCacheKey(resource: string, userId: string, suffix?: string): string
// Example: getCacheKey("jobs", "123") → "jobs-123"
// Example: getCacheKey("jobs", "123", "active") → "jobs-123-active"
```

**Limitations**:

- In-memory only (no persistence)
- Simple TTL-based expiration (no LRU yet)
- Not suitable for large datasets
- Consider react-query for advanced use cases

**2 imports** - Used by jobsService for performance

**Design Notes**:

- Lightweight alternative to react-query
- Useful for demo/prototype performance
- Can be replaced with react-query later

---

### fetchCompanyNews.ts

**Fetch live company news from Google News RSS**

**Purpose**: Enrich company research with recent news

**API**:

- Google News RSS → rss2json.com converter (free, no API key)

**Function**:

```typescript
fetchCompanyNews(companyName: string) → Promise<CompanyNewsItem[]>
```

**Return Type**:

```typescript
{
  title: string,
  category: "Finance" | "Product" | "Business" | "Technology" | "Legal" | "General",
  date: string,           // YYYY-MM-DD format
  source: string,         // Hostname (e.g., "techcrunch.com")
  relevance: number,      // 0-1 score based on company name mentions
  summary: string,        // HTML-stripped description
  link: string
}[]
```

**Features**:

- **Category detection**: Earnings → Finance, Product launch → Product, etc.
- **Relevance scoring**: Title match + mention count
- **Deduplication**: Filters duplicate links
- **Filtering**: Only returns articles mentioning company name
- **Limit**: Max 10 results

**Usage**:

```typescript
import { fetchCompanyNews } from "@shared/services/fetchCompanyNews";

const news = await fetchCompanyNews("Google");
news.forEach((item) => {
  console.log(`${item.date} [${item.category}]: ${item.title}`);
  console.log(`Relevance: ${item.relevance * 100}%`);
});
```

**Error Handling**:

- Returns empty array on failure (no throw)
- Logs errors to console

**2 imports** - Used by useCompanyResearch hook

---

## Resume Draft Services (AI Workspace Specific)

These services are specialized for the AI workspace's resume builder and should be considered for moving to `workspaces/ai/services/`.

### resumeDraftsService.ts

**Database CRUD for resume drafts table**

**Purpose**: Persist resume drafts with versioning and conflict resolution

**Interface**:

```typescript
interface ResumeDraftRow {
  id: string;
  user_id: string;
  name: string;
  template_id: string;
  source_artifact_id?: string | null;  // Link to AI artifact if generated
  content: {
    summary?: string;
    skills?: string[];
    experience?: Array<{
      employment_id?: string;
      role?: string;
      company?: string;
      dates?: string;
      bullets: string[];
      relevance_score?: number;
    }>;
    education?: Array<{...}>;
    projects?: Array<{...}>;
  };
  metadata: {
    sections: Array<{
      type: "summary" | "skills" | "experience" | "education" | "projects";
      visible: boolean;
      state: "empty" | "applied" | "from-profile" | "edited";
    }>;
    lastModified: string;
    createdAt: string;
    jobId?: number;
    jobTitle?: string;
    jobCompany?: string;
  };
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

**Functions**:

```typescript
// List active drafts (is_active=true)
listResumeDrafts(userId) → Result<ResumeDraftRow[]>

// Get draft (updates last_accessed_at)
getResumeDraft(userId, draftId) → Result<ResumeDraftRow | null>

// Create new draft
createResumeDraft(userId, {
  name,
  template_id?,
  source_artifact_id?,
  content?,
  metadata?,
  jobId?
}) → Result<ResumeDraftRow>

// Update draft with automatic retry on version conflict
updateResumeDraft(userId, draftId, updates, maxRetries?) → Result<ResumeDraftRow>

// Delete draft (hard delete)
deleteResumeDraft(userId, draftId) → Result<null>

// Restore archived draft
restoreResumeDraft(userId, draftId) → Result<ResumeDraftRow>

// Duplicate draft
duplicateResumeDraft(userId, draftId, newName?) → Result<ResumeDraftRow>

// List archived drafts
listArchivedDrafts(userId) → Result<ResumeDraftRow[]>
```

**Optimistic Locking**:

- Version number incremented on each update
- `updateResumeDraft()` retries on conflict (up to 3 times)
- Exponential backoff: 100ms, 200ms, 400ms
- Prevents race conditions from concurrent edits

**Usage**:

```typescript
import {
  createResumeDraft,
  updateResumeDraft,
} from "@shared/services/resumeDraftsService";

// Create draft
const draft = await createResumeDraft(user.id, {
  name: "Software Engineer Resume",
  template_id: "modern",
  jobId: 123,
});

// Update with conflict handling
const updated = await updateResumeDraft(user.id, draft.data.id, {
  content: { ...newContent },
});
// Automatically retries if version conflict occurs
```

**2 imports** - Used by useResumeDraftsV2 hook

---

### resumeDraftsCache.ts

**localStorage caching layer for resume drafts**

**Purpose**: Fast page loads + offline support while syncing with database

**Strategy**:

1. Load from cache immediately (instant UI)
2. Background sync with database
3. Write-through: update both cache + DB
4. Timestamp-based invalidation

**Cache Structure**:

```typescript
{
  userId: string;
  drafts: ResumeDraft[];
  activeDraftId: string | null;
  lastSyncedAt: string;    // ISO timestamp
  version: number;         // Cache version (currently 2)
}
```

**Configuration**:

- **Key**: `resume_drafts_cache_v2`
- **Max Age**: 5 minutes
- **Scope**: User-specific

**Functions**:

```typescript
// Load from cache (returns null if stale/missing)
loadFromCache(userId) → CachedDraftsData | null

// Save to cache
saveToCache(userId, drafts, activeDraftId) → void

// Clear cache
clearCache(userId?) → void

// Check if cache is fresh
isCacheFresh(userId) → boolean

// Get cache age in milliseconds
getCacheAge(userId) → number | null
```

**Usage**:

```typescript
import { loadFromCache, saveToCache } from "@shared/services/resumeDraftsCache";

// On mount: try cache first
const cached = loadFromCache(user.id);
if (cached && isCacheFresh(user.id)) {
  setDrafts(cached.drafts);
}

// Background sync from DB
const { data } = await listResumeDrafts(user.id);
setDrafts(data);
saveToCache(user.id, data, activeDraftId);
```

**1 import** - Used by useResumeDraftsV2

**Design Notes**:

- Non-fatal failures (cache is optional)
- Stale cache still returned for UX (marked for refresh)
- Version bump clears incompatible caches

---

### resumeVersionService.ts

**Git-like version control for resume drafts**

**Purpose**: Automatic version creation, comparison, and restoration

**Interface**:

```typescript
interface ResumeDraftVersion {
  id: string;
  user_id: string;
  name: string;
  version: number;
  is_active: boolean;
  parent_draft_id: string | null;  // Link to previous version
  origin_source: string;           // "manual" | "ai" | "restore"
  template_id: string;
  content: {...};
  metadata: {...};
  content_hash: string | null;     // SHA-256 hash for change detection
  created_at: string;
  updated_at: string;
}
```

**Functions**:

```typescript
// Create version if content changed (via hash comparison)
createVersionIfChanged(currentDraftId, newContent, newMetadata, userId, originSource?)
  → Promise<string | null>  // Returns new version ID or null if no change

// Update draft without versioning (metadata-only changes)
updateDraftInPlace(draftId, updates, userId) → Promise<boolean>

// Get all versions for a draft family
getVersionHistory(draftId, userId) → Promise<ResumeDraftVersion[]>

// Get latest active version
getLatestVersion(rootDraftId, userId) → Promise<ResumeDraftVersion | null>

// Compare two versions side-by-side
compareVersions(versionId1, versionId2, userId) → Promise<VersionComparison | null>

// Restore previous version (creates new version with old content)
restoreVersion(versionToRestoreId, userId) → Promise<string | null>

// Delete version (soft delete - marks inactive)
deleteVersion(versionId, userId) → Promise<boolean>
```

**Version Comparison**:

```typescript
{
  version1: ResumeDraftVersion,
  version2: ResumeDraftVersion,
  differences: {
    summary?: { old, new },
    skills?: { added: string[], removed: string[] },
    experience?: { added, removed, modified },
    education?: { added, removed, modified },
    projects?: { added, removed, modified }
  }
}
```

**Hash-Based Change Detection**:

- Uses SHA-256 of content
- Skips version creation if hash matches
- Ensures only meaningful changes create versions

**Usage**:

```typescript
import {
  createVersionIfChanged,
  getVersionHistory,
  compareVersions,
} from "@shared/services/resumeVersionService";

// Auto-version on save
const newVersionId = await createVersionIfChanged(
  draftId,
  updatedContent,
  updatedMetadata,
  user.id,
  "manual"
);
if (newVersionId) {
  console.log("Created version:", newVersionId);
} else {
  console.log("No changes detected");
}

// View history
const versions = await getVersionHistory(draftId, user.id);
console.log(`${versions.length} versions`);

// Compare versions
const comparison = await compareVersions(v1.id, v2.id, user.id);
console.log("Added skills:", comparison.differences.skills?.added);
```

**2 imports** - Used by VersionHistoryPanel and VersionComparisonDialog

**Design Notes**:

- Automatic versioning reduces user burden
- Hash comparison prevents duplicate versions
- Parent links create version tree
- Soft delete preserves history

---

### resumeDraftsMigration.ts

**One-time migration from localStorage to database**

**Purpose**: Move legacy localStorage drafts to database on first login

**Status**: ⚠️ **Currently commented out in usage** (useResumeDraftsV2.ts line 50)

**Migration Flow**:

1. Check migration flag in localStorage
2. Load drafts from `resume_drafts_v2` key
3. Create each draft in database
4. Mark migration complete
5. Optionally clear localStorage

**Functions**:

```typescript
// Check if already migrated
isMigrationComplete() → boolean

// Run migration
migrateLocalStorageDraftsToDatabase(userId, clearAfter?) → Promise<{
  migrated: number,
  errors: Array<{ draftName, error }>
}>

// Reset flag (testing only)
resetMigrationFlag() → void

// Get migration status
getMigrationStatus() → {
  isComplete: boolean,
  localDraftsCount: number
}
```

**Usage** (when enabled):

```typescript
import { migrateLocalStorageDraftsToDatabase } from "@shared/services/resumeDraftsMigration";

// On first login
useEffect(() => {
  if (user && !isMigrationComplete()) {
    migrateLocalStorageDraftsToDatabase(user.id, true).then((result) => {
      console.log(`Migrated ${result.migrated} drafts`);
      if (result.errors.length) {
        console.error("Migration errors:", result.errors);
      }
    });
  }
}, [user]);
```

**0 active imports** - Migration commented out

**Recommendation**:

- Keep for potential future use or remove if localStorage path is abandoned
- Currently inactive but well-documented

---

## Barrel Export (index.ts)

**Current Exports**:

```typescript
export * from "./crud"; // CRUD helpers + withUser
export { supabase } from "./supabaseClient";
export * from "./jobMaterials";
export * from "./dbMappers";
export * from "./documents";
export * from "./aiArtifacts";
export type { CrudError } from "./types";
export type { AiArtifactRow } from "./types/aiArtifacts";
```

**Missing from Barrel**:

- `cache.ts` - Used but not exported (direct import)
- `fetchCompanyNews.ts` - Used but not exported (direct import)
- `resumeDraftsService.ts` - AI-specific, direct import intentional
- `resumeDraftsCache.ts` - AI-specific, direct import intentional
- `resumeVersionService.ts` - AI-specific, direct import intentional
- `resumeDraftsMigration.ts` - Utility, direct import intentional
- `types.ts` - Partially exported (CrudError only)

**Import Patterns**:

```typescript
// Barrel imports (most common)
import { withUser, listRows } from "@shared/services";
import { supabase } from "@shared/services";

// Direct imports (specific services)
import { dataCache } from "@shared/services/cache";
import { fetchCompanyNews } from "@shared/services/fetchCompanyNews";
import type { ProfileRow, ListOptions } from "@shared/services/types";
```

---

## Usage Statistics

**By Import Count**:

1. `supabaseClient.ts` - 71 imports (core infrastructure)
2. `crud.ts` - 54 imports (primary data layer)
3. `dbMappers.ts` - 14 imports (form handling)
4. `aiArtifacts.ts` - 4 imports (AI workspace)
5. `jobMaterials.ts` - 3 imports (Jobs workspace)
6. `cache.ts` - 2 imports (jobsService optimization)
7. `documents.ts` - 2 imports (Jobs workspace)
8. `fetchCompanyNews.ts` - 2 imports (useCompanyResearch)
9. `resumeDraftsService.ts` - 2 imports (AI workspace)
10. `resumeVersionService.ts` - 2 imports (AI workspace)
11. `resumeDraftsCache.ts` - 1 import (AI workspace)
12. `resumeDraftsMigration.ts` - 0 imports (commented out)

**By Workspace**:

- **Shared (cross-workspace)**: supabaseClient, crud, types, dbMappers, cache
- **AI Workspace**: aiArtifacts, resumeDrafts\*, fetchCompanyNews
- **Jobs Workspace**: jobMaterials, documents

---

## Design Patterns & Best Practices

### Result<T> Pattern

**All services return** `Result<T>` instead of throwing:

```typescript
const result = await listRows("jobs", "*");
if (result.error) {
  handleError(result.error);
} else {
  setData(result.data);
}
```

**Benefits**:

- No try/catch boilerplate
- Standardized error handling
- TypeScript-friendly (explicit null checks)

### User Scoping with withUser()

**Always scope user-owned data**:

```typescript
const userCrud = withUser(user?.id);
const jobs = await userCrud.listRows("jobs", "*"); // Auto-filters user_id
```

**Prevents**:

- Accidental data leaks
- RLS policy violations
- Manual user_id filtering errors

### Immutable Audit Trails

**For history-critical tables** (job_materials, ai_artifacts):

- Insert new rows instead of updating
- Never delete (soft delete with is_active flag)
- Retrieve latest via views or ORDER BY created_at DESC

**Benefits**:

- Complete audit trail
- Rollback capability
- Analytics on material usage

### Separation of Concerns

**Services handle data only**:

- No business logic (belongs in hooks/components)
- No UI state management
- No side effects beyond database operations

**Example**:

```typescript
// ❌ Bad: Business logic in service
async function createJobWithNotification(userId, jobData) {
  const job = await insertRow("jobs", jobData);
  showNotification("Job created!");
  return job;
}

// ✅ Good: Service only handles data
async function createJob(userId, jobData) {
  return insertRow("jobs", jobData);
}

// Business logic in component
const { data, error } = await createJob(user.id, formData);
if (!error) showNotification("Job created!");
```

---

## Testing

**Test Files**:

- `dbMappers.test.ts` - Mapper validation and date normalization

**Coverage**:

- Mappers: Date parsing, validation logic
- Missing: CRUD helpers, service functions

**Recommendation**: Add integration tests for:

- User scoping (withUser)
- Filter combinations
- Versioning logic (resume drafts)
- Cache TTL behavior

---

## Recommendations for Refactoring

### 1. Move Resume Services to AI Workspace

**Issue**: Resume draft services are AI-workspace-specific but in shared/

**Files to Move**:

- `resumeDraftsService.ts` → `workspaces/ai/services/`
- `resumeDraftsCache.ts` → `workspaces/ai/services/`
- `resumeVersionService.ts` → `workspaces/ai/services/`
- `resumeDraftsMigration.ts` → `workspaces/ai/services/`

**Benefits**:

- Clearer separation of concerns
- shared/ only contains truly cross-workspace code
- Easier to maintain AI workspace as a unit

**Impact**:

- Update 5 import paths in AI workspace components
- No functional changes

### 2. Complete Barrel Export

**Add to index.ts**:

```typescript
export * from "./cache";
export * from "./fetchCompanyNews";
export * from "./types"; // Export all types, not just CrudError
```

**Benefits**:

- Consistent import pattern
- Easier to discover available services

### 3. Consider react-query Migration

**Current State**:

- Custom `dataCache` for performance
- Manual cache invalidation
- No refetch/background sync

**Upgrade Path**:

- Replace `dataCache` with react-query hooks
- Get automatic refetch, optimistic updates, background sync
- Better TypeScript inference

**Trade-off**: Adds dependency, more complex setup

### 4. Add Service Tests

**Priority Tests**:

1. `withUser()` scoping (ensure RLS enforcement)
2. Filter combinations (eq + order + limit)
3. Version conflict resolution (resume drafts)
4. Cache TTL expiration

### 5. Consolidate Mapper Exports

**Current**: Mappers + CRUD helpers mixed in `dbMappers.ts`

**Option**: Split into:

- `mappers.ts` - Pure transformation functions
- `dbHelpers.ts` - Convenience CRUD wrappers

**Benefit**: Clearer separation, easier testing

---

## Migration Guide

### Moving Resume Services to AI Workspace

**Step 1**: Create AI services directory

```bash
mkdir -p frontend/src/app/workspaces/ai/services
```

**Step 2**: Move files

```bash
mv shared/services/resumeDrafts*.ts workspaces/ai/services/
mv shared/services/resumeVersion*.ts workspaces/ai/services/
```

**Step 3**: Update imports (5 files)

```typescript
// Before
import { createResumeDraft } from "@shared/services/resumeDraftsService";

// After
import { createResumeDraft } from "@ai/services/resumeDraftsService";
```

**Files to Update**:

- `workspaces/ai/hooks/useResumeDraftsV2.ts`
- `workspaces/ai/components/resume-v2/VersionHistoryPanel.tsx`
- `workspaces/ai/components/resume-v2/VersionComparisonDialog.tsx`

**Step 4**: Remove from shared barrel export (if added)

**Step 5**: Test

```bash
cd frontend
npm run typecheck
npm run lint
```

---

## Common Import Patterns

```typescript
// Core database operations
import { supabase } from "@shared/services/supabaseClient";
import { withUser, listRows, insertRow } from "@shared/services/crud";
import type { Result, ListOptions } from "@shared/services/types";

// Form handling
import { mapJob, createJob, updateJob } from "@shared/services/dbMappers";

// AI artifacts
import aiArtifacts from "@shared/services/aiArtifacts";
import type { AiArtifactKind } from "@shared/services/types/aiArtifacts";

// Job materials
import {
  addJobMaterials,
  getCurrentJobMaterials,
} from "@shared/services/jobMaterials";

// Documents
import {
  listDocuments,
  getSignedDownloadUrl,
} from "@shared/services/documents";

// Caching
import { dataCache, getCacheKey } from "@shared/services/cache";

// External APIs
import { fetchCompanyNews } from "@shared/services/fetchCompanyNews";

// Auth helpers
import { getUserProfile, updateUserProfile } from "@shared/services/crud";
```

---

## Environment Requirements

**Required Variables** (.env.local):

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**Validation**: `supabaseClient.ts` throws if missing

---

## Related Documentation

- [Copilot Instructions](../../../../.github/copilot-instructions.md) - Service usage patterns
- [Database Schema](../../../../.github/instructions/database_schema.instructions.md) - Table structures
- [Hooks Documentation](../hooks/README.md) - Consumer patterns
- [Context Documentation](../context/README.md) - Auth integration

---

## Quick Reference

**Most Common Operations**:

```typescript
// ━━━ User-scoped CRUD ━━━
const userCrud = withUser(user?.id);
const jobs = await userCrud.listRows("jobs", "*");
const job = await userCrud.getRow("jobs", "*", { eq: { id: 123 } });
const newJob = await userCrud.insertRow("jobs", { title: "Engineer" });
const updated = await userCrud.updateRow("jobs", { status: "Applied" }, { eq: { id: 123 } });
await userCrud.deleteRow("jobs", { eq: { id: 123 } });

// ━━━ Global CRUD ━━━
const profiles = await listRows("profiles", "*", { limit: 10 });
const profile = await getRow("profiles", "*", { eq: { id: userId }, single: true });

// ━━━ Form Mapping ━━━
const mapped = mapJob(formData);
if (mapped.error) return handleError(mapped.error);
await userCrud.insertRow("jobs", mapped.payload);

// ━━━ AI Artifacts ━━━
await aiArtifacts.insertAiArtifact(user.id, {
  kind: "resume",
  content: { bullets: [...] },
  job_id: 123
});
const latest = await aiArtifacts.getLatestMaterialsForJob(user.id, 123);

// ━━━ Job Materials ━━━
await addJobMaterials(user.id, {
  job_id: 123,
  resume_artifact_id: "abc"
});
const current = await getCurrentJobMaterials(user.id, 123);

// ━━━ Caching ━━━
const key = getCacheKey("jobs", user.id);
const cached = dataCache.get<Job[]>(key);
if (!cached) {
  const data = await fetchJobs();
  dataCache.set(key, data);
}
```

---

**Last Updated**: 2025-01-XX
**Maintainers**: Development Team
**Related**: [Frontend Architecture](../../README.md)
