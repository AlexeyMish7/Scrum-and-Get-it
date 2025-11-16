/**
 * FEEDBACK COMPONENTS
 *
 * Centralized exports for all feedback-related UI components.
 * These components handle loading states, errors, empty states, and user notifications.
 */

export { ErrorBoundary } from "./ErrorBoundary";
export { default as LoadingSpinner } from "./LoadingSpinner";
export { default as EmptyState } from "./EmptyState";
export { default as ErrorSnackbar } from "./ErrorSnackbar";

// Skeleton components for loading states
export {
  JobCardSkeleton,
  EmploymentCardSkeleton,
  ProjectCardSkeleton,
  ChartSkeleton,
  DocumentCardSkeleton,
  TableRowSkeleton,
  PipelinePageSkeleton,
  AnalyticsPageSkeleton,
  DetailViewSkeleton,
} from "./Skeletons";
