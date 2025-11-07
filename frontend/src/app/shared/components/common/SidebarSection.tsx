import { Box, Typography } from "@mui/material";

export default function SidebarSection({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}
