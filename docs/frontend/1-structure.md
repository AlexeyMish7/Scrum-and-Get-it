# Frontend Structure - In-Depth Technical Guide

## Directory Tree

```
frontend/
├── src/
│   ├── main.tsx                      # Application entry point
│   ├── router.tsx                    # React Router configuration
│   ├── vite-env.d.ts                # Vite TypeScript declarations
│   └── app/
│       ├── shared/                   # Shared utilities across workspaces
│       │   ├── assets/              # Images, icons, static files
│       │   ├── components/          # Reusable UI components
│       │   │   ├── common/         # Generic components (Button, Card, etc.)
│       │   │   ├── dialogs/        # Modal dialogs
│       │   │   ├── feedback/       # Snackbars, alerts, loaders
│       │   │   ├── forms/          # Form inputs, validation
│       │   │   └── navigation/     # Navbar, sidebar, breadcrumbs
│       │   ├── constants/          # App-wide constants
│       │   ├── context/            # React Context providers
│       │   │   ├── AuthContext.tsx          # Authentication state
│       │   │   ├── ThemeContext.tsx         # Theme (light/dark mode)
│       │   │   └── ProfileChangeContext.tsx # Profile change tracking
│       │   ├── hooks/              # Custom React hooks
│       │   │   ├── useAuth.ts               # Auth operations
│       │   │   ├── useErrorHandler.ts       # Error handling
│       │   │   ├── useConfirmDialog.ts      # Confirmation dialogs
│       │   │   └── useDebounce.ts           # Debouncing utility
│       │   ├── layouts/            # Page layout components
│       │   │   ├── AppShell.tsx            # Main app wrapper
│       │   │   ├── Sidebar.tsx             # Navigation sidebar
│       │   │   └── Header.tsx              # Top header bar
│       │   ├── services/           # API/Database services
│       │   │   ├── supabase.ts             # Supabase client setup
│       │   │   ├── crud.ts                 # CRUD operations wrapper
│       │   │   ├── dbMappers.ts            # Data validation/mapping
│       │   │   └── storage.ts              # File storage operations
│       │   ├── theme/              # MUI theme configuration
│       │   │   ├── index.ts                # Theme exports
│       │   │   ├── palette.ts              # Color definitions
│       │   │   └── typography.ts           # Font settings
│       │   ├── types/              # TypeScript type definitions
│       │   │   ├── database.types.ts       # Database row types
│       │   │   ├── api.types.ts            # API request/response types
│       │   │   └── common.types.ts         # Shared types
│       │   └── utils/              # Utility functions
│       │       ├── formatting.ts           # Date, number formatting
│       │       ├── validation.ts           # Input validation
│       │       └── helpers.ts              # General helpers
│       └── workspaces/             # Feature modules (self-contained)
│           ├── job_pipeline/       # Job tracking & Kanban board
│           │   ├── components/
│           │   │   ├── analytics/          # Match analysis, scoring
│           │   │   ├── board/              # Kanban board components
│           │   │   ├── details/            # Job details drawer
│           │   │   ├── dialogs/            # Job form dialog
│           │   │   └── search/             # Search, filters, archive
│           │   ├── hooks/
│           │   │   ├── useJobMatch.ts      # AI job matching
│           │   │   └── useJobsPipeline.ts  # Jobs state management
│           │   ├── pages/
│           │   │   └── PipelinePage.tsx    # Main pipeline view
│           │   ├── services/
│           │   │   ├── index.ts            # Service exports
│           │   │   ├── jobsService.ts      # Jobs CRUD operations
│           │   │   ├── pipelineService.ts  # Pipeline-specific logic
│           │   │   └── analyticsCache.ts   # Analytics caching
│           │   ├── types/
│           │   │   └── job.types.ts        # Job-related types
│           │   └── widgets/
│           │       ├── CalendarWidget.tsx  # Deadline calendar
│           │       └── StatsWidget.tsx     # Pipeline statistics
│           ├── profile/            # User profile management
│           │   ├── components/
│           │   │   ├── education/          # Education section
│           │   │   ├── employment/         # Work experience
│           │   │   ├── skills/             # Skills management
│           │   │   └── projects/           # Portfolio projects
│           │   ├── pages/
│           │   │   └── ProfilePage.tsx     # Main profile view
│           │   ├── services/
│           │   │   ├── profileService.ts   # Profile operations
│           │   │   ├── skillsService.ts    # Skills CRUD
│           │   │   └── experienceService.ts # Employment/education
│           │   └── types/
│           │       └── profile.types.ts    # Profile types
│           ├── ai/                 # AI-powered features
│           │   ├── components/
│           │   │   ├── generation/         # AI generation UI
│           │   │   ├── templates/          # Template selection
│           │   │   └── preview/            # Document preview
│           │   ├── pages/
│           │   │   ├── ResumeGeneratorPage.tsx
│           │   │   └── CoverLetterPage.tsx
│           │   ├── services/
│           │   │   ├── aiService.ts        # AI API calls
│           │   │   └── documentService.ts  # Document operations
│           │   └── types/
│           │       └── ai.types.ts         # AI-related types
│           ├── ai_workspace/       # Document management workspace
│           │   ├── components/
│           │   │   ├── documents/          # Document list, cards
│           │   │   ├── versions/           # Version history
│           │   │   └── export/             # Export functionality
│           │   └── pages/
│           │       └── AIWorkspacePage.tsx # Main workspace view
│           └── interview_hub/      # Interview scheduling
│               ├── components/
│               │   ├── calendar/           # Calendar integration
│               │   └── preparation/        # Interview prep
│               └── pages/
│                   └── InterviewHubPage.tsx # Main hub view
├── index.html                       # HTML entry point
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript configuration
├── tsconfig.app.json               # App-specific TS config
├── tsconfig.node.json              # Node-specific TS config
├── vite.config.ts                  # Vite build configuration
├── vitest.config.ts                # Testing configuration
└── eslint.config.js                # Linting rules
```

## Architecture Principles

### 1. Workspace-Based Modularity

**Concept:** Each major feature is a self-contained "workspace" module.

**Structure:**

```
workspace/
├── components/  # UI components specific to this feature
├── hooks/       # Custom hooks for this feature
├── pages/       # Full page components
├── services/    # API calls specific to this feature
├── types/       # TypeScript types for this feature
└── widgets/     # Sidebar/supplementary components
```

**Rules:**

- ✅ Workspaces can import from `@shared/*`
- ❌ Workspaces cannot import from other workspaces
- ✅ Keeps features isolated and maintainable

### 2. Path Aliases for Clean Imports

**Configuration:** `tsconfig.json` + `vite.config.ts`

```typescript
// Instead of: ../../../../shared/context/AuthContext
import { useAuth } from "@shared/context/AuthContext";

// Instead of: ../../services/jobsService
import { jobsService } from "@job_pipeline/services";
```

**Available Aliases:**

- `@shared/*` → `src/app/shared/*`
- `@workspaces/*` → `src/app/workspaces/*`
- `@job_pipeline/*` → `src/app/workspaces/job_pipeline/*`
- `@profile/*` → `src/app/workspaces/profile/*`
- `@ai/*` → `src/app/workspaces/ai/*`

### 3. Service Layer Architecture

**Three-Tier Pattern:**

```
Component (UI)
    ↓
Service (Business Logic)
    ↓
CRUD Wrapper (Database Access)
    ↓
Supabase Client (API)
```

**Example:**

```typescript
// Tier 1: Component
const { user } = useAuth();
const jobs = await jobsService.listJobs(user.id);

// Tier 2: Service
export const jobsService = {
  async listJobs(userId: string) {
    const userCrud = withUser(userId);
    return userCrud.listRows("jobs", "*");
  },
};

// Tier 3: CRUD Wrapper
export function withUser(userId: string) {
  return {
    listRows: (table, select) => {
      return supabase.from(table).select(select).eq("user_id", userId);
    },
  };
}

// Tier 4: Supabase Client
import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(url, key);
```

### 4. State Management Strategy

**Local State:** `useState` for component-specific data

```typescript
const [loading, setLoading] = useState(false);
const [formData, setFormData] = useState({});
```

**Context State:** For app-wide data

```typescript
// AuthContext: user, session, signIn, signOut
// ThemeContext: mode, toggleColorMode
// ProfileChangeContext: track profile updates
```

**Custom Hooks:** For feature-specific state

```typescript
// useJobsPipeline: jobs, jobsByStage, moveJob, refreshJobs
// useJobMatch: match analysis, loading, refetch
```

**No Redux/Zustand:** Keep it simple with React built-ins + hooks

### 5. Component Hierarchy

**Pages** (Full screen views)

```typescript
// Example: PipelinePage.tsx
export default function PipelinePage() {
  return (
    <Box>
      <PipelineHeader />
      <KanbanBoard />
      <PipelineStats />
    </Box>
  );
}
```

**Views** (Composite components, not full pages)

```typescript
// Example: KanbanBoard.tsx
export function KanbanBoard() {
  return (
    <Stack direction="row">
      <StageColumn stage="Interested" />
      <StageColumn stage="Applied" />
      <StageColumn stage="Interview" />
    </Stack>
  );
}
```

**Components** (Reusable building blocks)

```typescript
// Example: JobCard.tsx
export function JobCard({ job, onEdit }) {
  return (
    <Card onClick={() => onEdit(job.id)}>
      <Typography>{job.job_title}</Typography>
    </Card>
  );
}
```

**Widgets** (Sidebar/auxiliary components)

```typescript
// Example: CalendarWidget.tsx
export function CalendarWidget() {
  // Shows upcoming deadlines
}
```

### 6. Type Safety Strategy

**Database Types** (auto-generated from Supabase schema)

```typescript
// types/database.types.ts
export interface JobRow {
  id: number;
  user_id: string;
  job_title: string;
  company_name: string | null;
  job_status: string;
  // ... all database columns
}
```

**API Types** (request/response shapes)

```typescript
// types/api.types.ts
export interface Result<T> {
  data: T | null;
  error: { message: string; status: number | null } | null;
}
```

**Component Props** (interface for every component)

```typescript
interface JobCardProps {
  job: JobRow;
  selected?: boolean;
  onEdit?: (id: number) => void;
}
```

### 7. Event-Driven Communication

**Custom Events** for cross-component updates

```typescript
// Emitter (after job update)
window.dispatchEvent(new CustomEvent("jobs-updated"));

// Listener (in calendar widget)
useEffect(() => {
  const handler = () => refreshCalendar();
  window.addEventListener("jobs-updated", handler);
  return () => window.removeEventListener("jobs-updated", handler);
}, []);
```

**Events Used:**

- `jobs-updated` - Job created/moved/deleted
- `profile-changed` - User updated profile data
- `document-generated` - AI generated new document

### 8. Error Handling Pattern

**Centralized Hook:**

```typescript
const { handleError, showSuccess, showWarning } = useErrorHandler();

try {
  await someOperation();
  showSuccess("Operation completed!");
} catch (err) {
  handleError(err); // Shows snackbar with error message
}
```

**Error Boundary:** Catches React component errors

```typescript
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

## Key Technical Decisions

### Why Vite?

- ⚡ Fast HMR (Hot Module Replacement)
- 📦 Smaller bundle sizes than CRA
- 🔧 Better TypeScript support out-of-box
- 🎯 Native ES modules

### Why Material-UI?

- 🎨 Professional components out-of-box
- 🌓 Built-in dark mode support
- 📱 Responsive by default
- ♿ Accessibility built-in
- 🎭 Themeable with minimal effort

### Why Supabase?

- 🔐 Built-in authentication
- 🛡️ Row Level Security (automatic user isolation)
- 📊 Real-time subscriptions
- 💾 Storage for file uploads
- 🚀 Serverless (no backend management)

### Why Workspace Pattern?

- 🧩 **Modularity** - Features are isolated
- 🔍 **Discoverability** - Easy to find code
- 🧪 **Testability** - Test features independently
- 👥 **Team-friendly** - Multiple devs can work on different workspaces
- 📈 **Scalability** - Add new features without affecting existing ones

## Build & Development Flow

### Development

```bash
npm run dev  # Starts Vite dev server on port 5173
```

**What happens:**

1. Vite reads `vite.config.ts`
2. TypeScript files compiled on-the-fly
3. HMR enabled (changes reflect instantly)
4. Source maps for debugging
5. Path aliases resolved

### Production Build

```bash
npm run build  # Creates optimized bundle
```

**Optimization steps:**

1. TypeScript compilation (strict mode)
2. Tree shaking (removes unused code)
3. Code splitting (separate chunks)
4. Minification (smaller file size)
5. Asset optimization (images, fonts)

**Output:** `dist/` folder ready for deployment

### Type Checking

```bash
npm run type-check  # Runs tsc without emitting files
```

Ensures all TypeScript types are valid before deployment.

## Performance Optimizations

### Code Splitting

```typescript
// Lazy load heavy components
const ProfilePage = lazy(() => import("@profile/pages/ProfilePage"));

<Suspense fallback={<LoadingSpinner />}>
  <ProfilePage />
</Suspense>;
```

### Memoization

```typescript
// Prevent unnecessary re-renders
const MemoizedJobCard = memo(JobCard, (prev, next) => {
  return prev.job.id === next.job.id;
});
```

### Debouncing

```typescript
// Reduce API calls during typing
const [searchTerm, setSearchTerm] = useState("");
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch);
  }
}, [debouncedSearch]);
```

### Caching

```typescript
// Cache AI analytics to avoid regeneration
const cached = await getAnalytics(userId, jobId, "match_score");
if (cached && cached.expires_at > new Date()) {
  return cached.data; // Use cached result
}
```

## Testing Strategy

### Unit Tests (Vitest)

```typescript
import { render, screen } from "@testing-library/react";
import { JobCard } from "./JobCard";

test("renders job title", () => {
  const job = { id: 1, job_title: "Software Engineer" };
  render(<JobCard job={job} />);
  expect(screen.getByText("Software Engineer")).toBeInTheDocument();
});
```

### Integration Tests

```typescript
test("job pipeline flow", async () => {
  const { user } = renderWithAuth(<PipelinePage />);

  // Create job
  await user.click(screen.getByText("Add Job"));
  await user.type(screen.getByLabelText("Job Title"), "Developer");
  await user.click(screen.getByText("Save"));

  // Verify job appears
  expect(await screen.findByText("Developer")).toBeInTheDocument();
});
```

## Security Considerations

### Authentication

- JWT tokens stored in Supabase session
- Automatic token refresh
- Protected routes require authentication

### Row Level Security

- All database queries scoped to `user_id`
- Cannot access other users' data
- Enforced at database level (Supabase RLS policies)

### Input Validation

- Client-side validation in forms
- Server-side validation in database mappers
- SQL injection prevented by Supabase client

### XSS Prevention

- React escapes all strings by default
- No `dangerouslySetInnerHTML` without sanitization
- MUI components handle XSS safely

## Deployment

### Environment Variables

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Build Output

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js    # Main app bundle
│   ├── vendor-[hash].js   # Third-party libraries
│   └── [workspace]-[hash].js  # Code-split chunks
```

### Hosting Options

- ✅ Vercel (recommended for Vite)
- ✅ Netlify
- ✅ GitHub Pages
- ✅ Any static host

---

This structure ensures maintainability, scalability, and developer experience. Each workspace is independent, shared utilities are centralized, and the build process is optimized for production.
