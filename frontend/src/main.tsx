import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
//import "./index.css";
import { router } from "@/router.tsx";
import { RouterProvider } from "react-router-dom";
import { AuthContextProvider } from "@shared/context/AuthContext.tsx";
import { ThemeContextProvider } from "@shared/context/ThemeContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeContextProvider>
      <AuthContextProvider>
        <RouterProvider router={router} />
      </AuthContextProvider>
    </ThemeContextProvider>
  </StrictMode>
);
