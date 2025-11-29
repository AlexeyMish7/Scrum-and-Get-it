/**
 * useSidebar - Hook to access sidebar state and controls
 *
 * Must be used within a SidebarProvider.
 *
 * USAGE:
 * ```tsx
 * const { open, setOpen, toggle, expand, collapse } = useSidebar();
 * ```
 */

import { useContext } from "react";
import SidebarContext from "./SidebarContext";

interface SidebarContextValue {
  /** Whether the sidebar is expanded/open */
  open: boolean;
  /** Update the sidebar open state */
  setOpen: (open: boolean) => void;
  /** Expand the sidebar (convenience) */
  expand: () => void;
  /** Collapse the sidebar (convenience) */
  collapse: () => void;
  /** Toggle sidebar state (convenience) */
  toggle: () => void;
}

export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }

  return context;
}
