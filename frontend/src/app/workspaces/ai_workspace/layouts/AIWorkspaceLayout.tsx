/**
 * AIWorkspaceLayout - Centralized Layout
 *
 * Centralized layout for AI workspace with sidebar navigation.
 * Uses AnimatedSidebar for consistent structure with Profile workspace.
 */

import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import AppShell from "@shared/layouts/AppShell";
import AIWorkspaceSidebar from "@shared/components/sidebars/AIWorkspaceSidebar";
import { Box, Snackbar, Alert } from "@mui/material";
import { GenerationProvider } from "../context/GenerationContext";
import { getApiBaseUrl, toApiUrl } from "@shared/services/apiUrl";

/**
 * Check if the AI server is reachable
 */
async function checkServerConnection(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(toApiUrl("/api/health"), {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * AIWorkspaceLayout Component
 *
 * Renders the AI workspace with:
 * - Global top bar (from AppShell)
 * - Sidebar navigation (similar to Profile workspace)
 * - Main content area (Outlet)
 * - Server connection status indicator
 */
export default function AIWorkspaceLayout() {
  const [serverConnected, setServerConnected] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  const apiBaseLabel = getApiBaseUrl() || "same origin";

  useEffect(() => {
    // Check connection on mount
    checkServerConnection().then((connected) => {
      setServerConnected(connected);
      setShowAlert(!connected);
    });

    // Poll every 10 seconds to update connection status
    const interval = setInterval(async () => {
      const connected = await checkServerConnection();
      setServerConnected(connected);

      // Show alert when connection is lost
      if (!connected) {
        setShowAlert(true);
      } else {
        // Auto-hide alert when connection is restored
        setShowAlert(false);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <GenerationProvider>
      <AppShell sidebar={<AIWorkspaceSidebar />}>
        <Outlet />

        {/* Server connection status */}
        <Snackbar
          open={showAlert && !serverConnected}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          sx={{ bottom: 24 }}
        >
          <Alert
            severity="error"
            variant="filled"
            sx={{
              width: "100%",
              boxShadow: 3,
            }}
          >
            Server connection lost. AI features will not work until the backend
            server is reachable at {apiBaseLabel}
          </Alert>
        </Snackbar>
      </AppShell>
    </GenerationProvider>
  );
}
