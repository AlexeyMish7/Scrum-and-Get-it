import { Box, Chip, Typography } from "@mui/material";

export default function RegionAnchor({
  id,
  desc,
}: {
  id: string;
  desc?: string;
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Chip label={id} size="small" sx={{ mr: 1 }} />
      {desc && (
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          {desc}
        </Typography>
      )}
    </Box>
  );
}
