// Router imports grouped for clarity:
// 1) react-router
// 2) auth pages (public)
// 3) profile pages and workspace routes
// 4) layout & shared components
// 5) AI and Jobs workspaces
import { createBrowserRouter, Navigate } from "react-router-dom";

// Auth / public pages
import Login from "@profile/pages/auth/Login";
import Register from "@profile/pages/auth/Register";
import AuthCallback from "@profile/pages/auth/AuthCallback";
import ForgotPassword from "@profile/pages/auth/ForgetPassword";
import ResetPassword from "@profile/pages/auth/ResetPassword";

// Profile workspace pages
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

// AI & Jobs workspaces
import AiLayout from "@workspaces/ai/AiLayout";
import DashboardAI from "@workspaces/ai/pages/DashboardAI/index";
import JobMatchPage from "@workspaces/ai/pages/JobMatch/index";
import CompanyResearch from "@workspaces/ai/pages/CompanyResearch/index";
import TemplatesHub from "@workspaces/ai/pages/TemplatesHub/index";
import GenerateCoverLetter from "@workspaces/ai/pages/GenerateCoverLetter/index";
import ResumeEditorV2 from "@workspaces/ai/pages/ResumeEditorV2/index";
import EditCoverLetter from "@workspaces/ai/components/cover-letter/EditCoverLetter";
import JobsLayout from "@workspaces/jobs/JobsLayout";
import PipelinePage from "./app/workspaces/jobs/pages/PipelinePage/PipelinePage";
import NewJobPage from "./app/workspaces/jobs/pages/NewJobPage";
import DocumentsPage from "./app/workspaces/jobs/pages/DocumentsPage/DocumentsPage";
import SavedSearchesPage from "./app/workspaces/jobs/pages/SavedSearchesPage";
import AnalyticsPage from "./app/workspaces/jobs/pages/AnalyticsPage/AnalyticsPage";
import AutomationsPage from "./app/workspaces/jobs/pages/AutomationsPage";
import ViewArchivedJobs from "./app/workspaces/jobs/pages/ViewArchivedJobs";

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  // AI workspace (scoped theme). Index route shows a simple AI landing.
  {
    path: "/ai",
    element: (
      <ProtectedRoute>
        <AiLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardAI /> },
      { path: "resume", element: <ResumeEditorV2 /> },
      { path: "cover-letter", element: <GenerateCoverLetter /> },
      { path: "cover-letter-edit", element: <EditCoverLetter /> },
      { path: "job-match", element: <JobMatchPage /> },
      { path: "company-research", element: <CompanyResearch /> },
      { path: "templates", element: <TemplatesHub /> },
    ],
  },
  // Jobs workspace (placeholder pages)
  {
    path: "/jobs",
    element: (
      <ProtectedRoute>
        <JobsLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <PipelinePage /> },
      { path: "pipeline", element: <PipelinePage /> },
      { path: "new", element: <NewJobPage /> },
      { path: "documents", element: <DocumentsPage /> },
      { path: "saved-searches", element: <SavedSearchesPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "automations", element: <AutomationsPage /> },
      { path: "archived-jobs", element: <ViewArchivedJobs /> },
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
