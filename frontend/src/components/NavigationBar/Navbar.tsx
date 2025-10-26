import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { NavLink, useNavigate } from "react-router-dom";

const NavBar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // --- Avatar dropdown handlers ---
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget); // Anchor to Avatar button clicked
  };
  const handleMenuClose = () => setAnchorEl(null);

  // --- Drawer toggle handlers (for mobile) ---
  const toggleDrawer = (open: boolean) => () => setDrawerOpen(open);

  // --- Main navigation links ---
  const navItems = [
    { label: "Dashboard", path: "/profile" },
    { label: "Education", path: "/educationOverview" },
    { label: "Skills", path: "/skillsOverview" },
    { label: "Employment", path: "/EmployementHistoryList" },
    { label: "Projects", path: "/AddProjectForm" },
    { label: "Certifications", path: "/Certifications" }
  ];

  return (
    <>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          {/* ---- Left: Logo / Brand ---- */}
          <Typography
            variant="h6"
            component={NavLink}
            to="/profile"
            sx={{
              textDecoration: "none",
              color: theme.palette.common.white,
              fontWeight: 600,
            }}
          >
            MyApp
          </Typography>

          {/* ---- Desktop Menu (regular nav items + avatar) ---- */}
          {!isMobile && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  component={NavLink}
                  to={item.path}
                  color="inherit"
                  sx={{
                    position: "relative",
                    textTransform: "none",
                    fontWeight: 500,
                    "&.active": {
                      fontWeight: 700,
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        bottom: -4,
                        left: 0,
                        height: 2,
                        width: "100%",
                        backgroundColor: theme.palette.secondary.main,
                      },
                    },
                    "&:hover::after": {
                      content: '""',
                      position: "absolute",
                      bottom: -4,
                      left: 0,
                      height: 2,
                      width: "100%",
                      backgroundColor: theme.palette.secondary.light,
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}

              {/* --- Profile Avatar Menu Trigger --- */}
              <IconButton
                onClick={handleMenuOpen}
                sx={{ p: 0, ml: 1 }}
                aria-controls={anchorEl ? "profile-menu" : undefined}
                aria-haspopup="true"
              >
                {/* 👇 Avatar = User Profile Picture */}
                <Avatar
                  alt="User Profile"
                  src="/static/images/avatar/1.jpg"
                />
              </IconButton>

              {/* --- Avatar Drop-Down Menu --- */}
              <Menu
                id="profile-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    navigate("/profile");
                  }}
                >
                  Profile
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    localStorage.removeItem("authToken"); // example logout
                    navigate("/login");
                  }}
                >
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          )}

          {/* ---- Mobile Menu (hamburger) ---- */}
          {isMobile && (
            <IconButton color="inherit" onClick={toggleDrawer(true)}>
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* ---- Drawer (for Mobile Responsive Navigation) ---- */}
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box
          sx={{
            width: 250,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "space-between",
          }}
        >
          {/* Drawer Links */}
          <Box>
            <List>
              {navItems.map((item) => (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton
                    component={NavLink}
                    to={item.path}
                    onClick={toggleDrawer(false)}
                    sx={{
                      "&.active": {
                        backgroundColor: theme.palette.action.selected,
                      },
                    }}
                  >
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Drawer Footer for Profile/Logout */}
          <Box>
            <List>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    toggleDrawer(false)();
                    navigate("/profile");
                  }}
                >
                  <ListItemText primary="Profile" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    toggleDrawer(false)();
                    localStorage.removeItem("authToken");
                    navigate("/login");
                  }}
                >
                  <ListItemText primary="Logout" />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default NavBar;