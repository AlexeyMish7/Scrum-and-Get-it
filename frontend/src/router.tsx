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

// Cover letter pages (kept using relative paths in repo layout)
import CoverLetterTemplates from "./app/workspaces/profile/pages/cover_letters/CoverLetterTemplates";
import EditCoverLetter from "./app/workspaces/profile/pages/cover_letters/EditCoverLetter";

// Layouts and shared components
import ProtectedRoute from "@shared/components/common/ProtectedRoute";
import ProfileLayout from "@profile/ProfileLayout";

// AI & Jobs workspaces
import AiLayout from "@workspaces/ai/AiLayout";
import DashboardAI from "@workspaces/ai/pages/DashboardAI/index";
import GenerateResume from "@workspaces/ai/pages/GenerateResume/index";
import GenerateCoverLetter from "@workspaces/ai/pages/GenerateCoverLetter/index";
import JobsLayout from "@workspaces/jobs/JobsLayout";
import PipelinePage from "./app/workspaces/jobs/pages/PipelinePage/PipelinePage";
import NewJobPage from "./app/workspaces/jobs/pages/NewJobPage";
import DocumentsPage from "./app/workspaces/jobs/pages/DocumentsPage/DocumentsPage";
import SavedSearchesPage from "./app/workspaces/jobs/pages/SavedSearchesPage";
import AnalyticsPage from "./app/workspaces/jobs/pages/AnalyticsPage/AnalyticsPage";

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
      { path: "resume", element: <GenerateResume /> },
      { path: "cover-letter", element: <GenerateCoverLetter /> },
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
    ],
  },
  // NOTE: Removed temporary /add-job-form test route; use the Jobs workspace 'new' page instead.
  { path: "/register", element: <Register /> },
  {
    path: "/cover-letters",
    element: (
      <ProtectedRoute>
        <ProfileLayout>
          <CoverLetterTemplates />
        </ProfileLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/edit-cover-letters",
    element: (
      <ProtectedRoute>
        <ProfileLayout>
          <EditCoverLetter />
        </ProfileLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <ProfileLayout>
          <Dashboard />
        </ProfileLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/education",
    element: (
      <ProtectedRoute>
        <ProfileLayout>
          <EducationOverview />
        </ProfileLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/education/manage",
    element: (
      <ProtectedRoute>
        <ProfileLayout>
          <AddEducation />
        </ProfileLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/skillsOverview",
    element: (
      <ProtectedRoute>
        <ProfileLayout>
          <SkillsOverview />
        </ProfileLayout>
      </ProtectedRoute>
    ),
  },
  { path: "/login", element: <Login /> },
  { path: "/auth/callback", element: <AuthCallback /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
  {
    path: "/add-employment",
    element: (
      <ProtectedRoute>
        <ProfileLayout>
          <AddEmployment />
        </ProfileLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/add-skills",
    element: (
      <ProtectedRoute>
        <ProfileLayout>
          <AddSkills />
        </ProfileLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/skills/manage",
    element: (
      <ProtectedRoute>
        <ProfileLayout>
          <AddSkills />
        </ProfileLayout>
      </ProtectedRoute>
    ),
  },

  {
    path: "/employment-history",
    element: (
      <ProtectedRoute>
        <ProfileLayout>
          <EmploymentHistoryList />
        </ProfileLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/portfolio",
    element: (
      <ProtectedRoute>
        <ProfileLayout>
          <ProjectPortfolio />
        </ProfileLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/certifications",
    element: (
      <ProtectedRoute>
        <ProfileLayout>
          <Certifications />
        </ProfileLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile-details",
    element: (
      <ProtectedRoute>
        <ProfileLayout>
          <ProfileDetails />
        </ProfileLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute>
        <ProfileLayout>
          <Settings />
        </ProfileLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects/new",
    element: (
      <ProtectedRoute>
        <ProfileLayout>
          <AddProjectForm />
        </ProfileLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects/:id",
    element: (
      <ProtectedRoute>
        <ProfileLayout>
          <ProjectDetails />
        </ProfileLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects/:id/edit",
    element: (
      <ProtectedRoute>
        <ProfileLayout>
          <AddProjectForm />
        </ProfileLayout>
      </ProtectedRoute>
    ),
  },
  // Catch-all: redirect unknown routes to home
  { path: "*", element: <Navigate to="/" replace /> },
]);
