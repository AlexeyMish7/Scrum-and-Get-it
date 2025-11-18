/**
 * JOB PIPELINE WORKSPACE
 * Main entry point for the job pipeline workspace.
 *
 * This workspace provides comprehensive job application tracking and management:
 * - Pipeline kanban board for visual workflow
 * - AI-powered job matching and analytics
 * - Document management for resumes and cover letters
 * - Application timeline and history tracking
 * - Interview scheduling and automation
 * - Salary research and benchmarking
 *
 * Structure:
 * - types/: TypeScript type definitions organized by domain
 * - components/: Reusable UI components organized by category
 * - pages/: Page-level components
 * - hooks/: Custom React hooks for state and logic
 * - services/: Data layer and API services
 * - views/: Larger composite views
 * - layouts/: Layout components
 * - widgets/: Dashboard widgets
 * - navigation/: Navigation components and types
 */

// Type exports
export * from "./types";

// Component exports
export * from "./components";

// Page exports
export * from "./pages";

// Hook exports
export * from "./hooks";

// Service exports
export * from "./services";

// View exports
export * from "./views";

// Layout exports
export { default as JobPipelineLayout } from "./layouts/JobPipelineLayout";
export { default as UnifiedJobsLayout } from "./layouts/UnifiedJobsLayout";

// Navigation exports
export { default as JobsNavBar } from "./navigation/JobsNavBar";
// Note: Navigation types (JobsView, NavItem, NAV_ITEMS) are already exported from ./types

// Widget exports
export { default as CalendarWidget } from "./widgets/CalendarWidget/CalendarWidget";
