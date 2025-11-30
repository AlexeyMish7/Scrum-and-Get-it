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
import Certifications from "@profile/pages/certifications/Certifications";
import SkillsOverview from "@profile/pages/skills/SkillsOverview";
import EmploymentHistoryList from "@profile/pages/employment/EmploymentHistoryList";
import ProjectPortfolio from "@profile/pages/projects/ProjectPortfolio";
import ProjectDetails from "@profile/pages/projects/ProjectDetails";
import ProfileDetails from "@profile/pages/profile/ProfileDetails";
import Settings from "@profile/pages/profile/Settings";
const ProfileAnalytics = lazy(() => import("./pages/AnalyticsDashboard"));

// Layouts and shared components
import ProtectedRoute from "@shared/components/common/ProtectedRoute";
import ProfileLayout from "@profile/ProfileLayout";
import AIWorkspaceLayout from "@ai_workspace/layouts/AIWorkspaceLayout";
import JobsLayout from "@workspaces/job_pipeline/layouts/JobPipelineLayout";
import UnifiedJobsLayout from "@workspaces/job_pipeline/layouts/UnifiedJobsLayout";
import LoadingSpinner from "@shared/components/feedback/LoadingSpinner";
import AppShell from "@shared/layouts/AppShell";

// AI workspace (redesigned)
const AIWorkspaceHub = lazy(() => import("@ai_workspace/pages/AIWorkspaceHub"));
const DocumentLibrary = lazy(
  () => import("@ai_workspace/pages/DocumentLibrary")
);
const TemplateManager = lazy(
  () => import("@ai_workspace/pages/TemplateManager")
);
const CompanyResearchNew = lazy(
  () => import("@ai_workspace/pages/CompanyResearch")
);
const GenerateResumePage = lazy(
  () => import("@ai_workspace/pages/GenerateResume")
);
const GenerateCoverLetterPage = lazy(
  () => import("@ai_workspace/pages/GenerateCoverLetter")
);
const DocumentEditorPage = lazy(() =>
  import("@ai_workspace/pages/DocumentEditorPage").then((module) => ({
    default: module.DocumentEditorPage,
  }))
);

// Reviews (UC-110: Collaborative Document Review)
const MyReviewsPage = lazy(() =>
  import("@ai_workspace/pages/Reviews").then((module) => ({
    default: module.MyReviewsPage,
  }))
);
const DocumentReviewPage = lazy(() =>
  import("@ai_workspace/pages/Reviews").then((module) => ({
    default: module.DocumentReviewPage,
  }))
);

// Jobs workspace pages (lazy loaded - legacy routes only)
const NewJobPage = lazy(
  () => import("./app/workspaces/job_pipeline/pages/NewJobPage")
);
const JobDetailsPage = lazy(
  () => import("./app/workspaces/job_pipeline/pages/JobDetailsPage")
);
const SavedSearchesPage = lazy(
  () => import("./app/workspaces/job_pipeline/pages/SavedSearchesPage")
);
const AutomationsPage = lazy(
  () => import("./app/workspaces/job_pipeline/pages/AutomationsPage")
);
const ViewArchivedJobs = lazy(
  () => import("./app/workspaces/job_pipeline/pages/ArchivedJobsPage")
);

// Jobs workspace views (new unified architecture - lazy loaded)
const PipelineView = lazy(
  () => import("@workspaces/job_pipeline/views/PipelineView/PipelineView")
);
const AnalyticsView = lazy(
  () => import("@workspaces/job_pipeline/views/AnalyticsView/AnalyticsView")
);

// Interview Hub workspace (lazy loaded)
const InterviewHub = lazy(() =>
  import("@workspaces/interview_hub").then((module) => ({
    default: module.InterviewHub,
  }))
);

// Network Hub (contacts)
const NetworkContacts = lazy(
  () =>
    import("@workspaces/network_hub/pages/ContactsDashboard/ContactsDashboard")
);
const NetworkTemplatesPage = lazy(
  () => import("@workspaces/network_hub/pages/TemplatesPage/TemplatesPage")
);
const NetworkInterviewsPage = lazy(
  () =>
    import(
      "@workspaces/network_hub/pages/InformationalInterview/InformationalInterviews"
    )
);

// Team Management workspace
import { TeamLayout } from "@workspaces/team_management/layouts/TeamLayout";
const TeamDashboard = lazy(() =>
  import("@workspaces/team_management/pages/TeamDashboard").then((module) => ({
    default: module.TeamDashboard,
  }))
);
const TeamSettings = lazy(() =>
  import("@workspaces/team_management/pages/TeamSettings").then((module) => ({
    default: module.TeamSettings,
  }))
);
const Invitations = lazy(() =>
  import("@workspaces/team_management/pages/Invitations").then((module) => ({
    default: module.Invitations,
  }))
);
const TeamReports = lazy(() =>
  import("@workspaces/team_management/pages/TeamReports").then((module) => ({
    default: module.TeamReports,
  }))
);
const MentorDashboard = lazy(() =>
  import("@workspaces/team_management/pages/MentorDashboard").then(
    (module) => ({
      default: module.MentorDashboard,
    })
  )
);
const PeerGroupsPage = lazy(() =>
  import("@workspaces/team_management/pages/PeerGroupsPage").then(
    (module) => ({
      default: module.PeerGroupsPage,
    })
  )
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

  // AI workspace - Redesigned with centralized hub
  {
    path: "/ai",
    element: (
      <ProtectedRoute>
        <AIWorkspaceLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <AIWorkspaceHub />
          </Suspense>
        ),
      },
      {
        path: "library",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <DocumentLibrary />
          </Suspense>
        ),
      },
      {
        path: "templates",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <TemplateManager />
          </Suspense>
        ),
      },
      {
        path: "generate/resume",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <GenerateResumePage />
          </Suspense>
        ),
      },
      {
        path: "generate/cover-letter",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <GenerateCoverLetterPage />
          </Suspense>
        ),
      },
      {
        path: "document/:documentId",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <DocumentEditorPage />
          </Suspense>
        ),
      },
      {
        path: "research",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <CompanyResearchNew />
          </Suspense>
        ),
      },
      // Reviews (UC-110: Collaborative Document Review)
      {
        path: "reviews",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <MyReviewsPage />
          </Suspense>
        ),
      },
      {
        path: "reviews/:reviewId",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <DocumentReviewPage />
          </Suspense>
        ),
      },
    ],
  },
  // Interview Hub workspace
  {
    path: "/interviews",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LazyLoadFallback />}>
          <InterviewHub />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  // Network Hub - Contacts
  {
    path: "/network",
    element: (
      <ProtectedRoute>
        <AppShell>
          <Suspense fallback={<LazyLoadFallback />}>
            <NetworkContacts />
          </Suspense>
        </AppShell>
      </ProtectedRoute>
    ),
  },
  {
    path: "/network/templates",
    element: (
      <ProtectedRoute>
        <AppShell>
          <Suspense fallback={<LazyLoadFallback />}>
            <NetworkTemplatesPage />
          </Suspense>
        </AppShell>
      </ProtectedRoute>
    ),
  },
  {
    path: "/network/interviews",
    element: (
      <ProtectedRoute>
        <AppShell>
          <Suspense fallback={<LazyLoadFallback />}>
            <NetworkInterviewsPage />
          </Suspense>
        </AppShell>
      </ProtectedRoute>
    ),
  },
  // Team Management workspace
  {
    path: "/team",
    element: (
      <ProtectedRoute>
        <TeamLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <TeamDashboard />
          </Suspense>
        ),
      },
      {
        path: "settings",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <TeamSettings />
          </Suspense>
        ),
      },
      {
        path: "invitations",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <Invitations />
          </Suspense>
        ),
      },
      {
        path: "reports",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <TeamReports />
          </Suspense>
        ),
      },
      {
        path: "mentor",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <MentorDashboard />
          </Suspense>
        ),
      },
      {
        path: "groups",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <PeerGroupsPage />
          </Suspense>
        ),
      },
      {
        path: "groups/:groupId",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <PeerGroupsPage />
          </Suspense>
        ),
      },
      // TODO: Add /team/messages route
    ],
  },
  // Jobs workspace - SIMPLIFIED: Single pipeline view with integrated analytics & calendar
  {
    path: "/jobs",
    element: (
      <ProtectedRoute>
        <UnifiedJobsLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <PipelineView />
          </Suspense>
        ),
      },
      {
        path: "analytics",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <AnalyticsView />
          </Suspense>
        ),
      },
    ],
  },
  // Jobs workspace - LEGACY: Old routes maintained for backward compatibility
  // TODO: Remove after Day 7 migration complete
  {
    path: "/jobs-legacy",
    element: (
      <ProtectedRoute>
        <JobsLayout />
      </ProtectedRoute>
    ),
    children: [
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
        path: "saved-searches",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <SavedSearchesPage />
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
      {
        path: "analytics",
        element: (
          <Suspense fallback={<LazyLoadFallback />}>
            <ProfileAnalytics />
          </Suspense>
        ),
      },
      { path: "education", element: <EducationOverview /> },
      { path: "skills", element: <SkillsOverview /> },
      { path: "employment", element: <EmploymentHistoryList /> },
      { path: "projects", element: <ProjectPortfolio /> },
      { path: "projects/:id", element: <ProjectDetails /> },
      { path: "certifications", element: <Certifications /> },
      { path: "details", element: <ProfileDetails /> },
      { path: "settings", element: <Settings /> },
    ],
  },

  // Legacy route redirects for backward compatibility
  { path: "/education", element: <Navigate to="/profile/education" replace /> },
  {
    path: "/education/manage",
    element: <Navigate to="/profile/education" replace />,
  },
  {
    path: "/skillsOverview",
    element: <Navigate to="/profile/skills" replace />,
  },
  {
    path: "/add-skills",
    element: <Navigate to="/profile/skills" replace />,
  },
  {
    path: "/skills/manage",
    element: <Navigate to="/profile/skills" replace />,
  },
  {
    path: "/add-employment",
    element: <Navigate to="/profile/employment" replace />,
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
    element: <Navigate to="/profile/projects" replace />,
  },
  {
    path: "/projects/:id",
    element: <Navigate to="/profile/projects/:id" replace />,
  },

  // Catch-all: redirect unknown routes to home
  { path: "*", element: <Navigate to="/" replace /> },
]);
