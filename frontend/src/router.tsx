import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import Register from "./pages/Register";
import ProfilePage from "./pages/ProfilePage";
import EducationOverview from "./pages/EducationOverview";
import Certifications from "./pages/Certifications";
import SkillsOverview from "./pages/SkillsOverview";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgetPassword";
import ResetPassword from "./pages/ResetPassword";

import ProtectedRoute from "./components/ProtectedRoute";
import AddEmployment from "./pages/AddEmployment";
import EmploymentHistoryList from "./pages/EmployementHistoryList";
import AddProjectForm from "./pages/AddProjectForm";
import ProjectPortfolio from "./pages/ProjectPortfolio";
import ProjectDetails from "./pages/ProjectDetails";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/register", element: <Register /> },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  { path: "/educationOverview", element: <EducationOverview /> },
  { path: "/skillsOverview", element: <SkillsOverview /> },
  { path: "/login", element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/add-employment", element: <AddEmployment /> },
  { path: "/employment-history", element: <EmploymentHistoryList /> },
  { path: "/add-projects", element: <AddProjectForm /> },
  { path: "/certifications", element: <Certifications /> },
  { path: "/portfolio", element: <ProjectPortfolio /> },
  { path: "/projects/:id", element: <ProjectDetails /> }
]);
