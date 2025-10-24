import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Register from "./pages/Register";
import ProfilePage from "./pages/ProfilePage";

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/Register", element: <Register /> },
  { path: "/ProfilePage", element: <ProfilePage /> },
]);
