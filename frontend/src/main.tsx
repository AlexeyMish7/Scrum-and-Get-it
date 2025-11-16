import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
//import "./index.css";
import { router } from "@/router.tsx";
import { RouterProvider } from "react-router-dom";
import { AuthContextProvider } from "@shared/context/AuthContext.tsx";
import { ThemeContextProvider } from "@shared/context/ThemeContext";
import { ErrorBoundary } from "@shared/components/feedback/ErrorBoundary";
import { ConfirmDialogProvider } from "@shared/components/dialogs";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeContextProvider>
        <AuthContextProvider>
          <ConfirmDialogProvider>
            <RouterProvider router={router} />
          </ConfirmDialogProvider>
        </AuthContextProvider>
      </ThemeContextProvider>
    </ErrorBoundary>
  </StrictMode>
);
