/**
 * SHARED CONTEXT INDEX
 * Central export point for all application-wide context providers and hooks.
 *
 * Re-exports:
 * - Authentication context provider and hook
 * - Theme context provider and hook
 * - Profile change tracking provider and hook
 *
 * Usage:
 * ```ts
 * import { useAuth, useThemeContext, useProfileChange } from "@context";
 * ```
 */

export { AuthContextProvider, useAuth } from "./AuthContext";
export { ThemeContextProvider, useThemeContext } from "./ThemeContext";
export {
  ProfileChangeProvider,
  useProfileChange,
} from "./ProfileChangeContext";
export { AvatarProvider, useAvatarContext } from "./AvatarContext";
