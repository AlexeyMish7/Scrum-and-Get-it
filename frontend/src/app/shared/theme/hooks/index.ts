/**
 * Theme Hooks Barrel Export
 *
 * Provides convenient hooks for accessing theme tokens and utilities.
 */

// Token access hooks
export {
  useThemeTokens,
  useThemeColors,
  useThemeShadows,
  useColorAlpha,
  useAppTheme,
  type ThemeColors,
  type ThemeBorderRadius,
  type ThemeSpacing,
  type ThemeShadows,
  type ThemeMotion,
} from "./useThemeTokens";

// AI Glossy Styles Hook
export { useAIGlossyStyles } from "./useAIGlossyStyles";
