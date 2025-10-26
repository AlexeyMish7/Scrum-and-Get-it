import React from "react";
import { Box, Typography, Divider } from "@mui/material";
import DeleteAccount from "./DeleteAccount";

const Settings: React.FC = () => {
  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: { xs: 2, sm: 3, md: 4 } }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* Delete Account Section */}
      <DeleteAccount />
    </Box>
  );
};

export default Settings;