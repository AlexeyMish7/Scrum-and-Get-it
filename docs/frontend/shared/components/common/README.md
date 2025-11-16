# Common Components

General-purpose UI primitives and utilities used throughout the application.

## Components

### Icon.tsx

**Purpose**: Centralized icon system using Material-UI icons with type safety.

**Key Features**:

- Type-safe icon names (autocomplete in IDE)
- Consistent sizing and color management
- Theme-aware color mapping
- Easy to swap icon library in the future

**Usage**:

```tsx
import { Icon } from '@shared/components/common';

<Icon name="Add" colorType="primary" />
<Icon name="Delete" colorType="error" sx={{ fontSize: 32 }} />
```

**Props**:

- `name`: Icon name from `@mui/icons-material` (required, type-safe)
- `colorType`: `primary`, `secondary`, `error`, `warning`, `success`, `info`, `text`
- `sx`: MUI sx prop for custom styling
- Inherits all `SvgIconProps` from Material-UI

**Implementation Notes**:

- Uses dynamic import from `@mui/icons-material`
- Warns in console if icon name doesn't exist
- Returns null for invalid icons (graceful degradation)

---

### ProfilePicture.tsx

**Purpose**: Complete avatar upload, crop, preview, and management system.

**Key Features**:

- Interactive image cropping with ReactCrop
- Upload to Supabase Storage (`avatars` bucket)
- Signed URL caching in localStorage
- Documents table integration for cleanup
- Error handling via `useErrorHandler`
- Confirmation dialog integration for deletion

**Implementation Details**:

- Max file size: 5MB
- Allowed types: JPG, PNG, GIF
- Output format: 512×512 PNG
- Storage path: `{user_id}/avatar.png`
- Metadata stored in `profiles.meta`

**Data Flow**:

1. User selects image → crop dialog opens
2. User crops → preview shows
3. User confirms → image resized to 512×512
4. Upload to Supabase Storage
5. Create signed URL for display
6. Create `documents` row for tracking
7. Update `profiles.meta` with path

**Error Handling**:

- Uses centralized `useErrorHandler` hook
- Shows friendly messages via `ErrorSnackbar`
- Validates file type and size before upload
- Handles upload failures gracefully

---

### ProtectedRoute.tsx

**Purpose**: Route wrapper that enforces authentication.

**Behavior**:

1. Shows `LoadingSpinner` while auth state loads
2. Redirects to `/login` if no user is authenticated
3. Renders children if user is present

**Usage**:

```tsx
import { ProtectedRoute } from "@shared/components/common";

<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <ProfileLayout />
    </ProtectedRoute>
  }
/>;
```

**Implementation Notes**:

- Uses `useAuth()` hook for auth state
- Prevents flash of protected content
- Replace navigation (no back button to protected page when logged out)

---

### QuickActionButton.tsx

**Purpose**: Styled button component for quick actions in navigation or toolbars.

**Key Features**:

- Supports routing (React Router) or onClick callbacks
- Consistent styling (`textTransform: "none"`)
- Configurable colors and sizes
- Optional start icons

**Usage**:

```tsx
import { QuickActionButton } from '@shared/components/common';

// With routing
<QuickActionButton label="Resume" to="/ai/resume" size="small" />

// With callback
<QuickActionButton
  label="Save"
  onClick={handleSave}
  color="primary"
  startIcon={<SaveIcon />}
/>
```

**Props**:

- `label`: Button text (required)
- `to?`: React Router path (for navigation)
- `onClick?`: Click handler (if no `to` prop)
- `startIcon?`: Icon to show before label
- `color?`: `primary`, `secondary`, `inherit`, `success`, `error`
- `size?`: `small`, `medium`

---

### RegionAnchor.tsx

**Purpose**: Development utility for marking page regions during testing/debugging.

**Usage**:

```tsx
import { RegionAnchor } from "@shared/components/common";

<RegionAnchor id="UC-037" desc="Job Status Pipeline Management" />;
```

**Output**:

- Visual chip with ID
- Optional description text
- Helps identify sections during demos/testing

**Notes**:

- Consider removing in production builds
- Useful for matching UI to Sprint PRD use cases

---

### RightDrawer.tsx

**Purpose**: Reusable right-side drawer with title and body slots.

**Key Features**:

- Focus management (restores focus on close)
- Custom close event (`rightdrawer:beforeClose`) for intercept logic
- Responsive width (100vw mobile, 420px desktop)
- Accessible with ARIA labels

**Usage**:

```tsx
import { RightDrawer } from "@shared/components/common";

const [open, setOpen] = useState(false);

<RightDrawer title="Job Details" open={open} onClose={() => setOpen(false)}>
  {/* Drawer content */}
</RightDrawer>;
```

**Advanced: Close Intercept Pattern**
Used in JobDetails to prevent closing with unsaved changes:

```tsx
useEffect(() => {
  const handler = (ev: Event) => {
    if (hasUnsavedChanges) {
      ev.preventDefault();
      // Show confirmation dialog
    }
  };
  window.addEventListener("rightdrawer:beforeClose", handler);
  return () => window.removeEventListener("rightdrawer:beforeClose", handler);
}, [hasUnsavedChanges]);
```

**Props**:

- `title?`: Drawer header text
- `open`: Boolean to control visibility (required)
- `onClose`: Callback when user closes drawer (required)
- `children?`: Drawer body content

---

### SprintTaskSnackbar.tsx

**Purpose**: Displays Sprint 2 PRD tasks relevant to the current page.

**Key Features**:

- Expandable/collapsible task list
- Shows UC codes, owners, descriptions, and implementation scope
- Non-blocking, bottom-right placement
- Optional auto-hide when collapsed

**Usage**:

```tsx
import { SprintTaskSnackbar } from "@shared/components/common";
import type { SprintTaskItem } from "@shared/components/common/SprintTaskSnackbar";

const tasks: SprintTaskItem[] = [
  {
    uc: "UC-037",
    title: "Job Status Pipeline",
    desc: "Track application status through different stages",
    owner: "Alice",
    scope: "frontend",
  },
];

<SprintTaskSnackbar items={tasks} open={true} />;
```

**Task Item Properties**:

- `uc`: Use case code (e.g., "UC-037")
- `title?`: Optional short title
- `desc`: Brief description
- `owner?`: Team member name
- `scope?`: `frontend`, `backend`, or `both`

**Integration**:

- Used in `SystemLayer.tsx` for global display
- Reads tasks from `pageTaskMap.ts`
- Gets owners from `taskOwners.ts`

---

## Architecture Notes

### Component Organization

- All components in this folder are **general-purpose**
- If a component is only used in one workspace, it belongs in that workspace's `components/` folder
- If used in 2+ workspaces, it belongs here

### Re-exports

The `common/index.ts` barrel export also re-exports some components from specialized folders (`dialogs`, `feedback`) for convenience:

```tsx
// These are equivalent:
import { ErrorSnackbar } from "@shared/components/feedback";
import { ErrorSnackbar } from "@shared/components/common";
```

### Dependencies

Common components may depend on:

- `@shared/hooks` - Custom React hooks
- `@shared/context` - Context providers (Auth, Theme)
- `@shared/services` - API clients, CRUD helpers
- `@mui/material` - Material-UI components
- `@mui/icons-material` - Material-UI icons

## Testing Guidelines

### Unit Tests

Each component should have tests covering:

- Renders with default props
- Renders with all prop variants
- Handles user interactions (clicks, form inputs)
- Shows error states correctly
- Accessible keyboard navigation

### Example Test Structure

```tsx
describe("Icon", () => {
  it("renders with valid icon name", () => {
    render(<Icon name="Add" />);
    expect(screen.getByLabelText(/add/i)).toBeInTheDocument();
  });

  it("warns for invalid icon name", () => {
    const consoleSpy = vi.spyOn(console, "warn");
    render(<Icon name="InvalidIcon" />);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Icon "InvalidIcon" not found')
    );
  });
});
```

## Related Documentation

- [Complete Component Catalog](../../../../shared-components.md)
- [Dialogs Documentation](../dialogs/README.md)
- [Feedback Documentation](../feedback/README.md)
