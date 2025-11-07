import { Box } from "@mui/material";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "@shared/components/common/ErrorSnackbar";

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
