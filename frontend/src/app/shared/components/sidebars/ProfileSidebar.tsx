import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { NavLink } from "react-router-dom";

export default function ProfileSidebar() {
  return (
    <Box
      component="nav"
      aria-label="Profile workspace navigation"
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
        Profile Workspace
      </Typography>
      <List disablePadding>
        <ListItemButton component={NavLink} to="/profile" end>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/profile/employment">
          <ListItemText primary="Employment" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/profile/education">
          <ListItemText primary="Education" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/profile/skills">
          <ListItemText primary="Skills" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/profile/projects">
          <ListItemText primary="Projects" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/profile/certifications">
          <ListItemText primary="Certifications" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/profile/details">
          <ListItemText primary="Profile Details" />
        </ListItemButton>
        <ListItemButton component={NavLink} to="/profile/settings">
          <ListItemText primary="Settings" />
        </ListItemButton>
      </List>
    </Box>
  );
}
