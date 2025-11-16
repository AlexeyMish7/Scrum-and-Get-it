# Shared Hooks

Reusable React hooks for common patterns across the application.

## Structure

```
hooks/
├── index.ts                 # Barrel export
├── useAvatar.ts            # Avatar loading with caching
├── useConfirmDialog.ts     # Confirmation dialog integration
├── useDebounce.ts          # Debounce values and callbacks
├── useErrorHandler.ts      # Error notifications and handling
├── useSprintTasks.ts       # Sprint task tracking (demo disabled)
└── useUserJobs.ts          # Centralized user jobs loader
```

## Files

### `useErrorHandler.ts`

**Purpose**: Centralized error handling with user-friendly notifications.

**Exports**:

- `useErrorHandler()` — Hook for managing error/success notifications
- `getErrorMessage(error)` — Convert errors to user-friendly messages
- `validateRequired(fields)` — Validate required form fields
- `withErrorHandling(operation)` — Async wrapper with error handling

**Hook Interface**:

```ts
{
  notification: ErrorNotification;
  closeNotification: () => void;
  showNotification: (msg, severity?, duration?) => void;
  handleError: (error, customMsg?, severity?) => void;
  showSuccess: (msg, duration?) => void;
  showWarning: (msg, duration?) => void;
  showInfo: (msg, duration?) => void;
}
```

**Error Message Handling**:

- ✅ PostgreSQL error codes (23505, 23514, 23503, 42501)
- ✅ HTTP status codes (400, 401, 403, 404, 409, 422, 5xx)
- ✅ Supabase-specific errors (RLS, JWT expired/malformed)
- ✅ Network errors (fetch, timeout, CORS)
- ✅ Frontend errors (TypeError, ReferenceError)

**Usage Locations**: 50+ files across all workspaces

**Import Pattern**:

```ts
import { useErrorHandler } from "@hooks";

const { notification, closeNotification, handleError, showSuccess } =
  useErrorHandler();

try {
  await deleteItem(id);
  showSuccess("Item deleted successfully");
} catch (error) {
  handleError(error);
}

return (
  <ErrorSnackbar notification={notification} onClose={closeNotification} />
);
```

---

### `useConfirmDialog.ts`

**Purpose**: Access confirmation dialog from `ConfirmDialogProvider`.

**Hook Interface**:

```ts
{
  confirm: (options: {
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmColor?: "error" | "primary" | "warning";
  }) => Promise<boolean>;
}
```

**Usage Locations**: 13 files (delete operations, destructive actions)

**Import Pattern**:

```ts
import { useConfirmDialog } from "@hooks";

const { confirm } = useConfirmDialog();

const handleDelete = async () => {
  const confirmed = await confirm({
    title: "Delete Item?",
    message: "This action cannot be undone.",
    confirmColor: "error",
  });

  if (confirmed) {
    // Proceed with deletion
  }
};
```

---

### `useDebounce.ts`

**Purpose**: Debounce values and function calls to reduce expensive operations.

**Exports**:

- `useDebounce(value, delay)` — Debounce value changes
- `useDebouncedCallback(callback, delay)` — Debounce function calls

**Usage Locations**:

- `useDebounce`: 1 file (`JobSearchFilters.tsx`)
- `useDebouncedCallback`: Not used (app uses `use-debounce` library)

**Import Pattern**:

```ts
import { useDebounce } from "@hooks";

const [searchTerm, setSearchTerm] = useState("");
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearch) {
    searchJobs(debouncedSearch); // Only called after 300ms of no typing
  }
}, [debouncedSearch]);
```

**Note**: The `useDebouncedCallback` is available but most code uses the `use-debounce` library instead. Consider standardizing on one approach.

---

### `useAvatar.ts`

**Purpose**: Load and cache user avatars from Supabase Storage.

**Features**:

- ✅ Loads avatar from user profile metadata
- ✅ Creates signed URLs with 1-hour expiration
- ✅ Caches signed URLs in localStorage (reduces API calls)
- ✅ Real-time updates via Supabase subscriptions
- ✅ Auto-refreshes 10 seconds before expiry

**Usage Locations**: 1 file (`GlobalTopBar.tsx`)

**Import Pattern**:

```ts
import { useAvatar } from "@hooks";

const avatarUrl = useAvatar(user?.id);

<Avatar src={avatarUrl ?? undefined}>
  {!avatarUrl && user?.email?.charAt(0)?.toUpperCase()}
</Avatar>;
```

**Caching Strategy**:

- Cache key: `avatar:{bucket}:{path}`
- TTL: 1 hour
- Refresh: 10 seconds before expiry
- Storage: localStorage

---

### `useUserJobs.ts`

**Purpose**: Centralized jobs loader for AI and Jobs workspace components.

**Hook Interface**:

```ts
{
  jobs: SimpleJob[];        // Array of { id, title, company }
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
```

**Usage Locations**: 7 files (ResumeEditor, JobMatch, CompanyResearch, CoverLetterStarter, etc.)

**Import Pattern**:

```ts
import { useUserJobs } from "@hooks";

const { jobs, loading, error, refresh } = useUserJobs(50); // Limit 50

if (loading) return <LoadingSpinner />;
if (error) return <ErrorDisplay error={error} />;

return (
  <Select>
    {jobs.map((job) => (
      <MenuItem key={job.id} value={job.id}>
        {job.title} at {job.company}
      </MenuItem>
    ))}
  </Select>
);
```

**Why this exists**: AI components need a consistent way to load jobs for selection (generate resume for job X, research company for job Y, etc.).

---

### `useSprintTasks.ts`

**Purpose**: Track Sprint 2 PRD tasks for current route.

**Hook Interface**:

```ts
{
  key?: PageTaskKey;
  tasks: SprintTaskItem[];
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
}
```

**Usage Locations**: Commented out in `SystemLayer.tsx` (disabled for demo)

**Import Pattern**:

```ts
import { useSprintTasks } from "@hooks";

const { tasks, open, setOpen } = useSprintTasks();

return (
  <SprintTaskSnackbar
    items={tasks}
    open={open}
    onClose={() => setOpen(false)}
  />
);
```

**Status**: Intentionally disabled for demo presentations. Re-enable by uncommenting in `SystemLayer.tsx`.

---

## Removed Hooks (Unused)

The following hooks were removed during cleanup:

### ❌ `useCache.ts` (REMOVED)

- Never used in the codebase
- Duplicated functionality (use `react-query` or similar if needed)

### ❌ `useOnboarding.ts` (REMOVED)

- Never used in the codebase
- Onboarding feature not implemented

### ❌ `usePrefetch.ts` (REMOVED)

- Never used in the codebase
- Performance optimization not needed yet
- Can be re-implemented when needed

---

## Design Decisions

### Why centralize error handling?

**Before**: Every component handled errors differently (console.log, alert, custom toast, silent fail).

**After**: `useErrorHandler` provides:

- Consistent error messages across the app
- User-friendly error translation
- Centralized error-to-message mapping
- Single `ErrorSnackbar` component in `SystemLayer`

### Why extract useAvatar?

**Before**: 100+ lines of avatar logic inline in `GlobalTopBar.tsx` (hard to read, not reusable).

**After**:

- Extracted to `useAvatar.ts` (reusable)
- Cleaner `GlobalTopBar` code (-100 lines)
- Can be used in other components (profile page, comment avatars, etc.)

### Why remove unused hooks?

**Maintenance burden**: Each hook requires:

- Understanding what it does
- Keeping dependencies updated
- Testing when making changes
- Documentation

**Decision**: Remove unused code until actually needed. Easy to restore from git history if needed later.

### Why keep useSprintTasks?

**Intentionally disabled**: Sprint task overlay is disabled for demos but will be re-enabled for development sprints. Keeping the code makes it easy to toggle.

---

## Common Patterns

### Error handling in CRUD operations

```ts
import { useErrorHandler } from "@hooks";

const { handleError, showSuccess } = useErrorHandler();

const handleDelete = async (id: string) => {
  try {
    const res = await deleteRow("jobs", id);
    if (res.error) throw new Error(res.error.message);
    showSuccess("Job deleted successfully");
  } catch (error) {
    handleError(error); // Converts to user-friendly message
  }
};
```

### Confirmation before destructive action

```ts
import { useConfirmDialog, useErrorHandler } from "@hooks";

const { confirm } = useConfirmDialog();
const { handleError, showSuccess } = useErrorHandler();

const handleDelete = async (id: string) => {
  const confirmed = await confirm({
    title: "Delete Job?",
    message: "This cannot be undone.",
    confirmColor: "error",
  });

  if (!confirmed) return;

  try {
    await deleteJob(id);
    showSuccess("Job deleted");
  } catch (error) {
    handleError(error);
  }
};
```

### Debounced search

```ts
import { useDebounce } from "@hooks";

const [search, setSearch] = useState("");
const debouncedSearch = useDebounce(search, 300);

useEffect(() => {
  if (debouncedSearch) {
    searchJobs(debouncedSearch);
  }
}, [debouncedSearch]);

<TextField
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder="Search jobs..."
/>;
```

---

## Barrel Export Pattern

All hooks can be imported from `@hooks`:

```ts
import {
  useErrorHandler,
  useConfirmDialog,
  useDebounce,
  useAvatar,
  useUserJobs,
} from "@hooks";
```

**Why?** Cleaner imports, single source of truth, easy refactoring.

---

## Extension Guidelines

### Adding a new hook

1. Create `useMyHook.ts` in this folder
2. Follow naming convention: `use` + PascalCase
3. Add JSDoc comments explaining:
   - Purpose
   - Inputs (parameters, types)
   - Outputs (return type, shape)
   - Error modes (what can go wrong)
   - Usage example
4. Add to `index.ts` barrel export:
   ```ts
   export { default as useMyHook } from "./useMyHook";
   ```
5. Update this README with:
   - What it does
   - Why it exists
   - Where it's used
   - Example usage
6. Run `npm run typecheck` to verify

### Hook design best practices

**DO**:

- ✅ Use descriptive names (`useErrorHandler` not `useEH`)
- ✅ Return objects for multiple values (`{ data, loading, error }`)
- ✅ Use `useCallback` for stable function references
- ✅ Use `useMemo` for expensive computations
- ✅ Clean up effects (return cleanup function)
- ✅ Document inputs/outputs with JSDoc
- ✅ Provide usage examples

**DON'T**:

- ❌ Create hooks that are only used once (inline instead)
- ❌ Create hooks that wrap a single line (not worth it)
- ❌ Duplicate external library functionality
- ❌ Skip cleanup in useEffect
- ❌ Forget dependency arrays

---

## Verification

**Type check**:

```powershell
npm run typecheck
```

**Find all hook usage**:

```powershell
# Error handler usage
grep -r "useErrorHandler" frontend/src

# Confirm dialog usage
grep -r "useConfirmDialog" frontend/src

# Check barrel export
grep -r "from.*@hooks" frontend/src
```

**Check for unused hooks**:

```powershell
# Search for hook name in codebase
grep -r "useMyHook" frontend/src

# If only found in the hook file itself → unused
```

---

## Migration Notes

### From inline error handling → useErrorHandler

**Before**:

```ts
try {
  await deleteItem(id);
  alert("Deleted!");
} catch (error) {
  console.error(error);
  alert("Error: " + error.message);
}
```

**After**:

```ts
const { handleError, showSuccess } = useErrorHandler();

try {
  await deleteItem(id);
  showSuccess("Item deleted successfully");
} catch (error) {
  handleError(error); // User-friendly message
}
```

### From window.confirm → useConfirmDialog

**Before**:

```ts
const handleDelete = async () => {
  if (!window.confirm("Delete this item?")) return;
  await deleteItem(id);
};
```

**After**:

```ts
const { confirm } = useConfirmDialog();

const handleDelete = async () => {
  const confirmed = await confirm({
    title: "Delete Item?",
    message: "This cannot be undone.",
  });
  if (!confirmed) return;
  await deleteItem(id);
};
```

---

## Future Enhancements

Potential hooks to add when needed:

1. **`useLocalStorage(key, initialValue)`** — Sync state with localStorage
2. **`useMediaQuery(query)`** — Responsive breakpoint detection (already in MUI)
3. **`useIntersectionObserver(ref, options)`** — Lazy loading, infinite scroll
4. **`useWebSocket(url)`** — Real-time data subscriptions
5. **`useForm(initialValues, validation)`** — Form state management (consider `react-hook-form`)

**Principle**: Don't add until actually needed. Keep it simple.
