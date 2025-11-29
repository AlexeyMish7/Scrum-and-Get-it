import type { DesignTokens } from "./types";

/**
 * Inject CSS custom properties for use outside of MUI components.
 * This keeps non-MUI areas, CSS files, and dev tools in sync with the active theme.
 *
 * Exports:
 * - Palette colors (primary, secondary, semantic colors)
 * - Typography (font families)
 * - Spacing scale
 * - Border radius tokens
 * - Motion duration and easing
 * - Elevation/shadow tokens
 */
export function exportCssVars(tokens: DesignTokens) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const p = tokens.palette;

  // ═══════════════════════════════════════════════════════════════════════════
  // PALETTE COLORS
  // ═══════════════════════════════════════════════════════════════════════════
  root.style.setProperty("--color-primary", p.primary);
  root.style.setProperty("--on-primary", p.onPrimary);
  if (p.primaryLight)
    root.style.setProperty("--color-primary-light", p.primaryLight);
  if (p.primaryDark)
    root.style.setProperty("--color-primary-dark", p.primaryDark);

  root.style.setProperty("--color-secondary", p.secondary);
  root.style.setProperty("--on-secondary", p.onSecondary);
  if (p.secondaryLight)
    root.style.setProperty("--color-secondary-light", p.secondaryLight);
  if (p.secondaryDark)
    root.style.setProperty("--color-secondary-dark", p.secondaryDark);

  root.style.setProperty("--color-tertiary", p.tertiary);
  root.style.setProperty("--on-tertiary", p.onTertiary);

  // Backgrounds
  root.style.setProperty("--color-bg", p.background);
  root.style.setProperty("--on-bg", p.onBackground);
  if (p.backgroundAlt)
    root.style.setProperty("--color-bg-alt", p.backgroundAlt);

  root.style.setProperty("--color-surface", p.surface);
  root.style.setProperty("--on-surface", p.onSurface);
  if (p.surfaceAlt) root.style.setProperty("--color-surface-alt", p.surfaceAlt);

  // Semantic colors
  root.style.setProperty("--color-error", p.error);
  root.style.setProperty("--on-error", p.onError);
  if (p.errorLight) root.style.setProperty("--color-error-light", p.errorLight);

  root.style.setProperty("--color-success", p.success);
  root.style.setProperty("--on-success", p.onSuccess);
  if (p.successLight)
    root.style.setProperty("--color-success-light", p.successLight);

  root.style.setProperty("--color-warning", p.warning);
  root.style.setProperty("--on-warning", p.onWarning);
  if (p.warningLight)
    root.style.setProperty("--color-warning-light", p.warningLight);

  if (p.info) root.style.setProperty("--color-info", p.info);
  if (p.onInfo) root.style.setProperty("--on-info", p.onInfo);

  // Dividers and borders
  root.style.setProperty("--color-divider", p.divider);
  if (p.border) root.style.setProperty("--color-border", p.border);

  // Text colors
  if (p.text) {
    root.style.setProperty("--text-primary", p.text.primary);
    root.style.setProperty("--text-secondary", p.text.secondary);
    root.style.setProperty("--text-tertiary", p.text.tertiary);
    root.style.setProperty("--text-disabled", p.text.disabled);
    root.style.setProperty("--text-inverse", p.text.inverse);
    root.style.setProperty("--text-link", p.text.link);
    root.style.setProperty("--text-link-hover", p.text.linkHover);
  }

  // Gradients
  if (p.gradientPrimary)
    root.style.setProperty("--gradient-primary", p.gradientPrimary);
  if (p.gradientSecondary)
    root.style.setProperty("--gradient-secondary", p.gradientSecondary);
  if (p.gradientAccent)
    root.style.setProperty("--gradient-accent", p.gradientAccent);
  if (p.gradientBackground)
    root.style.setProperty("--gradient-background", p.gradientBackground);

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPOGRAPHY
  // ═══════════════════════════════════════════════════════════════════════════
  if (tokens.typography) {
    const t = tokens.typography;
    root.style.setProperty("--font-heading", t.fontFamily.heading);
    root.style.setProperty("--font-body", t.fontFamily.body);
    root.style.setProperty("--font-mono", t.fontFamily.mono);

    // Font sizes
    root.style.setProperty("--font-size-xs", t.fontSize.xs);
    root.style.setProperty("--font-size-sm", t.fontSize.sm);
    root.style.setProperty("--font-size-md", t.fontSize.md);
    root.style.setProperty("--font-size-lg", t.fontSize.lg);
    root.style.setProperty("--font-size-xl", t.fontSize.xl);
    root.style.setProperty("--font-size-2xl", t.fontSize["2xl"]);
    root.style.setProperty("--font-size-3xl", t.fontSize["3xl"]);
    root.style.setProperty("--font-size-4xl", t.fontSize["4xl"]);
    root.style.setProperty("--font-size-5xl", t.fontSize["5xl"]);

    // Font weights
    root.style.setProperty("--font-weight-light", String(t.fontWeight.light));
    root.style.setProperty(
      "--font-weight-regular",
      String(t.fontWeight.regular)
    );
    root.style.setProperty("--font-weight-medium", String(t.fontWeight.medium));
    root.style.setProperty(
      "--font-weight-semibold",
      String(t.fontWeight.semibold)
    );
    root.style.setProperty("--font-weight-bold", String(t.fontWeight.bold));

    // Line heights
    root.style.setProperty("--line-height-tight", String(t.lineHeight.tight));
    root.style.setProperty("--line-height-normal", String(t.lineHeight.normal));
    root.style.setProperty(
      "--line-height-relaxed",
      String(t.lineHeight.relaxed)
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SPACING
  // ═══════════════════════════════════════════════════════════════════════════
  if (tokens.spacing) {
    const s = tokens.spacing;
    root.style.setProperty("--spacing-unit", `${s.unit}px`);
    root.style.setProperty("--spacing-none", "0");
    root.style.setProperty("--spacing-xs", `${s.scale.xs}px`);
    root.style.setProperty("--spacing-sm", `${s.scale.sm}px`);
    root.style.setProperty("--spacing-md", `${s.scale.md}px`);
    root.style.setProperty("--spacing-lg", `${s.scale.lg}px`);
    root.style.setProperty("--spacing-xl", `${s.scale.xl}px`);
    root.style.setProperty("--spacing-2xl", `${s.scale["2xl"]}px`);
    root.style.setProperty("--spacing-3xl", `${s.scale["3xl"]}px`);

    // Container widths
    root.style.setProperty("--container-sm", s.container.sm);
    root.style.setProperty("--container-md", s.container.md);
    root.style.setProperty("--container-lg", s.container.lg);
    root.style.setProperty("--container-xl", s.container.xl);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EFFECTS (Border Radius, Shadows)
  // ═══════════════════════════════════════════════════════════════════════════
  const e = tokens.effects;
  root.style.setProperty("--radius-none", "0");
  root.style.setProperty("--radius-sm", `${e.borderRadius.sm}px`);
  root.style.setProperty("--radius-md", `${e.borderRadius.md}px`);
  root.style.setProperty("--radius-lg", `${e.borderRadius.lg}px`);
  root.style.setProperty("--radius-xl", `${e.borderRadius.xl}px`);
  root.style.setProperty("--radius-full", `${e.borderRadius.full}px`);

  // Elevation/shadows
  root.style.setProperty("--shadow-none", e.elevation.none);
  root.style.setProperty("--shadow-1", e.elevation.level1);
  root.style.setProperty("--shadow-2", e.elevation.level2);
  root.style.setProperty("--shadow-3", e.elevation.level3);
  root.style.setProperty("--shadow-4", e.elevation.level4);
  root.style.setProperty("--shadow-5", e.elevation.level5);

  // Focus ring
  root.style.setProperty("--focus-ring-color", e.focusRing.color);
  root.style.setProperty("--focus-ring-width", `${e.focusRing.width}px`);
  if (e.focusRing.offset)
    root.style.setProperty("--focus-ring-offset", `${e.focusRing.offset}px`);

  // Glow effect
  if (e.glow) {
    root.style.setProperty("--glow-color", e.glow.color);
    root.style.setProperty("--glow-spread", e.glow.spread);
  }

  // Overlay
  if (e.overlay) {
    root.style.setProperty("--overlay-backdrop", e.overlay.backdropColor);
    root.style.setProperty("--overlay-opacity", String(e.overlay.opacity));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOTION (Duration, Easing)
  // ═══════════════════════════════════════════════════════════════════════════
  const m = tokens.motion;
  root.style.setProperty("--duration-instant", `${m.duration.instant}ms`);
  root.style.setProperty("--duration-fast", `${m.duration.fast}ms`);
  root.style.setProperty("--duration-short", `${m.duration.short}ms`);
  root.style.setProperty("--duration-medium", `${m.duration.medium}ms`);
  root.style.setProperty("--duration-long", `${m.duration.long}ms`);
  root.style.setProperty("--duration-slower", `${m.duration.slower}ms`);

  root.style.setProperty("--easing-standard", m.easing.standard);
  root.style.setProperty("--easing-emphasized", m.easing.emphasized);
  root.style.setProperty("--easing-decelerate", m.easing.decelerate);
  root.style.setProperty("--easing-accelerate", m.easing.accelerate);
  root.style.setProperty("--easing-linear", m.easing.linear);
  if (m.easing.bounce)
    root.style.setProperty("--easing-bounce", m.easing.bounce);
  if (m.easing.elastic)
    root.style.setProperty("--easing-elastic", m.easing.elastic);

  // Reduced motion flag
  if (m.reducedMotion) {
    root.style.setProperty("--reduced-motion", "1");
  } else {
    root.style.removeProperty("--reduced-motion");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERACTION
  // ═══════════════════════════════════════════════════════════════════════════
  if (tokens.interaction) {
    const i = tokens.interaction;
    root.style.setProperty("--hover-opacity", String(i.hoverOpacity));
    root.style.setProperty("--active-opacity", String(i.activeOpacity));
    root.style.setProperty("--disabled-opacity", String(i.disabledOpacity));
    if (i.hoverOverlay)
      root.style.setProperty("--hover-overlay", i.hoverOverlay);
    if (i.activeOverlay)
      root.style.setProperty("--active-overlay", i.activeOverlay);
    if (i.pressTransform)
      root.style.setProperty("--press-transform", i.pressTransform);
    if (i.hoverScale) root.style.setProperty("--hover-scale", i.hoverScale);
  }
}

export default exportCssVars;
