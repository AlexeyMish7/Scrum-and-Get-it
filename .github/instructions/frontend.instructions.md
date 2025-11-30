# Frontend Architecture Instructions

## Overview

React 18 + TypeScript + Vite frontend with workspace-based architecture. Uses Material-UI for components, Supabase for backend, and follows a modular pattern with shared utilities.

---

## Project Structure

```
frontend/src/
├── app/
│   ├── shared/              # Shared utilities, components, services
│   │   ├── assets/          # Static assets (images, icons)
│   │   ├── components/      # Reusable UI components
│   │   ├── constants/       # Application constants
│   │   ├── context/         # React Context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── layouts/         # Page layouts (AppShell, etc.)
│   │   ├── services/        # API/database services
│   │   ├── theme/           # MUI theme configuration
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   └── workspaces/          # Feature-based modules
│       ├── ai_workspace/    # AI document generation & company research
│       ├── interview_hub/   # Interview scheduling & preparation
│       ├── job_pipeline/    # Job tracking Kanban board
│       ├── network_hub/     # Contact & networking management
│       ├── profile/         # User profile management
│       └── team_management/ # Team collaboration & mentoring
├── pages/                   # Top-level pages (Analytics Dashboard)
├── main.tsx                 # App entry point
├── router.tsx               # Route definitions
└── vite-env.d.ts           # Vite types
```

---

## Workspace Pattern

### What is a Workspace?

A **workspace** is a self-contained feature module with its own:

- Components
- Services
- Hooks
- Pages/Views
- Types

### Example: job_pipeline workspace

```
workspaces/job_pipeline/
├── components/          # UI components specific to this workspace
│   ├── analytics/       # Match analysis, job scoring
│   ├── calendar/        # Calendar widget components
│   ├── cards/           # Job card components
│   ├── details/         # Job details drawer
│   ├── dialogs/         # Job form dialog, confirmation dialogs
│   ├── documents/       # Document-related job components
│   ├── import/          # Job import components
│   ├── search/          # Search filters, archive toggle
│   └── timeline/        # Application timeline components
├── hooks/               # Custom hooks for job pipeline
│   ├── useJobsPipeline.ts  # Main jobs state management
│   └── ...
├── layouts/             # Layout components
│   ├── JobPipelineLayout.tsx
│   └── UnifiedJobsLayout.tsx
├── pages/               # Full page components
│   ├── ArchivedJobsPage.tsx
│   ├── JobDetailsPage.tsx
│   ├── NewJobPage.tsx
│   └── ...
├── services/            # API calls specific to jobs
│   ├── index.ts         # Main service exports
│   ├── jobsService.ts   # CRUD operations for jobs
│   ├── pipelineService.ts # Pipeline stage operations
│   └── analyticsCache.ts # Analytics caching layer
├── types/               # TypeScript types
├── views/               # Composite views
│   ├── AnalyticsView/   # Analytics dashboard view
│   └── PipelineView/    # Kanban pipeline view
└── widgets/             # Sidebar widgets (calendar, stats)
```

### Example: ai_workspace (Document Generation)

```
workspaces/ai_workspace/
├── components/
│   ├── common/          # Shared AI workspace components
│   ├── editor/          # Document editor components
│   ├── hub/             # Hub/dashboard components
│   ├── reviews/         # Document review components (UC-110)
│   ├── templates/       # Template management components
│   ├── themes/          # Theme management components
│   ├── version/         # Version management components
│   ├── versions/        # Version history components
│   └── wizard/          # Generation wizard components
├── context/             # AI workspace context providers
├── hooks/               # AI-specific hooks
├── layouts/             # AI workspace layouts
│   └── AIWorkspaceLayout.tsx
├── navigation/          # Navigation components
├── pages/               # Full pages
│   ├── AIWorkspaceHub/  # Main hub page
│   ├── CompanyResearch/ # Company research page
│   ├── DocumentEditorPage.tsx
│   ├── DocumentLibrary/ # Document library page
│   ├── GenerateCoverLetter/ # Cover letter generator
│   ├── GenerateResume/  # Resume generator
│   ├── Reviews/         # Document reviews page (UC-110)
│   └── TemplateManager/ # Template management page
├── services/            # AI services
│   ├── aiGenerationService.ts
│   ├── companyResearchService.ts
│   ├── exportService.ts
│   ├── reviewService.ts
│   ├── templateService.ts
│   ├── themeService.ts
│   └── versionService.ts
└── types/               # Type definitions
    ├── document.types.ts
    ├── generation.types.ts
    ├── template.types.ts
    └── version.types.ts
```

### Example: team_management workspace

```
workspaces/team_management/
├── components/
│   ├── AccountabilityTracker.tsx
│   ├── CoachingInsights.tsx
│   ├── CreateTeamDialog.tsx
│   ├── EngagementMonitor.tsx
│   ├── FeedbackPanel.tsx
│   ├── InviteMemberDialog.tsx
│   ├── MenteeDocumentsViewer.tsx
│   ├── MenteeGoalsTracker.tsx
│   └── MenteeProgressCard.tsx
├── hooks/               # Team-specific hooks
├── layouts/
│   └── TeamLayout.tsx
├── pages/
│   ├── Invitations.tsx
│   ├── MentorDashboard.tsx  # UC-109
│   ├── TeamDashboard.tsx    # UC-108
│   ├── TeamReports.tsx
│   └── TeamSettings.tsx
├── services/
│   ├── mentorService.ts
│   └── teamService.ts
├── types/               # Team type definitions
└── utils/               # Team utilities
```

### Example: network_hub workspace

```
workspaces/network_hub/
├── components/
│   ├── AddContact/
│   ├── ContactDetails/
│   ├── ContactFilters.tsx
│   ├── ContactsList/
│   ├── InformationInterview/
│   ├── NetworkHubNavbar/
│   ├── NetworkingEvents/
│   ├── References/
│   └── RelationshipMaintenance/
└── pages/
    ├── ContactsDashboard/
    ├── Events/
    ├── InformationalInterview/
    └── TemplatesPage/
```

### Key Principle

**Workspaces are independent but can import from `@shared`**

- ✅ `import { Button } from "@shared/components/common/Button"`
- ✅ `import { useAuth } from "@shared/context/AuthContext"`
- ❌ Don't import from other workspaces directly

---

## Path Aliases (Import Shortcuts)

Configured in `tsconfig.json` and `vite.config.ts`:

```typescript
@shared/*           → src/app/shared/*
@workspaces/*       → src/app/workspaces/*
@job_pipeline/*     → src/app/workspaces/job_pipeline/*
@profile/*          → src/app/workspaces/profile/*
@ai_workspace/*     → src/app/workspaces/ai_workspace/*
```

**Usage Example:**

```typescript
// Instead of: ../../../../shared/context/AuthContext
import { useAuth } from "@shared/context/AuthContext";

// Instead of: ../../services/jobsService
import { jobsService } from "@job_pipeline/services";

// AI workspace imports
import { AIWorkspaceLayout } from "@ai_workspace/layouts/AIWorkspaceLayout";
```

---

## Database Connection Pattern

### 1. Supabase Client Setup

**Location:** `frontend/src/app/shared/services/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### 2. CRUD Service Layer

**Location:** `frontend/src/app/shared/services/crud.ts`

**Core Pattern:** User-scoped operations with automatic RLS enforcement

```typescript
import { withUser } from "@shared/services/crud";

// Create user-scoped CRUD wrapper
const userCrud = withUser(userId);

// All operations automatically add user_id filter
const jobs = await userCrud.listRows("jobs", "*");
const job = await userCrud.getRow("jobs", "*", { eq: { id: 123 } });
await userCrud.insertRow("jobs", { job_title: "Developer", ... });
await userCrud.updateRow("jobs", { job_title: "Senior Dev" }, { eq: { id: 123 } });
await userCrud.deleteRow("jobs", { eq: { id: 123 } });
```

**Key Functions:**

- `listRows(table, select, options)` - Get multiple rows with filters/sorting
- `getRow(table, select, options)` - Get single row
- `insertRow(table, payload)` - Create new row (auto-adds user_id)
- `updateRow(table, payload, filters)` - Update rows
- `deleteRow(table, filters)` - Delete rows
- `upsertRow(table, payload, onConflict)` - Insert or update

**Options Pattern:**

```typescript
{
  eq: { id: 123, status: "active" },        // Equals filter
  in: { id: [1, 2, 3] },                    // IN filter
  order: { column: "created_at", ascending: false },
  limit: 10,
  single: true  // Return single object instead of array
}
```

### 3. Service Abstraction Layer

**Location:** `frontend/src/app/workspaces/[workspace]/services/`

Create workspace-specific services that wrap CRUD operations:

```typescript
// jobsService.ts example
import { withUser } from "@shared/services/crud";

export const jobsService = {
  async listJobs(userId: string, options?: ListOptions) {
    const userCrud = withUser(userId);
    return userCrud.listRows("jobs", "*", options);
  },

  async getJob(userId: string, jobId: number) {
    const userCrud = withUser(userId);
    return userCrud.getRow("jobs", "*", { eq: { id: jobId }, single: true });
  },

  async createJob(userId: string, data: JobPayload) {
    const userCrud = withUser(userId);
    return userCrud.insertRow("jobs", data);
  },

  async updateJob(userId: string, jobId: number, data: Partial<JobPayload>) {
    const userCrud = withUser(userId);
    return userCrud.updateRow("jobs", data, { eq: { id: jobId } });
  },
};
```

### 4. Shared Services Overview

**Location:** `frontend/src/app/shared/services/`

| Service               | Purpose                             |
| --------------------- | ----------------------------------- |
| `supabaseClient.ts`   | Supabase client initialization      |
| `crud.ts`             | User-scoped CRUD operations         |
| `dbMappers.ts`        | Form data validation/transformation |
| `aiArtifacts.ts`      | AI artifact management              |
| `documents.ts`        | Document CRUD operations            |
| `cache.ts`            | Local caching utilities             |
| `errorNotifier.ts`    | Error notification service          |
| `fetchCompanyNews.ts` | Company news fetching               |
| `jobMaterials.ts`     | Job materials service               |
| `mockDataNotifier.ts` | Mock data notifications             |
| `ai/`                 | AI-related services                 |

### 5. Data Mappers (Validation Layer)

**Location:** `frontend/src/app/shared/services/dbMappers.ts`

**Purpose:** Validate and transform form data before sending to database

```typescript
// Validates and normalizes job data
export const mapJob = (formData: Record<string, unknown>) => {
  const jobTitle = String(formData.job_title ?? "").trim();
  if (!jobTitle) return { error: "Job title is required" };

  const payload = {
    job_title: jobTitle,
    company_name: String(formData.company_name ?? "").trim() || null,
    job_description: formData.job_description || null,
    application_deadline: formatToSqlDate(formData.application_deadline),
    // ... transform all fields
  };

  return { payload };
};

// Usage in service
export async function createJobNote(
  userId: string,
  formData: Record<string, unknown>
) {
  const mapped = mapJobNote(formData);
  if (mapped.error) return { data: null, error: { message: mapped.error } };

  const userCrud = withUser(userId);
  return userCrud.insertRow("job_notes", mapped.payload);
}
```

**Key Mappers Available:**

- `mapJob()` - Jobs table
- `mapJobNote()` - Job notes
- `mapProfile()` - User profiles
- `mapSkill()` - Skills
- `mapEmployment()` - Employment history
- `mapEducation()` - Education records
- `mapCoverLetterDraft()` - Cover letter drafts

---

## Context Providers (Global State)

### AuthContext

**Location:** `frontend/src/app/shared/context/AuthContext.tsx`

```typescript
import { useAuth } from "@shared/context/AuthContext";

const { user, session, loading, signIn, signUp, signOut } = useAuth();

// user object structure:
{
  id: string,           // UUID for database queries
  email: string,
  user_metadata: {...}
}
```

**Usage Pattern:**

```typescript
function MyComponent() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Safe to make database calls
    const userCrud = withUser(user.id);
    // ...
  }, [user]);
}
```

### ThemeContext

**Location:** `frontend/src/app/shared/context/ThemeContext.tsx`

```typescript
import { useTheme } from "@shared/context/ThemeContext";

const { mode, toggleColorMode } = useTheme();
// mode: "light" | "dark"
```

**How It Works:**

- Wraps MUI ThemeProvider
- Persists theme preference to localStorage
- Provides Material-UI theme object
- Handles dark/light mode switching

### ProfileChangeContext

**Location:** `frontend/src/app/shared/context/ProfileChangeContext.tsx`

**Purpose:** Track when user profile changes to invalidate analytics cache

```typescript
import { useProfileChange } from "@shared/context/ProfileChangeContext";

const { hasProfileChanged, markProfileChanged, resetProfileChanged } =
  useProfileChange();

// When user updates skills/education/employment:
await updateSkill(data);
markProfileChanged(); // Sets flag + timestamp in localStorage

// When analytics regenerated:
if (hasProfileChanged) {
  // Regenerate AI analytics
  resetProfileChanged(); // Clear flag
}
```

**Storage Key:** `profile_last_changed` in localStorage (ISO timestamp)

### TeamContext

**Location:** `frontend/src/app/shared/context/TeamContext.tsx`

**Purpose:** Manage team state for multi-user collaboration features (UC-108, UC-109)

```typescript
import { useTeam } from "@shared/context/useTeam";

const {
  teams, // User's teams
  currentTeam, // Currently selected team
  role, // User's role in current team (admin/mentor/candidate)
  assignedCandidates, // For mentors: their assigned candidates
  loading,
  selectTeam, // Switch between teams
  refreshTeams, // Reload team data
} = useTeam();

// Check permissions
if (role === "admin") {
  // Show admin-only features
}
```

### SidebarContext

**Location:** `frontend/src/app/shared/context/SidebarContext.tsx`

**Purpose:** Control sidebar collapse/expand state across the app

```typescript
import { useSidebar } from "@shared/context/useSidebar";

const { isCollapsed, toggle, expand, collapse } = useSidebar();
```

---

## Custom Hooks Pattern

### Hook Naming

- `use[Feature]` - Main hook for feature
- `use[Feature][Action]` - Specific action hook

### Example Hooks

**useErrorHandler** - Centralized error handling

```typescript
import { useErrorHandler } from "@shared/hooks/useErrorHandler";

const { handleError, showSuccess, showWarning } = useErrorHandler();

try {
  await someAsyncOperation();
  showSuccess("Operation completed!");
} catch (err) {
  handleError(err); // Shows error snackbar
}
```

**useConfirmDialog** - Confirmation dialogs

```typescript
import { useConfirmDialog } from "@shared/hooks/useConfirmDialog";

const { confirm } = useConfirmDialog();

const handleDelete = async () => {
  const confirmed = await confirm({
    title: "Delete job?",
    message: "This action cannot be undone",
    confirmText: "Delete",
    confirmColor: "error",
  });

  if (confirmed) {
    // Proceed with delete
  }
};
```

**useJobsPipeline** - Main jobs state management

```typescript
import { useJobsPipeline } from "@job_pipeline/hooks/useJobsPipeline";

const {
  allJobs, // All jobs array
  jobsByStage, // Jobs grouped by status
  loading, // Loading state
  stats, // Pipeline statistics
  refreshJobs, // Refetch from database
  moveJob, // Move single job
  bulkMoveJobs, // Move multiple jobs
  deleteJobs, // Delete jobs
} = useJobsPipeline();
```

**useUserJobs** - Simple jobs fetching hook

```typescript
import { useUserJobs } from "@shared/hooks/useUserJobs";

const { jobs, loading, error, refetch } = useUserJobs(userId);
```

**useDebounce** - Debounce values for search

```typescript
import { useDebounce } from "@shared/hooks/useDebounce";

const debouncedSearch = useDebounce(searchTerm, 300);
```

**useAvatar** - User avatar management

```typescript
import { useAvatar } from "@shared/hooks/useAvatar";

const { avatarUrl, loading, uploadAvatar, deleteAvatar } = useAvatar(userId);
```

---

## Theme System

### Theme Structure

**Location:** `frontend/src/app/shared/theme/`

```typescript
const theme = createTheme({
  palette: {
    mode: "light" | "dark",
    primary: { main: "#2563eb" },
    secondary: { main: "#64748b" },
    // ... color definitions
  },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    h1: { fontSize: "2.5rem", fontWeight: 700 },
    // ... typography scale
  },
  spacing: 8, // Base spacing unit (8px)
  shape: {
    borderRadius: 8, // Default border radius
  },
});
```

### Using Theme in Components

**Method 1: sx prop (preferred)**

```typescript
<Box
  sx={{
    p: 2, // padding: 16px (2 * 8)
    bgcolor: "primary.main", // theme.palette.primary.main
    borderRadius: 1, // theme.shape.borderRadius
    color: "text.primary", // theme.palette.text.primary
  }}
>
  Content
</Box>
```

**Method 2: useTheme hook**

```typescript
import { useTheme } from "@mui/material";

function MyComponent() {
  const theme = useTheme();

  return <div style={{ color: theme.palette.primary.main }}>Content</div>;
}
```

### Responsive Design

```typescript
<Box
  sx={{
    width: { xs: "100%", sm: "50%", md: "33%" },
    p: { xs: 1, md: 2 },
  }}
>
  // xs: 0px+, sm: 600px+, md: 900px+, lg: 1200px+, xl: 1536px+
</Box>
```

---

## Component Communication Patterns

### 1. Props (Parent → Child)

```typescript
interface JobCardProps {
  job: JobRow;
  onEdit: (jobId: number) => void;
}

function JobCard({ job, onEdit }: JobCardProps) {
  return <Card onClick={() => onEdit(job.id)} />;
}
```

### 2. Context (Global State)

```typescript
// Provider at app level
<AuthProvider>
  <App />
</AuthProvider>;

// Consumer anywhere in tree
const { user } = useAuth();
```

### 3. Custom Events (Sibling Communication)

```typescript
// Emitter (after job update)
window.dispatchEvent(new CustomEvent("jobs-updated"));

// Listener (calendar widget)
useEffect(() => {
  const handleJobsUpdated = () => {
    refreshCalendar();
  };

  window.addEventListener("jobs-updated", handleJobsUpdated);
  return () => window.removeEventListener("jobs-updated", handleJobsUpdated);
}, []);
```

### 4. Callback Props (Child → Parent)

```typescript
function Parent() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return <JobList onJobSelect={setSelectedId} />;
}

function JobList({ onJobSelect }: { onJobSelect: (id: number) => void }) {
  return <div onClick={() => onJobSelect(123)} />;
}
```

---

## Common Patterns & Best Practices

### 1. Loading States

```typescript
function MyComponent() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const result = await fetchData();
        if (mounted) setData(result);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <CircularProgress />;
  if (!data) return <EmptyState />;

  return <div>{data.content}</div>;
}
```

### 2. Form Handling

```typescript
function JobForm() {
  const [form, setForm] = useState({
    job_title: "",
    company_name: "",
  });

  const handleChange =
    (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  return (
    <TextField value={form.job_title} onChange={handleChange("job_title")} />
  );
}
```

### 3. Optimistic Updates

```typescript
// Update UI immediately, revert on error
const handleMove = async (jobId: number, newStage: string) => {
  const previous = jobsByStage[currentStage];

  // Optimistic update
  setJobsByStage((prev) => ({
    ...prev,
    [currentStage]: prev[currentStage].filter((j) => j.id !== jobId),
    [newStage]: [...prev[newStage], job],
  }));

  try {
    await pipelineService.moveJob(userId, jobId, newStage);
  } catch (err) {
    // Revert on error
    setJobsByStage((prev) => ({
      ...prev,
      [currentStage]: previous,
    }));
    handleError(err);
  }
};
```

### 4. Debouncing Search

```typescript
const [searchTerm, setSearchTerm] = useState("");
const [debouncedTerm, setDebouncedTerm] = useState("");

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedTerm(searchTerm);
  }, 300);

  return () => clearTimeout(timer);
}, [searchTerm]);

useEffect(() => {
  if (debouncedTerm) {
    performSearch(debouncedTerm);
  }
}, [debouncedTerm]);
```

---

## Type Definitions

### Location

- Shared types: `frontend/src/app/shared/types/`
- Workspace types: `frontend/src/app/workspaces/[workspace]/types/`

### Common Type Patterns

```typescript
// Database row types
interface JobRow {
  id: number;
  user_id: string;
  job_title: string;
  company_name: string | null;
  job_status: string;
  created_at: string;
  // ... all database columns
}

// API response wrapper
interface Result<T> {
  data: T | null;
  error: { message: string; status: number | null } | null;
  status: number | null;
}

// Form data (before validation)
type JobFormData = Record<string, unknown>;

// Component props
interface JobCardProps {
  job: JobRow;
  selected?: boolean;
  onEdit?: (id: number) => void;
}

// Enums/Literals
type JobStatus =
  | "Interested"
  | "Applied"
  | "Phone Screen"
  | "Interview"
  | "Offer";
type PipelineStage = JobStatus | "Rejected";
```

### Type Export Pattern

```typescript
// types/index.ts
export type { JobRow, JobFormData } from "./job.types";
export type { ProfileRow } from "./profile.types";

// Usage
import type { JobRow } from "@job_pipeline/types";
```

---

## Routing

### Router Configuration

**Location:** `frontend/src/router.tsx`

The app uses React Router v6 with nested routes and lazy loading for performance.

**Main Route Structure:**

```typescript
// Public routes
/                     → HomePage
/login                → Login
/register             → Register
/forgot-password      → ForgotPassword
/reset-password       → ResetPassword
/auth/callback        → AuthCallback (OAuth)

// Profile workspace (protected)
/profile              → Dashboard (index)
/profile/analytics    → ProfileAnalytics
/profile/education    → EducationOverview
/profile/skills       → SkillsOverview
/profile/employment   → EmploymentHistoryList
/profile/projects     → ProjectPortfolio
/profile/projects/:id → ProjectDetails
/profile/certifications → Certifications
/profile/details      → ProfileDetails
/profile/settings     → Settings

// AI workspace (protected, lazy loaded)
/ai                   → AIWorkspaceHub (index)
/ai/library           → DocumentLibrary
/ai/templates         → TemplateManager
/ai/generate/resume   → GenerateResumePage
/ai/generate/cover-letter → GenerateCoverLetterPage
/ai/document/:documentId → DocumentEditorPage
/ai/research          → CompanyResearchNew
/ai/reviews           → MyReviewsPage (UC-110)
/ai/reviews/:reviewId → DocumentReviewPage (UC-110)

// Jobs workspace (protected, lazy loaded)
/jobs                 → PipelineView (Kanban board, index)
/jobs/analytics       → AnalyticsView

// Interview Hub (protected, lazy loaded)
/interviews           → InterviewHub

// Network Hub (protected, lazy loaded)
/network              → NetworkContacts
/network/templates    → NetworkTemplatesPage
/network/interviews   → NetworkInterviewsPage

// Team Management (protected, lazy loaded)
/team                 → TeamDashboard (index)
/team/settings        → TeamSettings
/team/invitations     → Invitations
/team/reports         → TeamReports
/team/mentor          → MentorDashboard (UC-109)
```

**Lazy Loading Pattern:**

```typescript
const AIWorkspaceHub = lazy(() => import("@ai_workspace/pages/AIWorkspaceHub"));

// In routes:
{
  path: "hub",
  element: (
    <Suspense fallback={<LazyLoadFallback />}>
      <AIWorkspaceHub />
    </Suspense>
  ),
}
```

### Navigation

```typescript
import { useNavigate, Link, NavLink } from "react-router-dom";

// Programmatic navigation
const navigate = useNavigate();
navigate("/jobs");
navigate(-1);  // Go back

// Link component
<Link to="/jobs">Jobs</Link>

// NavLink (adds active class)
<NavLink to="/jobs" className={({ isActive }) => isActive ? "active" : ""}>
  Jobs
</NavLink>
```

### Protected Routes

```typescript
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
}
```

### Layout Components

**AppShell** - Main application shell with sidebar navigation
**ProfileLayout** - Layout for profile workspace pages
**AIWorkspaceLayout** - Layout for AI workspace with specialized navigation
**JobsLayout / UnifiedJobsLayout** - Layout for job pipeline views
**TeamLayout** - Layout for team management pages

---

## File Naming Conventions

```
PascalCase.tsx       → React components
camelCase.ts         → Utilities, services, hooks
kebab-case/          → Directories
SCREAMING_SNAKE.md   → Documentation (avoid!)
```

**Examples:**

- ✅ `JobCard.tsx` - Component
- ✅ `useJobMatch.ts` - Hook
- ✅ `jobsService.ts` - Service
- ✅ `job-pipeline/` - Directory
- ❌ `job_card.tsx` - Wrong
- ❌ `JobsService.ts` - Wrong

---

## Development Guidelines for AI Assistant

### ✅ DO:

1. **Respect the workspace pattern** - Keep features isolated
2. **Use path aliases** - `@shared/*`, `@job_pipeline/*`
3. **Add meaningful comments** - Explain "why", not "what"
4. **Use TypeScript properly** - Define types, avoid `any`
5. **Extract types** - Create separate type files when needed
6. **Use custom hooks** - Don't repeat logic
7. **Handle loading/error states** - Always
8. **Use Material-UI components** - Don't reinvent
9. **Follow existing patterns** - Check similar code first
10. **Keep it simple** - College-level TypeScript, no advanced patterns
11. **Emit custom events** - For cross-workspace communication
12. **Clean up effects** - Always return cleanup functions

### ❌ DON'T:

1. **Create markdown documentation files** - Instructions only in `.github/instructions/`
2. **Import between workspaces** - Use `@shared` instead
3. **Use advanced TypeScript** - Keep it readable
4. **Skip error handling** - Always use try/catch
5. **Hardcode values** - Use constants/config
6. **Mutate state directly** - Use setState callbacks
7. **Skip prop validation** - Define interfaces
8. **Create inline styles** - Use `sx` prop or theme
9. **Forget cleanup** - Remove event listeners, clear timeouts
10. **Over-abstract** - Simple and clear > clever

### Code Quality Checklist

- [ ] TypeScript errors resolved
- [ ] Meaningful variable names
- [ ] Comments explain complex logic
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Empty states handled
- [ ] Cleanup functions added
- [ ] Types exported properly
- [ ] No console.logs (except debugging)
- [ ] Follows existing code style

---

## Quick Reference Commands

```bash
# Start dev server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Environment Variables

**File:** `frontend/.env`

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Usage:**

```typescript
import.meta.env.VITE_SUPABASE_URL;
```

---

## Common Issues & Solutions

### Issue: "Module not found"

**Solution:** Check path alias in `tsconfig.json` and `vite.config.ts`

### Issue: State not updating

**Solution:** Check if you're mutating state directly. Use spread operator:

```typescript
// ❌ Wrong
state.push(item);

// ✅ Correct
setState([...state, item]);
```

### Issue: Infinite re-renders

**Solution:** Check useEffect dependencies. Missing deps cause loops:

```typescript
// ❌ Wrong
useEffect(() => {
  fetchData();
}, []); // fetchData not in deps

// ✅ Correct
useEffect(() => {
  fetchData();
}, [fetchData]); // or use useCallback for fetchData
```

### Issue: Type errors with Supabase

**Solution:** Cast database responses:

```typescript
const jobs = (res.data ?? []) as JobRow[];
```

---

This is your frontend bible. When in doubt, check existing code in the workspace you're working in, follow these patterns, and keep it simple and maintainable.
