/**
 * SIDEBAR CONTEXT
 *
 * Manages sidebar open/close state for animated sidebars.
 * Provides toggle and close functions for both desktop (hover) and mobile (drawer) modes.
 *
 * USAGE:
 * ```tsx
 * // Wrap your app or layout with the provider
 * <SidebarProvider>
 *   <AnimatedSidebar>
 *     <SidebarLink ... />
 *   </AnimatedSidebar>
 * </SidebarProvider>
 *
 * // Use the hook to access state
 * const { open, setOpen } = useSidebar();
 * ```
 */

import { createContext, useState, useMemo, type ReactNode } from "react";

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

const SidebarContext = createContext<SidebarContextValue | null>(null);

interface SidebarProviderProps {
  children: ReactNode;
  /** Initial open state - defaults to false (collapsed) */
  defaultOpen?: boolean;
}

/**
 * SidebarProvider - Provides sidebar state to all child components
 *
 * Handles both desktop (hover expand/collapse) and mobile (drawer) modes.
 * The open state determines whether the sidebar is expanded.
 */
export function SidebarProvider({
  children,
  defaultOpen = false,
}: SidebarProviderProps) {
  const [open, setOpen] = useState(defaultOpen);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<SidebarContextValue>(
    () => ({
      open,
      setOpen,
      expand: () => setOpen(true),
      collapse: () => setOpen(false),
      toggle: () => setOpen((prev) => !prev),
    }),
    [open]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export default SidebarContext;
