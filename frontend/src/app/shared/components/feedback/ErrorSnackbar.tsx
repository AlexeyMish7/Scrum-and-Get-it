import React from "react";
import { Snackbar, Alert } from "@mui/material";
import type { ErrorNotification } from "../../hooks/useErrorHandler";

interface ErrorSnackbarProps {
  notification: ErrorNotification;
  onClose: () => void;
}

/**
 * Reusable Snackbar component for displaying error notifications
 * across the application. Works with the useErrorHandler hook.
 */
export const ErrorSnackbar: React.FC<ErrorSnackbarProps> = ({
  notification,
  onClose,
}) => {
  return (
    <Snackbar
      open={notification.open}
      autoHideDuration={notification.autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        onClose={onClose}
        severity={notification.severity}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {notification.message}
      </Alert>
    </Snackbar>
  );
};

export default ErrorSnackbar;
