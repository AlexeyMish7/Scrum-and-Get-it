/**
 * Error Notification Provider
 *
 * Displays error notifications as snackbars using MUI components.
 * Automatically subscribes to the global errorNotifier service.
 */

import { useEffect, useState } from "react";
import { Snackbar, Alert, AlertTitle, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { errorNotifier } from "../../services/errorNotifier";
import type { ErrorNotification } from "../../services/errorNotifier";

export function ErrorNotificationProvider() {
  const [notification, setNotification] = useState<ErrorNotification | null>(
    null
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Subscribe to error notifications
    const unsubscribe = errorNotifier.subscribe((notification) => {
      setNotification(notification);
      setOpen(true);
    });

    return unsubscribe;
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  if (!notification) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        severity={notification.severity || "error"}
        onClose={handleClose}
        sx={{ width: "100%", maxWidth: 500 }}
        action={
          <>
            {notification.action && (
              <IconButton
                size="small"
                color="inherit"
                onClick={() => {
                  notification.action?.onClick();
                  handleClose();
                }}
              >
                {notification.action.label}
              </IconButton>
            )}
            <IconButton size="small" color="inherit" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        }
      >
        {notification.context && (
          <AlertTitle>{notification.context}</AlertTitle>
        )}
        {notification.message}
      </Alert>
    </Snackbar>
  );
}
