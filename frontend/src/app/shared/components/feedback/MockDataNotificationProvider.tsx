/**
 * useMockDataNotification Hook
 *
 * Subscribes to mock data notifications and displays a snackbar warning
 * when the AI service is unavailable and mock data is being used.
 */

import { useEffect, useState } from "react";
import { Snackbar, Alert } from "@mui/material";
import { mockDataNotifier } from "@shared/services/mockDataNotifier";

export function MockDataNotificationProvider() {
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = mockDataNotifier.subscribe((msg) => {
      setMessage(msg);
      setOpen(true);
    });

    return unsubscribe;
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={8000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      sx={{ mt: 8 }}
    >
      <Alert
        onClose={handleClose}
        severity="warning"
        variant="filled"
        sx={{
          width: "100%",
          fontSize: "0.95rem",
          boxShadow: 3,
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
