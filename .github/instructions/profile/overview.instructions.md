# Profile Workspace Overview

> User profile management workspace for FlowATS. Handles personal information, employment history, education, skills, projects, certifications, and authentication.

---

## Workspace Location

```
frontend/src/app/workspaces/profile/
```

---

## Structure

```
profile/
├── ProfileLayout.tsx          # Main layout with ProfileSidebar
├── cache/                     # React Query unified caching system
│   ├── cacheConfig.ts         # ENV-based cache timing settings
│   ├── index.ts               # Public exports
│   ├── ProfileQueryProvider.tsx  # Query client provider
│   ├── queryKeys.ts           # Cache key definitions
│   ├── useProfileQueries.ts   # Individual data hooks (by type)
│   ├── useUnifiedProfileCache.ts  # MAIN: Single query for all data
│   ├── useRealtimeSync.ts     # Supabase real-time subscriptions
│   └── (legacy files for migration)
├── components/
│   ├── dialogs/               # Add dialogs for each section
│   │   ├── AddEducationDialog.tsx
│   │   ├── AddEmploymentDialog.tsx
│   │   ├── AddProjectDialog.tsx
│   │   └── AddSkillDialog.tsx
│   ├── LinkedIn/              # LinkedIn integration
│   │   └── LinkedInButton.tsx
│   └── profile/               # Dashboard widgets
│       ├── CareerTimeline.tsx
│       ├── ExportProfileButton.tsx
│       ├── GenerateProfileTips.tsx
│       ├── ProfileCompletion.tsx
│       ├── ProfileStrengthTips.tsx
│       ├── SkillsDistributionChart.tsx
│       └── SummaryCards.tsx
├── hooks/
│   └── useDashboardData.ts    # Dashboard data hook (wraps unified cache)
├── pages/
│   ├── auth/                  # Authentication pages
│   ├── certifications/
│   ├── dashboard/
│   │   └── Dashboard.tsx      # Main profile dashboard
│   ├── education/
│   ├── employment/
│   ├── home/
│   ├── profile/
│   │   └── ProfileDetails.tsx # Uses useUnifiedProfile() with select
│   ├── projects/
│   └── skills/
├── services/
│   ├── certifications.ts
│   ├── education.ts
│   ├── employment.ts
│   ├── profileService.ts
│   ├── projects.ts
│   └── skills.ts
└── types/
```

---

## React Query Caching System

The profile workspace uses React Query with a **unified cache** architecture. One query fetches ALL profile data, and individual hooks extract what they need using selectors.

### Architecture: Unified Cache

```typescript
// ONE query fetches everything
useUnifiedProfile() → {
  profile: ProfileData,
  skills: SkillItem[],
  employment: EmploymentRow[],
  education: EducationEntry[],
  projects: Project[],
  certifications: Certification[]
}

// Individual hooks use "select" to extract data
useProfileData()  → select: (data) => data.profile
useSkills()       → select: (data) => data.skills
useEmployment()   → select: (data) => data.employment
// etc.
```

**Benefits:**

- One network request fetches all data
- Automatic cache sharing between dashboard and detail pages
- Simple invalidation: `invalidateAll()` refreshes everything
- Reduced Supabase calls (1 fetch vs 6+ individual fetches)

### Cache Configuration

Cache timing is controlled via environment variables in `.env`:

```bash
# How long data is "fresh" before background refetch (default: 5 min)
VITE_CACHE_STALE_TIME_MINUTES=5

# How long unused data stays in memory (default: 30 min)
VITE_CACHE_GC_TIME_MINUTES=30
```

### How Caching Works

```
Dashboard Load
      │
      ▼
┌─────────────────────────────────────────┐
│  useUnifiedProfile()                    │
│  Fetches: profile, skills, employment,  │
│  education, projects, certifications    │
│  Stored in ONE React Query cache entry  │
└─────────────────────────────────────────┘
      │
      │  Navigate to Education page
      ▼
┌─────────────────────────────────────────┐
│  useEducation() → select from cache     │
│  NO new network request!                │
└─────────────────────────────────────────┘
```

### Available Cache Hooks

```typescript
import {
  // Main unified query
  useUnifiedProfile, // Returns ALL data

  // Selector hooks (extract from unified cache)
  useProfileData, // Profile info only
  useSkills, // Skills array only
  useEmployment, // Employment array only
  useEducation, // Education array only
  useProjects, // Projects array only
  useCertifications, // Certifications array only

  // Dashboard helpers
  useDashboardQueries, // Parallel fetch helper (legacy)

  // Cache utilities
  useUnifiedCacheUtils, // Provides invalidateAll()
} from "@profile/cache";
```

### Cache Invalidation (Unified Cache)

After mutations (add/edit/delete), invalidate the unified cache to refetch all data:

```typescript
import { useUnifiedCacheUtils } from "@profile/cache";

const { invalidateAll } = useUnifiedCacheUtils();

// After saving changes
await saveEducation();
await invalidateAll(); // Refetches entire unified profile
```

**All mutation points call `invalidateAll()`:**

- `AddEducationDialog`, `AddEmploymentDialog`, `AddSkillDialog`, `AddProjectDialog`
- `Certifications.tsx`, `ProfileDetails.tsx`, `ProjectPortfolio.tsx`
- `SkillsOverview.tsx`, `EmploymentHistoryList.tsx`

### Components with Cache Invalidation

| Component                   | Operations                     | Cache Action      |
| --------------------------- | ------------------------------ | ----------------- |
| `AddEducationDialog.tsx`    | insert, update, delete         | `invalidateAll()` |
| `AddEmploymentDialog.tsx`   | insert, update, delete         | `invalidateAll()` |
| `AddSkillDialog.tsx`        | insert, update, delete         | `invalidateAll()` |
| `AddProjectDialog.tsx`      | insert, update, delete         | `invalidateAll()` |
| `Certifications.tsx`        | insert, update, delete, verify | `invalidateAll()` |
| `ProfileDetails.tsx`        | profile update                 | `invalidateAll()` |
| `ProjectPortfolio.tsx`      | delete                         | `invalidateAll()` |
| `AddProjectForm.tsx`        | insert, update                 | `invalidateAll()` |
| `SkillsOverview.tsx`        | batch reorder                  | `invalidateAll()` |
| `EmploymentHistoryList.tsx` | delete                         | `invalidateAll()` |

### When Does Data Refetch?

| Event                          | Refetches?                           |
| ------------------------------ | ------------------------------------ |
| Add/edit/delete data           | ✅ Yes (via cache invalidation)      |
| Navigate within staleTime      | ❌ No (uses cache)                   |
| Navigate after staleTime       | ✅ Yes (background refetch)          |
| Window refocus after staleTime | ✅ Yes (background refetch)          |
| Hard refresh (F5)              | ✅ Yes (~7 calls, one per data type) |

### Expected Supabase Calls

- **Hard refresh**: ~7 calls (profiles, education, employment, skills, projects, certifications, documents)
- **Navigation between pages**: 0 calls (uses cached data)
- **After data mutation**: Only invalidated cache refetches

---

## Key Features

### 1. Profile Dashboard

- **Summary Cards** - Employment, skills, education, projects counts
- **Profile Completion** - Progress indicator with tips
- **Career Timeline** - Visual employment history
- **Skills Distribution** - Chart of skills by category
- **Recent Activity** - Timeline of document and profile changes

### 2. Profile Sections

| Section        | Page                        | Description                                 |
| -------------- | --------------------------- | ------------------------------------------- |
| Basic Info     | `ProfileDetails.tsx`        | Name, email, phone, headline, bio, industry |
| Employment     | `EmploymentHistoryList.tsx` | Job history with CRUD                       |
| Education      | `EducationOverview.tsx`     | Degrees and certifications                  |
| Skills         | `SkillsOverview.tsx`        | Skills with drag-and-drop ordering          |
| Projects       | `ProjectPortfolio.tsx`      | Portfolio with media uploads                |
| Certifications | `Certifications.tsx`        | Professional certifications                 |

### 3. Authentication

- Login/Register with email
- Password reset flow
- Auth callback handling
- Account deletion

---

## Layout

Uses `ProfileLayout.tsx` which wraps content in:

```tsx
<AppShell sidebar={<ProfileSidebar />}>{children ?? <Outlet />}</AppShell>
```

The `ProfileSidebar` provides navigation between profile sections.

---

## Database Tables

| Table            | Purpose                             |
| ---------------- | ----------------------------------- |
| `profiles`       | Core user profile (id = auth.uid()) |
| `education`      | Education entries                   |
| `employment`     | Job history                         |
| `skills`         | User skills with proficiency        |
| `projects`       | Portfolio projects                  |
| `certifications` | Professional certifications         |

---

## Key Patterns

### Service Layer

Each section has a dedicated service file:

- Handles CRUD operations via `@shared/services/crud`
- Maps DB rows to UI-friendly types
- Ensures profile exists before FK operations

### Type Mapping

Two type shapes per section:

1. **DB Row** - Matches database columns (snake_case)
2. **UI Type** - Frontend-friendly (camelCase)

Example:

```typescript
// DB Row
type DbEducationRow = {
  institution_name: string;
  degree_type: string;
  // ...
};

// UI Type
type EducationEntry = {
  institution: string;
  degree: string;
  // ...
};
```

### Profile Auto-Creation

Services check if profile exists before inserting related data:

```typescript
// Ensure profile exists (table has FK to profiles)
const { data: profileData } = await supabase
  .from("profiles")
  .select("id")
  .eq("id", userId)
  .single();

if (!profileData) {
  // Create minimal profile from auth user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("profiles").insert({
    id: userId,
    first_name: user.user_metadata?.first_name || "User",
    last_name: user.user_metadata?.last_name || "",
    email: user.email || "",
  });
}
```

---

## Import Aliases

```typescript
// Types
import type { EducationEntry } from "@profile/types/education";

// Services
import educationService from "@profile/services/education";

// Shared utilities
import { useAuth } from "@shared/context/AuthContext";
import * as crud from "@shared/services/crud";
```
