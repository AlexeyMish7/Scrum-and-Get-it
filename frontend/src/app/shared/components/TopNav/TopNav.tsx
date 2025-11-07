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
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme, type Theme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import WorkspacesIcon from "@mui/icons-material/DashboardCustomize";
// BuildIcon (Tools) removed — quick actions live in GlobalTopBar
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@shared/context/AuthContext";
import { useThemeContext } from "@shared/context/ThemeContext";
import { getUserProfile } from "@shared/services/crud";
import type { ProfileRow } from "@shared/services/types";
import { supabase } from "@shared/services/supabaseClient";
import logo from "@/app/assets/logo/graphics_only.png";

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
    description: "Research companies, match jobs, generate resumes",
  },
];

const PROFILE_TOOL_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/profile" },
  { label: "Education", path: "/education" },
  { label: "Employment", path: "/employment-history" },
  { label: "Projects", path: "/portfolio" },
  { label: "Skills", path: "/skillsOverview" },
  { label: "Certifications", path: "/certifications" },
  { label: "Cover Letters", path: "/cover-letters" },
];

const JOBS_TOOL_ITEMS: NavItem[] = [
  { label: "Pipeline", path: "/jobs/pipeline" },
  { label: "New Job", path: "/jobs/new" },
  { label: "Documents & Versions", path: "/jobs/documents" },
  { label: "Saved Searches", path: "/jobs/saved-searches" },
  { label: "Analytics", path: "/jobs/analytics" },
];

const AI_TOOL_ITEMS: NavItem[] = [
  { label: "AI Home", path: "/ai" },
  { label: "Resume Editor", path: "/ai/resume" },
  { label: "Cover Letter Editor", path: "/ai/cover-letter" },
];

const MENU_ITEMS: NavItem[] = [
  { label: "Profile", path: "/profile-details" },
  { label: "Settings", path: "/settings" },
];

type AvatarCacheEntry = {
  url: string;
  expiresAt: number;
};

const AVATAR_CACHE_PREFIX = "avatar:";
const AVATAR_TTL_SECONDS = 60 * 60; // 1 hour

const getCacheKey = (bucket: string, path: string) =>
  `${AVATAR_CACHE_PREFIX}${bucket}:${path}`;

const readCachedAvatar = (bucket: string, path: string) => {
  try {
    const raw = window.localStorage.getItem(getCacheKey(bucket, path));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AvatarCacheEntry;
    if (Date.now() < parsed.expiresAt - 10_000) {
      return parsed.url;
    }
    window.localStorage.removeItem(getCacheKey(bucket, path));
  } catch {
    /* ignore */
  }
  return null;
};

const writeCachedAvatar = (bucket: string, path: string, url: string) => {
  try {
    const entry: AvatarCacheEntry = {
      url,
      expiresAt: Date.now() + AVATAR_TTL_SECONDS * 1000,
    };
    window.localStorage.setItem(
      getCacheKey(bucket, path),
      JSON.stringify(entry)
    );
  } catch {
    /* ignore */
  }
};

const useAvatar = (userId: string | undefined) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setAvatarUrl(null);
      return;
    }

    let active = true;

    const load = async () => {
      const res = await getUserProfile<ProfileRow>(userId);
      if (res.error) return;
      const meta =
        (res.data?.meta as
          | { avatar_path?: string | null; avatar_bucket?: string | null }
          | undefined) ?? {};
      const avatarPath = meta?.avatar_path ?? null;
      const avatarBucket = meta?.avatar_bucket ?? "avatars";
      if (!avatarPath) {
        if (active) setAvatarUrl(null);
        return;
      }

      const cached = readCachedAvatar(avatarBucket, avatarPath);
      if (cached) {
        if (active) setAvatarUrl(cached);
      } else {
        const { data, error } = await supabase.storage
          .from(avatarBucket)
          .createSignedUrl(avatarPath, AVATAR_TTL_SECONDS);
        if (!error && data?.signedUrl && active) {
          setAvatarUrl(data.signedUrl);
          writeCachedAvatar(avatarBucket, avatarPath, data.signedUrl);
        }
      }
    };

    load();

    const channel = supabase
      .channel("public:profiles")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        () => load()
      )
      .subscribe();

    return () => {
      active = false;
      channel.unsubscribe();
    };
  }, [userId]);

  return avatarUrl;
};

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

const TopNav = ({ quickActions }: { quickActions?: React.ReactNode }) => {
  const theme = useTheme();
  const { mode, toggleMode } = useThemeContext();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const appBarCfg = theme.designTokens?.palette.appBar;
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
  const [workspaceAnchor, setWorkspaceAnchor] = useState<HTMLElement | null>(
    null
  );
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);

  const avatarUrl = useAvatar(user?.id);

  const currentWorkspace = useMemo(() => {
    if (location.pathname.startsWith("/ai")) return "AI";
    if (location.pathname.startsWith("/jobs")) return "JOBS";
    return "PROFILE";
  }, [location.pathname]);

  const toolItems = useMemo(() => {
    switch (currentWorkspace) {
      case "AI":
        return AI_TOOL_ITEMS;
      case "JOBS":
        return JOBS_TOOL_ITEMS;
      default:
        return PROFILE_TOOL_ITEMS;
    }
  }, [currentWorkspace]);

  // tools menu removed from topnav; toolItems still used in mobile drawer

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

  const renderMenuItems = (items: NavItem[], close: () => void) => (
    <>
      {items.map((item) => (
        <MenuItem
          key={item.path}
          component={NavLink}
          to={item.path}
          onClick={close}
          sx={{
            borderRadius: 1,
            typography: "body2",
            color: location.pathname.startsWith(item.path)
              ? theme.palette.primary.main
              : undefined,
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
            },
          }}
        >
          <Box>
            <Typography fontWeight={600}>{item.label}</Typography>
            {item.description && (
              <Typography variant="caption" color="text.secondary">
                {item.description}
              </Typography>
            )}
          </Box>
        </MenuItem>
      ))}
    </>
  );

  const highlightAi = currentWorkspace === "AI";

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
              {highlightAi ? "AI Workspace" : "Job Search Hub"}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {!isMobile ? (
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Button
              color="inherit"
              startIcon={<WorkspacesIcon />}
              onClick={(event) => setWorkspaceAnchor(event.currentTarget)}
              size="large"
              sx={{
                ...getNavVariantStyles(theme, highlightAi),
                "& .MuiSvgIcon-root": { fontSize: 24 },
                fontSize: 16,
                px: 2,
                py: 1,
                borderRadius: 2,
              }}
            >
              Workspaces
            </Button>
            <Menu
              anchorEl={workspaceAnchor}
              open={Boolean(workspaceAnchor)}
              onClose={() => setWorkspaceAnchor(null)}
              MenuListProps={{ sx: { width: 260 } }}
            >
              {renderMenuItems(WORKSPACE_ITEMS, () => setWorkspaceAnchor(null))}
            </Menu>

            {/* If the parent chooses to hide the Tools dropdown, render any
                provided quick action buttons in its place. The legacy Tools
                button has been removed from the desktop header; mobile drawer
                still exposes tool links. */}
            {quickActions ?? null}

            <Tooltip title={themeToggleLabel}>
              <IconButton
                color="inherit"
                onClick={toggleMode}
                sx={{
                  borderRadius: 2,
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
              sx={{ p: 0, ml: 0.5 }}
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
            >
              {MENU_ITEMS.map((item) => (
                <MenuItem
                  key={item.path}
                  component={NavLink}
                  to={item.path}
                  onClick={() => setProfileAnchor(null)}
                  sx={{ gap: 1 }}
                >
                  {item.path === "/settings" ? (
                    <SettingsIcon fontSize="small" />
                  ) : (
                    <AccountCircleIcon fontSize="small" />
                  )}
                  {item.label}
                </MenuItem>
              ))}
              <Divider sx={{ my: 0.5 }} />
              <MenuItem onClick={handleLogout} sx={{ gap: 1 }}>
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
            sx={{ borderRadius: 2 }}
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
            width: { xs: "100vw", sm: 360 },
            display: "flex",
            flexDirection: "column",
            height: "100%",
            backgroundColor: alpha(theme.palette.background.default, 0.96),
          }}
        >
          <Box sx={{ px: 3, py: 2.5 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                src={avatarUrl ?? undefined}
                alt="User avatar"
                sx={{ width: 48, height: 48 }}
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

          <Box sx={{ flexGrow: 1, overflow: "auto" }}>
            <List
              subheader={
                <ListSubheader
                  component="div"
                  sx={{ px: 3, py: 1.5, fontWeight: 600 }}
                >
                  Workspaces
                </ListSubheader>
              }
            >
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

            <List
              subheader={
                <ListSubheader
                  component="div"
                  sx={{ px: 3, py: 1.5, fontWeight: 600 }}
                >
                  Tools
                </ListSubheader>
              }
            >
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

          <Divider />

          <Box sx={{ px: 2.5, py: 2, display: "flex", gap: 1 }}>
            <IconButton
              color="inherit"
              onClick={() => {
                toggleMode();
                handleDrawerToggle(false)();
              }}
              sx={{
                flex: "0 0 auto",
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.text.primary, 0.12),
              }}
            >
              {themeToggleIcon}
            </IconButton>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
            >
              Sign out
            </Button>
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default TopNav;
