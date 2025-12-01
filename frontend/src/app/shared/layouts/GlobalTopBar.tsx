import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme, type Theme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PaletteIcon from "@mui/icons-material/Palette";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@shared/context/AuthContext";
import { useThemeContext } from "@shared/context/ThemeContext";
import { useAvatarContext } from "@shared/context/AvatarContext";
import logo from "@shared/assets/logos/logo-icon.png";

type NavItem = {
  label: string;
  path: string;
  description?: string;
};

const WORKSPACE_ITEMS: NavItem[] = [
  {
    label: "Profile Workspace",
    path: "/profile",
    description: "Manage profile, skills, projects, certifications",
  },
  {
    label: "Jobs Workspace",
    path: "/jobs",
    description: "Track jobs, documents, searches, analytics",
  },
  {
    label: "AI Workspace",
    path: "/ai",
    description: "Generate resumes, cover letters, manage templates & themes",
  },
  {
    label: "Interview Hub",
    path: "/interviews",
    description: "Schedule interviews, prep tasks, Google Calendar integration",
  },
  {
    label: "Network Hub",
    path: "/network",
    description: "Manage professional contacts and interactions",
  },
  {
    label: "Team Management",
    path: "/team",
    description: "Collaborate with mentors and candidates, manage team members",
  },
];

const PROFILE_TOOL_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/profile" },
  { label: "Education", path: "/profile/education" },
  { label: "Employment", path: "/profile/employment" },
  { label: "Projects", path: "/profile/projects" },
  { label: "Skills", path: "/profile/skills" },
  { label: "Certifications", path: "/profile/certifications" },
];

const JOBS_TOOL_ITEMS: NavItem[] = [
  { label: "Pipeline", path: "/jobs/pipeline" },
  { label: "New Job", path: "/jobs/new" },
  { label: "Documents", path: "/jobs/documents" },
  { label: "Saved Searches", path: "/jobs/saved-searches" },
  { label: "Analytics", path: "/jobs/analytics" },
];

const AI_TOOL_ITEMS: NavItem[] = [
  { label: "AI Hub", path: "/ai" },
  { label: "Generate Resume", path: "/ai/generate/resume" },
  { label: "Generate Cover Letter", path: "/ai/generate/cover-letter" },
  { label: "Document Library", path: "/ai/library" },
  { label: "Templates", path: "/ai/templates" },
];

const NETWORK_TOOL_ITEMS: ToolItem[] = [
  { label: "Network Hub", path: "/network" },
  { label: "Contacts", path: "/network" },
  { label: "Peer Groups", path: "/network/peer-groups" },
  { label: "Family Support", path: "/network/family-support" },
];

const TEAM_TOOL_ITEMS: NavItem[] = [
  { label: "Team Dashboard", path: "/team" },
  { label: "Mentor Dashboard", path: "/team/mentor" },
  { label: "External Advisors", path: "/team/advisors" },
  { label: "Enterprise", path: "/team/enterprise" },
  { label: "Team Settings", path: "/team/settings" },
  { label: "Team Reports", path: "/team/reports" },
  { label: "Invitations", path: "/team/invitations" },
];

const MENU_ITEMS: NavItem[] = [
  { label: "Profile", path: "/profile/details" },
  { label: "Settings", path: "/profile/settings" },
];

const getNavVariantStyles = (theme: Theme, highlight: boolean) => ({
  color: highlight
    ? theme.palette.primary.contrastText
    : theme.palette.text.primary,
  backgroundColor: highlight
    ? alpha(theme.palette.primary.main, 0.28)
    : alpha(theme.palette.text.primary, 0.04),
  "&:hover": {
    color: theme.palette.primary.contrastText,
    backgroundColor: alpha(theme.palette.primary.main, 0.36),
  },
});

export default function GlobalTopBar() {
  const theme = useTheme();
  const { mode, toggleMode } = useThemeContext();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Custom app bar configuration from theme (if available)
  const appBarCfg = (
    theme as Theme & { designTokens?: { palette?: { appBar?: unknown } } }
  ).designTokens?.palette.appBar as
    | {
        bg?: string;
        glassOpacity?: number;
        blur?: number;
        color?: string;
        border?: string;
      }
    | undefined;
  const appBarBgBase = appBarCfg?.bg ?? theme.palette.background.default;
  const appBarOpacity = appBarCfg?.glassOpacity ?? 0.85;
  const appBarBlur = appBarCfg?.blur ?? 16;
  const appBarColor = appBarCfg?.color ?? theme.palette.text.primary;
  const appBarBorder = appBarCfg?.border ?? theme.palette.divider;

  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);

  const { avatarUrl } = useAvatarContext();

  const currentWorkspace = useMemo(() => {
    if (location.pathname.startsWith("/ai")) return "AI";
    if (location.pathname.startsWith("/jobs")) return "JOBS";
    if (location.pathname.startsWith("/network")) return "NETWORK";
    if (location.pathname.startsWith("/team")) return "TEAM";
    return "PROFILE";
  }, [location.pathname]);

  // Get the page title based on current route
  const pageTitle = useMemo(() => {
    if (location.pathname === "/ai") return "Generation Hub";
    if (location.pathname === "/ai/library") return "Document Library";
    if (location.pathname === "/ai/templates") return "Templates";
    if (location.pathname === "/ai/research") return "Company Research";
    if (location.pathname === "/ai/generate/resume") return "Generate Resume";
    if (location.pathname === "/ai/generate/cover-letter")
      return "Generate Cover Letter";
    if (location.pathname.startsWith("/ai/document/")) return "Document Editor";
    if (location.pathname.startsWith("/ai")) return "AI Workspace";
    if (location.pathname.startsWith("/jobs")) return "Job Search Hub";
    if (location.pathname === "/network") return "Network Hub";
    if (location.pathname.startsWith("/network")) return "Network Hub";
    if (location.pathname === "/team") return "Team Dashboard";
    if (location.pathname === "/team/mentor") return "Mentor Dashboard";
    if (location.pathname === "/team/enterprise") return "Enterprise Dashboard";
    if (location.pathname === "/team/settings") return "Team Settings";
    if (location.pathname === "/team/invitations") return "Invitations";
    if (location.pathname.startsWith("/team")) return "Team Management";
    return "Profile";
  }, [location.pathname]);

  const toolItems = useMemo(() => {
    switch (currentWorkspace) {
      case "AI":
        return AI_TOOL_ITEMS;
      case "JOBS":
        return JOBS_TOOL_ITEMS;
      case "NETWORK":
        return NETWORK_TOOL_ITEMS;
      case "TEAM":
        return TEAM_TOOL_ITEMS;
      default:
        return PROFILE_TOOL_ITEMS;
    }
  }, [currentWorkspace]);

  const handleDrawerToggle = useCallback(
    (open: boolean) => () => {
      setDrawerOpen(open);
    },
    []
  );

  const handleLogout = useCallback(async () => {
    await signOut();
    navigate("/", { replace: true });
  }, [navigate, signOut]);

  const themeToggleIcon =
    mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />;
  const themeToggleLabel =
    mode === "dark" ? "Switch to light mode" : "Switch to dark mode";

  const highlightAi = currentWorkspace === "AI";
  const highlightJobs = currentWorkspace === "JOBS";
  const highlightProfile = currentWorkspace === "PROFILE";
  const highlightNetwork = currentWorkspace === "NETWORK";

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{
        backdropFilter: `blur(${appBarBlur}px)`,
        WebkitBackdropFilter: `blur(${appBarBlur}px)`,
        backgroundColor: alpha(
          appBarBgBase,
          Math.min(1, appBarOpacity + (scrolled ? 0.05 : 0))
        ),
        borderBottom: `1px solid ${alpha(appBarBorder, 0.6)}`,
        color: appBarColor,
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 3 }, py: { xs: 1, md: 1.25 }, gap: 2 }}>
        <Box
          component={NavLink}
          to="/profile"
          sx={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            color: "inherit",
            gap: 1.5,
          }}
        >
          <Box
            component="img"
            src={logo}
            alt="Flow ATS logo"
            sx={{
              height: 52,
              width: "auto",
              filter: highlightAi
                ? "drop-shadow(0 0 12px rgba(63,123,255,0.45))"
                : "drop-shadow(0 4px 12px rgba(15,23,42,0.2))",
            }}
          />
          <Box>
            <Typography
              variant="overline"
              sx={{ letterSpacing: "0.18em", fontSize: 12 }}
            >
              Flow ATS
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {pageTitle}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {!isMobile ? (
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Button
              color="inherit"
              component={NavLink}
              to="/ai"
              size="large"
              sx={{
                ...getNavVariantStyles(theme, highlightAi),
                fontSize: theme.typography.body1.fontSize,
                px: theme.spacing(2),
                py: theme.spacing(1),
                borderRadius: theme.shape.borderRadius,
              }}
            >
              Generation Hub
            </Button>

            <Button
              color="inherit"
              component={NavLink}
              to="/jobs"
              size="large"
              sx={{
                ...getNavVariantStyles(theme, highlightJobs),
                fontSize: theme.typography.body1.fontSize,
                px: theme.spacing(2),
                py: theme.spacing(1),
                borderRadius: theme.shape.borderRadius,
              }}
            >
              Jobs Pipeline
            </Button>

            <Button
              color="inherit"
              component={NavLink}
              to="/interviews"
              size="large"
              sx={{
                fontSize: theme.typography.body1.fontSize,
                px: theme.spacing(2),
                py: theme.spacing(1),
                borderRadius: theme.shape.borderRadius,
                backgroundColor: alpha(theme.palette.text.primary, 0.04),
                "&:hover": {
                  backgroundColor: alpha(theme.palette.text.primary, 0.12),
                },
              }}
            >
              Interviews
            </Button>

            <Button
              color="inherit"
              component={NavLink}
              to="/network"
              size="large"
              sx={{
                ...getNavVariantStyles(theme, highlightNetwork),
                fontSize: theme.typography.body1.fontSize,
                px: theme.spacing(2),
                py: theme.spacing(1),
                borderRadius: theme.shape.borderRadius,
              }}
            >
              Network Hub
            </Button>

            <Button
              color="inherit"
              component={NavLink}
              to="/team"
              size="large"
              sx={{
                ...getNavVariantStyles(theme, currentWorkspace === "TEAM"),
                fontSize: theme.typography.body1.fontSize,
                px: theme.spacing(2),
                py: theme.spacing(1),
                borderRadius: theme.shape.borderRadius,
              }}
            >
              Team
            </Button>

            <Box sx={{ flexGrow: 1 }} />

            <Button
              color="inherit"
              component={NavLink}
              to="/profile"
              size="large"
              sx={{
                ...getNavVariantStyles(theme, highlightProfile),
                fontSize: theme.typography.body1.fontSize,
                px: theme.spacing(2),
                py: theme.spacing(1),
                borderRadius: theme.shape.borderRadius,
              }}
            >
              Profile Hub
            </Button>

            <Tooltip title={themeToggleLabel}>
              <IconButton
                color="inherit"
                onClick={toggleMode}
                sx={{
                  borderRadius: theme.shape.borderRadius,
                  backgroundColor: alpha(theme.palette.text.primary, 0.08),
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.text.primary, 0.16),
                  },
                }}
                size="large"
              >
                {themeToggleIcon}
              </IconButton>
            </Tooltip>

            <IconButton
              onClick={(event) => setProfileAnchor(event.currentTarget)}
              sx={{ p: 0, ml: theme.spacing(0.5) }}
              aria-haspopup="true"
              aria-controls={profileAnchor ? "profile-menu" : undefined}
            >
              <Avatar src={avatarUrl ?? undefined} alt="User avatar">
                {!avatarUrl && (user?.email?.charAt(0)?.toUpperCase() ?? "U")}
              </Avatar>
            </IconButton>
            <Menu
              id="profile-menu"
              anchorEl={profileAnchor}
              open={Boolean(profileAnchor)}
              onClose={() => setProfileAnchor(null)}
              slotProps={{
                paper: {
                  sx: { minWidth: 220 },
                },
              }}
            >
              {MENU_ITEMS.map((item) => (
                <MenuItem
                  key={item.path}
                  component={NavLink}
                  to={item.path}
                  onClick={() => setProfileAnchor(null)}
                  sx={{ gap: theme.spacing(1) }}
                >
                  {item.path === "/profile/settings" ? (
                    <SettingsIcon fontSize="small" />
                  ) : (
                    <AccountCircleIcon fontSize="small" />
                  )}
                  {item.label}
                </MenuItem>
              ))}

              <Divider sx={{ my: theme.spacing(0.5) }} />

              {/* Theme Section */}
              <Box sx={{ px: 2, py: 1 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 1 }}
                >
                  <PaletteIcon fontSize="small" color="action" />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={500}
                  >
                    Appearance
                  </Typography>
                </Stack>
                <ToggleButtonGroup
                  value={mode}
                  exclusive
                  onChange={() => {
                    toggleMode();
                    setProfileAnchor(null);
                  }}
                  size="small"
                  fullWidth
                >
                  <ToggleButton value="light" sx={{ gap: 0.5, py: 0.5 }}>
                    <LightModeIcon fontSize="small" />
                    Light
                  </ToggleButton>
                  <ToggleButton value="dark" sx={{ gap: 0.5, py: 0.5 }}>
                    <DarkModeIcon fontSize="small" />
                    Dark
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Divider sx={{ my: theme.spacing(0.5) }} />
              <MenuItem onClick={handleLogout} sx={{ gap: theme.spacing(1) }}>
                <LogoutIcon fontSize="small" />
                Logout
              </MenuItem>
            </Menu>
          </Stack>
        ) : (
          <IconButton
            color="inherit"
            onClick={handleDrawerToggle(true)}
            size="large"
            sx={{ borderRadius: theme.shape.borderRadius }}
          >
            <MenuIcon />
          </IconButton>
        )}
      </Toolbar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerToggle(false)}
      >
        <Box
          sx={{
            width: { xs: "100vw", sm: theme.spacing(45) },
            display: "flex",
            flexDirection: "column",
            height: "100%",
            backgroundColor: alpha(theme.palette.background.default, 0.96),
          }}
        >
          <Box sx={{ px: theme.spacing(3), py: theme.spacing(2.5) }}>
            <Stack
              direction="row"
              spacing={theme.spacing(2)}
              alignItems="center"
            >
              <Avatar
                src={avatarUrl ?? undefined}
                alt="User avatar"
                sx={{ width: theme.spacing(6), height: theme.spacing(6) }}
              >
                {!avatarUrl && (user?.email?.charAt(0)?.toUpperCase() ?? "U")}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {user?.email ?? "Signed in"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {highlightAi ? "AI Workspace" : "Profile Workspace"}
                </Typography>
              </Box>
            </Stack>
          </Box>
          <Divider />
          <List>
            <ListSubheader>Workspaces</ListSubheader>
            {WORKSPACE_ITEMS.map((item) => (
              <ListItemButton
                key={item.path}
                component={NavLink}
                to={item.path}
                onClick={handleDrawerToggle(false)}
              >
                <ListItemText
                  primary={item.label}
                  secondary={item.description}
                />
              </ListItemButton>
            ))}
          </List>
          <Divider />
          <List>
            <ListSubheader>Tools</ListSubheader>
            {toolItems.map((item) => (
              <ListItemButton
                key={item.path}
                component={NavLink}
                to={item.path}
                onClick={handleDrawerToggle(false)}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
