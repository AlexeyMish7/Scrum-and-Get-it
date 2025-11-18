/**
 * SystemLayer Component
 *
 * Provides app-wide system UI overlays and global feedback components.
 * Rendered once at the app root to make these features available everywhere.
 *
 * Current features:
 * - Error notifications (snackbar)
 * - Future: Global modals, confirm dialogs, toast notifications
 *
 * Usage: Import and render in App.tsx or main layout component
 */

import { Box } from "@mui/material";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "@shared/components/feedback/ErrorSnackbar";

export default function SystemLayer() {
  // Use centralized error handler and render the snackbar here so it's available
  // across the app without adding the component to each page.
  const { notification, closeNotification } = useErrorHandler();

  return (
    <Box>
      <ErrorSnackbar notification={notification} onClose={closeNotification} />
      {/* Add global modals and confirm dialogs here as needed */}
    </Box>
  );
}
