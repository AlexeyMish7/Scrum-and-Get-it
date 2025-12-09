import React from "react";
import { Box, Typography, Divider, Paper } from "@mui/material";
import PaletteIcon from "@mui/icons-material/Palette";
import DeleteAccount from "./DeleteAccount";
import { ThemeSettingsPanel } from "@shared/components/theme";
import { AutoBreadcrumbs } from "@shared/components/navigation/AutoBreadcrumbs";

const Settings: React.FC = () => {
  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: { xs: 2, sm: 3, md: 4 }, pt: 2 }}>
      <AutoBreadcrumbs />
      <Typography variant="h2" gutterBottom>
        Settings
      </Typography>

      {/* Appearance Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <PaletteIcon color="primary" />
          <Typography variant="h5" component="h2">
            Appearance
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Customize the look and feel of your application
        </Typography>
        <ThemeSettingsPanel />
      </Paper>

      <Divider sx={{ my: 3 }} />

      {/* Delete Account Section */}
      <DeleteAccount />
    </Box>
  );
};

export default Settings;
