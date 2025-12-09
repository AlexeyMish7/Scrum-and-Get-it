# GitHub Copilot Instructions for FlowATS

## Application Overview

FlowATS is a full-stack job application tracking system with AI-powered features. The app helps job seekers manage their job search, build resumes, prepare for interviews, and collaborate with teams.

### Current Status: Sprint 4

We are in **Sprint 4** which focuses on:

- External integrations (LinkedIn, Google Calendar)
- Bug fixing and stability improvements
- Production readiness (performance, error handling)
- Polish and UX refinements

**See detailed Sprint 4 tasks:** `.github/instructions/sprint4.instructions.md`

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  React + TypeScript + Material-UI                           │
│  Location: frontend/src/                                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Supabase Client (frontend/src/shared/services/)    │   │
│  │  - Direct database access via REST API              │   │
│  │  - Authentication (login, signup, OAuth)            │   │
│  │  - File storage (avatars, documents)                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Database calls go directly
                          │ to Supabase (no server needed)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                    │
│  - All data storage (profiles, jobs, documents)             │
│  - Row Level Security (users only see their data)           │
│  - Real-time subscriptions                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                         SERVER                              │
│  Node.js + Express                                          │
│  Location: server/src/                                      │
│                                                             │
│  ONLY used for:                                             │
│  - AI/OpenAI API calls (resume generation, analysis)        │
│  - External API integrations                                │
│  - Operations requiring server-side secrets                 │
└─────────────────────────────────────────────────────────────┘
```

**Key Point:** The frontend connects **directly** to Supabase for all database operations. The server is only used for AI features and external APIs that require server-side processing.

---

## Frontend Workspaces

The frontend is organized into **workspaces** - each handling a major feature area:

```
frontend/src/app/workspaces/
├── profile/           # User profile, skills, education, employment
├── job_pipeline/      # Kanban board for tracking job applications
├── ai_workspace/      # Resume/cover letter generation
├── interview_hub/     # Interview scheduling and prep
├── network_hub/       # Networking contacts and references
└── team_management/   # Team collaboration features
```

### UI Flow

```
Login → Dashboard (profile workspace) → Navigate via sidebar to other workspaces
         │
         ├── Profile → Skills, Education, Employment, Projects
         ├── Jobs → Kanban board with drag-and-drop
         ├── AI → Generate resumes and cover letters
         ├── Interviews → Schedule and prepare
         └── Teams → Collaborate with others
```

### Workspace-Specific Instructions

**When working in a specific workspace**, check for detailed instructions:

```
.github/instructions/
├── profile/           # Profile workspace patterns
├── job_pipeline/      # Job tracking patterns
├── ai_workspace/      # AI generation patterns
├── interview_hub/     # Interview feature patterns
├── network_hub/       # Networking patterns
├── team_management/   # Team collaboration patterns
└── database/          # Database schema and queries
```

Each workspace folder contains:

- `overview.instructions.md` - Structure and key concepts
- `components.instructions.md` - UI component patterns
- `services.instructions.md` - Data fetching patterns
- `types.instructions.md` - TypeScript type definitions

---

## React Contexts

The app uses React Context for global state management:

### AuthContext (`@shared/context/AuthContext`)

- Manages user authentication state
- Provides `user`, `session`, `signIn`, `signOut`
- Wraps the entire app

### ThemeContext (`@shared/context/ThemeContext`)

- Light/dark mode toggle
- Persists preference to localStorage

### AvatarContext (`@shared/context/AvatarContext`)

- User profile picture management
- Provides `avatarUrl` and upload functionality

### ApiLogDebugProvider (`@shared/components/dev/`)

- Development tool for debugging API/Supabase calls
- Shows real-time request logs in a floating panel

### React Query (Profile Workspace)

- Profile data cached via React Query
- Cache config in `profile/cache/cacheConfig.ts`
- ENV-configurable stale time: `VITE_CACHE_STALE_TIME_MINUTES`

---

## Database Connection Pattern

**All database calls happen in the frontend** via Supabase client:

```typescript
// frontend/src/app/shared/services/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Use the CRUD Helper

**Always use the shared CRUD utility** for database operations:

```typescript
// frontend/src/app/shared/services/crud.ts
import * as crud from "@shared/services/crud";

// Examples:
await crud.getUserProfile(userId);
await crud.listRows("skills", userId);
await crud.insertRow("education", { user_id: userId, ... });
await crud.updateRow("employment", id, { job_title: "..." });
await crud.deleteRow("projects", id);
await crud.upsertRow("profiles", data, "id");
```

### Service Layer with Mappers

Each workspace has service files that:

1. Use the CRUD helper for database operations
2. Map database rows (snake_case) to UI types (camelCase)

```typescript
// Example: frontend/src/app/workspaces/profile/services/education.ts

// DB Row shape (from database)
type DbEducationRow = {
  institution_name: string;
  degree_type: string;
  field_of_study: string;
};

// UI Type shape (for components)
type EducationEntry = {
  institution: string;
  degree: string;
  field: string;
};

// Mapper function
function mapRowToEducation(row: DbEducationRow): EducationEntry {
  return {
    institution: row.institution_name,
    degree: row.degree_type,
    field: row.field_of_study,
  };
}
```

**Pattern:**

```
Component → Service (with mapper) → CRUD Helper → Supabase Client → Database
```

**When adding new database features:**

1. Check if a mapper already exists in the workspace's `services/` folder
2. If not, create a mapper following the pattern above
3. Use the CRUD helper, don't call Supabase directly in components

---

## Primary Instructions Location

```
.github/instructions/
├── dev-tools.instructions.md   # Dev panel and debugging tools
├── profile/                    # Profile workspace
├── job_pipeline/               # Jobs workspace
├── ai_workspace/               # AI generation
├── interview_hub/              # Interviews
├── network_hub/                # Networking
├── team_management/            # Teams
└── database/                   # Schema reference
```

**Always read these files first** when working on code to understand:

- Project structure and architecture
- Coding patterns and conventions
- Service layer usage
- Database schema and relationships

---

## Additional Context

For broader understanding:

```
docs/
├── ARCHITECTURE.md              # System overview and data flows
├── GIT_COLLABORATION.md         # Git workflow
├── frontend/                    # Frontend deep-dive
├── server/                      # Server documentation
├── database/                    # Schema reference
└── performance/                 # Performance baselines
```

---

## Code Quality Guidelines

### 1. Add Meaningful Comments

**Always add comments that explain WHY, not WHAT:**

```typescript
// ❌ BAD - States the obvious
// Loop through jobs
jobs.forEach(job => { ... });

// ✅ GOOD - Explains the reason
// Fetch fresh match scores for jobs that don't have cached analytics
jobs.forEach(job => { ... });
```

**Comment complex logic:**

```typescript
// ✅ GOOD
// We rebase the feature branch on main to resolve conflicts locally
// before pushing, which keeps the remote history clean
git rebase origin/main
```

**Add context to business logic:**

```typescript
// ✅ GOOD
// Cache match scores for 7 days to reduce OpenAI API costs
// and improve response time for repeated job views
const CACHE_EXPIRY_DAYS = 7;
```

### 2. Avoid Overly Complex Syntax

**Keep code simple and readable:**

```typescript
// ❌ AVOID - Too clever, hard to read
const active = jobs
  .filter((j) => j.status !== "archived")
  .map((j) => ({ ...j, isActive: true }));

// ✅ PREFER - Clear steps
const nonArchivedJobs = jobs.filter((job) => job.status !== "archived");
const activeJobs = nonArchivedJobs.map((job) => ({
  ...job,
  isActive: true,
}));
```

**Use descriptive variable names:**

```typescript
// ❌ AVOID
const d = new Date();
const ms = d.getTime();

// ✅ PREFER
const currentDate = new Date();
const timestamp = currentDate.getTime();
```

### 3. High-Level, Non-Technical Explanations

When explaining code or writing comments, make them understandable:

```typescript
// ❌ AVOID - Too technical
// Memoize the filtered dataset to prevent unnecessary re-renders
// when parent component re-renders due to unrelated state changes

// ✅ PREFER - Clear and simple
// Remember the filtered jobs so we don't recalculate them
// every time the page updates
const filteredJobs = useMemo(() => { ... }, [jobs, filter]);
```

### 4. NO Markdown Summary Files

**❌ DO NOT create files like:**

- `CHANGES.md`
- `UPDATES.md`
- `SUMMARY.md`
- `MODIFICATIONS.md`

**✅ INSTEAD:**

- Make the changes directly
- Add comments in the code itself
- Provide a brief verbal summary when done

---

## Repository Sync Command

When the user says any of these phrases, perform a full codebase scan and update:

### Trigger Phrases:

- "update instructions"
- "sync docs"
- "refresh context"
- "scan codebase"
- "update everything"

### What to Do:

1. **Scan the codebase:**

   - Read all files in `frontend/src/`
   - Read all files in `server/src/`
   - Read all files in `db/migrations/`
   - Note patterns, new files, changed structures

2. **Update instruction files:**

   - `.github/instructions/frontend.instructions.md`
     - Update workspace structure
     - Add new components/services/hooks
     - Update patterns and conventions
   - `.github/instructions/server.instructions.md`
     - Add new API endpoints
     - Update service patterns
     - Add new prompt templates
   - `.github/instructions/database.instructions.md`
     - Add new tables from migrations
     - Update schema relationships
     - Add new JSONB patterns

3. **Update documentation:**

   - `docs/ARCHITECTURE.md` - Update system flows if architecture changed
   - `docs/frontend/` - Update if major frontend changes
   - `docs/server/` - Update if new endpoints or services
   - `docs/database/` - Update schema if tables changed

4. **Provide summary:**
   ```
   Updated Instructions:
   ✓ Frontend: Added [new workspace/component/pattern]
   ✓ Server: Added [new endpoint/service]
   ✓ Database: Added [new tables/columns]
   ✓ Docs: Updated [which docs changed]
   ```

### Example Usage:

```
User: "update instructions"

You:
[Scan entire codebase]
[Update all instruction files]
[Update relevant docs]

Response:
✓ Scanned 247 files
✓ Updated frontend instructions (added interview_hub workspace patterns)
✓ Updated server instructions (added salary research endpoint)
✓ Updated database instructions (added ai_artifacts table)
✓ Updated ARCHITECTURE.md with new data flows
```

---

## General Coding Principles

### Write Code That:

1. **Is easy to read** - Another developer should understand it quickly
2. **Has clear names** - Functions and variables describe what they do
3. **Is well-commented** - Complex logic explained in plain language
4. **Follows patterns** - Match existing code style in the project
5. **Is simple** - Don't over-engineer, keep it straightforward

### When Writing Code:

- Add comments for business logic and complex operations
- Use simple, clear variable names
- Break complex functions into smaller, named functions
- Prefer readability over clever one-liners
- Explain WHY in comments, not WHAT (code shows what)

### When Making Changes:

- Update the actual code files
- Add inline comments if logic is complex
- Provide a brief summary when done
- Don't create separate markdown documentation files

---

## Quick Reference

**Before coding:** Read `.github/instructions/[workspace]/` for that workspace
**Need context:** Check `docs/ARCHITECTURE.md` and workspace-specific docs
**Making changes:** Add comments, keep it simple, no summary files
**After completing changes:** Update the relevant instruction files
**User says "update instructions":** Full scan + update instructions + update docs

---

## After Making Changes

**Always update the relevant instruction files** when you:

- Add new components, services, or hooks
- Change file structure or patterns
- Add new API endpoints
- Modify database schema
- Change how features work

This keeps documentation in sync with the codebase for future development.

---

Remember: Your job is to write clear, maintainable code that the team can easily understand and work with. When in doubt, choose simplicity and clarity over complexity.
