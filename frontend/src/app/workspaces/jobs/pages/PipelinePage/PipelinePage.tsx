import { Box, Button, Stack, Typography } from "@mui/material";
import { useState } from "react";
import RightDrawer from "@shared/components/common/RightDrawer";

export default function PipelinePage() {
  const [open, setOpen] = useState(false);
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Jobs Pipeline
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        TODO: Kanban board will be implemented here in a future sprint.
      </Typography>
      <Stack direction="row" spacing={2}>
        <Button variant="outlined" onClick={() => setOpen(true)}>
          Open Right Drawer (demo)
        </Button>
      </Stack>
      <RightDrawer title="Details" open={open} onClose={() => setOpen(false)}>
        <Typography>
          Stub content. Use this drawer for details/editors.
        </Typography>
      </RightDrawer>
    </Box>
  );
}
