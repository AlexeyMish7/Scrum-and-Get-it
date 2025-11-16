# Shared Components

Reusable UI components used across all three workspaces (Profile, AI, Jobs).

## Overview

The shared components system provides a consistent, accessible, and maintainable UI foundation. All components follow Material-UI design patterns and integrate with our theme system.

## Categories

### [Common Components](./common/)

General-purpose UI primitives and utilities:

- **Icon** - Centralized icon system with type safety
- **ProfilePicture** - Avatar upload, crop, and management
- **ProtectedRoute** - Authentication enforcement wrapper
- **QuickActionButton** - Styled navigation buttons
- **RightDrawer** - Reusable side panel component
- **SprintTaskSnackbar** - Sprint task overlay for development
- **RegionAnchor** - Development utility for page markers

### [Dialog System](./dialogs/)

Centralized confirmation dialogs to replace `window.confirm()`:

- **ConfirmDialog** - Material-UI dialog component
- **ConfirmDialogContext** - React Context for dialog state management
- **useConfirmDialog** - Hook for showing confirmation prompts

### [Feedback Components](./feedback/)

Loading states, errors, and empty states:

- **LoadingSpinner** - Standardized loading indicators with size variants
- **ErrorSnackbar** - Centralized notification system
- **EmptyState** - Friendly empty state UI
- **ErrorBoundary** - React error boundary
- **Skeletons** - Loading skeleton components

### [Navigation Components](./navigation/)

Breadcrumbs and hierarchical navigation:

- **Breadcrumbs** - Breadcrumb navigation component

### [Sidebar Components](./sidebars/)

Workspace-specific navigation sidebars:

- **WorkspaceSidebar** - Base sidebar component (shared logic)
- **AISidebar** - AI workspace navigation
- **JobsSidebar** - Jobs workspace navigation
- **ProfileSidebar** - Profile workspace navigation

## Architecture Principles

### 1. **Single Source of Truth**

Each component exists in one place and is imported where needed. No duplication.

### 2. **Barrel Exports**

Components are exported through `index.ts` files for clean imports:

```tsx
import { LoadingSpinner, ErrorSnackbar } from "@shared/components/feedback";
```

### 3. **Theme Integration**

All components respect the active theme (light/dark) and use MUI's `sx` prop for styling.

### 4. **Accessibility First**

- Proper ARIA labels
- Keyboard navigation support
- Focus management
- Screen reader compatibility

### 5. **Type Safety**

All components have proper TypeScript types for props and return values.

## Usage Patterns

### Import from Category Folders

```tsx
// Good - import from category
import { LoadingSpinner } from "@shared/components/feedback";
import { ConfirmDialog } from "@shared/components/dialogs";

// Avoid - import from individual files
import LoadingSpinner from "@shared/components/feedback/LoadingSpinner";
```

### Hooks for Context-Based Components

```tsx
import { useConfirmDialog } from "@shared/hooks/useConfirmDialog";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";

const { confirm } = useConfirmDialog();
const { handleError, showSuccess } = useErrorHandler();
```

### Consistent Error Handling

```tsx
try {
  await someOperation();
  showSuccess("Operation completed!");
} catch (error) {
  handleError(error); // Automatically shows ErrorSnackbar
}
```

## Testing Strategy

All shared components should have:

1. **Unit tests** - Component renders correctly with various props
2. **Integration tests** - Component interactions work as expected
3. **Accessibility tests** - ARIA labels, keyboard navigation

## Related Documentation

- [Complete Component Catalog](../../../shared-components.md) - Detailed docs for every component
- [Theming Guide](../../../THEMING_GUIDE.md) - How to use and customize themes
- [Project Structure](../../../project-structure.md) - Overall architecture

## Contributing

When adding new shared components:

1. Determine the correct category (or create a new one)
2. Add the component with proper TypeScript types
3. Export through the category's `index.ts`
4. Write unit tests
5. Document in this folder structure
6. Update the main [shared-components.md](../../../shared-components.md)
