import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Register from "./pages/Register";
import ProfilePage from "./pages/ProfilePage";
import EducationOverview from "./pages/EducationOverview";
import SkillsOverview from "./pages/SkillsOverview";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgetPassword";
import ResetPassword from "./pages/ResetPassword";


export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/register", element: <Register /> },
  { path: "/profile", element: <ProfilePage /> },
  { path: "/educationOverview", element: <EducationOverview /> },
  { path: "/skillsOverview", element: <SkillsOverview /> },
  { path: "/login", element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> }
]);
