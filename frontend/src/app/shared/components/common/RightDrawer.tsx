import { Drawer, Box, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useRef, useEffect } from "react";
import type { ReactNode } from "react";

interface RightDrawerProps {
  title?: string;
  open: boolean;
  onClose: () => void;
  children?: ReactNode;
}

/**
 * Simple reusable right-side drawer with title and body slots.
 * Focus is trapped by MUI's Modal; focus is restored to the previously focused element on close.
 */
export default function RightDrawer({
  title,
  open,
  onClose,
  children,
}: RightDrawerProps) {
  const prevFocusedRef = useRef<Element | null>(null);

  useEffect(() => {
    if (open) {
      prevFocusedRef.current = document.activeElement;
    }
  }, [open]);

  useEffect(() => {
    if (!open && prevFocusedRef.current instanceof HTMLElement) {
      // Restore focus to the element that triggered the drawer, when possible
      prevFocusedRef.current.focus();
    }
  }, [open]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
    >
      <Box
        role="dialog"
        aria-label={title || "Panel"}
        sx={{
          width: { xs: "100vw", sm: 420 },
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {title}
          </Typography>
          <IconButton aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ p: 2, overflow: "auto", flex: 1 }}>{children}</Box>
      </Box>
    </Drawer>
  );
}
