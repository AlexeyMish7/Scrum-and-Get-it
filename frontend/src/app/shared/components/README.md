# Shared Components

**Purpose**: Reusable UI components that operate across all workspaces (Profile, AI, Jobs).

**Import Pattern**: Use barrel exports by category for better organization:

```typescript
// ✅ Recommended - import by category
import {
  LoadingSpinner,
  EmptyState,
  ErrorSnackbar,
} from "@components/feedback";
import { ConfirmDialog, ConfirmDialogProvider } from "@components/dialogs";
import { Breadcrumbs } from "@components/navigation";

// ✅ Also acceptable - top-level barrel for common components
import { Icon, ProtectedRoute, ProfilePicture } from "@components/common";
```

---

## 📁 Component Organization

```
components/
├─ common/          Generic reusable UI primitives
├─ dialogs/         Confirmation and modal dialogs
├─ feedback/        Loading states, errors, empty states
├─ navigation/      Breadcrumbs and routing components
└─ sidebars/        Workspace navigation sidebars
```

---

## 🧩 Common Components (`common/`)

### **Icon.tsx**

Centralized icon wrapper for MUI icons.

**Purpose**: Consistent icon sizing, coloring, and easy library swapping

```typescript
import { Icon } from "@components/common";

<Icon name="Add" colorType="primary" />
<Icon name="Delete" colorType="error" sx={{ fontSize: 32 }} />
```

**Props**:

- `name` - MUI icon name (e.g., "Add", "Delete", "Settings")
- `colorType` - "primary" | "secondary" | "error" | "warning" | "success" | "info" | "text"
- `sx` - MUI sx prop for custom styling

---

### **ProtectedRoute.tsx**

Auth-guarded route wrapper.

**Purpose**: Redirect unauthenticated users to login

```typescript
import { ProtectedRoute } from "@components/common";

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>;
```

**Behavior**:

- Checks `useAuth()` for active session
- Redirects to `/login` if not authenticated
- Preserves intended destination in URL state

---

### **ProfilePicture.tsx**

User avatar display with fallback.

**Purpose**: Consistent avatar rendering across app

```typescript
import { ProfilePicture } from "@components/common";

<ProfilePicture userId={user.id} size="large" />;
```

**Props**:

- `userId` - User ID for avatar lookup
- `size` - "small" | "medium" | "large" (default: "medium")
- `fallbackText` - Text to show if no avatar (default: user initials)

**Features**:

- Loads avatar from Supabase Storage via `useAvatar` hook
- Shows fallback initials if no avatar
- Caches avatar URLs in localStorage

---

### **RightDrawer.tsx**

Side panel drawer component.

**Purpose**: Sliding panel for forms, details, filters

```typescript
import { RightDrawer } from "@components/common";

<RightDrawer
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Filter Jobs"
  width={400}
>
  <FilterForm />
</RightDrawer>;
```

**Props**:

- `open` - Boolean to control visibility
- `onClose` - Callback when drawer closes
- `title` - Drawer header title
- `width` - Drawer width in pixels (default: 400)
- `children` - Drawer content

---

### **QuickActionButton.tsx**

Floating action button (FAB).

**Purpose**: Primary action button for pages

```typescript
import { QuickActionButton } from "@components/common";

<QuickActionButton icon={<AddIcon />} label="Add Job" onClick={handleAdd} />;
```

**Props**:

- `icon` - React element for button icon
- `label` - Accessibility label
- `onClick` - Click handler
- `color` - MUI color (default: "primary")

---

### **ThemePresetSelector.tsx**

Theme preset picker UI.

**Purpose**: Allow users to select pre-configured themes

```typescript
import { ThemePresetSelector } from "@components/common";

<ThemePresetSelector />;
```

**Features**:

- Displays 8 theme presets with live previews
- Applies preset on selection
- Persists choice to localStorage
- Shows current active preset

---

### **RegionAnchor.tsx** (Dev Tool)

Page section markers for testing.

**Purpose**: Visual markers for debugging page sections

```typescript
import { RegionAnchor } from "@components/common";

<RegionAnchor id="UC-036" desc="Basic Job Entry Form" />;
```

**Props**:

- `id` - Section identifier
- `desc` - Optional description

**Usage**: Development/testing only (remove in production)

---

### **SprintTaskSnackbar.tsx** (Sprint 2 Specific)

⚠️ **Currently disabled** - Sprint task overlay

**Status**: Commented out in SystemLayer, may be removed in future

---

## 🗨️ Dialog Components (`dialogs/`)

### **ConfirmDialog.tsx**

Confirmation dialog with async/await pattern.

**Purpose**: Get user confirmation before destructive actions

**Must use with ConfirmDialogProvider**:

```typescript
// In main.tsx or app root
import { ConfirmDialogProvider } from "@components/dialogs";

<ConfirmDialogProvider>
  <App />
</ConfirmDialogProvider>;

// In any component
import { useConfirmDialog } from "@hooks";

const { confirm } = useConfirmDialog();

const handleDelete = async () => {
  const confirmed = await confirm({
    title: "Delete Job?",
    message: "This action cannot be undone.",
    confirmText: "Delete",
    confirmColor: "error",
  });

  if (confirmed) {
    await deleteJob();
  }
};
```

**Dialog Options**:

- `title` - Dialog title
- `message` - Confirmation message
- `confirmText` - Confirm button text (default: "Confirm")
- `cancelText` - Cancel button text (default: "Cancel")
- `confirmColor` - "error" | "primary" | "secondary" etc.

---

## 📢 Feedback Components (`feedback/`)

### **LoadingSpinner.tsx**

Centered loading indicator.

```typescript
import { LoadingSpinner } from "@components/feedback";

{
  isLoading && <LoadingSpinner />;
}
```

**Variants**:

- Default: Centered circular progress
- Inline: Small spinner for buttons

---

### **EmptyState.tsx**

Placeholder for empty data states.

```typescript
import { EmptyState } from "@components/feedback";

{
  jobs.length === 0 && (
    <EmptyState
      icon={<WorkIcon />}
      title="No Jobs Yet"
      message="Add your first job opportunity to get started."
      action={{
        label: "Add Job",
        onClick: handleAddJob,
      }}
    />
  );
}
```

**Props**:

- `icon` - React element for empty state icon
- `title` - Primary message
- `message` - Secondary message
- `action` - Optional action button { label, onClick }

---

### **ErrorSnackbar.tsx**

Toast notifications for errors and success messages.

**Must use with useErrorHandler**:

```typescript
import { useErrorHandler } from "@hooks";
import { ErrorSnackbar } from "@components/feedback";

const { notification, closeNotification, handleError, showSuccess } =
  useErrorHandler();

// Show error
try {
  await saveData();
  showSuccess("Saved successfully!");
} catch (error) {
  handleError(error);
}

// Render snackbar (usually in layout or SystemLayer)
<ErrorSnackbar notification={notification} onClose={closeNotification} />;
```

**Notification Types**:

- `error` - Red snackbar with error icon
- `success` - Green snackbar with check icon
- `warning` - Orange snackbar with warning icon
- `info` - Blue snackbar with info icon

---

### **ErrorBoundary.tsx**

React error boundary for crash recovery.

```typescript
import { ErrorBoundary } from "@components/feedback";

<ErrorBoundary>
  <App />
</ErrorBoundary>;
```

**Features**:

- Catches rendering errors in child tree
- Shows fallback UI with error message
- Logs error to console
- Provides reset button to retry

---

### **Skeletons.tsx**

Loading placeholders for various components.

```typescript
import {
  JobCardSkeleton,
  EmploymentCardSkeleton,
  TableRowSkeleton,
  ChartSkeleton,
} from "@components/feedback";

{
  isLoading ? <JobCardSkeleton /> : <JobCard job={job} />;
}
```

**Available Skeletons**:

- `JobCardSkeleton` - Job opportunity card placeholder
- `EmploymentCardSkeleton` - Work history card placeholder
- `ProjectCardSkeleton` - Portfolio project card placeholder
- `DocumentCardSkeleton` - Document/file card placeholder
- `TableRowSkeleton` - Table row placeholder
- `ChartSkeleton` - Analytics chart placeholder
- `PipelinePageSkeleton` - Jobs pipeline page placeholder
- `AnalyticsPageSkeleton` - Analytics dashboard placeholder
- `DetailViewSkeleton` - Detail page placeholder

---

## 🧭 Navigation Components (`navigation/`)

### **Breadcrumbs.tsx**

Page navigation trail.

```typescript
import { Breadcrumbs, type BreadcrumbItem } from "@components/navigation";

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Jobs", href: "/jobs" },
  { label: "Pipeline" }, // Current page (no href)
];

<Breadcrumbs items={breadcrumbs} />;
```

**BreadcrumbItem Type**:

- `label` - Text to display
- `href` - Optional link (omit for current page)

**Features**:

- Auto-navigates with React Router
- Highlights current page
- Responsive (collapses on mobile)

---

## 🗂️ Sidebar Components (`sidebars/`)

### **WorkspaceSidebar.tsx**

Base sidebar component with navigation items.

**Purpose**: Reusable sidebar template for workspaces

```typescript
import { WorkspaceSidebar, type NavItem } from "@components/sidebars";

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <DashboardIcon />,
  },
  {
    label: "Jobs",
    path: "/jobs",
    icon: <WorkIcon />,
  },
];

<WorkspaceSidebar title="Jobs Workspace" navItems={navItems} />;
```

**NavItem Type**:

- `label` - Display text
- `path` - Route path
- `icon` - React element for icon

---

### **AISidebar.tsx**, **JobsSidebar.tsx**, **ProfileSidebar.tsx**

Workspace-specific sidebars.

⚠️ **Note**: These should eventually move to their respective workspace folders:

- `workspaces/ai/components/AISidebar.tsx`
- `workspaces/jobs/components/JobsSidebar.tsx`
- `workspaces/profile/components/ProfileSidebar.tsx`

---

## 🎨 Component Design Principles

### **1. Single Responsibility**

Each component should do one thing well.

```typescript
// ✅ Good - focused responsibility
function LoadingSpinner() { ... }
function EmptyState() { ... }

// ❌ Avoid - too many responsibilities
function DataDisplay() {
  // handles loading, errors, empty state, AND data rendering
}
```

### **2. Composition Over Props**

Favor children/slots over excessive props.

```typescript
// ✅ Good - flexible composition
<RightDrawer open={open} onClose={onClose}>
  <FilterForm />
</RightDrawer>

// ❌ Avoid - too many conditional props
<RightDrawer
  open={open}
  showFilters={true}
  showSorting={false}
  filterType="jobs"
  sortOptions={...}
/>
```

### **3. Controlled Components**

Let parent manage state for reusability.

```typescript
// ✅ Good - controlled (parent manages state)
<RightDrawer
  open={isOpen}
  onClose={() => setIsOpen(false)}
>

// ❌ Avoid - uncontrolled (component manages own state)
<RightDrawer defaultOpen={true}>
```

### **4. Accessibility First**

Always include ARIA labels and keyboard support.

```typescript
// ✅ Good
<IconButton
  aria-label="Delete job"
  onClick={handleDelete}
>
  <DeleteIcon />
</IconButton>

// ❌ Avoid - no accessibility
<IconButton onClick={handleDelete}>
  <DeleteIcon />
</IconButton>
```

---

## 📝 Adding New Components

1. **Determine category**: common, dialogs, feedback, navigation, or sidebars?
2. **Create component file** with JSDoc header
3. **Add to category barrel** in `[category]/index.ts`
4. **Write tests** (if applicable)
5. **Document usage** in this README

**Template**:

````typescript
/**
 * COMPONENT_NAME
 *
 * Brief description of what this component does.
 *
 * Usage:
 * ```tsx
 * <ComponentName prop="value" />
 * ```
 */

import { ... } from "@mui/material";

interface ComponentNameProps {
  // Props definition
}

export function ComponentName({ }: ComponentNameProps) {
  // Implementation
}

export default ComponentName;
````

---

**Last Updated**: Sprint 2 Polish (November 2025)
