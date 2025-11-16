# App Refactor Plan

> **Status**: Phase 1 - Discovery (Complete)
> **Date**: November 15, 2025
> **App**: ATS Tracker (Scrum-and-Get-it)

---

## Executive Summary

This document provides a comprehensive analysis of the current application structure, identifies key issues, and will guide a systematic refactor to improve maintainability, consistency, and developer experience. The app is a job application tracking system with three main workspaces: Profile, AI, and Jobs.

**Tech Stack:**

- Frontend: React 19 + TypeScript 5.9 + Vite 7 + MUI v7
- Backend: Node.js server (Express-like) + Supabase (Postgres + Auth)
- State: React Context + Zustand (minimal)
- Testing: Vitest (minimal coverage currently)

---

## Phase 1: Current Structure Analysis

### 1.1 Project Structure

#### Frontend Structure (`frontend/src/`)

```
frontend/src/
├── App.tsx                    # Root component with theme + auth providers
├── main.tsx                   # React entry point
├── router.tsx                 # Centralized routing configuration
├── app/
│   ├── assets/                # Static images, icons
│   ├── constants/             # App-wide constants
│   ├── shared/                # Cross-workspace shared code
│   │   ├── components/        # Reusable UI components
│   │   │   ├── common/        # Common components (ProtectedRoute, ErrorSnackbar, etc.)
│   │   │   ├── sidebars/      # Workspace sidebars (AISidebar, JobsSidebar)
│   │   │   └── TopNav/        # Legacy top navigation (likely unused)
│   │   ├── context/           # React contexts (AuthContext)
│   │   ├── hooks/             # Shared hooks (useErrorHandler, useSprintTasks)
│   │   ├── layouts/           # Layout components (AppShell, GlobalTopBar, SystemLayer)
│   │   ├── services/          # API/data layer (supabaseClient, crud, types)
│   │   ├── theme/             # MUI theme configuration
│   │   └── utils/             # Utility functions
│   └── workspaces/            # Feature-based workspaces
│       ├── profile/           # Profile workspace
│       │   ├── ProfileLayout.tsx
│       │   ├── pages/         # Profile-related pages (auth, dashboard, education, etc.)
│       │   ├── services/      # Profile-specific services
│       │   ├── components/    # Profile-specific components
│       │   └── types/         # Profile-specific types
│       ├── ai/                # AI workspace
│       │   ├── AiLayout.tsx
│       │   ├── pages/         # AI pages (DashboardAI, ResumeEditorV2, etc.)
│       │   ├── components/    # AI-specific components
│       │   ├── services/      # AI services
│       │   ├── hooks/         # AI-specific hooks
│       │   └── types/         # AI-specific types
│       └── jobs/              # Jobs workspace
│           ├── JobsLayout.tsx
│           ├── pages/         # Jobs pages (Pipeline, NewJob, Analytics, etc.)
│           └── components/    # Jobs-specific components
```

#### Backend Structure (`server/src/`)

```
server/src/
├── index.ts                   # Entry point (loads env, starts server)
├── server.ts                  # HTTP server setup + routing
├── routes/                    # Route handlers (REST-like endpoints)
│   ├── health.ts              # Health check endpoint
│   ├── ai.ts                  # AI generation endpoints
│   ├── artifacts.ts           # AI artifacts CRUD
│   ├── coverLetterDrafts.ts   # Cover letter drafts
│   ├── companyResearch.ts     # Company research
│   └── salaryResearch.ts      # Salary research
├── services/                  # Business logic layer
│   ├── aiClient.ts            # OpenAI client wrapper
│   ├── orchestrator.ts        # AI generation orchestration
│   ├── supabaseAdmin.ts       # Supabase admin client
│   ├── companyResearchService.ts
│   └── coverLetterDraftsService.ts
├── middleware/                # Express-style middleware
└── types/                     # TypeScript type definitions
```

#### Database Structure (Supabase Postgres)

Key tables (from migrations):

- `profiles` - User profile data (linked to auth.users)
- `jobs` - Job opportunities tracked by users
- `employment` - Work experience entries
- `education` - Education history
- `skills` - User skills with proficiency levels
- `certifications` - Professional certifications
- `projects` - Portfolio projects
- `documents` - Uploaded files (resumes, cover letters, etc.)
- `ai_artifacts` - Generated AI content (resumes, cover letters, analyses)
- `job_materials` - Links jobs to specific resume/cover letter versions
- `job_notes` - Notes and contact info for jobs
- `cover_letter_drafts` - Draft cover letters with versioning
- `resume_drafts` (likely exists) - Draft resumes with versioning

All user-owned tables use RLS (Row Level Security) scoped to `auth.uid()`.

### 1.2 Routing Configuration

**Current Route Structure:**

**Public Routes:**

- `/` - HomePage (landing page)
- `/login` - Login page
- `/register` - Register page
- `/auth/callback` - OAuth callback handler
- `/forgot-password` - Password recovery
- `/reset-password` - Password reset

**AI Workspace (`/ai`)** - Protected, uses AiLayout:

- `/ai` - DashboardAI (index)
- `/ai/resume` - ResumeEditorV2
- `/ai/cover-letter` - GenerateCoverLetter
- `/ai/cover-letter-edit` - EditCoverLetter
- `/ai/job-match` - JobMatchPage
- `/ai/company-research` - CompanyResearch
- `/ai/templates` - TemplatesHub

**Jobs Workspace (`/jobs`)** - Protected, uses JobsLayout:

- `/jobs` or `/jobs/pipeline` - PipelinePage (Kanban board)
- `/jobs/new` - NewJobPage
- `/jobs/documents` - DocumentsPage
- `/jobs/saved-searches` - SavedSearchesPage
- `/jobs/analytics` - AnalyticsPage
- `/jobs/automations` - AutomationsPage
- `/jobs/archived-jobs` - ViewArchivedJobs

**Profile Workspace** - Protected, uses ProfileLayout:

- `/profile` - Dashboard
- `/education` - EducationOverview
- `/education/manage` - AddEducation
- `/skillsOverview` - SkillsOverview
- `/add-skills` or `/skills/manage` - AddSkills
- `/add-employment` - AddEmployment
- `/employment-history` - EmploymentHistoryList
- `/portfolio` - ProjectPortfolio
- `/projects/new` - AddProjectForm
- `/projects/:id` - ProjectDetails
- `/projects/:id/edit` - AddProjectForm (edit mode)
- `/certifications` - Certifications
- `/profile-details` - ProfileDetails
- `/settings` - Settings

**Issues Identified:**

1. **Inconsistent route patterns**: Profile routes scattered (`/profile`, `/education`, `/add-skills`) rather than nested under `/profile/*`
2. **Duplicate routes**: `/add-skills` and `/skills/manage` point to same component
3. **Unclear naming**: `/skillsOverview` vs `/education` (inconsistent casing and structure)
4. **No breadcrumb/navigation hierarchy**: Hard to understand parent-child relationships

### 1.3 UI/UX and Navigation Flow

**Current Navigation Pattern:**

1. **Global Top Bar** (`GlobalTopBar.tsx`):

   - Logo/branding
   - Main workspace navigation (Profile, AI, Jobs)
   - User menu (settings, logout)
   - Theme toggle

2. **Workspace Layouts**:

   - **ProfileLayout**: Uses legacy sidebar structure (likely inconsistent with AI/Jobs)
   - **AiLayout**: Uses AppShell + AISidebar (modern pattern)
   - **JobsLayout**: Uses AppShell + JobsSidebar (modern pattern)

3. **Sidebar Navigation**:
   - AI workspace has consistent sidebar with feature links
   - Jobs workspace has consistent sidebar with feature links
   - Profile workspace has older sidebar pattern (needs verification)

**User Journey Analysis:**

**Primary Flow 1: New User Onboarding**

1. Landing page (/) → Register
2. After registration → Login
3. After login → ??? (no clear default landing - router redirect is `/`)
4. User must navigate to profile to fill in details
5. User must navigate to AI or Jobs to use features

**Issues:**

- No onboarding flow or empty state guidance
- Unclear default landing page after login
- No profile completion prompts

**Primary Flow 2: Job Application Process**

1. User searches/adds job (`/jobs/new`)
2. User wants to generate resume → Navigate to `/ai/resume`
3. User wants to generate cover letter → Navigate to `/ai/cover-letter`
4. User returns to job → Navigate back to `/jobs/pipeline`
5. User attaches materials to job → ???

**Issues:**

- No direct link from job to AI generation (must navigate separately)
- No clear way to associate generated materials with jobs in the UI flow
- Multiple navigation jumps break the natural workflow

**Primary Flow 3: Profile Management**

1. User goes to `/profile` dashboard
2. User wants to add education → Navigate to `/education`
3. User wants to add skills → Navigate to `/skillsOverview` or `/add-skills`
4. User wants to add employment → Navigate to `/employment-history` or `/add-employment`

**Issues:**

- Inconsistent navigation patterns (some pages are "manage", some are "add", some are "overview")
- No unified profile editing experience
- Unclear which page is the "list" vs "add/edit" page

### 1.4 Data and API Layer

**Current Data Access Patterns:**

**Frontend Data Layer:**

1. **Shared CRUD helpers** (`shared/services/crud.ts`):

   - Generic functions: `listRows`, `getRow`, `insertRow`, `updateRow`, `deleteRow`, `upsertRow`
   - User-scoped wrapper: `withUser(userId)` - automatically injects `user_id` filter
   - Error mapping: `mapSupabaseError()` - normalizes Supabase errors
   - Filter options: `eq`, `neq`, `like`, `ilike`, `in`, `order`, `limit`, `offset`

2. **Workspace-specific services** (e.g., `profile/services/`, `ai/services/`):

   - Profile services: `profileService`, `educationService`, `employmentService`, `skillsService`, `projectsService`
   - AI services: Resume generation, cover letter generation, job matching, company research
   - Pattern: Each service wraps CRUD helpers with domain-specific logic

3. **Auth Context** (`shared/context/AuthContext.tsx`):
   - Provides: `session`, `user`, `loading`, `signIn`, `signUpNewUser`, `signInWithOAuth`, `signOut`
   - Handles: Token refresh, session persistence, auth state changes

**Backend Data Layer:**

1. **Supabase Admin Client** (`services/supabaseAdmin.ts`):

   - Server-side Supabase client with service role key
   - Used for operations that bypass RLS

2. **AI Orchestrator** (`services/orchestrator.ts`):

   - Coordinates AI generation requests
   - Manages prompts and AI client interactions
   - Persists AI artifacts to database

3. **Route Handlers** (`routes/`):
   - Thin handlers that validate input, call services, return responses
   - Authentication via `X-User-Id` header (dev mode) or JWT validation

**Data Flow Example (Resume Generation):**

```
Frontend Component
  → AI Service (resumeService.ts)
    → HTTP POST to server (/api/ai/generate/resume)
      → Server Route Handler (routes/ai.ts)
        → Orchestrator (services/orchestrator.ts)
          → OpenAI Client (services/aiClient.ts)
          → Supabase Admin (persist artifact)
        ← Return artifact
      ← Return to frontend
    ← Update local state
  ← Render UI
```

**Issues Identified:**

1. **Inconsistent service usage**:

   - Some components call CRUD directly
   - Some components call workspace services
   - No clear guideline on when to use which

2. **Missing service layer for some features**:

   - Jobs workspace appears to have minimal service abstraction
   - Direct Supabase calls mixed with service calls

3. **No API response caching**:

   - Every component re-fetches data independently
   - No shared cache or state management for frequently accessed data

4. **Error handling inconsistency**:

   - `useErrorHandler` hook exists but not universally used
   - Some components use `alert()` or `console.error()`
   - Some components have inline error handling logic

5. **Type inconsistencies**:
   - Database row types vs domain model types not always aligned
   - Services sometimes return raw DB rows, sometimes mapped objects
   - No clear contract for service return types

### 1.5 Shared Logic and Components

**Current Shared Infrastructure:**

**Shared Components:**

- `ProtectedRoute` - Auth guard for routes
- `ErrorSnackbar` - Error notification display
- `SprintTaskSnackbar` - Sprint task overlay (dev/demo feature)
- `AppShell` - Main layout wrapper (top bar + sidebar + content)
- `GlobalTopBar` - Global navigation bar
- `SystemLayer` - Global overlays (snackbars, modals)
- Sidebars: `AISidebar`, `JobsSidebar`

**Shared Hooks:**

- `useAuth()` - Authentication state and actions
- `useErrorHandler()` - Centralized error handling and notifications
- `useSprintTasks()` - Sprint task tracking (demo feature)

**Shared Services:**

- `supabaseClient.ts` - Single Supabase client instance
- `crud.ts` - Generic CRUD operations
- `types.ts` - Shared type definitions

**Shared Utils:**

- `pageTaskMap.ts` - Maps pages to sprint tasks
- `taskOwners.ts` - Maps tasks to owners

**Issues Identified:**

1. **Inconsistent component usage**:

   - Not all pages use `ErrorSnackbar` (some use inline error display)
   - Not all protected pages use `ProtectedRoute` wrapper

2. **Duplicate functionality**:

   - Legacy `TopNav` component exists alongside `GlobalTopBar`
   - Multiple error notification patterns

3. **Missing common components**:

   - No shared loading spinner/skeleton component
   - No shared empty state component
   - No shared confirmation dialog component
   - No shared form components (input, select, date picker wrappers)

4. **Inconsistent styling patterns**:
   - Mix of inline `sx` props, theme usage, and hardcoded values
   - No standardized spacing/sizing system enforced

### 1.6 Error Handling and Performance

**Current Error Handling:**

1. **Centralized `useErrorHandler` hook** (`shared/hooks/useErrorHandler.ts`):

   - Provides: `handleError`, `showSuccess`, `showWarning`, `showInfo`
   - Maps error codes to user-friendly messages
   - Supports custom messages and severity levels

2. **Error notification via `ErrorSnackbar`**:
   - MUI Snackbar component
   - Auto-hide after configurable duration
   - Severity-based styling

**Issues:**

- Not consistently used across all pages
- Some components still use `alert()` or `console.error()`
- No error boundary for catching React errors
- No global error logging or monitoring

**Current Performance Patterns:**

**Good:**

- Using React 19 (latest)
- Using Vite for fast builds
- Lazy loading not extensively used but possible

**Issues:**

1. **No data caching**: Every component refetches independently
2. **No request deduplication**: Multiple components fetching same data simultaneously
3. **No pagination**: Some list pages (e.g., jobs pipeline) load all records
4. **No debouncing**: Search inputs trigger immediate requests
5. **No optimistic updates**: UI waits for server response before updating
6. **Large bundle size**: No code splitting beyond route level

### 1.7 Testing Coverage

**Current Test Setup:**

- **Testing Framework**: Vitest (configured in `package.json`)
- **Test Files Found**:
  - `frontend/src/app/shared/services/dbMappers.test.ts` (only 1 test file found)

**Test Commands:**

- `npm test` - Run tests in watch mode
- `npm run test:ci` - Run tests once (CI mode)

**Coverage Analysis:**

**What's Tested:**

- Database mappers (minimal)

**What's NOT Tested:**

- Authentication flows
- CRUD operations
- Service layer functions
- React components
- Hooks
- API endpoints
- Error handling logic
- Form validation
- User workflows

**Critical Gaps:**

- **0% coverage** on AI generation flows
- **0% coverage** on Jobs workspace features
- **0% coverage** on Profile workspace features
- **0% coverage** on shared hooks and context
- **0% coverage** on backend routes and services

---

## Phase 1: Major Issues Summary

### File Structure Issues

1. **Inconsistent route organization**: Profile routes not nested, scattered across root level
2. **Duplicate routes**: Same page accessible via multiple URLs
3. **Naming inconsistencies**: Mixed casing (`/skillsOverview` vs `/add-employment`)
4. **Legacy code present**: Unused `TopNav` component, commented-out routes

### UI/UX and Navigation Issues

1. **No clear onboarding flow**: New users land on homepage with no guidance
2. **Broken user journeys**: Job application workflow requires multiple navigation jumps
3. **Inconsistent layouts**: Profile workspace uses older layout pattern
4. **No empty states**: No guidance when users have no data
5. **No loading states**: Inconsistent loading indicators
6. **No confirmation dialogs**: Destructive actions (delete) lack confirmation
7. **Accessibility gaps**: No keyboard navigation standards, no screen reader support verified

### Data/API Layer Issues

1. **Inconsistent service usage**: Mix of direct CRUD calls and service abstraction
2. **Missing service layer**: Jobs workspace lacks service abstraction
3. **No caching strategy**: Repeated fetches of same data
4. **Type inconsistencies**: DB types vs domain types not aligned
5. **No request deduplication**: Simultaneous requests for same resource
6. **Error handling fragmentation**: Not all components use `useErrorHandler`

### Error Handling/Performance Issues

1. **No error boundaries**: Unhandled React errors crash entire UI
2. **No global error logging**: Errors not tracked or monitored
3. **Alert() usage**: Legacy alert dialogs instead of modern notifications
4. **No pagination**: Large lists load all records at once
5. **No debouncing**: Search inputs trigger immediate requests
6. **No code splitting**: Entire app bundles together (beyond route level)
7. **No performance monitoring**: No metrics on render times, API latency

### Testing Issues

1. **~1% test coverage**: Only one test file exists
2. **No integration tests**: User flows not tested
3. **No E2E tests**: Critical paths not verified
4. **No API contract tests**: Frontend/backend interface not validated
5. **No accessibility tests**: WCAG compliance not verified

---

## Next Steps: Phase 2 - Refactor Plan

The next phase will define a concrete refactor plan addressing these issues in order of:

1. **Impact**: High-value improvements first
2. **Risk**: Low-risk changes before high-risk restructuring
3. **Dependencies**: Foundation before features

The plan will include:

- Target file/folder structure
- Improved navigation model
- Unified data access patterns
- Shared component library
- Error handling standards
- Performance optimizations
- Testing strategy

---

## Phase 2: Refactor Plan

> **Created**: November 15, 2025
> **Approach**: Incremental, low-risk to high-impact
> **Execution**: 6 phases over 6-8 weeks

This plan defines concrete improvements organized by implementation phases. Each phase can be completed independently and provides immediate value.

---

### 2.1 Target File/Folder Structure

**Goal**: Create consistent, predictable organization that scales with features.

#### Proposed Frontend Structure

```
frontend/src/
├── main.tsx                           # Entry point (no change)
├── App.tsx                            # Root providers (no change)
├── router.tsx                         # Centralized routing (improved)
├── app/
│   ├── shared/                        # Cross-workspace foundation
│   │   ├── components/
│   │   │   ├── feedback/              # NEW: Error, success, loading components
│   │   │   │   ├── ErrorBoundary.tsx
│   │   │   │   ├── ErrorSnackbar.tsx  # (existing, moved here)
│   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   ├── LoadingSkeleton.tsx
│   │   │   │   └── EmptyState.tsx
│   │   │   ├── dialogs/               # NEW: Reusable dialogs
│   │   │   │   ├── ConfirmDialog.tsx
│   │   │   │   └── FormDialog.tsx
│   │   │   ├── forms/                 # NEW: Form components
│   │   │   │   ├── FormInput.tsx
│   │   │   │   ├── FormSelect.tsx
│   │   │   │   ├── FormDatePicker.tsx
│   │   │   │   └── FormTextArea.tsx
│   │   │   ├── navigation/            # NEW: Navigation components
│   │   │   │   ├── Breadcrumbs.tsx
│   │   │   │   ├── BackButton.tsx
│   │   │   │   └── NavTabs.tsx
│   │   │   ├── layout/                # Renamed from 'common'
│   │   │   │   ├── ProtectedRoute.tsx
│   │   │   │   ├── AppShell.tsx       # (moved from layouts/)
│   │   │   │   ├── GlobalTopBar.tsx   # (moved from layouts/)
│   │   │   │   └── SystemLayer.tsx    # (moved from layouts/)
│   │   │   └── sidebars/              # (existing)
│   │   │       ├── AISidebar.tsx
│   │   │       └── JobsSidebar.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx        # (existing)
│   │   │   └── CacheContext.tsx       # NEW: Data caching layer
│   │   ├── hooks/
│   │   │   ├── useAuth.ts             # (re-export from context)
│   │   │   ├── useErrorHandler.ts     # (existing)
│   │   │   ├── useCache.ts            # NEW: Cache management
│   │   │   ├── usePagination.ts       # NEW: Pagination helper
│   │   │   ├── useDebounce.ts         # NEW: Debounce helper
│   │   │   └── useConfirmDialog.ts    # NEW: Confirmation dialog
│   │   ├── services/
│   │   │   ├── api/                   # NEW: Organized API layer
│   │   │   │   ├── client.ts          # Supabase client (renamed)
│   │   │   │   ├── crud.ts            # (existing)
│   │   │   │   ├── cache.ts           # NEW: Caching utilities
│   │   │   │   └── types.ts           # (existing)
│   │   │   └── domain/                # NEW: Domain services
│   │   │       └── (workspace services will reference these)
│   │   ├── types/
│   │   │   ├── database.ts            # DB row types
│   │   │   ├── domain.ts              # Business entity types
│   │   │   └── api.ts                 # API request/response types
│   │   ├── utils/
│   │   │   ├── formatters.ts          # NEW: Date, currency, text formatters
│   │   │   ├── validators.ts          # NEW: Form validation helpers
│   │   │   └── constants.ts           # NEW: App-wide constants
│   │   └── theme/                     # (existing, no change)
│   │
│   └── workspaces/
│       ├── profile/
│       │   ├── ProfileWorkspace.tsx   # NEW: Workspace root component
│       │   ├── routes.tsx             # NEW: Profile route definitions
│       │   ├── pages/
│       │   │   ├── ProfileDashboard/  # Renamed from 'dashboard'
│       │   │   ├── Education/         # Consolidated (overview + manage)
│       │   │   ├── Skills/            # Consolidated (overview + manage)
│       │   │   ├── Employment/        # Consolidated (list + add/edit)
│       │   │   ├── Projects/          # Consolidated (portfolio + add/edit)
│       │   │   ├── Certifications/    # (existing)
│       │   │   ├── ProfileSettings/   # Renamed from 'profile'
│       │   │   └── Account/           # Renamed from 'profile/Settings'
│       │   ├── components/            # Profile-specific components
│       │   ├── services/
│       │   │   ├── profileService.ts  # Unified service
│       │   │   ├── educationService.ts
│       │   │   ├── employmentService.ts
│       │   │   ├── skillsService.ts
│       │   │   └── projectsService.ts
│       │   └── types/
│       │       └── profile.types.ts   # Profile-specific types
│       │
│       ├── ai/
│       │   ├── AiWorkspace.tsx        # Renamed from AiLayout
│       │   ├── routes.tsx             # NEW: AI route definitions
│       │   ├── pages/
│       │   │   ├── Dashboard/         # AI feature overview
│       │   │   ├── ResumeBuilder/     # Renamed from ResumeEditorV2
│       │   │   ├── CoverLetterBuilder/ # Consolidated cover letter pages
│       │   │   ├── JobMatcher/        # Renamed from JobMatch
│       │   │   ├── CompanyResearch/   # (existing)
│       │   │   └── Templates/         # Renamed from TemplatesHub
│       │   ├── components/
│       │   │   ├── resume/            # Resume-specific components
│       │   │   ├── cover-letter/      # Cover letter components
│       │   │   └── shared/            # AI workspace shared components
│       │   ├── services/
│       │   │   ├── resumeService.ts
│       │   │   ├── coverLetterService.ts
│       │   │   ├── jobMatchService.ts
│       │   │   └── companyResearchService.ts
│       │   ├── hooks/
│       │   │   ├── useResumeGeneration.ts
│       │   │   └── useCoverLetterGeneration.ts
│       │   └── types/
│       │       └── ai.types.ts
│       │
│       └── jobs/
│           ├── JobsWorkspace.tsx      # Renamed from JobsLayout
│           ├── routes.tsx             # NEW: Jobs route definitions
│           ├── pages/
│           │   ├── Pipeline/          # Kanban board
│           │   ├── JobDetails/        # NEW: Individual job view
│           │   ├── NewJob/            # (existing)
│           │   ├── Documents/         # Materials management
│           │   ├── Search/            # Renamed from SavedSearches
│           │   ├── Analytics/         # (existing)
│           │   └── Automation/        # Renamed from Automations
│           ├── components/
│           │   ├── pipeline/          # Kanban-specific components
│           │   ├── job-card/          # Job card components
│           │   └── forms/             # Job form components
│           ├── services/
│           │   ├── jobsService.ts     # NEW: Main jobs service
│           │   ├── pipelineService.ts # NEW: Pipeline logic
│           │   └── analyticsService.ts # NEW: Analytics logic
│           └── types/
│               └── jobs.types.ts
```

#### Backend Structure (Minimal Changes)

```
server/src/
├── index.ts                    # (no change)
├── server.ts                   # (no change)
├── routes/
│   ├── index.ts                # NEW: Route registry
│   ├── health.ts               # (existing)
│   ├── ai/                     # NEW: Grouped AI routes
│   │   ├── resume.ts
│   │   ├── coverLetter.ts
│   │   └── research.ts
│   └── jobs/                   # NEW: Grouped job routes
│       ├── crud.ts
│       └── analytics.ts
├── services/
│   ├── ai/                     # NEW: Grouped AI services
│   │   ├── orchestrator.ts     # (existing)
│   │   ├── client.ts           # Renamed from aiClient.ts
│   │   └── prompts/            # NEW: Prompt templates
│   ├── data/                   # NEW: Data services
│   │   ├── supabase.ts         # Renamed from supabaseAdmin.ts
│   │   └── cache.ts            # NEW: Server-side cache
│   └── domain/                 # NEW: Business logic
├── middleware/
│   ├── auth.ts                 # NEW: JWT validation
│   ├── rateLimit.ts            # NEW: Rate limiting
│   └── errorHandler.ts         # NEW: Error handling
└── types/                      # (existing)
```

---

### 2.2 Improved Navigation Model

**Goal**: Create intuitive, predictable navigation that matches user mental models.

#### Proposed Route Structure

```typescript
// Public routes (no change)
/
/login
/register
/auth/callback
/forgot-password
/reset-password

// Profile Workspace - All nested under /profile
/profile                          # Dashboard
/profile/education               # Education list
/profile/education/add           # Add education
/profile/education/:id/edit      # Edit education
/profile/skills                  # Skills list
/profile/skills/manage           # Add/edit skills (bulk)
/profile/employment              # Employment list
/profile/employment/add          # Add employment
/profile/employment/:id/edit     # Edit employment
/profile/projects                # Project portfolio
/profile/projects/add            # Add project
/profile/projects/:id            # View project
/profile/projects/:id/edit       # Edit project
/profile/certifications          # Certifications list
/profile/settings                # Profile settings
/profile/account                 # Account settings

// AI Workspace (improved consistency)
/ai                              # AI Dashboard
/ai/resume                       # Resume builder
/ai/resume/new                   # NEW: Create from scratch
/ai/resume/:id                   # NEW: Edit existing
/ai/cover-letter                 # Cover letter builder
/ai/cover-letter/new             # NEW: Create from scratch
/ai/cover-letter/:id             # NEW: Edit existing
/ai/job-matcher                  # Renamed from job-match
/ai/company-research             # (existing)
/ai/templates                    # Templates library

// Jobs Workspace (improved)
/jobs                            # Pipeline (default view)
/jobs/pipeline                   # Pipeline kanban
/jobs/new                        # Add new job
/jobs/:id                        # NEW: Job details page
/jobs/:id/edit                   # NEW: Edit job
/jobs/:id/materials              # NEW: Manage resume/cover letter
/jobs/documents                  # Document library
/jobs/search                     # Renamed from saved-searches
/jobs/analytics                  # Analytics dashboard
/jobs/automation                 # Automation settings
/jobs/archived                   # Archived jobs
```

#### Navigation Improvements

1. **Consistent Nesting**: All workspace routes nested under workspace prefix
2. **RESTful Patterns**: Use `:id` for entities, `/add`, `/edit`, `/new` for actions
3. **Predictable Hierarchy**: List → Details → Edit pattern
4. **Breadcrumbs**: Every nested page shows breadcrumb trail
5. **Back Navigation**: Consistent back button behavior

#### Layout Hierarchy

```
App
├── GlobalTopBar (always visible)
│   ├── Logo (links to /)
│   ├── Workspace Nav (Profile | AI | Jobs)
│   └── User Menu (Settings | Logout)
│
├── Workspace Layout (varies by workspace)
│   ├── Sidebar (workspace-specific navigation)
│   └── Content Area
│       ├── Breadcrumbs (nested pages)
│       ├── Page Header (title + actions)
│       └── Page Content
│
└── SystemLayer (global overlays)
    ├── ErrorSnackbar
    ├── ConfirmDialog
    └── LoadingOverlay (for long operations)
```

---

### 2.3 Unified Data Access Patterns

**Goal**: Consistent, type-safe, cacheable data access across the app.

#### Data Layer Architecture

```typescript
// 1. Database Types (generated from Supabase schema)
type ProfileRow = {
  /* DB columns */
};
type JobRow = {
  /* DB columns */
};

// 2. Domain Types (business entities)
type Profile = {
  /* UI-friendly fields */
};
type Job = {
  /* UI-friendly fields */
};

// 3. Service Layer (maps DB ↔ Domain)
class ProfileService {
  async getProfile(userId: string): Promise<Profile | null>;
  async updateProfile(userId: string, data: Partial<Profile>): Promise<Profile>;
  // ... CRUD methods

  private mapRowToDomain(row: ProfileRow): Profile {
    /* mapping */
  }
  private mapDomainToRow(domain: Profile): ProfileRow {
    /* mapping */
  }
}

// 4. Cache Layer (optional, for frequently accessed data)
const cache = new Map<string, { data: unknown; timestamp: number }>();

// 5. React Hook (combines service + cache + error handling)
function useProfile(userId: string) {
  const [data, setData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    profileService
      .getProfile(userId)
      .then(setData)
      .catch(handleError)
      .finally(() => setLoading(false));
  }, [userId]);

  return {
    data,
    loading,
    refetch: () => {
      /* ... */
    },
  };
}
```

#### Service Standards

**Every service must:**

1. Use `withUser(userId)` for user-scoped operations
2. Return consistent `Result<T>` type with `{ data, error }`
3. Map DB rows to domain types (no raw DB objects in UI)
4. Handle errors gracefully (never throw to UI)
5. Support pagination for list operations
6. Provide TypeScript types for all inputs/outputs

**Example Service Template:**

```typescript
// services/profileService.ts
import { withUser } from "@shared/services/api/crud";
import type { Result } from "@shared/services/api/types";
import type { ProfileRow, Profile } from "@shared/types";

export const profileService = {
  async getProfile(userId: string): Promise<Result<Profile>> {
    const crud = withUser(userId);
    const res = await crud.getRow<ProfileRow>("profiles", "*", {
      eq: { id: userId },
      single: true,
    });

    if (res.error) return { data: null, error: res.error };
    if (!res.data) return { data: null, error: null };

    return {
      data: this.mapRowToDomain(res.data),
      error: null,
    };
  },

  async updateProfile(
    userId: string,
    updates: Partial<Profile>
  ): Promise<Result<Profile>> {
    const crud = withUser(userId);
    const payload = this.mapDomainToRow(updates);
    const res = await crud.updateRow<ProfileRow>("profiles", payload, {
      eq: { id: userId },
    });

    if (res.error) return { data: null, error: res.error };
    if (!res.data) return { data: null, error: null };

    return {
      data: this.mapRowToDomain(res.data),
      error: null,
    };
  },

  mapRowToDomain(row: ProfileRow): Profile {
    return {
      id: row.id,
      fullName: `${row.first_name} ${row.last_name}`,
      email: row.email,
      // ... transform DB structure to UI structure
    };
  },

  mapDomainToRow(domain: Partial<Profile>): Partial<ProfileRow> {
    return {
      // ... transform UI structure to DB structure
    };
  },
};
```

#### Caching Strategy

```typescript
// Simple in-memory cache for frequently accessed data
class DataCache {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private TTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) this.cache.delete(key);
    }
  }
}

export const dataCache = new DataCache();
```

---

### 2.4 Shared Component Library

**Goal**: Consistent UI components that enforce design system and reduce duplication.

#### Component Categories

**1. Feedback Components** (`shared/components/feedback/`)

```typescript
// ErrorBoundary.tsx - Catch React errors
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>

// LoadingSpinner.tsx - Consistent loading indicator
<LoadingSpinner size="small" | "medium" | "large" />

// LoadingSkeleton.tsx - Content placeholders
<LoadingSkeleton variant="text" | "card" | "list" width={200} height={40} />

// EmptyState.tsx - No data states
<EmptyState
  icon={<InboxIcon />}
  title="No jobs yet"
  description="Get started by adding your first job opportunity"
  action={<Button onClick={handleAdd}>Add Job</Button>}
/>
```

**2. Dialog Components** (`shared/components/dialogs/`)

```typescript
// ConfirmDialog.tsx - Confirmation dialogs
const { confirm } = useConfirmDialog()
const confirmed = await confirm({
  title: 'Delete Job?',
  message: 'This action cannot be undone.',
  confirmText: 'Delete',
  confirmColor: 'error'
})

// FormDialog.tsx - Form in dialog
<FormDialog
  open={open}
  onClose={handleClose}
  title="Add Education"
  onSubmit={handleSubmit}
>
  {/* form fields */}
</FormDialog>
```

**3. Form Components** (`shared/components/forms/`)

```typescript
// Standardized form inputs with validation
<FormInput
  label="Email"
  value={email}
  onChange={setEmail}
  error={errors.email}
  required
  type="email"
/>

<FormSelect
  label="Experience Level"
  value={level}
  onChange={setLevel}
  options={[
    { value: 'entry', label: 'Entry Level' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior Level' }
  ]}
/>

<FormDatePicker
  label="Start Date"
  value={startDate}
  onChange={setStartDate}
  maxDate={new Date()}
/>
```

**4. Navigation Components** (`shared/components/navigation/`)

```typescript
// Breadcrumbs.tsx
<Breadcrumbs
  items={[
    { label: 'Jobs', path: '/jobs' },
    { label: 'Software Engineer', path: '/jobs/123' },
    { label: 'Materials' }
  ]}
/>

// BackButton.tsx
<BackButton to="/jobs" label="Back to Jobs" />

// NavTabs.tsx
<NavTabs
  value={activeTab}
  onChange={setActiveTab}
  tabs={[
    { value: 'overview', label: 'Overview', path: '/jobs/123' },
    { value: 'materials', label: 'Materials', path: '/jobs/123/materials' }
  ]}
/>
```

#### Component Implementation Priority

**Phase 1 (Critical):**

- ErrorBoundary
- LoadingSpinner
- EmptyState
- ConfirmDialog

**Phase 2 (High Value):**

- FormInput, FormSelect, FormDatePicker
- Breadcrumbs
- BackButton

**Phase 3 (Nice to Have):**

- LoadingSkeleton
- FormDialog
- NavTabs

---

### 2.5 Error Handling Standards

**Goal**: Consistent, user-friendly error handling across the entire app.

#### Error Handling Architecture

```typescript
// 1. Error Boundary (React errors)
class AppErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(error, errorInfo);
    // Show fallback UI
  }
}

// 2. Service Layer Errors (API/DB errors)
type Result<T> = { data: T; error: null } | { data: null; error: CrudError };

// All services return Result<T>, never throw

// 3. Component Error Handling
function MyComponent() {
  const { handleError, showSuccess } = useErrorHandler();

  async function handleAction() {
    const res = await myService.doSomething();
    if (res.error) {
      handleError(res.error);
      return;
    }
    showSuccess("Action completed!");
    // ... use res.data
  }
}

// 4. Global Error Notification
// ErrorSnackbar in SystemLayer shows all errors
```

#### Error Handling Rules

**DO:**

- Use `useErrorHandler` for all error notifications
- Return `Result<T>` from services (never throw)
- Wrap async operations in try-catch
- Log errors to console in development
- Show user-friendly messages (never show stack traces)

**DON'T:**

- Use `alert()` or `window.confirm()`
- Throw errors from services to components
- Show technical error messages to users
- Ignore errors silently

---

### 2.6 Performance Optimization Strategy

**Goal**: Fast, responsive UI with efficient data loading.

#### Optimization Targets

**1. Data Loading**

- Implement pagination for large lists (>50 items)
- Add request debouncing for search inputs (300ms)
- Cache frequently accessed data (profiles, job lists)
- Deduplicate simultaneous requests for same resource

**2. Rendering Performance**

- Use `React.memo()` for expensive list items
- Virtualize long lists (react-window for >100 items)
- Lazy load workspace routes
- Code-split large dependencies

**3. Bundle Size**

- Analyze bundle with `vite-plugin-visualizer`
- Tree-shake unused MUI components
- Lazy load AI generation features
- Consider date-fns over dayjs (smaller)

**4. Network Performance**

- Compress API responses (gzip)
- Use HTTP/2 for server
- Implement optimistic UI updates
- Prefetch likely next pages

#### Implementation Patterns

```typescript
// Debounced search
const [searchTerm, setSearchTerm] = useState("");
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearch) {
    searchJobs(debouncedSearch);
  }
}, [debouncedSearch]);

// Paginated list
const { data, loading, hasMore, loadMore } = usePagination(
  () => jobsService.listJobs(userId, { limit: 20, offset: page * 20 }),
  [page]
);

// Cached data
const { data, loading } = useCache(
  `profile-${userId}`,
  () => profileService.getProfile(userId),
  { ttl: 5 * 60 * 1000 } // 5 minutes
);

// Optimistic update
async function handleToggleFavorite(jobId: string) {
  // Update UI immediately
  setJobs((prev) =>
    prev.map((j) => (j.id === jobId ? { ...j, favorite: !j.favorite } : j))
  );

  // Send request in background
  const res = await jobsService.toggleFavorite(userId, jobId);

  // Rollback on error
  if (res.error) {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, favorite: !j.favorite } : j))
    );
    handleError(res.error);
  }
}
```

---

### 2.7 Testing Strategy

**Goal**: Achieve 80%+ test coverage on critical paths, prevent regressions.

#### Testing Pyramid

```
        /\
       /  \  E2E Tests (5%)
      /    \  - Critical user flows
     /------\  - Smoke tests
    /  Unit  \  Integration Tests (25%)
   /  Tests  \  - Service layer
  /   (70%)   \  - Hook behavior
 /______________\  - Component logic
```

#### Test Coverage Targets

**Phase 1 (Critical Paths):**

- Auth flows: Login, register, logout (E2E)
- Profile CRUD: Create, read, update (Integration)
- Job pipeline: Add job, move status, delete (E2E)
- AI generation: Resume/cover letter generation (Integration)

**Phase 2 (Service Layer):**

- All services have unit tests
- CRUD operations tested with mock DB
- Error handling tested
- Type safety verified

**Phase 3 (Components):**

- Shared components tested in isolation
- Form validation tested
- Loading/error states tested
- Accessibility tested (keyboard nav, screen reader)

#### Test Examples

```typescript
// Unit test: Service
describe("profileService", () => {
  it("should map DB row to domain model", () => {
    const row: ProfileRow = {
      id: "123",
      first_name: "John",
      last_name: "Doe",
      email: "john@test.com",
    };
    const profile = profileService.mapRowToDomain(row);
    expect(profile.fullName).toBe("John Doe");
    expect(profile.email).toBe("john@test.com");
  });
});

// Integration test: Hook
describe("useProfile", () => {
  it("should load profile on mount", async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useProfile("user-123")
    );

    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeTruthy();
  });
});

// E2E test: User flow
describe("Job Pipeline", () => {
  it("should allow user to add and move job", async () => {
    await page.goto("/jobs");
    await page.click('[data-testid="add-job-button"]');
    await page.fill('[name="job_title"]', "Software Engineer");
    await page.fill('[name="company_name"]', "Tech Corp");
    await page.click('[type="submit"]');

    // Verify job appears in pipeline
    await expect(page.locator("text=Software Engineer")).toBeVisible();

    // Move to next stage
    await page.dragAndDrop(
      '[data-testid="job-card-1"]',
      '[data-testid="column-phone-screen"]'
    );

    // Verify status updated
    await expect(page.locator('[data-status="phone_screen"]')).toContainText(
      "Software Engineer"
    );
  });
});
```

---

### 2.8 Implementation Order (Phased Approach)

**Goal**: Deliver value incrementally, minimize risk, build foundation first.

#### Phase 1: Foundation (Week 1-2) - LOW RISK, HIGH VALUE

**Goals:**

- Establish shared component library
- Standardize error handling
- Add missing types

**Tasks:**

1. Create shared feedback components (ErrorBoundary, LoadingSpinner, EmptyState)
2. Create ConfirmDialog and useConfirmDialog hook
3. Ensure useErrorHandler is used consistently across all pages
4. Add TypeScript types for all DB tables → domain models
5. Create service template and document standards
6. Add basic unit tests for existing services

**Success Criteria:**

- All pages use ErrorBoundary
- All pages use useErrorHandler
- All destructive actions use ConfirmDialog
- Services have consistent return types
- 10+ unit tests pass

**Files Changed:** ~20-30 files (mostly new shared components + updates to existing pages)

---

#### Phase 2: Profile Workspace Refactor (Week 2-3) - MEDIUM RISK, HIGH VALUE

**Goals:**

- Consolidate profile routes
- Unify profile page patterns
- Improve profile navigation

**Tasks:**

1. Create new route structure: `/profile/*`
2. Consolidate education pages (overview + manage → single page with tabs)
3. Consolidate skills pages (overview + manage → single page)
4. Consolidate employment pages (list + add/edit → single page)
5. Add breadcrumbs to all profile pages
6. Update ProfileLayout to use AppShell pattern (like AI/Jobs)
7. Add pagination to employment/projects lists
8. Add empty states to all list pages

**Success Criteria:**

- All profile routes nested under `/profile`
- Consistent list → add/edit pattern
- Breadcrumbs on all nested pages
- Profile workspace matches AI/Jobs layout quality

**Files Changed:** ~30-40 files (route updates, page consolidation, layout changes)

---

#### Phase 3: Jobs Service Layer (Week 3-4) - MEDIUM RISK, MEDIUM VALUE

**Goals:**

- Create jobs service abstraction
- Implement pagination for job lists
- Add caching for job data

**Tasks:**

1. Create `jobsService.ts` with full CRUD operations
2. Create `pipelineService.ts` for kanban logic
3. Update all Jobs pages to use services (no direct Supabase calls)
4. Implement pagination for pipeline (load 50 jobs at a time)
5. Add debounced search to jobs list
6. Implement job data caching (5-minute TTL)
7. Add optimistic updates for job status changes
8. Create unit tests for jobs services

**Success Criteria:**

- Jobs workspace has no direct Supabase calls
- Pipeline loads quickly (< 1s for 50 jobs)
- Search is debounced (300ms)
- Job status changes feel instant (optimistic UI)
- 15+ service tests pass

**Files Changed:** ~25-35 files (new services, update all Jobs pages)

---

#### Phase 4: Navigation & UX Improvements (Week 4-5) - LOW RISK, HIGH VALUE

**Goals:**

- Improve user flows
- Add navigation helpers
- Reduce friction in common tasks

**Tasks:**

1. Add job details page (`/jobs/:id`) with tabbed layout
2. Add job materials page (`/jobs/:id/materials`) for resume/cover letter management
3. Add direct links from job to AI generation (with job context)
4. Create Breadcrumbs component and add to all workspaces
5. Create BackButton component and add to detail pages
6. Add NavTabs component for tabbed pages
7. Implement "onboarding flow" for new users (profile completion prompt)
8. Add empty state guidance with helpful actions

**Success Criteria:**

- Users can navigate job → AI → back to job seamlessly
- All detail pages have back button
- All nested pages have breadcrumbs
- New users see profile completion prompt
- Empty states provide clear next actions

**Files Changed:** ~20-30 files (new components, route additions, UX improvements)

---

#### Phase 5: Performance Optimization (Week 5-6) - MEDIUM RISK, HIGH VALUE

**Goals:**

- Improve load times
- Reduce bundle size
- Optimize rendering

**Tasks:**

1. Add bundle analyzer and identify large dependencies
2. Implement lazy loading for workspace routes
3. Add react-window for long lists (jobs, projects)
4. Implement request deduplication
5. Add prefetching for likely next pages
6. Optimize images (compression, lazy loading)
7. Implement code splitting for heavy AI components
8. Add loading skeletons for better perceived performance

**Success Criteria:**

- Initial bundle size < 500KB (gzipped)
- Time to interactive < 2s on 3G
- Lists with 100+ items render smoothly (60fps)
- Perceived performance improved (loading skeletons)

**Files Changed:** ~15-20 files (optimization changes, lazy loading, virtualization)

---

#### Phase 6: Testing & Polish (Week 6-8) - LOW RISK, HIGH VALUE

**Goals:**

- Achieve 80% test coverage
- Fix accessibility issues
- Polish UI consistency

**Tasks:**

1. Write E2E tests for critical flows (auth, job pipeline, AI generation)
2. Write integration tests for all services
3. Write unit tests for hooks and utilities
4. Run accessibility audit (axe-core)
5. Fix keyboard navigation issues
6. Add ARIA labels where missing
7. Standardize spacing/sizing across all pages
8. Create style guide documentation
9. Conduct user testing and gather feedback
10. Fix bugs discovered in testing

**Success Criteria:**

- 80%+ code coverage (services, hooks, utilities)
- 5+ E2E tests covering critical flows
- 0 critical accessibility violations (axe-core)
- Keyboard navigation works on all pages
- Consistent spacing/sizing (via theme system)

**Files Changed:** ~40-50 files (new tests, accessibility fixes, polish)

---

### 2.9 Risk Mitigation

**High-Risk Changes:**

- Route restructuring (Phase 2) - **Mitigation**: Add redirects for old routes, test thoroughly
- Service layer refactor (Phase 3) - **Mitigation**: Refactor incrementally, keep old code until verified
- Performance optimization (Phase 5) - **Mitigation**: Benchmark before/after, feature flags for rollback

**Medium-Risk Changes:**

- Layout consolidation - **Mitigation**: Keep old layouts until all pages migrated
- Navigation improvements - **Mitigation**: A/B test with small user group first

**Low-Risk Changes:**

- Shared component library - **Mitigation**: Additive only, doesn't break existing code
- Testing additions - **Mitigation**: Pure additions, no behavior changes

---

### 2.10 Success Metrics

**Developer Experience:**

- Time to add new feature: < 1 day (vs current ~2-3 days)
- Code review time: < 30 min (vs current ~1-2 hours)
- Bug fix time: < 2 hours (vs current ~4-8 hours)
- New developer onboarding: < 1 week (vs current ~2-3 weeks)

**User Experience:**

- Time to interactive: < 2s (current: ~4-5s)
- Page navigation: < 200ms (current: ~500ms)
- Form submission: Instant feedback (current: 1-2s delay)
- Error recovery: < 10s (current: requires page refresh)

**Code Quality:**

- Test coverage: 80%+ (current: ~1%)
- Type safety: 100% (current: ~85%)
- Accessibility: 0 critical violations (current: not measured)
- Bundle size: < 500KB gzipped (current: not measured)

---

**Document Status**: Phase 2 Complete
**Next Phase**: Implementation (Phase 1 Execution)
**Approval Required**: Yes - Review plan before starting implementation
