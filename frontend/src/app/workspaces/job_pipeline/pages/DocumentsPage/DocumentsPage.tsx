/**
 * DocumentsPage — Wrapper for job materials browser
 *
 * This page now uses the reusable DocumentsDrawer component.
 * Kept as a separate route for backward compatibility, but the actual
 * logic is in DocumentsDrawer which can be used in modals elsewhere.
 */

import { useState } from "react";
import { Box } from "@mui/material";
import DocumentsDrawer from "../../components/DocumentsDrawer";

export default function DocumentsPage2() {
  const [open, setOpen] = useState(true);

  return (
    <Box>
      <DocumentsDrawer open={open} onClose={() => setOpen(false)} />
    </Box>
  );
}
