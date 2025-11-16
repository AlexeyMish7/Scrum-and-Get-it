# Shared Module Organization

**Purpose**: The `shared/` folder contains reusable code that operates across all three workspaces (Profile, AI, Jobs). Code should only live here if it's truly workspace-agnostic.

**Rule of Thumb**: If a component/hook/utility is specific to one workspace, it belongs in that workspace's folder, not in `shared/`.

---

## 📁 Folder Structure

```
shared/
├─ assets/          Brand logos and images
├─ components/      Reusable UI components
├─ constants/       Centralized enums and display labels
├─ context/         React contexts (Auth, Theme)
├─ hooks/           Custom React hooks
├─ layouts/         App-wide layout components
├─ services/        API clients and data access
├─ theme/           MUI theme configuration
├─ types/           TypeScript type definitions
└─ utils/           Pure utility functions
```

---

## 🎯 Import Patterns

### **Preferred: Use Barrel Exports**

```typescript
// ✅ Good - uses centralized barrel exports
import { useAuth } from "@context";
import { useErrorHandler } from "@hooks";
import { LoadingSpinner } from "@components/feedback";
import { JOB_STATUSES } from "@shared/constants";
import { formatToSqlDate } from "@shared/utils";
import type { Job, JobFormData } from "@shared/types";
```

### **Avoid: Direct File Imports**

```typescript
// ❌ Avoid - bypasses barrel, couples to internal structure
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import LoadingSpinner from "@shared/components/feedback/LoadingSpinner";
```

**Why barrel exports?**

- Single entry point makes refactoring easier
- Better tree-shaking in production builds
- Clearer module boundaries
- Consistent import style across codebase

---

## 📂 Module Breakdown

### **assets/** - Brand Resources

Static assets used across the application.

```
assets/
└─ logos/
   ├─ logo-full.png    (Main app logo)
   └─ logo-icon.png    (Favicon/small icon)
```

**Usage**:

```typescript
import logoFull from "@shared/assets/logos/logo-full.png";
```

---

### **components/** - Reusable UI

**Organization by Purpose**:

```
components/
├─ common/          Generic UI primitives
├─ dialogs/         Confirmation dialogs
├─ feedback/        Loading states, errors, empty states
├─ navigation/      Breadcrumbs, routing
└─ sidebars/        Workspace navigation sidebars
```

**Import Pattern**:

```typescript
// By category (recommended)
import { LoadingSpinner, EmptyState } from "@components/feedback";
import { ConfirmDialog } from "@components/dialogs";
import { Breadcrumbs } from "@components/navigation";

// From top-level barrel
import { Icon, ProtectedRoute } from "@components/common";
```

**Key Components**:

- **common/Icon.tsx** - Centralized MUI icon wrapper with theming
- **common/ProtectedRoute.tsx** - Auth-guarded routes
- **common/ProfilePicture.tsx** - User avatar display
- **common/RightDrawer.tsx** - Side panel layout
- **dialogs/ConfirmDialog.tsx** - Async confirmation prompts
- **feedback/ErrorSnackbar.tsx** - Error notification display
- **feedback/LoadingSpinner.tsx** - Loading indicators
- **feedback/Skeletons.tsx** - Placeholder loaders
- **navigation/Breadcrumbs.tsx** - Page navigation trail

**⚠️ Note**: Workspace-specific sidebars (AISidebar, JobsSidebar, ProfileSidebar) should eventually move to their respective workspace folders.

---

### **constants/** - Centralized Enums

Domain constants prevent hardcoded strings scattered across components.

**Available Modules**:

- `skills.ts` - Skill proficiency levels & categories
- `domain.ts` - Job statuses, document types, education levels, etc.

**Usage Example**:

```typescript
import {
  JOB_STATUSES,
  JOB_STATUS_OPTIONS,
  DOCUMENT_TYPES,
  EDUCATION_LEVELS,
  formatJobStatus,
} from "@shared/constants/domain";

// Display label
const label = JOB_STATUSES["applied"]; // → "Applied"

// Dropdown options
<Select options={JOB_STATUS_OPTIONS} />;

// Format DB value for display
formatJobStatus("phone_screen"); // → "Phone Screen"
```

**Available Constants**:

- **Job Statuses**: Interested, Applied, Phone Screen, Interview, Offer, Rejected
- **Document Types**: Resume, Cover Letter, Portfolio, Other
- **AI Artifact Kinds**: Resume, Cover Letter, Skills Optimization, etc.
- **Education Levels**: High School, Associate, Bachelor's, Master's, Doctorate
- **Enrollment Statuses**: Not Enrolled, Currently Enrolled, Graduated, Withdrawn
- **Job Types**: Full-Time, Part-Time, Contract, Internship, etc.
- **Industries**: Technology, Finance, Healthcare, etc.
- **Experience Levels**: Entry, Mid, Senior, Lead, Principal, Executive
- **Skill Proficiencies**: Beginner, Intermediate, Advanced, Expert

---

### **context/** - Global State

React contexts for app-wide state management.

**Available Contexts**:

- `AuthContext` - User authentication (session, login, logout, signup)
- `ThemeContext` - Theme mode (light/dark) and preset selection

**Usage**:

```typescript
import { useAuth, useThemeContext } from "@context";

function MyComponent() {
  const { user, session, signOut } = useAuth();
  const { mode, toggleMode, applyPreset } = useThemeContext();

  // ...
}
```

**Authentication API**:

- `session` - Current Supabase session
- `user` - Active user or null
- `loading` - Initial load state
- `signIn(email, password)` - Email/password login
- `signUpNewUser({ email, password, firstName, lastName })` - Registration
- `signInWithOAuth(provider)` - OAuth login (Google, GitHub, etc.)
- `signOut()` - Logout

**Theme API**:

- `mode` - "light" | "dark"
- `setMode(mode)` - Set specific mode
- `toggleMode()` - Switch between light/dark
- `radiusMode` - "tiny" | "default"
- `toggleRadiusMode()` - Adjust border radius
- `currentPreset` - Active preset ID or null
- `applyPreset(id)` - Apply theme preset
- `clearPreset()` - Reset to default theme

---

### **hooks/** - Custom React Hooks

**Available Hooks**:

#### **useErrorHandler** (Most Important)

Centralized error handling and user notifications.

```typescript
import { useErrorHandler } from "@hooks";

const {
  notification, // Current error/success message
  closeNotification, // Dismiss notification
  handleError, // Process Error objects
  showSuccess, // Show success message
  showError, // Show error message
} = useErrorHandler();

// Handle async errors
try {
  await saveData();
  showSuccess("Saved successfully!");
} catch (error) {
  handleError(error);
}

// Render notification
<ErrorSnackbar notification={notification} onClose={closeNotification} />;
```

#### **useConfirmDialog**

Async confirmation dialogs.

```typescript
import { useConfirmDialog } from "@hooks";

const { confirm } = useConfirmDialog();

const handleDelete = async () => {
  const confirmed = await confirm({
    title: "Delete Item?",
    message: "This action cannot be undone.",
    confirmColor: "error",
    confirmText: "Delete",
  });

  if (confirmed) {
    // Proceed with deletion
  }
};
```

#### **useDebounce**

Delay value updates (search optimization).

```typescript
import { useDebounce, useDebouncedCallback } from "@hooks";

// Debounce value
const [searchTerm, setSearchTerm] = useState("");
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearch) {
    searchJobs(debouncedSearch);
  }
}, [debouncedSearch]);

// Debounce callback
const debouncedSave = useDebouncedCallback((data) => saveToServer(data), 500);
```

#### **useAvatar**

Load and cache user avatars.

```typescript
import { useAvatar } from "@hooks";

const avatarUrl = useAvatar(user?.id);

<Avatar src={avatarUrl ?? undefined}>
  {!avatarUrl && user?.email?.charAt(0)?.toUpperCase()}
</Avatar>;
```

#### **useUserJobs** (Consider Moving)

⚠️ **Jobs workspace-specific** - may move in future refactor.

```typescript
import { useUserJobs } from "@hooks";

const { jobs, loading, error, refresh } = useUserJobs(50);
```

#### **useSprintTasks** (Sprint 2 Specific)

⚠️ **Sprint-specific** - currently disabled, may be removed.

---

### **layouts/** - App Structure

Core layout components that define the app's visual structure.

**Components**:

- **AppShell.tsx** - Main app wrapper (topbar + sidebar slot + content area)
- **GlobalTopBar.tsx** - App header with navigation
- **SystemLayer.tsx** - Portal layer for global overlays (errors, dialogs)

**Usage** (workspace layouts):

```typescript
import AppShell from "@shared/layouts/AppShell";
import ProfileSidebar from "@shared/components/sidebars/ProfileSidebar";

export default function ProfileLayout() {
  return (
    <AppShell sidebar={<ProfileSidebar />}>
      <Outlet /> {/* Workspace pages render here */}
    </AppShell>
  );
}
```

**Architecture**:

```
┌─────────────────────────────────────┐
│     GlobalTopBar (navigation)       │
├──────────┬──────────────────────────┤
│          │                          │
│ Sidebar  │   Main Content Area      │
│ (slot)   │   (Container maxWidth)   │
│          │                          │
└──────────┴──────────────────────────┘
         SystemLayer (overlays)
```

---

### **services/** - Data Access

API clients, Supabase integration, and data transformation.

**Key Services**:

- **supabaseClient.ts** - Supabase singleton
- **crud.ts** - Generic database operations with RLS
- **cache.ts** - Request caching layer
- See `shared/services/README.md` for complete documentation

**Usage**:

```typescript
import { crud, withUser } from "@shared/services/crud";

const userCrud = withUser(user.id);
const { data, error } = await userCrud.listRows("jobs", "*");
```

---

### **theme/** - MUI Theming

Theme configuration, presets, and design tokens.

**Key Files**:

- `index.ts` - Theme exports (lightTheme, darkTheme, presets)
- `palettes/` - Color palettes with design tokens
- `presets/` - Pre-configured theme variations
- See `shared/theme/README.md` for complete documentation

**Usage**:

```typescript
import { applyPresetById } from "@shared/theme";

// Apply preset
applyPresetById("professional-light");
```

---

### **types/** - TypeScript Definitions

Three-layer type system: Database → Domain → API

**Organization**:

- `database.ts` - Raw DB row types (snake_case, matches Supabase)
- `domain.ts` - UI-friendly models (camelCase, Date objects, computed fields)
- `api.ts` - Request/response contracts
- See `shared/types/README.md` for complete documentation

**Usage**:

```typescript
// Domain types for UI
import type { Job, JobFormData } from "@shared/types";

// Database types for services
import type { JobRow } from "@shared/types";

// API types for requests
import type { GenerateResumeRequest, ApiResponse } from "@shared/types";
```

---

### **utils/** - Pure Functions

Utility functions with no side effects.

**Available Utilities**:

- **dateUtils.ts** - Date formatting & parsing (SQL + UI)
- **requestDeduplication.ts** - Prevent duplicate API calls
- **a11yAudit.ts** - Accessibility testing (dev only)
- **pageTaskMap.ts** - Sprint task mapping
- **taskOwners.ts** - UC ownership
- See `shared/utils/README.md` for complete documentation

**Usage**:

```typescript
import {
  formatToSqlDate,
  parseMonthToMs,
  deduplicateRequest,
} from "@shared/utils";

// SQL date formatting
const sqlDate = formatToSqlDate("2024-03"); // → '2024-03-01'

// Request deduplication
const data = await deduplicateRequest("jobs-list", () => fetchJobs());
```

---

## 🚧 Known Issues & Future Improvements

### **Issue 1: Barrel Export Bypassing**

**Problem**: Most files import directly instead of using barrels

```typescript
// Current (inconsistent)
import { useAuth } from "@shared/context/AuthContext";
import { useAuth } from "@context"; // Some files use this
```

**Solution**: Update imports to consistently use barrels (low priority - no functional impact)

---

### **Issue 2: Workspace-Specific Code in Shared**

**Problem**: Some components/hooks are workspace-specific but in `shared/`

**Items to Move**:

- `hooks/useUserJobs.ts` → `workspaces/jobs/hooks/`
- `hooks/useSprintTasks.ts` → Delete (disabled, Sprint 2 specific)
- `components/sidebars/AISidebar.tsx` → `workspaces/ai/components/`
- `components/sidebars/JobsSidebar.tsx` → `workspaces/jobs/components/`
- `components/sidebars/ProfileSidebar.tsx` → `workspaces/profile/components/`
- `components/common/SprintTaskSnackbar.tsx` → Delete (disabled)
- `components/common/RegionAnchor.tsx` → Verify usage, delete if unused

---

### **Issue 3: Incomplete Constant Centralization**

**Problem**: Some hardcoded strings still scattered in codebase

**Solution**: Created `constants/domain.ts` with centralized enums. Gradually migrate hardcoded strings to use these constants.

---

## ✅ Best Practices

### **1. Use Barrel Exports**

```typescript
// ✅ Good
import { useAuth } from "@context";
import { LoadingSpinner } from "@components/feedback";

// ❌ Avoid
import { useAuth } from "@shared/context/AuthContext";
```

### **2. Keep Shared Code Workspace-Agnostic**

```typescript
// ✅ Good - truly reusable
function useDebounce<T>(value: T, delay: number): T { ... }

// ❌ Bad - Jobs workspace specific, belongs in workspaces/jobs/
function useUserJobs() { ... }
```

### **3. Use Centralized Constants**

```typescript
// ✅ Good
import { JOB_STATUSES } from "@shared/constants";
const status = JOB_STATUSES["applied"];

// ❌ Avoid
const status = "Applied"; // Hardcoded string
```

### **4. Type Safety at Boundaries**

```typescript
// ✅ Good - domain types in UI
function JobCard({ job }: { job: Job }) { ... }

// ✅ Good - DB types in services
async function getJobRow(id: number): Promise<JobRow> { ... }
```

### **5. Document Complex Logic**

```typescript
/**
 * Calculate days until application deadline.
 *
 * @param deadline - Application deadline date
 * @returns Days remaining (positive) or days overdue (negative)
 */
function getDaysUntilDeadline(deadline: Date): number {
  // Implementation
}
```

---

## 📚 Additional Documentation

- **Services**: `shared/services/README.md`
- **Theme System**: `shared/theme/README.md`
- **Type System**: `shared/types/README.md`
- **Utilities**: `shared/utils/README.md`
- **Layouts**: `docs/frontend/shared/layouts/README.md`

---

**Last Updated**: Sprint 2 Polish (November 2025)
