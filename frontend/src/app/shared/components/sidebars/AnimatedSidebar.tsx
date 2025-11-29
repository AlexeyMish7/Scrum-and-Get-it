/**
 * ANIMATED SIDEBAR COMPONENT
 *
 * A responsive animated sidebar with:
 * - Desktop: Collapses on hover (60px collapsed → 280px expanded)
 * - Mobile: Hamburger menu with slide-in drawer from left
 *
 * Uses Framer Motion for smooth animations.
 * Requires SidebarProvider to be wrapped around the component.
 *
 * USAGE:
 * ```tsx
 * <SidebarProvider>
 *   <AnimatedSidebar title="Profile">
 *     <AnimatedSidebarLink to="/profile" icon={<DashboardIcon />} label="Dashboard" end />
 *     <AnimatedSidebarLink to="/profile/skills" icon={<StarIcon />} label="Skills" />
 *   </AnimatedSidebar>
 * </SidebarProvider>
 * ```
 */

import { type ReactNode } from "react";
import { Box, IconButton, Drawer, Typography, useTheme } from "@mui/material";
import { useMediaQuery } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useSidebar } from "@shared/context/useSidebar";
import {
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
} from "./sidebarConstants";

const ANIMATION_DURATION = 0.2;

interface AnimatedSidebarProps {
  /** Title shown at top of sidebar (visible when expanded) */
  title: string;
  /** ARIA label for accessibility */
  ariaLabel: string;
  /** Navigation links (AnimatedSidebarLink components) */
  children: ReactNode;
}

/**
 * DesktopSidebar - Fixed sidebar that expands on hover
 *
 * Collapsed state shows only icons (60px width)
 * Expanded state shows icons + labels (280px width)
 */
function DesktopSidebar({ title, ariaLabel, children }: AnimatedSidebarProps) {
  const { open, expand, collapse } = useSidebar();
  const theme = useTheme();

  return (
    <motion.div
      // Expand sidebar on mouse enter, collapse on leave
      onMouseEnter={expand}
      onMouseLeave={collapse}
      initial={{ width: SIDEBAR_WIDTH_COLLAPSED }}
      animate={{
        width: open ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED,
      }}
      transition={{ duration: ANIMATION_DURATION, ease: "easeInOut" }}
      style={{
        height: "100%",
        overflow: "hidden",
        flexShrink: 0,
        borderRight: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        component="nav"
        aria-label={ariaLabel}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          p: 1.5,
          boxSizing: "border-box",
        }}
      >
        {/* Sidebar Header - Title visible when expanded */}
        <Box
          sx={{
            height: 48,
            display: "flex",
            alignItems: "center",
            px: 1,
            mb: 1,
            overflow: "hidden",
          }}
        >
          <AnimatePresence mode="wait">
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: ANIMATION_DURATION }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  noWrap
                  sx={{ color: "text.primary" }}
                >
                  {title}
                </Typography>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        {/* Navigation Links */}
        <Box
          component="ul"
          sx={{
            listStyle: "none",
            p: 0,
            m: 0,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            flexGrow: 1,
            overflow: "auto",
          }}
        >
          {children}
        </Box>
      </Box>
    </motion.div>
  );
}

/**
 * MobileSidebar - Hamburger menu with slide-in drawer
 *
 * Shows hamburger icon in fixed header position
 * Opens full-height drawer from left on click
 */
function MobileSidebar({ title, ariaLabel, children }: AnimatedSidebarProps) {
  const { open, toggle, collapse } = useSidebar();
  const theme = useTheme();

  return (
    <>
      {/* Fixed hamburger menu button */}
      <Box
        sx={{
          position: "fixed",
          top: 64, // Below GlobalTopBar (adjust if needed)
          left: 8,
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <IconButton
          onClick={toggle}
          aria-label={open ? "Close sidebar" : "Open sidebar"}
          sx={{
            bgcolor: "background.paper",
            boxShadow: 1,
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <MenuIcon />
        </IconButton>
      </Box>

      {/* Slide-in drawer */}
      <Drawer
        anchor="left"
        open={open}
        onClose={collapse}
        sx={{
          "& .MuiDrawer-paper": {
            width: SIDEBAR_WIDTH_EXPANDED,
            boxSizing: "border-box",
            bgcolor: "background.paper",
          },
        }}
      >
        <Box
          component="nav"
          aria-label={ariaLabel}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            p: 2,
          }}
        >
          {/* Header with close button */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              {title}
            </Typography>
            <IconButton
              onClick={collapse}
              size="small"
              aria-label="Close sidebar"
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Navigation Links */}
          <Box
            component="ul"
            sx={{
              listStyle: "none",
              p: 0,
              m: 0,
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              flexGrow: 1,
              overflow: "auto",
            }}
          >
            {children}
          </Box>
        </Box>
      </Drawer>
    </>
  );
}

/**
 * AnimatedSidebar - Responsive sidebar that adapts to screen size
 *
 * Renders DesktopSidebar on md+ screens, MobileSidebar on smaller screens.
 */
export default function AnimatedSidebar(props: AnimatedSidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return <MobileSidebar {...props} />;
  }

  return <DesktopSidebar {...props} />;
}
