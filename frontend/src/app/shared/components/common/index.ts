/**
 * SHARED COMMON COMPONENTS - Barrel Export
 *
 * Centralized exports for reusable UI components.
 * These components are used across multiple workspaces.
 *
 * Organization:
 * - UI Primitives: Icon, QuickActionButton
 * - Layouts: RightDrawer
 * - Auth: ProtectedRoute
 * - Domain-specific: ProfilePicture, SprintTaskSnackbar
 * - Development: RegionAnchor (page markers for testing)
 *
 * Note: ConfirmDialog, ErrorSnackbar, and LoadingSpinner are exported from their
 * respective specialized folders (dialogs/, feedback/) for better organization.
 * Import them from @shared/components/dialogs or @shared/components/feedback instead.
 */

// Re-export components from specialized folders for convenience
// (dialogs and feedback folders have their own barrel exports)
export { default as ConfirmDialog } from "../dialogs/ConfirmDialog";
export { default as ErrorSnackbar } from "../feedback/ErrorSnackbar";

// UI primitives and utilities
export { default as Icon } from "./Icon";
export { default as QuickActionButton } from "./QuickActionButton";

// Layout components
export { default as RightDrawer } from "./RightDrawer";

// Auth and routing
export { default as ProtectedRoute } from "./ProtectedRoute";

// Domain-specific components
export { default as ProfilePicture } from "./ProfilePicture";
export { default as SprintTaskSnackbar } from "./SprintTaskSnackbar";
export { ThemePresetSelector } from "./ThemePresetSelector";

// Development/debugging tools
export { default as RegionAnchor } from "./RegionAnchor";
