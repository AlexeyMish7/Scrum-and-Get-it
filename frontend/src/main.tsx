import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
//import "./index.css";
import { router } from "@/router.tsx";
import { RouterProvider } from "react-router-dom";
import { AuthContextProvider } from "@shared/context/AuthContext.tsx";
import { ThemeContextProvider } from "@shared/context/ThemeContext";
import { ErrorBoundary } from "@shared/components/feedback/ErrorBoundary";
import { ConfirmDialogProvider } from "@shared/components/dialogs";
import { initAccessibilityAudit } from "@shared/utils/a11yAudit";

// Initialize accessibility auditing in development mode
if (import.meta.env.DEV) {
  initAccessibilityAudit({
    wcagLevel: "AA",
    minImpact: "moderate", // Only show moderate and above to reduce noise
    auditDelay: 2000, // Wait 2s after changes before auditing
  }).catch(console.error);
}

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
