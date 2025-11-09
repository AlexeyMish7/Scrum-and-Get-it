/**
 * Shared Hooks
 * Barrel export for simplified imports
 */

export {
  useErrorHandler,
  getErrorMessage,
  validateRequired,
  withErrorHandling,
  type ErrorSeverity,
  type ErrorNotification,
} from "./useErrorHandler";
export { default as useSprintTasks } from "./useSprintTasks";
export { default as useUserJobs } from "./useUserJobs";
