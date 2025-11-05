import { createBrowserRouter, Navigate } from "react-router-dom";
import Register from "@profile/pages/auth/Register";
import Dashboard from "@profile/pages/dashboard/Dashboard";
import EducationOverview from "@profile/pages/education/EducationOverview";
import Certifications from "@profile/pages/certifications/Certifications";
import AddSkills from "@profile/pages/skills/AddSkills";
import SkillsOverview from "@profile/pages/skills/SkillsOverview";
import Login from "@profile/pages/auth/Login";
// import AddEducation from "./pages/AddEducation"; // unused - remove or wire a route when needed
import AddEducation from "@profile/pages/education/AddEducation";
import ForgotPassword from "@profile/pages/auth/ForgetPassword";
import ResetPassword from "@profile/pages/auth/ResetPassword";
import HomePage from "@profile/pages/home/HomePage";
import AuthCallback from "@profile/pages/auth/AuthCallback";

import ProtectedRoute from "@shared/components/common/ProtectedRoute";
import AddEmployment from "@profile/pages/employment/AddEmployment";
import EmploymentHistoryList from "@profile/pages/employment/EmploymentHistoryList";
import AddProjectForm from "@profile/pages/projects/AddProjectForm";
import ProjectPortfolio from "@profile/pages/projects/ProjectPortfolio";
import ProjectDetails from "@profile/pages/projects/ProjectDetails";
//import NavBar from "./components/NavigationBar/Navbar";
//import BreadcrumbsBar from "./components/NavigationBar/BreadcrumbsBar";
import ProfileDetails from "@profile/pages/profile/ProfileDetails";
import MainLayout from "@profile/components/navigation/MainLayout";
import Settings from "@profile/pages/profile/Settings";

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/register", element: <Register /> },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/education",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <EducationOverview />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/education/manage",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <AddEducation />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/skillsOverview",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <SkillsOverview />
        </MainLayout>
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
        <MainLayout>
          <AddEmployment />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/add-skills",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <AddSkills />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/skills/manage",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <AddSkills />
        </MainLayout>
      </ProtectedRoute>
    ),
  },

  {
    path: "/employment-history",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <EmploymentHistoryList />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/portfolio",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <ProjectPortfolio />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/certifications",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Certifications />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile-details",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <ProfileDetails />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Settings />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects/new",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <AddProjectForm />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects/:id",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <ProjectDetails />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects/:id/edit",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <AddProjectForm />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  // Catch-all: redirect unknown routes to home
  { path: "*", element: <Navigate to="/" replace /> },
]);
