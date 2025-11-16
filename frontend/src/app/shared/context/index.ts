/**
 * SHARED CONTEXT INDEX
 * Central export point for all application-wide context providers and hooks.
 *
 * Re-exports:
 * - Authentication context provider and hook
 * - Theme context provider and hook
 *
 * Usage:
 * ```ts
 * import { useAuth, useThemeContext } from "@context";
 * ```
 */

export { AuthContextProvider, useAuth } from "./AuthContext";
export { ThemeContextProvider, useThemeContext } from "./ThemeContext";
