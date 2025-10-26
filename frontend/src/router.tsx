import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import AddSkills from "./pages/AddSkills";
import Register from "./pages/Register";
import ProfilePage from "./pages/ProfilePage";
import EducationOverview from "./pages/EducationOverview";
import Certifications from "./pages/Certifications";
import SkillsOverview from "./pages/SkillsOverview";
import Login from "./pages/Login";
import AddEducation from "./pages/AddEducation";
import ForgotPassword from "./pages/ForgetPassword";
import ResetPassword from "./pages/ResetPassword";

import ProtectedRoute from "./components/ProtectedRoute";
import AddEmployment from "./pages/AddEmployment";
import EmploymentHistoryList from "./pages/EmployementHistoryList";
import AddProjectForm from "./pages/AddProjectForm";
import ProjectPortfolio from "./pages/ProjectPortfolio";
import ProjectDetails from "./pages/ProjectDetails";
import NavBar from "./components/NavigationBar/Navbar";
import BreadcrumbsBar from "./components/NavigationBar/BreadcrumbsBar";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/register", element: <Register /> },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <NavBar />
        <BreadcrumbsBar /> 
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
{
  path: "/education/manage",
  element: (
    <ProtectedRoute>
      <NavBar />
      <BreadcrumbsBar />
      <AddEducation />
    </ProtectedRoute>
  ),
},
  { path: "/educationOverview", 
   element: (
      <>
        <NavBar />
        <BreadcrumbsBar /> 
        <EducationOverview />
      </>
    ), 
  },
  { path: "/skillsOverview", 
    element: (
      <>
        <NavBar />
        <BreadcrumbsBar /> 
        <SkillsOverview />
      </>
    ),},
  { path: "/login", element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/add-employment", element: <AddEmployment /> },
  { path: "/portfolio", element: <ProjectPortfolio /> },
  { path: "/projects/:id", element: <ProjectDetails /> },
  { path: "/skills/manage", element: <AddSkills /> },
  { path: "/employment-history", 
    element: (
      <>
        <NavBar />
        <BreadcrumbsBar /> 
        <EmploymentHistoryList />
      </>
    ),
  },
  { path: "/add-projects", 
    element: (
      <>
        <NavBar />
        <BreadcrumbsBar /> 
        <AddProjectForm />
      </>
    ),  
  },
  { path: "/certifications", 
     element: (
      <>
        <NavBar />
        <BreadcrumbsBar /> 
        <Certifications />
      </>
    ), 
  }
]);



