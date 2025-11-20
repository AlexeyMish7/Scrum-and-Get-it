/**
 * AIWorkspaceLayout - Centralized Layout
 *
 * New centralized layout for AI workspace without sidebar.
 * Uses horizontal navigation tabs and AppShell for consistent structure.
 */

import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import AppShell from "@shared/layouts/AppShell";
import AINavBar from "../navigation/AINavBar";
import { Box, Snackbar, Alert } from "@mui/material";
import { GenerationProvider } from "../context/GenerationContext";

const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || "http://localhost:8787";

/**
 * Check if the AI server is reachable
 */
async function checkServerConnection(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`${AI_BASE_URL}/api/health`, {
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
 * - Horizontal navigation tabs
 * - Main content area (Outlet)
 * - No sidebar (unlike old design)
 * - Server connection status indicator
 */
export default function AIWorkspaceLayout() {
  const [serverConnected, setServerConnected] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

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
      <AppShell sidebar={null}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {/* Horizontal navigation */}
          <AINavBar />

          {/* Main content area */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              overflow: "auto",
              backgroundColor: "background.default",
            }}
          >
            <Outlet />
          </Box>

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
              server is running on {AI_BASE_URL}
            </Alert>
          </Snackbar>
        </Box>
      </AppShell>
    </GenerationProvider>
  );
}
