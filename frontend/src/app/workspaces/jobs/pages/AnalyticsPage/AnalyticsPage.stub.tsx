/**
 * TEMPORARY STUB for AnalyticsPage
 *
 * TODO: The original AnalyticsDashboard.tsx uses deprecated MUI Grid API (v4 syntax with `item` prop).
 * MUI v7 requires migrating to Grid2 or using flexbox/Box layouts.
 * This stub allows the build to pass while we refactor the layout.
 *
 * See: AnalyticsDashboard.tsx for original implementation
 * Ref: https://mui.com/material-ui/migration/migration-grid-v2/
 */
import { Box, Typography, Paper } from "@mui/material";

export default function AnalyticsPageStub() {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h4" gutterBottom>
          Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Analytics dashboard is being migrated to MUI v7 Grid2 API.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
          Original implementation: AnalyticsDashboard.tsx
        </Typography>
      </Paper>
    </Box>
  );
}
