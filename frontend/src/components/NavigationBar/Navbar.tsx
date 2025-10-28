import { useAuth } from "../../context/AuthContext";
import React, { useEffect, useState } from "react";
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
import { supabase } from "../../supabaseClient";
import crud from "../../services/crud";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/logo/graphics_only.png"; // adjust path if needed

const NavBar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    // If there's no user yet, there's nothing to restore synchronously.
    try {
      if (!window) return null;
    } catch {
      return null;
    }
    try {
      // Use user id to avoid returning another user's cached avatar.
      // Keys are stored as `avatar:<bucket>:<path>` where <path> begins with user id.
      // Try to find the current user id in a global place if the app sets it
      // (this is optional and only used to narrow the cache lookup). Fallback
      // to null which will allow a looser cache match that still filters by
      // key contents.
      let uid: string | null = null;
      try {
        const maybe = window as unknown as Record<string, unknown>;
        const v = maybe.__CURRENT_USER_ID;
        if (typeof v === "string") uid = v;
      } catch {
        uid = null;
      }
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (!key.startsWith("avatar:")) continue;
        if (uid && !key.includes(`:${uid}`)) continue; // skip other users' avatars
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw) as { url: string; expiresAt: number };
          if (Date.now() < parsed.expiresAt - 10_000) return parsed.url;
          // expired -> remove
          localStorage.removeItem(key);
        } catch {
          localStorage.removeItem(key);
        }
      }
    } catch {
      /* ignore */
    }
    return null;
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const toggleDrawer = (open: boolean) => () => setDrawerOpen(open);

  useEffect(() => {
    let mounted = true;
    if (!user) {
      setAvatarUrl(null);
      return;
    }

    // small helper: cache signed urls in localStorage to avoid regenerating
    // them on every route change which causes the img to reload.
    const cacheKey = (bucket: string, path: string) =>
      `avatar:${bucket}:${path}`;
    const getCachedSignedUrl = (bucket: string, path: string) => {
      try {
        const k = cacheKey(bucket, path);
        const raw = localStorage.getItem(k);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { url: string; expiresAt: number };
        if (Date.now() < parsed.expiresAt - 10_000) return parsed.url; // keep 10s margin
        // expired
        localStorage.removeItem(k);
        return null;
      } catch {
        return null;
      }
    };

    const setCachedSignedUrl = (
      bucket: string,
      path: string,
      url: string,
      ttlSec: number
    ) => {
      try {
        const k = cacheKey(bucket, path);
        const expiresAt = Date.now() + ttlSec * 1000;
        localStorage.setItem(k, JSON.stringify({ url, expiresAt }));
      } catch {
        /* ignore */
      }
    };

    const load = async () => {
      const res = await crud.getUserProfile(user.id);
      if (res.error) return;
      const p = res.data as Record<string, unknown> | null;
      type ProfileMeta = {
        avatar_path?: string | null;
        avatar_bucket?: string | null;
      } & Record<string, unknown>;
      const meta = (p?.meta as ProfileMeta | undefined) ?? {};
      const avatar_path = meta?.avatar_path ?? null;
      const avatar_bucket = meta?.avatar_bucket ?? "projects";
      if (!avatar_path) {
        setAvatarUrl(null);
        return;
      }

      // try cache first
      const cached = getCachedSignedUrl(avatar_bucket, avatar_path);
      if (cached) {
        if (mounted) setAvatarUrl(cached);
        return;
      }

      const { data, error } = await supabase.storage
        .from(avatar_bucket)
        .createSignedUrl(avatar_path, 60 * 60);
      if (error) {
        console.warn("Failed to create signed url for avatar", error);
        setAvatarUrl(null);
        return;
      }
      if (mounted) {
        setAvatarUrl(data?.signedUrl ?? null);
        if (data?.signedUrl)
          setCachedSignedUrl(
            avatar_bucket,
            avatar_path,
            data.signedUrl,
            60 * 60
          );
      }
    };

    load();

    // subscribe to profile changes for this user so avatar updates live
    const ch = supabase
      .channel("public:profiles")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        () => load()
      )
      .subscribe();

    return () => {
      mounted = false;
      // unsubscribe channel
      ch.unsubscribe();
    };
  }, [user]);

  const navItems = [
    { label: "Dashboard", path: "/profile" },
    { label: "Education", path: "/education" },
    { label: "Skills", path: "/skillsOverview" },
    { label: "Employment", path: "/employment-history" },
    { label: "Projects", path: "/portfolio" },
    { label: "Certifications", path: "/certifications" },
  ];

  return (
    <>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar disableGutters sx={{ justifyContent: "space-between", px: 2 }}>
          {/* ---- Left: Logo / Brand ---- */}
          <Box
            component={NavLink}
            to="/profile"
            sx={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              color: theme.palette.common.white,
            }}
          >
            <Box
              component="img"
              src={logo}
              alt="Flow ATS Logo"
              sx={{ height: 40, width: "auto", mr: 1, display: "block" }}
            />
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.common.white,
                fontWeight: 600,
              }}
            >
              Flow ATS
            </Typography>
          </Box>

          {/* ---- Desktop Navigation ---- */}
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

              {/* --- Profile Avatar Menu --- */}
              <IconButton
                onClick={handleMenuOpen}
                sx={{ p: 0, ml: 1 }}
                aria-controls={anchorEl ? "profile-menu" : undefined}
                aria-haspopup="true"
              >
                <Avatar alt="User Profile" src={avatarUrl ?? undefined}>
                  {!avatarUrl && (user?.email?.charAt(0)?.toUpperCase() ?? "U")}
                </Avatar>
              </IconButton>

              <Menu
                id="profile-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    navigate("/profile-details");
                  }}
                >
                  Profile
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    navigate("/settings");
                  }}
                >
                  Settings
                </MenuItem>
                <MenuItem
                  onClick={async () => {
                    handleMenuClose();
                    await signOut();
                    navigate("/", { replace: true });
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

      {/* ---- Mobile Drawer ---- */}
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

          {/* --- Bottom Section of Drawer --- */}
          <Box>
            <List>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    toggleDrawer(false)();
                    navigate("/profile-details");
                  }}
                >
                  <ListItemText primary="Profile" />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    toggleDrawer(false)();
                    navigate("/settings");
                  }}
                >
                  <ListItemText primary="Settings" />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton
                  onClick={async () => {
                    toggleDrawer(false)();
                    await signOut();
                    navigate("/", { replace: true });
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
