/**
 * SHARED HOOKS INDEX
 * Central export point for all shared React hooks.
 *
 * Re-exports:
 * - Error handling and notifications
 * - Confirm dialog integration
 * - Debounce utilities
 * - Sprint task tracking
 * - User jobs loading
 * - Avatar loading with caching
 *
 * Usage:
 * ```ts
 * import { useErrorHandler, useConfirmDialog, useDebounce, useAvatar } from "@hooks";
 * ```
 */

export {
  useErrorHandler,
  getErrorMessage,
  validateRequired,
  withErrorHandling,
  type ErrorSeverity,
  type ErrorNotification,
} from "./useErrorHandler";
export { default as useConfirmDialog } from "./useConfirmDialog";
export { useDebounce, useDebouncedCallback } from "./useDebounce";
export { default as useSprintTasks } from "./useSprintTasks";
export { default as useUserJobs } from "./useUserJobs";
export { default as useAvatar } from "./useAvatar";
