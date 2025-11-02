import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  open,
  title = "Confirm",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onClose,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="confirm-dialog">
      <DialogTitle id="confirm-dialog">{title}</DialogTitle>
      <DialogContent>
        {description && <DialogContentText>{description}</DialogContentText>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{cancelText}</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
