import { Box, Stack } from "@mui/material";
import TopNav from "@shared/components/TopNav/TopNav";
import QuickActionButton from "@shared/components/common/QuickActionButton";
import { Add as AddIcon } from "@mui/icons-material";

export default function GlobalTopBar() {
  const quickActions = (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      role="toolbar"
      aria-label="Quick actions"
    >
      <QuickActionButton
        label="New Job"
        to="/jobs/new"
        startIcon={<AddIcon />}
        size="small"
      />
      <QuickActionButton label="Resume" to="/ai/resume" size="small" />
      <QuickActionButton
        label="Cover Letter"
        to="/ai/cover-letter"
        size="small"
      />
    </Stack>
  );

  return (
    <Box sx={{ width: "100%", boxShadow: 1 }}>
      {/* Render TopNav and inject quick actions */}
      <TopNav quickActions={quickActions} />
    </Box>
  );
}
