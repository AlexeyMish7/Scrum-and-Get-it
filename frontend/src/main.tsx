// MUST be first import - installs fetch interceptor before any other code runs
import "./fetchInterceptor";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
//import "./index.css";
import { router } from "@/router.tsx";
import { RouterProvider } from "react-router-dom";
import { AuthContextProvider } from "@shared/context/AuthContext.tsx";
import { TeamProvider } from "@shared/context/TeamContext.tsx";
import { ThemeContextProvider } from "@shared/context/ThemeContext";
import { AvatarProvider } from "@shared/context/AvatarContext";
import { ProfileChangeProvider } from "@shared/context/ProfileChangeContext";
import { ErrorBoundary } from "@shared/components/feedback/ErrorBoundary";
import { ConfirmDialogProvider } from "@shared/components/dialogs";
import { ApiLogDebugProvider } from "@shared/components/dev/ApiLogDebugProvider";
import { AppBootstrapPrefetch, AppQueryProvider } from "@shared/cache";
// import { initAccessibilityAudit } from "@shared/utils";

// Initialize accessibility auditing in development mode
// DISABLED: Uncomment to enable accessibility warnings
// if (import.meta.env.DEV) {
//   initAccessibilityAudit({
//     wcagLevel: "AA",
//     minImpact: "moderate", // Only show moderate and above to reduce noise
//     auditDelay: 2000, // Wait 2s after changes before auditing
//   }).catch(console.error);
// }

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ApiLogDebugProvider>
        <ThemeContextProvider>
          <AppQueryProvider>
            <AuthContextProvider>
              <AppBootstrapPrefetch />
              <AvatarProvider>
                <TeamProvider>
                  <ProfileChangeProvider>
                    <ConfirmDialogProvider>
                      <RouterProvider router={router} />
                    </ConfirmDialogProvider>
                  </ProfileChangeProvider>
                </TeamProvider>
              </AvatarProvider>
            </AuthContextProvider>
          </AppQueryProvider>
        </ThemeContextProvider>
      </ApiLogDebugProvider>
    </ErrorBoundary>
  </StrictMode>
);
