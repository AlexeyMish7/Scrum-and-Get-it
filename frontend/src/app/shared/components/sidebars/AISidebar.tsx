import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { NavLink } from "react-router-dom";

export default function AISidebar() {
  return (
    <Box
      component="nav"
      aria-label="AI workspace navigation"
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
        AI Workspace
      </Typography>
      <List disablePadding>
        <ListItemButton component={NavLink} to="/ai">
          <ListItemText primary="Dashboard" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/ai/job-match">
          <ListItemText primary="Job Match" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/ai/company-research">
          <ListItemText primary="Company Research" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/ai/resume">
          <ListItemText primary="Resume Studio" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/ai/cover-letter">
          <ListItemText primary="Cover Letters" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/ai/templates">
          <ListItemText primary="Templates" />
        </ListItemButton>
      </List>
    </Box>
  );
}
