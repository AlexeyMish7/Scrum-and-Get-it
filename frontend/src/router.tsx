import { createBrowserRouter, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import ProfilePage from "./pages/ProfilePage";
import EducationOverview from "./pages/EducationOverview";
import Certifications from "./pages/Certifications";
import SkillsOverview from "./pages/SkillsOverview";
import Login from "./pages/Login";
// import AddEducation from "./pages/AddEducation"; // unused - remove or wire a route when needed
import ForgotPassword from "./pages/ForgetPassword";
import ResetPassword from "./pages/ResetPassword";

import ProtectedRoute from "./components/ProtectedRoute";
import AddEmployment from "./pages/AddEmployment";
import EmploymentHistoryList from "./pages/EmployementHistoryList";
import AddProjectForm from "./pages/AddProjectForm";
import ProjectPortfolio from "./pages/ProjectPortfolio";
import ProjectDetails from "./pages/ProjectDetails";
//import NavBar from "./components/NavigationBar/Navbar";
//import BreadcrumbsBar from "./components/NavigationBar/BreadcrumbsBar";
import ProfileDetails from "./pages/ProfileDetails";
import MainLayout from "./components/NavigationBar/MainLayout";


export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
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
    path: "/educationOverview",
    element: (
      <MainLayout>
        <EducationOverview />
      </MainLayout>
    ),
  },
  {
    path: "/skillsOverview",
     element: (
      <MainLayout>
        <SkillsOverview />
      </MainLayout>
    ),
  },
  { path: "/login", element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/add-employment", element: <AddEmployment /> },
  {
    path: "/employment-history",
    element: (
      <MainLayout>
        <EmploymentHistoryList />
      </MainLayout>
    ),
  },
  {
    path: "/portfolio",
    element: (
      <MainLayout>
        <ProjectPortfolio />
      </MainLayout>
    ),
  },
  {
    path: "/certifications",
    element: (
      <MainLayout>
        <Certifications />
      </MainLayout>
    ),
  },
  {
    path: "/profile-details",
    element: (
      <MainLayout>
        <ProfileDetails />
      </MainLayout>
    ),
  },
  { path: "/add-projects", element: <AddProjectForm /> },
  { path: "/projects/:id", element: <ProjectDetails /> },
]);
