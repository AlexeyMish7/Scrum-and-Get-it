import { Box, Typography } from "@mui/material";
import RegionAnchor from "@shared/components/common/RegionAnchor";

export default function SavedSearchesPage() {
  return (
    <Box>
      <RegionAnchor
        id="[G]"
        desc="Saved search management and alert scheduling"
      />
      <Typography variant="h4" sx={{ mb: 1 }}>
        Saved Searches
      </Typography>
      <Typography color="text.secondary">
        TODO: Saved search definitions, run history, and alert scheduling
        (UC-039, UC-069).
      </Typography>
    </Box>
  );
}
