// Router imports grouped for clarity:
// 1) react-router
// 2) auth pages (public)
// 3) profile pages and workspace routes
// 4) layout & shared components
// 5) AI and Jobs workspaces (lazy loaded for performance)
import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

// Auth / public pages (eager loaded - needed immediately)
import Login from "@profile/pages/auth/Login";
import Register from "@profile/pages/auth/Register";
import AuthCallback from "@profile/pages/auth/AuthCallback";
import ForgotPassword from "@profile/pages/auth/ForgetPassword";
import ResetPassword from "@profile/pages/auth/ResetPassword";

// Profile workspace pages (eager loaded - frequently accessed)
import HomePage from "@profile/pages/home/HomePage";
import Dashboard from "@profile/pages/dashboard/Dashboard";
import EducationOverview from "@profile/pages/education/EducationOverview";
import AddEducation from "@profile/pages/education/AddEducation";
import Certifications from "@profile/pages/certifications/Certifications";
import AddSkills from "@profile/pages/skills/AddSkills";
import SkillsOverview from "@profile/pages/skills/SkillsOverview";
import AddEmployment from "@profile/pages/employment/AddEmployment";
import EmploymentHistoryList from "@profile/pages/employment/EmploymentHistoryList";
import AddProjectForm from "@profile/pages/projects/AddProjectForm";
import ProjectPortfolio from "@profile/pages/projects/ProjectPortfolio";
import ProjectDetails from "@profile/pages/projects/ProjectDetails";
import ProfileDetails from "@profile/pages/profile/ProfileDetails";
import Settings from "@profile/pages/profile/Settings";

// Layouts and shared components
import ProtectedRoute from "@shared/components/common/ProtectedRoute";
import ProfileLayout from "@profile/ProfileLayout";
import AiLayout from "@workspaces/ai/AiLayout";
import JobsLayout from "@workspaces/jobs/JobsLayout";
import LoadingSpinner from "@shared/components/feedback/LoadingSpinner";

// AI workspace pages (lazy loaded - heavy components with AI logic)
const DashboardAI = lazy(
  () => import("@workspaces/ai/pages/DashboardAI/index")
);
const JobMatchPage = lazy(() => import("@workspaces/ai/pages/JobMatch/index"));
const CompanyResearch = lazy(
  () => import("@workspaces/ai/pages/CompanyResearch/index")
);
const TemplatesHub = lazy(
  () => import("@workspaces/ai/pages/TemplatesHub/index")
);
const CoverLetterEditor = lazy(
  () => import("@workspaces/ai/pages/CoverLetterEditor/index")
);
const ResumeEditorV2 = lazy(
  () => import("@workspaces/ai/pages/ResumeEditorV2/index")
);
const EditCoverLetter = lazy(
  () => import("@workspaces/ai/pages/EditCoverLetter/index")
);

// Jobs workspace pages (lazy loaded - data-heavy components)
const PipelinePage = lazy(
  () => import("./app/workspaces/jobs/pages/PipelinePage/PipelinePage")
);
const NewJobPage = lazy(() => import("./app/workspaces/jobs/pages/NewJobPage"));
const JobDetailsPage = lazy(
  () => import("./app/workspaces/jobs/pages/JobDetailsPage")
);
const DocumentsPage = lazy(
  () => import("./app/workspaces/jobs/pages/DocumentsPage/DocumentsPage")
);
const SavedSearchesPage = lazy(
  () => import("./app/workspaces/jobs/pages/SavedSearchesPage")
);
const AnalyticsPage = lazy(
  () => import("./app/workspaces/jobs/pages/AnalyticsPage/AnalyticsPage")
);
const AutomationsPage = lazy(
  () => import("./app/workspaces/jobs/pages/AutomationsPage")
);
const ViewArchivedJobs = lazy(
  () => import("./app/workspaces/jobs/pages/ViewArchivedJobs")
);

// Loading fallback component for lazy-loaded routes
const LazyLoadFallback = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "400px",
    }}
  >
    <LoadingSpinner size="large" message="Loading..." />
  </div>
);

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  // AI workspace (scoped theme). Index route shows a simple AI landing.
  // Lazy loaded for performance - reduces initial bundle size
  {
    path: "/ai",
    element: (
      <ProtectedRoute>
        <AiLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <DashboardAI />
          </Suspense>
        ),
      },
      {
        path: "resume",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <ResumeEditorV2 />
          </Suspense>
        ),
      },
      {
        path: "cover-letter",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <CoverLetterEditor />
          </Suspense>
        ),
      },
      {
        path: "cover-letter-edit",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <EditCoverLetter />
          </Suspense>
        ),
      },
      {
        path: "job-match",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <JobMatchPage />
          </Suspense>
        ),
      },
      {
        path: "company-research",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <CompanyResearch />
          </Suspense>
        ),
      },
      {
        path: "templates",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <TemplatesHub />
          </Suspense>
        ),
      },
    ],
  },
  // Jobs workspace - lazy loaded to reduce initial bundle size
  {
    path: "/jobs",
    element: (
      <ProtectedRoute>
        <JobsLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <PipelinePage />
          </Suspense>
        ),
      },
      {
        path: "pipeline",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <PipelinePage />
          </Suspense>
        ),
      },
      {
        path: "new",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <NewJobPage />
          </Suspense>
        ),
      },
      {
        path: ":id",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <JobDetailsPage />
          </Suspense>
        ),
      },
      {
        path: "documents",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <DocumentsPage />
          </Suspense>
        ),
      },
      {
        path: "saved-searches",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <SavedSearchesPage />
          </Suspense>
        ),
      },
      {
        path: "analytics",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <AnalyticsPage />
          </Suspense>
        ),
      },
      {
        path: "automations",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <AutomationsPage />
          </Suspense>
        ),
      },
      {
        path: "archived-jobs",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <ViewArchivedJobs />
          </Suspense>
        ),
      },
    ],
  },
  // NOTE: Removed temporary /add-job-form test route; use the Jobs workspace 'new' page instead.
  // NOTE: Removed old /cover-letters and /edit-cover-letters routes; replaced by AI workspace /ai/cover-letter
  // NOTE: Removed old /edit-resume and /ai/resume-old routes; replaced by AI workspace /ai/resume (ResumeEditorV2)

  // Public auth routes
  { path: "/register", element: <Register /> },
  { path: "/login", element: <Login /> },
  { path: "/auth/callback", element: <AuthCallback /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },

  // Profile workspace - All routes nested under /profile
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <ProfileLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "education", element: <EducationOverview /> },
      { path: "education/add", element: <AddEducation /> },
      { path: "education/:id/edit", element: <AddEducation /> },
      { path: "skills", element: <SkillsOverview /> },
      { path: "skills/manage", element: <AddSkills /> },
      { path: "employment", element: <EmploymentHistoryList /> },
      { path: "employment/add", element: <AddEmployment /> },
      { path: "employment/:id/edit", element: <AddEmployment /> },
      { path: "projects", element: <ProjectPortfolio /> },
      { path: "projects/new", element: <AddProjectForm /> },
      { path: "projects/:id", element: <ProjectDetails /> },
      { path: "projects/:id/edit", element: <AddProjectForm /> },
      { path: "certifications", element: <Certifications /> },
      { path: "details", element: <ProfileDetails /> },
      { path: "settings", element: <Settings /> },
    ],
  },

  // Legacy route redirects for backward compatibility
  { path: "/education", element: <Navigate to="/profile/education" replace /> },
  {
    path: "/education/manage",
    element: <Navigate to="/profile/education/add" replace />,
  },
  {
    path: "/skillsOverview",
    element: <Navigate to="/profile/skills" replace />,
  },
  {
    path: "/add-skills",
    element: <Navigate to="/profile/skills/manage" replace />,
  },
  {
    path: "/skills/manage",
    element: <Navigate to="/profile/skills/manage" replace />,
  },
  {
    path: "/add-employment",
    element: <Navigate to="/profile/employment/add" replace />,
  },
  {
    path: "/employment-history",
    element: <Navigate to="/profile/employment" replace />,
  },
  { path: "/portfolio", element: <Navigate to="/profile/projects" replace /> },
  {
    path: "/certifications",
    element: <Navigate to="/profile/certifications" replace />,
  },
  {
    path: "/profile-details",
    element: <Navigate to="/profile/details" replace />,
  },
  { path: "/settings", element: <Navigate to="/profile/settings" replace /> },
  {
    path: "/projects/new",
    element: <Navigate to="/profile/projects/new" replace />,
  },
  {
    path: "/projects/:id",
    element: <Navigate to="/profile/projects/:id" replace />,
  },
  {
    path: "/projects/:id/edit",
    element: <Navigate to="/profile/projects/:id/edit" replace />,
  },

  // Catch-all: redirect unknown routes to home
  { path: "*", element: <Navigate to="/" replace /> },
]);
