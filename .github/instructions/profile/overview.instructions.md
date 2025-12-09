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
├── cache/                     # React Query caching system
│   ├── cacheConfig.ts         # ENV-based cache timing settings
│   ├── index.ts               # Public exports
│   ├── ProfileQueryProvider.tsx
│   ├── queryKeys.ts           # Cache key definitions
│   ├── useProfileQueries.ts   # Cached data hooks
│   └── useRealtimeSync.ts     # Cache invalidation utilities
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
│   └── useDashboardData.ts    # Dashboard data hook (wraps React Query)
├── pages/
│   ├── auth/                  # Authentication pages
│   ├── certifications/
│   ├── dashboard/
│   │   └── Dashboard.tsx      # Main profile dashboard
│   ├── education/
│   ├── employment/
│   ├── home/
│   ├── profile/
│   │   └── ProfileDetails.tsx # Uses useFullProfile() cache
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

The profile workspace uses React Query for efficient data caching. This eliminates duplicate API calls when navigating between pages.

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
│  useDashboardQueries()                  │
│  Fetches: header, employment, skills,   │
│  education, projects, certifications    │
│  All stored in React Query cache        │
└─────────────────────────────────────────┘
      │
      │  Navigate to Education page
      ▼
┌─────────────────────────────────────────┐
│  useEducation() → Returns cached data   │
│  NO new network request!                │
└─────────────────────────────────────────┘
```

### Available Cache Hooks

```typescript
import {
  useProfileHeader, // Name, email
  useFullProfile, // All profile fields (for ProfileDetails)
  useEmployment, // Employment list
  useEducation, // Education list
  useSkills, // Skills list
  useProjects, // Projects list
  useCertifications, // Certifications list
  useDashboardQueries, // All data in parallel
  useProfileCacheUtils, // Invalidation helpers
} from "@profile/cache";
```

### Cache Invalidation (Unified Cache)

After mutations (add/edit/delete), invalidate the unified cache so all profile slices refetch together:

```typescript
import { useUnifiedCacheUtils } from "@profile/cache";

const { invalidateAll } = useUnifiedCacheUtils();

// After saving changes
await saveEducation();
await invalidateAll();
```

Legacy window events (`education:changed`, `skills:changed`, etc.) remain for non-React Query listeners, but `invalidateAll()` is the source of truth for refreshing data.

### Components with Cache Invalidation

All dialogs and pages that modify profile data now call `invalidateAll()` after successful mutations:

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
