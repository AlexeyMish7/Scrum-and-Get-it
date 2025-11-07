import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { NavLink } from "react-router-dom";

export default function JobsSidebar() {
  return (
    <Box
      component="nav"
      aria-label="Jobs workspace navigation"
      sx={{
        p: 2,
        borderRight: "1px solid",
        borderColor: "divider",
        height: "100%",
        boxSizing: "border-box",
        overflow: "auto",
      }}
    >
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Jobs Workspace
      </Typography>
      <List disablePadding>
        <ListItemButton component={NavLink} to="/jobs/pipeline">
          <ListItemText primary="Pipeline" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/jobs/new">
          <ListItemText primary="New Job" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/jobs/documents">
          <ListItemText primary="Documents" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/jobs/saved-searches">
          <ListItemText primary="Saved Searches" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/jobs/analytics">
          <ListItemText primary="Analytics" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/jobs/automations">
          <ListItemText primary="Automations" />
        </ListItemButton>
      </List>
    </Box>
  );
}
