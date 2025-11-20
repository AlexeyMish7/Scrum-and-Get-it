/**
 * ConfirmNavigationDialog - Custom Navigation Confirmation
 *
 * Displays a custom dialog to confirm navigation when there are unsaved changes.
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

interface ConfirmNavigationDialogProps {
  /** Whether dialog is open */
  open: boolean;

  /** Close handler */
  onClose: () => void;

  /** Confirm handler */
  onConfirm: () => void;

  /** Dialog title */
  title?: string;

  /** Dialog message */
  message?: string;
}

/**
 * ConfirmNavigationDialog Component
 *
 * Custom confirmation dialog for navigation with unsaved changes.
 */
export default function ConfirmNavigationDialog({
  open,
  onClose,
  onConfirm,
  title = "Unsaved Changes",
  message = "You have unsaved changes. Are you sure you want to leave? Your progress may be lost.",
}: ConfirmNavigationDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-navigation-title"
      aria-describedby="confirm-navigation-description"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle
        id="confirm-navigation-title"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          pb: 1,
        }}
      >
        <WarningAmberIcon color="warning" />
        {title}
      </DialogTitle>

      <DialogContent>
        <Typography id="confirm-navigation-description" variant="body1">
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Stay on Page
        </Button>
        <Button onClick={onConfirm} variant="contained" color="warning" autoFocus>
          Leave Anyway
        </Button>
      </DialogActions>
    </Dialog>
  );
}
