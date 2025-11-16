# Feedback Components

Loading states, error handling, empty states, and skeleton loaders for consistent user feedback throughout the application.

## Overview

Feedback components provide visual feedback to users during various application states: loading, errors, empty data, and component errors. All components are theme-aware and accessible.

## Components

### LoadingSpinner.tsx

**Purpose**: Standardized loading indicator with size variants and optional message.

**Features**:

- Three size variants: `small` (24px), `medium` (40px), `large` (60px)
- Optional loading message below spinner
- Full-height centering option
- Accessible with ARIA attributes (`role="status"`, `aria-live="polite"`)
- Theme-aware colors

**Usage**:

```tsx
import { LoadingSpinner } from '@shared/components/feedback';

// Default (medium size)
<LoadingSpinner />

// Large with message and full viewport height
<LoadingSpinner
  size="large"
  message="Loading your data..."
  fullHeight
/>

// Small inline spinner
<LoadingSpinner size="small" />

// Custom styling
<LoadingSpinner sx={{ my: 4 }} />
```

**Props**:

```tsx
{
  size?: 'small' | 'medium' | 'large';  // Default: 'medium'
  message?: string;                      // Optional text below spinner
  fullHeight?: boolean;                  // If true, centers in 100vh
  sx?: SxProps;                          // MUI sx prop for custom styles
}
```

**When to Use**:

- ✅ Page is loading data from API
- ✅ Component is waiting for async operation
- ✅ Protected route is checking auth state
- ❌ Button is submitting (use button's loading state instead)
- ❌ Small inline actions (use linear progress or button spinner)

---

### ErrorSnackbar.tsx

**Purpose**: Centralized notification system for success/error/warning/info messages.

**Features**:

- Auto-hide after 6 seconds (customizable)
- Four severity variants: `success`, `error`, `warning`, `info`
- Manual close button
- Accessible with ARIA live region
- Theme-aware colors
- Stacks multiple notifications

**Usage**:

```tsx
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "@shared/components/feedback";

function MyComponent() {
  const { notification, closeNotification, handleError, showSuccess } =
    useErrorHandler();

  const handleSave = async () => {
    try {
      await saveData();
      showSuccess("Changes saved successfully!");
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <>
      {/* Component UI */}
      <ErrorSnackbar notification={notification} onClose={closeNotification} />
    </>
  );
}
```

**useErrorHandler Hook API**:

```tsx
{
  notification: {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  } | null;

  handleError: (error: unknown) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  closeNotification: () => void;
}
```

**Global vs Local Snackbars**:

- **Global**: `SystemLayer.tsx` renders a global `ErrorSnackbar` for app-wide errors
- **Local**: Pages can render their own `ErrorSnackbar` for page-specific feedback
- **Best Practice**: Use global for most cases; use local only if you need isolated error state

---

### EmptyState.tsx

**Purpose**: Friendly empty state component with icon, message, and optional action.

**Features**:

- Customizable icon (any React element)
- Title and message text
- Optional action button/element
- Centered layout
- Theme-aware styling

**Usage**:

```tsx
import { EmptyState } from '@shared/components/feedback';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { Button } from '@mui/material';

// Basic empty state
<EmptyState
  icon={<FolderOpenIcon sx={{ fontSize: 64 }} />}
  title="No jobs found"
  message="Start by adding your first job opportunity."
/>

// With action button
<EmptyState
  icon={<SearchIcon sx={{ fontSize: 64, color: 'text.secondary' }} />}
  title="No search results"
  message="Try adjusting your filters or search terms."
  action={
    <Button variant="contained" onClick={clearFilters}>
      Clear Filters
    </Button>
  }
/>
```

**Props**:

```tsx
{
  icon?: React.ReactNode;      // Icon element (usually MUI icon)
  title: string;               // Main heading
  message?: string;            // Descriptive text
  action?: React.ReactNode;    // Action button or element
}
```

**When to Use**:

- ✅ No data exists yet (first-time users)
- ✅ Search/filter returns no results
- ✅ User cleared all items from a list
- ❌ Data is loading (use LoadingSpinner instead)
- ❌ Error occurred (use error state UI instead)

---

### ErrorBoundary.tsx

**Purpose**: React Error Boundary to catch JavaScript errors in component tree.

**Features**:

- Catches unhandled component errors
- Prevents entire app crash
- Displays friendly error UI
- Shows error details in development mode
- Can reset error state and retry

**Usage**:

```tsx
import { ErrorBoundary } from '@shared/components/feedback';

// Wrap components that might throw
<ErrorBoundary>
  <SomeComponentThatMightError />
</ErrorBoundary>

// Wrap entire route
<ErrorBoundary>
  <Route path="/profile" element={<ProfilePage />} />
</ErrorBoundary>
```

**What It Catches**:

- ✅ Runtime errors in component render
- ✅ Errors in lifecycle methods
- ✅ Errors in child component tree
- ❌ Event handler errors (use try/catch)
- ❌ Async errors (use try/catch)
- ❌ Server-side rendering errors

**Error UI**:

- Production: Simple "Something went wrong" message with reload button
- Development: Full error stack trace and component tree

**Best Practices**:

- Place at route level for per-page error isolation
- Don't wrap the entire app (prevents any UI from showing)
- Log errors to monitoring service (Sentry, LogRocket, etc.)

---

### Skeletons.tsx

**Purpose**: Loading skeleton components for various content types during data fetching.

**Available Skeletons**:

#### CardSkeleton

```tsx
import { CardSkeleton } from "@shared/components/feedback";

<CardSkeleton count={3} />;
```

Use for: Job cards, project cards, news cards

#### TableSkeleton

```tsx
import { TableSkeleton } from "@shared/components/feedback";

<TableSkeleton rows={5} columns={4} />;
```

Use for: Data tables, lists with multiple columns

#### FormSkeleton

```tsx
import { FormSkeleton } from "@shared/components/feedback";

<FormSkeleton fields={6} />;
```

Use for: Forms while loading initial data

#### ListSkeleton

```tsx
import { ListSkeleton } from "@shared/components/feedback";

<ListSkeleton items={8} />;
```

Use for: Simple lists, navigation items

**Pattern: Conditional Rendering**

```tsx
function MyComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CardSkeleton count={3} />;
  if (!data) return <EmptyState title="No data" />;

  return <DataDisplay data={data} />;
}
```

**When to Use Skeletons vs Spinner**:

- **Skeletons**: When you know the layout/structure of incoming data
- **Spinner**: When layout is unknown or simple loading state
- **Skeletons**: Better perceived performance (shows structure immediately)
- **Spinner**: Simpler to implement

---

## Architecture

### Centralized Error Handling Flow

```
Component throws error
    ↓
try/catch OR ErrorBoundary
    ↓
useErrorHandler.handleError()
    ↓
ErrorSnackbar displays message
    ↓
Auto-hide after 6 seconds
```

### Global vs Local State

**Global** (`SystemLayer.tsx`):

- Single ErrorSnackbar instance
- Handles app-wide notifications
- Shared error state

**Local** (per-page):

- Isolated error state
- Page-specific feedback
- Use when errors shouldn't affect other pages

---

## Testing

### LoadingSpinner Tests

```tsx
test("renders spinner with message", () => {
  render(<LoadingSpinner message="Loading..." />);
  expect(screen.getByText("Loading...")).toBeInTheDocument();
  expect(screen.getByRole("status")).toBeInTheDocument();
});
```

### ErrorSnackbar Tests

```tsx
test("shows and hides notification", async () => {
  const { rerender } = render(
    <ErrorSnackbar
      notification={{ open: true, message: "Error!", severity: "error" }}
      onClose={vi.fn()}
    />
  );

  expect(screen.getByText("Error!")).toBeInTheDocument();

  rerender(
    <ErrorSnackbar
      notification={{ open: false, message: "", severity: "info" }}
      onClose={vi.fn()}
    />
  );

  await waitFor(() => {
    expect(screen.queryByText("Error!")).not.toBeInTheDocument();
  });
});
```

### ErrorBoundary Tests

```tsx
function ThrowError() {
  throw new Error("Test error");
}

test("catches errors and shows fallback", () => {
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```

---

## Common Patterns

### Page Loading with Skeleton

```tsx
function JobPipeline() {
  const { data: jobs, loading } = useJobs();

  if (loading) {
    return <CardSkeleton count={6} />;
  }

  if (!jobs || jobs.length === 0) {
    return (
      <EmptyState
        title="No jobs yet"
        message="Add your first job to get started"
        action={<Button onClick={addJob}>Add Job</Button>}
      />
    );
  }

  return <JobCards jobs={jobs} />;
}
```

### Error Handling with Retry

```tsx
function DataComponent() {
  const [error, setError] = useState(null);
  const { handleError, showSuccess } = useErrorHandler();

  const loadData = async () => {
    setError(null);
    try {
      const data = await fetchData();
      setData(data);
      showSuccess("Data loaded");
    } catch (err) {
      setError(err);
      handleError(err);
    }
  };

  if (error) {
    return (
      <EmptyState
        title="Failed to load data"
        message={error.message}
        action={<Button onClick={loadData}>Retry</Button>}
      />
    );
  }

  // ... rest of component
}
```

---

## Related Documentation

- [Error Handling Hook](../../hooks/useErrorHandler.md)
- [Complete Component Catalog](../../../../shared-components.md)
- [Common Components](../common/README.md)
