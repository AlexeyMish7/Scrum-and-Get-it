import React from "react";
import { Box, Typography, Divider } from "@mui/material";
import DeleteAccount from "./DeleteAccount";
import { Breadcrumbs } from "@shared/components/navigation";

const Settings: React.FC = () => {
  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: { xs: 2, sm: 3, md: 4 } }}>
      <Breadcrumbs
        items={[{ label: "Profile", path: "/profile" }, { label: "Settings" }]}
      />
      <Typography variant="h2" gutterBottom>
        Settings
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* Delete Account Section */}
      <DeleteAccount />
    </Box>
  );
};

export default Settings;
