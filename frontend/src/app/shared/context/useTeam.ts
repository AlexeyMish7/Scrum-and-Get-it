/**
 * useTeam Hook
 *
 * Hook to access team context.
 * Separated from TeamContext.tsx to fix React Fast Refresh warning.
 */

import { useContext } from "react";
import { TeamContext } from "./TeamContextDefinition";
import type { TeamContextValue } from "@workspaces/team_management/types";

/**
 * Hook to access team context
 * Must be used within TeamProvider
 */
export function useTeam(): TeamContextValue {
  const ctx = useContext(TeamContext);
  if (!ctx) {
    throw new Error("useTeam must be used within TeamProvider");
  }
  return ctx;
}
