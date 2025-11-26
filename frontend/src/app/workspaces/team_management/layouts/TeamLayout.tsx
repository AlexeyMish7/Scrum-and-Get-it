/**
 * TEAM MANAGEMENT LAYOUT
 *
 * Purpose:
 * - Shared layout wrapper for all team pages
 * - Uses AppShell for consistent navigation
 * - No team-specific sidebar (keeps it simple)
 *
 * Usage:
 *   All /team/* routes wrapped in this layout
 */

import { Outlet } from "react-router-dom";
import AppShell from "@shared/layouts/AppShell";

export function TeamLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
