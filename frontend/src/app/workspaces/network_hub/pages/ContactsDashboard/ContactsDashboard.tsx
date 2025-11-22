import { Box, Typography } from "@mui/material";
import ContactsList from "@workspaces/network_hub/components/ContactsList/ContactsList";
import { Breadcrumbs } from "@shared/components/navigation";

export default function ContactsDashboard() {
  return (
    <Box sx={{ width: "100%", p: 3 }}>
      <Box sx={{ p: 3, pb: 0 }}>
        <Breadcrumbs items={[{ label: "Network" }, { label: "Contacts" }]} />
      </Box>

      <Box sx={{ maxWidth: 1200, mx: "auto", mt: 2 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Network Hub
        </Typography>

        <ContactsList />
      </Box>
    </Box>
  );
}
