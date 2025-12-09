import {
  AppBar,
  Avatar,
  Box,
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
import { alpha, useTheme, type Theme, keyframes } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PaletteIcon from "@mui/icons-material/Palette";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import WorkIcon from "@mui/icons-material/Work";
import EventNoteIcon from "@mui/icons-material/EventNote";
import PeopleIcon from "@mui/icons-material/People";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@shared/context/AuthContext";
import { useThemeContext } from "@shared/context/ThemeContext";
import { useAvatarContext } from "@shared/context/AvatarContext";
import logo from "@shared/assets/logos/logo-icon.png";

// Lamp glow animation for active nav items
const glowPulse = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
`;

// Scale bounce animation when switching hubs
const scaleIn = keyframes`
  0% { transform: scale(0.92); opacity: 0.7; }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); opacity: 1; }
`;

// Lamp bar slide animation
const lampSlide = keyframes`
  0% { width: 0%; opacity: 0; }
  100% { width: 80%; opacity: 1; }
`;

type NavItem = {
  label: string;
  path: string;
  description?: string;
};

// Navigation items with icons and short labels
type NavItemConfig = {
  path: string;
  shortLabel: string;
  fullLabel: string;
  icon: React.ReactNode;
};

const NAV_ITEMS: NavItemConfig[] = [
  {
    path: "/ai",
    shortLabel: "Generate",
    fullLabel: "AI Generation Hub",
    icon: <AutoAwesomeIcon />,
  },
  {
    path: "/jobs",
    shortLabel: "Jobs",
    fullLabel: "Jobs Pipeline",
    icon: <WorkIcon />,
  },
  {
    path: "/interviews",
    shortLabel: "Interviews",
    fullLabel: "Interview Hub",
    icon: <EventNoteIcon />,
  },
  {
    path: "/network",
    shortLabel: "Network",
    fullLabel: "Network Hub",
    icon: <PeopleIcon />,
  },
  {
    path: "/team",
    shortLabel: "Team",
    fullLabel: "Team Management",
    icon: <GroupsIcon />,
  },
  {
    path: "/profile",
    shortLabel: "Profile",
    fullLabel: "Profile Hub",
    icon: <PersonIcon />,
  },
];

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

const NETWORK_TOOL_ITEMS: NavItem[] = [ //this used to be ToolItem, changed to NavItem due to error?
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

// Styled nav button with lamp glow effect and switch animation
interface NavButtonProps {
  item: NavItemConfig;
  isActive: boolean;
  theme: Theme;
}

function NavButton({ item, isActive, theme }: NavButtonProps) {
  return (
    <Tooltip title={item.fullLabel} arrow enterDelay={500}>
      <Box
        component={NavLink}
        to={item.path}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.5,
          px: 2,
          py: 1,
          borderRadius: 2,
          textDecoration: "none",
          position: "relative",
          overflow: "visible",
          minWidth: 72,
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          color: isActive
            ? theme.palette.primary.main
            : theme.palette.text.secondary,
          backgroundColor: isActive
            ? alpha(theme.palette.primary.main, 0.1)
            : "transparent",
          // Animation plays when becoming active
          animation: isActive ? `${scaleIn} 0.3s ease-out` : "none",
          "&:hover": {
            color: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            transform: "translateY(-2px)",
            "& .nav-icon svg": {
              transform: "scale(1.1)",
            },
          },
        }}
      >
        {/* Icon - bigger size with glow effect when active */}
        <Box
          className="nav-icon"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "& svg": {
              fontSize: 26,
              transition: "all 0.25s ease",
              filter: isActive
                ? `drop-shadow(0 0 8px ${alpha(
                    theme.palette.primary.main,
                    0.6
                  )})`
                : "none",
            },
          }}
        >
          {item.icon}
        </Box>

        {/* Label - bigger font */}
        <Typography
          sx={{
            fontSize: "0.8rem",
            fontWeight: isActive ? 600 : 500,
            letterSpacing: 0.3,
            lineHeight: 1.2,
            transition: "all 0.2s ease",
          }}
        >
          {item.shortLabel}
        </Typography>

        {/* Animated lamp indicator bar with glow */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            height: 3,
            borderRadius: 1.5,
            backgroundColor: theme.palette.primary.main,
            boxShadow: isActive
              ? `0 2px 12px 2px ${alpha(
                  theme.palette.primary.main,
                  0.5
                )}, 0 4px 20px 4px ${alpha(theme.palette.primary.main, 0.25)}`
              : "none",
            // Animated lamp bar
            width: isActive ? "80%" : "0%",
            opacity: isActive ? 1 : 0,
            animation: isActive
              ? `${lampSlide} 0.35s ease-out forwards`
              : "none",
          }}
        />

        {/* Glow backdrop effect when active */}
        {isActive && (
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "100%",
              height: "70%",
              background: `radial-gradient(ellipse at bottom, ${alpha(
                theme.palette.primary.main,
                0.15
              )} 0%, transparent 65%)`,
              pointerEvents: "none",
              animation: `${glowPulse} 2.5s ease-in-out infinite`,
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
}

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

  // Open Getting Started modal
  const handleOpenGettingStarted = () => {
    window.dispatchEvent(new Event("open-getting-started"));
  };

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
      <Toolbar sx={{ px: { xs: 2, md: 3 }, py: 1.5, gap: 2 }}>
        {/* Logo and brand - cohesive styling */}
        <Box
          component={NavLink}
          to="/profile"
          sx={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            color: "inherit",
            gap: 1.5,
            px: 1,
            py: 0.5,
            borderRadius: 2,
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: alpha(theme.palette.text.primary, 0.04),
            },
          }}
        >
          <Box
            component="img"
            src={logo}
            alt="Flow ATS logo"
            sx={{
              height: 44,
              width: "auto",
              transition: "filter 0.3s ease",
              filter: highlightAi
                ? `drop-shadow(0 0 10px ${alpha(
                    theme.palette.primary.main,
                    0.5
                  )})`
                : "drop-shadow(0 2px 8px rgba(0,0,0,0.15))",
            }}
          />
          <Box>
            <Typography
              sx={{
                fontSize: "0.65rem",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: theme.palette.text.secondary,
                lineHeight: 1,
              }}
            >
              Flow ATS
            </Typography>
            <Typography
              sx={{
                fontSize: "1.1rem",
                fontWeight: 700,
                lineHeight: 1.3,
                color: theme.palette.text.primary,
              }}
            >
              {pageTitle}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {!isMobile ? (
          <Stack direction="row" spacing={0.5} alignItems="center">
            {/* Main navigation items with icons and lamp effect */}
            {NAV_ITEMS.slice(0, 5).map((item) => {
              const isActive =
                item.path === "/interviews"
                  ? location.pathname.startsWith("/interviews")
                  : item.path === "/team"
                  ? currentWorkspace === "TEAM"
                  : item.path === "/ai"
                  ? highlightAi
                  : item.path === "/jobs"
                  ? highlightJobs
                  : item.path === "/network"
                  ? highlightNetwork
                  : false;

              return (
                <NavButton
                  key={item.path}
                  item={item}
                  isActive={isActive}
                  theme={theme}
                />
              );
            })}

            <Divider
              orientation="vertical"
              flexItem
              sx={{ mx: 1, opacity: 0.15, height: 40, alignSelf: "center" }}
            />

            {/* Profile nav item */}
            <NavButton
              item={NAV_ITEMS[5]}
              isActive={highlightProfile}
              theme={theme}
            />

            <Divider
              orientation="vertical"
              flexItem
              sx={{ mx: 1, opacity: 0.15, height: 40, alignSelf: "center" }}
            />

            {/* Theme toggle - matching nav style */}
            <Tooltip title={themeToggleLabel} arrow>
              <Box
                component="button"
                onClick={toggleMode}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1.5,
                  py: 1,
                  border: "none",
                  borderRadius: 2,
                  cursor: "pointer",
                  minWidth: 56,
                  backgroundColor: alpha(theme.palette.text.primary, 0.04),
                  color: theme.palette.text.secondary,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.text.primary, 0.08),
                    color: theme.palette.text.primary,
                    transform: "translateY(-2px)",
                  },
                  "& svg": {
                    fontSize: 24,
                    transition: "transform 0.2s ease",
                  },
                  "&:hover svg": {
                    transform: "rotate(15deg)",
                  },
                }}
              >
                {themeToggleIcon}
                <Typography
                  sx={{ fontSize: "0.7rem", fontWeight: 500, lineHeight: 1 }}
                >
                  {mode === "dark" ? "Light" : "Dark"}
                </Typography>
              </Box>
            </Tooltip>

            {/* Avatar - matching style */}
            <Tooltip title="Account menu" arrow>
              <IconButton
                onClick={(event) => setProfileAnchor(event.currentTarget)}
                sx={{
                  p: 0.5,
                  ml: 0.5,
                  borderRadius: 2,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.text.primary, 0.06),
                    transform: "translateY(-2px)",
                  },
                }}
                aria-haspopup="true"
                aria-controls={profileAnchor ? "profile-menu" : undefined}
              >
                <Avatar
                  src={avatarUrl ?? undefined}
                  alt="User avatar"
                  sx={{
                    width: 36,
                    height: 36,
                    border: `2px solid ${alpha(
                      theme.palette.primary.main,
                      0.2
                    )}`,
                    transition: "border-color 0.2s ease",
                    "&:hover": {
                      borderColor: alpha(theme.palette.primary.main, 0.5),
                    },
                  }}
                >
                  {!avatarUrl && (user?.email?.charAt(0)?.toUpperCase() ?? "U")}
                </Avatar>
              </IconButton>
            </Tooltip>
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
              <MenuItem onClick={handleOpenGettingStarted} sx={{ gap: theme.spacing(1) }}>
                <HelpOutlineIcon fontSize="small" />
                Help & Getting Started
              </MenuItem>
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