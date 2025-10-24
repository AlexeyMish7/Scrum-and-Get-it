import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Register from "./pages/Register";
import ProfilePage from "./pages/ProfilePage";
import EducationOverview from "./pages/EducationOverview";
import SkillsOverview from "./pages/SkillsOverview";

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/register", element: <Register /> },
  { path: "/profile", element: <ProfilePage /> },
  { path: "/educationOverview", element: <EducationOverview /> },
  { path: "/skillsOverview", element: <SkillsOverview /> }
]);
