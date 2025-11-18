# Frontend Files - Detailed Reference

## Core Application Files

### `src/main.tsx` - Application Entry Point

**Purpose:** Initializes React app and renders root component

**Key Responsibilities:**

- Creates React root
- Wraps app with providers
- Renders router

**Inputs:** None (entry point)

**Outputs:** Rendered React application in DOM

**Code Structure:**

```typescript
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "@shared/context/AuthContext";
import { ThemeProvider } from "@shared/context/ThemeContext";
import router from "./router";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </AuthProvider>
);
```

---

### `src/router.tsx` - Route Configuration

**Purpose:** Defines all application routes and navigation

**Key Responsibilities:**

- Maps URLs to page components
- Implements protected routes
- Configures nested routes

**Inputs:** None

**Outputs:** Router instance for `RouterProvider`

**Routes Defined:**

- `/` → Landing/Login page
- `/jobs` → Pipeline page (protected)
- `/profile` → Profile page (protected)
- `/ai` → AI workspace (protected)
- `/ai/resume` → Resume generator (protected)
- `/ai/cover-letter` → Cover letter generator (protected)
- `/interview-hub` → Interview Hub (protected)

**Example:**

```typescript
const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        path: "/jobs",
        element: (
          <ProtectedRoute>
            <PipelinePage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
```

---

## Shared Context Files

### `src/app/shared/context/AuthContext.tsx`

**Purpose:** Manages authentication state across entire app

**Inputs:**

- Supabase auth events (login, logout, session refresh)

**Outputs:**

- `user` - Current user object or null
- `session` - Active session or null
- `loading` - Authentication loading state
- `signIn(email, password)` - Login function
- `signUp(email, password)` - Registration function
- `signOut()` - Logout function

**Usage:**

```typescript
const { user, loading, signIn } = useAuth();

if (loading) return <LoadingScreen />;
if (!user) return <LoginPage />;
```

**Internal State:**

```typescript
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}
```

---

### `src/app/shared/context/ThemeContext.tsx`

**Purpose:** Manages light/dark theme toggle

**Inputs:**

- User theme preference from localStorage

**Outputs:**

- `mode` - Current theme mode ("light" | "dark")
- `toggleColorMode()` - Function to switch themes
- `theme` - Material-UI theme object

**Persistence:**

```typescript
localStorage.setItem("theme-mode", mode);
```

---

### `src/app/shared/context/ProfileChangeContext.tsx`

**Purpose:** Tracks when user profile changes to invalidate analytics cache

**Inputs:**

- Manual calls to `markProfileChanged()`

**Outputs:**

- `hasProfileChanged` - Boolean flag
- `markProfileChanged()` - Set flag + timestamp
- `resetProfileChanged()` - Clear flag

**Storage:**

```typescript
// Stores ISO timestamp in localStorage
localStorage.setItem("profile_last_changed", new Date().toISOString());
```

**Use Case:**

```typescript
// After user updates skills
await updateSkill(data);
markProfileChanged();

// In analytics hook
if (hasProfileChanged) {
  // Regenerate AI analytics with fresh data
  await generateAnalytics();
  resetProfileChanged();
}
```

---

## Shared Services

### `src/app/shared/services/supabase.ts`

**Purpose:** Configures Supabase client for database access

**Inputs:**

- Environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

**Outputs:**

- `supabase` - Configured Supabase client instance

**Code:**

```typescript
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

---

### `src/app/shared/services/crud.ts`

**Purpose:** Provides user-scoped CRUD operations

**Key Function: `withUser(userId: string)`**

**Inputs:**

- `userId` - User's UUID for RLS filtering

**Outputs:** Object with CRUD methods

- `listRows(table, select, options)` - Query multiple rows
- `getRow(table, select, options)` - Query single row
- `insertRow(table, payload)` - Create new row
- `updateRow(table, payload, filters)` - Update rows
- `deleteRow(table, filters)` - Delete rows
- `upsertRow(table, payload, onConflict)` - Insert or update

**Example:**

```typescript
const userCrud = withUser(user.id);

// List all jobs for user
const jobs = await userCrud.listRows("jobs", "*");

// Get specific job
const job = await userCrud.getRow("jobs", "*", {
  eq: { id: 123 },
  single: true,
});

// Create job (user_id automatically added)
await userCrud.insertRow("jobs", {
  job_title: "Developer",
  company_name: "Tech Corp",
});

// Update job
await userCrud.updateRow(
  "jobs",
  { job_status: "Applied" },
  { eq: { id: 123 } }
);

// Delete job
await userCrud.deleteRow("jobs", { eq: { id: 123 } });
```

**Filter Options:**

```typescript
{
  eq: { column: value },           // WHERE column = value
  in: { column: [val1, val2] },    // WHERE column IN (val1, val2)
  order: { column: "created_at", ascending: false },
  limit: 10,
  single: true  // Return object instead of array
}
```

---

### `src/app/shared/services/dbMappers.ts`

**Purpose:** Validates and transforms form data before database insertion

**Key Functions:**

#### `mapJob(formData: Record<string, unknown>)`

**Inputs:** Form data object
**Outputs:** `{ payload: JobPayload } | { error: string }`

**Validation:**

- Ensures `job_title` is present and non-empty
- Converts dates to SQL format
- Handles null/undefined values
- Validates salary ranges

**Example:**

```typescript
const formData = {
  job_title: "Software Engineer",
  company_name: "Tech Corp",
  application_deadline: "2025-12-01",
  start_salary_range: "100000",
  job_status: "Interested",
};

const { payload, error } = mapJob(formData);

if (error) {
  showError(error);
  return;
}

await createJob(userId, payload);
```

#### `mapJobNote(formData: Record<string, unknown>)`

**Inputs:** Job note form data
**Outputs:** `{ payload: JobNotePayload }`

**Validation:**

- Only includes non-empty fields
- Converts `job_id` to number
- Parses JSONB fields (interview_schedule, application_history)
- Excludes database-managed fields (id, created_at, updated_at)

**Other Mappers:**

- `mapProfile()` - User profile data
- `mapSkill()` - Skills
- `mapEmployment()` - Work experience
- `mapEducation()` - Education records
- `mapProject()` - Portfolio projects
- `mapCertification()` - Certifications

---

## Shared Hooks

### `src/app/shared/hooks/useErrorHandler.ts`

**Purpose:** Centralized error handling with user-friendly messages

**Inputs:** None

**Outputs:**

- `handleError(error)` - Displays error snackbar
- `showSuccess(message)` - Displays success snackbar
- `showWarning(message)` - Displays warning snackbar

**Example:**

```typescript
const { handleError, showSuccess } = useErrorHandler();

try {
  await updateJob(jobId, data);
  showSuccess("Job updated successfully!");
} catch (err) {
  handleError(err); // Shows "Failed to update job" snackbar
}
```

**Error Parsing:**

- Supabase errors → User-friendly messages
- Network errors → "Connection failed. Please try again."
- Validation errors → Specific field error messages

---

### `src/app/shared/hooks/useConfirmDialog.ts`

**Purpose:** Reusable confirmation dialogs

**Inputs:** None

**Outputs:**

- `confirm(options)` - Shows dialog, returns Promise<boolean>

**Example:**

```typescript
const { confirm } = useConfirmDialog();

const handleDelete = async () => {
  const confirmed = await confirm({
    title: "Delete Job?",
    message: "This action cannot be undone.",
    confirmText: "Delete",
    confirmColor: "error",
  });

  if (confirmed) {
    await deleteJob(jobId);
  }
};
```

---

### `src/app/shared/hooks/useDebounce.ts`

**Purpose:** Debounces rapidly changing values

**Inputs:**

- `value` - Value to debounce
- `delay` - Delay in milliseconds (default: 300)

**Outputs:**

- Debounced value (updates after delay)

**Example:**

```typescript
const [searchTerm, setSearchTerm] = useState("");
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch); // Only called after user stops typing
  }
}, [debouncedSearch]);
```

---

## Job Pipeline Workspace

### `src/app/workspaces/job_pipeline/hooks/useJobsPipeline.ts`

**Purpose:** Main state management for job pipeline (Kanban board)

**Inputs:**

- User from `useAuth()`

**Outputs:**

- `allJobs` - Array of all jobs
- `jobsByStage` - Jobs grouped by status { Interested: [...], Applied: [...], etc. }
- `loading` - Loading state
- `stats` - Pipeline statistics (total, by stage, conversion rates)
- `refreshJobs()` - Refetch from database
- `moveJob(jobId, newStage)` - Move single job
- `bulkMoveJobs(jobIds, newStage)` - Move multiple jobs
- `deleteJobs(jobIds)` - Delete jobs

**Internal Logic:**

```typescript
// On mount: Fetch all user's jobs
useEffect(() => {
  if (user) {
    fetchJobs();
  }
}, [user]);

// Group jobs by status
const jobsByStage = useMemo(() => {
  return groupJobsByStage(allJobs);
}, [allJobs]);

// Calculate stats
const stats = useMemo(() => {
  return {
    total: allJobs.length,
    byStage: {
      interested: jobsByStage.Interested?.length || 0,
      applied: jobsByStage.Applied?.length || 0,
      // ...
    },
  };
}, [allJobs, jobsByStage]);
```

**Optimistic Updates:**

```typescript
const moveJob = async (jobId, newStage) => {
  // Update UI immediately
  setAllJobs((prev) =>
    prev.map((j) => (j.id === jobId ? { ...j, job_status: newStage } : j))
  );

  try {
    await pipelineService.moveJob(userId, jobId, newStage);
    window.dispatchEvent(new CustomEvent("jobs-updated"));
  } catch (err) {
    // Revert on error
    await refreshJobs();
    handleError(err);
  }
};
```

---

### `src/app/workspaces/job_pipeline/hooks/useJobMatch.ts`

**Purpose:** AI job matching and analytics

**Inputs:**

- `userId` - User UUID
- `jobId` - Job ID

**Outputs:**

- `data` - Match analysis data (score, breakdown, recommendations)
- `loading` - Loading state
- `error` - Error message
- `refetch(forceRefresh?)` - Regenerate analysis

**Caching Strategy:**

```typescript
// Step 1: Check cache
const cached = await getAnalytics(userId, jobId, "match_score");
if (cached && cached.expires_at > now()) {
  setData(cached.data);
  return;
}

// Step 2: Check if already generating (deduplication)
const cacheKey = `${userId}:${jobId}`;
if (pendingRequests.has(cacheKey)) {
  await pendingRequests.get(cacheKey);
  return;
}

// Step 3: Generate new analysis
const promise = generateMatchAnalysis(userId, jobId);
pendingRequests.set(cacheKey, promise);

const result = await promise;
pendingRequests.delete(cacheKey);

// Step 4: Cache result
await saveAnalytics(userId, jobId, "match_score", result);
```

**Force Refresh:**

```typescript
const refetch = async (forceRefresh = true) => {
  if (forceRefresh) {
    // Invalidate cache first
    await invalidateAnalytics(userId, jobId, "match_score");
  }
  await fetchMatch();
};
```

---

### `src/app/workspaces/job_pipeline/services/jobsService.ts`

**Purpose:** Jobs CRUD operations

**Functions:**

#### `listJobs(userId, options?)`

**Inputs:**

- `userId` - User UUID
- `options` - Filter/sort options

**Outputs:**

- `{ data: JobRow[], error: null } | { data: null, error: Error }`

#### `getJob(userId, jobId)`

**Inputs:**

- `userId` - User UUID
- `jobId` - Job ID

**Outputs:**

- Single job object or error

#### `createJob(userId, formData)`

**Inputs:**

- `userId` - User UUID
- `formData` - Job form data

**Validation:** Uses `mapJob()` mapper

**Outputs:**

- Created job object or error

#### `updateJob(userId, jobId, formData)`

**Inputs:**

- `userId` - User UUID
- `jobId` - Job ID
- `formData` - Updated fields

**Outputs:**

- Updated job object or error

#### `deleteJob(userId, jobId)`

**Inputs:**

- `userId` - User UUID
- `jobId` - Job ID

**Outputs:**

- Success/error response

---

### `src/app/workspaces/job_pipeline/services/analyticsCache.ts`

**Purpose:** Manages AI analytics caching

**Functions:**

#### `getAnalytics(userId, jobId, type)`

**Inputs:**

- `userId` - User UUID
- `jobId` - Job ID
- `type` - Analytics type ("match_score", "skills-gap", etc.)

**Outputs:**

- Cached analytics data or null

**Query:**

```sql
SELECT * FROM analytics_cache
WHERE user_id = ? AND job_id = ? AND analytics_type = ?
  AND expires_at > NOW()
ORDER BY generated_at DESC
LIMIT 1
```

#### `saveAnalytics(userId, jobId, type, data)`

**Inputs:**

- `userId` - User UUID
- `jobId` - Job ID
- `type` - Analytics type
- `data` - Analysis results

**Outputs:**

- Saved cache entry

**Auto-expiry:** Sets `expires_at` to 7 days from now

#### `invalidateAnalytics(userId, jobId, type)`

**Inputs:**

- `userId` - User UUID
- `jobId` - Job ID
- `type` - Analytics type

**Outputs:**

- Deleted cache entries

**Use Case:** Force refresh when user updates profile

---

### `src/app/workspaces/job_pipeline/components/board/KanbanBoard.tsx`

**Purpose:** Drag-and-drop Kanban board UI

**Inputs:**

- `jobs` - Jobs grouped by stage
- `onMoveJob` - Callback for job movement

**Outputs:**

- Rendered Kanban columns with job cards

**Libraries:**

- `@dnd-kit/core` - Drag and drop
- `@dnd-kit/sortable` - Sortable lists

**Event Handling:**

```typescript
const handleDragEnd = (event) => {
  const { active, over } = event;

  if (over && active.id !== over.id) {
    const jobId = active.id;
    const newStage = over.data.stage;
    onMoveJob(jobId, newStage);
  }
};
```

---

### `src/app/workspaces/job_pipeline/components/details/JobDetails.tsx`

**Purpose:** Side drawer showing job details and notes

**Inputs:**

- `jobId` - Job to display
- `open` - Drawer open state
- `onClose` - Close callback

**Outputs:**

- Rendered drawer with job info and editable notes

**Features:**

- View job details
- Edit personal notes
- Add contact information
- Track interview schedule
- Record pros/cons/red flags

**State Management:**

```typescript
const [job, setJob] = useState(null);
const [note, setNote] = useState(null);
const [editMode, setEditMode] = useState(false);

useEffect(() => {
  if (jobId) {
    loadJobDetails();
    loadJobNote();
  }
}, [jobId]);
```

---

### `src/app/workspaces/job_pipeline/widgets/CalendarWidget.tsx`

**Purpose:** Shows upcoming job deadlines

**Inputs:**

- User from `useAuth()`

**Outputs:**

- Calendar with deadline markers

**Data Source:**

```typescript
const loadJobs = async () => {
  const res = await userCrud.listRows(
    "jobs",
    "id, job_title, company_name, application_deadline",
    {
      order: { column: "application_deadline", ascending: true },
    }
  );

  // Filter: has deadline + active status
  const activeStatuses = [
    "interested",
    "applied",
    "phone screen",
    "interview",
    "offer",
  ];
  const jobsWithDeadlines = res.data.filter(
    (j) =>
      j.application_deadline &&
      activeStatuses.includes(j.job_status?.toLowerCase())
  );

  setJobs(jobsWithDeadlines);
};
```

**Event Listening:**

```typescript
useEffect(() => {
  window.addEventListener("jobs-updated", loadJobs);
  return () => window.removeEventListener("jobs-updated", loadJobs);
}, []);
```

---

## Profile Workspace

### `src/app/workspaces/profile/services/skillsService.ts`

**Purpose:** Skills CRUD operations

**Functions:**

- `listSkills(userId)` - Get all user's skills
- `createSkill(userId, formData)` - Add new skill
- `updateSkill(userId, skillId, formData)` - Update skill
- `deleteSkill(userId, skillId)` - Remove skill

**Validation:** Uses `mapSkill()` mapper

---

### `src/app/workspaces/profile/services/experienceService.ts`

**Purpose:** Employment and education CRUD

**Functions:**

- `listEmployment(userId)` - Get work history
- `createEmployment(userId, formData)` - Add job
- `updateEmployment(userId, empId, formData)` - Update job
- `deleteEmployment(userId, empId)` - Remove job
- `listEducation(userId)` - Get education records
- `createEducation(userId, formData)` - Add education
- `updateEducation(userId, eduId, formData)` - Update education
- `deleteEducation(userId, eduId)` - Remove education

---

## AI Workspace

### `src/app/workspaces/ai/services/aiService.ts`

**Purpose:** AI generation API calls to server

**Functions:**

#### `generateResume(input)`

**Inputs:**

```typescript
{
  templateType: 'chronological' | 'functional' | 'hybrid' | 'creative',
  profile: ProfileData,
  skills: SkillData[],
  employment: EmploymentData[],
  education: EducationData[],
  jobDetails?: JobDetailsData,
  options?: { tone, length, focusAreas }
}
```

**Outputs:**

```typescript
{
  success: true,
  data: { header, summary, experience, education, skills },
  metadata: { model, tokensUsed, generationTimeMs }
}
```

**API Call:**

```typescript
const response = await fetch("http://localhost:3001/api/generate/resume", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  },
  body: JSON.stringify(input),
});
```

#### `generateCoverLetter(input)`

**Inputs:**

```typescript
{
  templateType: 'professional' | 'creative',
  profile: ProfileData,
  jobDetails: JobDetailsData,
  relevantExperience: EmploymentData[],
  relevantSkills: string[],
  options?: { tone, length }
}
```

**Outputs:**

```typescript
{
  success: true,
  data: { greeting, opening, body, closing, signature },
  metadata: { model, tokensUsed, generationTimeMs }
}
```

---

This reference covers all major files and their inputs/outputs. Each function signature, data flow, and purpose is documented for easy understanding and maintenance.
