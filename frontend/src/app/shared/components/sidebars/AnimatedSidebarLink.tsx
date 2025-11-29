/**
 * ANIMATED SIDEBAR LINK COMPONENT
 *
 * Navigation link for use inside AnimatedSidebar.
 * Shows icon always, label animates in/out based on sidebar open state.
 *
 * Features:
 * - Icon always visible for collapsed state
 * - Label fades in/out with sidebar expansion
 * - Active state styling via NavLink
 * - Hover effects and smooth transitions
 *
 * USAGE:
 * ```tsx
 * <AnimatedSidebarLink
 *   to="/profile"
 *   icon={<DashboardIcon />}
 *   label="Dashboard"
 *   end // For exact matching (dashboard routes)
 * />
 * ```
 */

import { type ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "@shared/context/useSidebar";

const ANIMATION_DURATION = 0.2;

interface AnimatedSidebarLinkProps {
  /** Route path */
  to: string;
  /** MUI icon component */
  icon: ReactNode;
  /** Link label text */
  label: string;
  /** Whether to use exact matching (for index routes like dashboard) */
  end?: boolean;
  /** Optional click handler (useful for mobile to close drawer) */
  onClick?: () => void;
}

/**
 * AnimatedSidebarLink - Individual navigation link with animated label
 *
 * Renders as a list item containing a NavLink.
 * Icon is always visible, label fades based on sidebar state.
 */
export default function AnimatedSidebarLink({
  to,
  icon,
  label,
  end = false,
  onClick,
}: AnimatedSidebarLinkProps) {
  const { open, collapse } = useSidebar();

  // Close mobile drawer on link click
  const handleClick = () => {
    // Only collapse on mobile - desktop uses hover
    if (window.innerWidth < 900) {
      collapse();
    }
    onClick?.();
  };

  return (
    <Box component="li">
      <NavLink
        to={to}
        end={end}
        onClick={handleClick}
        style={{ textDecoration: "none" }}
      >
        {({ isActive }) => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 1.5,
              py: 1,
              borderRadius: 1,
              minHeight: 44,
              // Active state styling
              bgcolor: isActive ? "action.selected" : "transparent",
              color: isActive ? "primary.main" : "text.secondary",
              // Hover effect
              transition: "background-color 0.15s ease",
              "&:hover": {
                bgcolor: isActive ? "action.selected" : "action.hover",
              },
              // Keep icon centered when collapsed
              justifyContent: open ? "flex-start" : "center",
            }}
          >
            {/* Icon - always visible */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                width: 24,
                height: 24,
                "& > svg": {
                  fontSize: 22,
                },
              }}
            >
              {icon}
            </Box>

            {/* Label - animates in/out */}
            <AnimatePresence mode="wait">
              {open && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: ANIMATION_DURATION }}
                  style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={isActive ? 600 : 400}
                    noWrap
                    sx={{
                      color: "inherit",
                    }}
                  >
                    {label}
                  </Typography>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        )}
      </NavLink>
    </Box>
  );
}
