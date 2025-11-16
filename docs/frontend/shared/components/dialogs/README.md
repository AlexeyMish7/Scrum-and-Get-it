# Dialog System

Centralized confirmation dialog system to replace `window.confirm()` with accessible, themeable Material-UI dialogs.

## Overview

The dialog system provides a consistent, promise-based API for showing confirmation dialogs throughout the application. It uses React Context to manage dialog state globally.

## Components

### ConfirmDialog.tsx

**Purpose**: Material-UI dialog component with customizable content and buttons.

**Features**:

- Accessible keyboard navigation (Escape to cancel, Enter to confirm)
- Customizable title, message, and button labels
- Configurable button colors (primary, error, warning, etc.)
- Theme-aware styling
- Focus management

**Not Used Directly**: This component is rendered by the `ConfirmDialogContext` provider. Use the `useConfirmDialog` hook instead.

---

### ConfirmDialogContext.tsx

**Purpose**: React Context that manages dialog state and provides the confirmation API.

**Exports**:

- `ConfirmDialogProvider` - Context provider component
- `useConfirmDialog` - Hook to show dialogs (do NOT export from index.ts)

**Provider Setup**: Already wrapped at app root in `main.tsx`:

```tsx
<ConfirmDialogProvider>
  <App />
</ConfirmDialogProvider>
```

**State Management**:

- Tracks open/closed state
- Stores dialog configuration (title, message, buttons)
- Manages promise resolution for async/await pattern

---

## Usage

### Basic Confirmation

```tsx
import { useConfirmDialog } from "@shared/hooks/useConfirmDialog";

function MyComponent() {
  const { confirm } = useConfirmDialog();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete Job",
      message:
        "Are you sure you want to delete this job? This action cannot be undone.",
      confirmText: "Delete",
      confirmColor: "error",
    });

    if (confirmed) {
      // User clicked "Delete"
      await deleteJob();
    } else {
      // User clicked "Cancel" or closed dialog
      console.log("Deletion cancelled");
    }
  };

  return <Button onClick={handleDelete}>Delete</Button>;
}
```

### Hook API

**`useConfirmDialog()`** returns:

```tsx
{
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}
```

**`ConfirmDialogOptions`**:

```tsx
{
  title: string;           // Dialog title (required)
  message: string;         // Dialog body text (required)
  confirmText?: string;    // Confirm button label (default: "Confirm")
  cancelText?: string;     // Cancel button label (default: "Cancel")
  confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
                           // Confirm button color (default: "primary")
}
```

**Returns**: `Promise<boolean>`

- `true` - User confirmed (clicked confirm button)
- `false` - User cancelled (clicked cancel button, pressed Escape, or clicked outside)

---

## Examples

### Delete Confirmation (Error Color)

```tsx
const confirmed = await confirm({
  title: "Delete Account",
  message:
    "This will permanently delete your account and all associated data. This action cannot be undone.",
  confirmText: "Delete Account",
  cancelText: "Keep Account",
  confirmColor: "error",
});
```

### Discard Changes Confirmation

```tsx
const confirmed = await confirm({
  title: "Discard Changes?",
  message: "You have unsaved changes. Are you sure you want to discard them?",
  confirmText: "Discard",
  cancelText: "Keep Editing",
  confirmColor: "warning",
});
```

### Simple Yes/No

```tsx
const confirmed = await confirm({
  title: "Apply Changes",
  message: "Do you want to apply these changes to your profile?",
  confirmText: "Yes",
  cancelText: "No",
});
```

---

## Migration from `window.confirm()`

### Before (Old Pattern)

```tsx
const handleDelete = () => {
  if (window.confirm("Are you sure you want to delete this?")) {
    deleteItem();
  }
};
```

### After (Dialog System)

```tsx
const { confirm } = useConfirmDialog();

const handleDelete = async () => {
  const confirmed = await confirm({
    title: "Confirm Deletion",
    message: "Are you sure you want to delete this?",
    confirmText: "Delete",
    confirmColor: "error",
  });

  if (confirmed) {
    deleteItem();
  }
};
```

**Benefits**:

- ✅ Themeable (respects light/dark mode)
- ✅ Accessible (ARIA labels, keyboard navigation)
- ✅ Customizable text and colors
- ✅ Consistent UI across the app
- ✅ Better mobile experience
- ✅ Non-blocking (async/await)

---

## Adoption Status

**Completed** (7 files refactored):

1. `AddSkills.tsx` - Delete skill confirmation
2. `ProjectPortfolio.tsx` - Delete project confirmation
3. `EducationOverview.tsx` - Delete education confirmation
4. `JobDetailsPage.tsx` - Delete job confirmation
5. `ResumeVersionsPanel.tsx` - Delete resume version
6. `ResumeEditorV2/index.tsx` - Discard changes confirmation
7. `ResumeStarter.tsx` - Clear all data confirmation

**Legacy Usage**: If you find `window.confirm()` still being used anywhere, please migrate to the dialog system.

---

## Architecture

### Why Context Instead of Props?

- **Global State**: Dialog can be triggered from any component
- **No Prop Drilling**: Don't need to pass dialog state through component tree
- **Single Instance**: Only one dialog shown at a time (enforced by context)

### Promise-Based API

The dialog uses promises to provide a clean async/await interface:

```tsx
const confirmed = await confirm({ ... });
// Code here runs AFTER user makes a choice
```

This is better than callback-based patterns:

```tsx
// Avoid this pattern:
showConfirm({
  onConfirm: () => {
    /* ... */
  },
  onCancel: () => {
    /* ... */
  },
});
```

### Focus Management

- Dialog automatically focuses the first button when opened
- Escape key closes dialog (returns `false`)
- Tab key cycles through buttons
- Focus returns to triggering element when closed

---

## Testing

### Unit Tests

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ConfirmDialogProvider,
  useConfirmDialog,
} from "@shared/components/dialogs";

function TestComponent() {
  const { confirm } = useConfirmDialog();
  const [result, setResult] = useState<boolean | null>(null);

  return (
    <>
      <button
        onClick={async () => {
          const res = await confirm({
            title: "Test",
            message: "Test message",
          });
          setResult(res);
        }}
      >
        Show Dialog
      </button>
      {result !== null && <div>Result: {String(result)}</div>}
    </>
  );
}

test("confirms when user clicks confirm button", async () => {
  render(
    <ConfirmDialogProvider>
      <TestComponent />
    </ConfirmDialogProvider>
  );

  await userEvent.click(screen.getByText("Show Dialog"));
  await userEvent.click(screen.getByText("Confirm"));

  await waitFor(() => {
    expect(screen.getByText("Result: true")).toBeInTheDocument();
  });
});
```

### Integration Tests

Test real-world scenarios:

- Confirm deletion → verify item deleted
- Cancel deletion → verify item still exists
- Multiple sequential dialogs → verify queue handling

---

## Common Patterns

### Delete with Success Message

```tsx
const { confirm } = useConfirmDialog();
const { showSuccess, handleError } = useErrorHandler();

const handleDelete = async () => {
  const confirmed = await confirm({
    title: "Delete Item",
    message: "Are you sure?",
    confirmText: "Delete",
    confirmColor: "error",
  });

  if (!confirmed) return;

  try {
    await deleteItem(id);
    showSuccess("Item deleted successfully");
  } catch (error) {
    handleError(error);
  }
};
```

### Discard Changes Before Navigation

```tsx
const navigate = useNavigate();
const { confirm } = useConfirmDialog();

const handleNavigateAway = async () => {
  if (hasUnsavedChanges) {
    const confirmed = await confirm({
      title: "Discard Changes?",
      message: "You have unsaved changes. Discard them?",
      confirmText: "Discard",
      confirmColor: "warning",
    });

    if (!confirmed) return;
  }

  navigate("/somewhere");
};
```

---

## Related Documentation

- [Common Components](../common/README.md)
- [Complete Component Catalog](../../../../shared-components.md)
- [Error Handling](../feedback/README.md)
