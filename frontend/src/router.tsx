import { createBrowserRouter, Navigate } from "react-router-dom";
import Register from "./pages/auth/Register";
import ProfilePage from "./pages/profile/ProfilePage";
import EducationOverview from "./pages/education/EducationOverview";
import Certifications from "./pages/certifications/Certifications";
import AddSkills from "./pages/skills/AddSkills";
import SkillsOverview from "./pages/skills/SkillsOverview";
import Login from "./pages/auth/Login";
// import AddEducation from "./pages/AddEducation"; // unused - remove or wire a route when needed
import AddEducation from "./pages/education/AddEducation";
import ForgotPassword from "./pages/auth/ForgetPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import HomePage from "./pages/home/HomePage";
import AuthCallback from "./pages/auth/AuthCallback";

import ProtectedRoute from "./components/common/ProtectedRoute";
import AddEmployment from "./pages/employment/AddEmployment";
import EmploymentHistoryList from "./pages/employment/EmploymentHistoryList";
import AddProjectForm from "./pages/projects/AddProjectForm";
import ProjectPortfolio from "./pages/projects/ProjectPortfolio";
import ProjectDetails from "./pages/projects/ProjectDetails";
//import NavBar from "./components/NavigationBar/Navbar";
//import BreadcrumbsBar from "./components/NavigationBar/BreadcrumbsBar";
import ProfileDetails from "./pages/profile/ProfileDetails";
import MainLayout from "./components/navigation/MainLayout";
import Settings from "./pages/profile/Settings";

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/register", element: <Register /> },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <ProfilePage />
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
    path: "/add-projects",
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
  // Catch-all: redirect unknown routes to home
  { path: "*", element: <Navigate to="/" replace /> },
]);
