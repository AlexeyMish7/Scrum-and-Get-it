/**
 * Team Context Definition
 *
 * Separated from TeamContext.tsx to fix React Fast Refresh warning.
 * Contains only the context creation, no components.
 */

import { createContext } from "react";
import type { TeamContextValue } from "@workspaces/team_management/types";

export const TeamContext = createContext<TeamContextValue | undefined>(
  undefined
);
