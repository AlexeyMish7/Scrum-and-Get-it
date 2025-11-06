import type { DesignTokens } from "./types";

/**
 * Inject a small set of CSS custom properties for use outside of MUI components.
 * This keeps non-MUI areas, CSS files, and dev tools in sync with the active theme.
 */
export function exportCssVars(tokens: DesignTokens) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const p = tokens.palette;
  root.style.setProperty("--color-primary", p.primary);
  root.style.setProperty("--on-primary", p.onPrimary);
  root.style.setProperty("--color-secondary", p.secondary);
  root.style.setProperty("--on-secondary", p.onSecondary);
  root.style.setProperty("--color-tertiary", p.tertiary);
  root.style.setProperty("--on-tertiary", p.onTertiary);
  root.style.setProperty("--color-bg", p.background);
  root.style.setProperty("--on-bg", p.onBackground);
  root.style.setProperty("--color-surface", p.surface);
  root.style.setProperty("--on-surface", p.onSurface);
  root.style.setProperty("--color-error", p.error);
  root.style.setProperty("--on-error", p.onError);
  root.style.setProperty("--color-success", p.success);
  root.style.setProperty("--on-success", p.onSuccess);
  root.style.setProperty("--color-warning", p.warning);
  root.style.setProperty("--on-warning", p.onWarning);
  root.style.setProperty("--color-divider", p.divider);
  if (p.gradientPrimary)
    root.style.setProperty("--gradient-primary", p.gradientPrimary);
  if (p.gradientAccent)
    root.style.setProperty("--gradient-accent", p.gradientAccent);
}

export default exportCssVars;
