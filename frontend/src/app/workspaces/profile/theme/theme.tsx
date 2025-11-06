import { createTheme, responsiveFontSizes } from "@mui/material/styles";

// ===== CUSTOM DESIGN TOKENS =====
// Define our custom design tokens that will be used throughout the theme
const designTokens = {
  gradients: {
    primary: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
    primaryHover: "linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)",
    secondary: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
    success: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    warning: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    error: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    info: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
    techy: "linear-gradient(135deg, #6366f1 0%, #3b82f6 50%, #06b6d4 100%)",
    surface:
      "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 100%)",
    background:
      "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 30%, #cbd5e1 70%, #94a3b8 100%)",
  },
  shadows: {
    glow: "0 0 20px rgba(59, 130, 246, 0.3)",
    glowHover: "0 0 30px rgba(59, 130, 246, 0.5)",
    surface: "0 8px 32px rgba(16, 24, 40, 0.08)",
    surfaceHover: "0 12px 40px rgba(16, 24, 40, 0.12)",
    floating: "0 16px 64px rgba(16, 24, 40, 0.1)",
    pressed: "0 2px 8px rgba(16, 24, 40, 0.1)",
    focus: "0 0 0 4px rgba(59, 130, 246, 0.2)",
  },
  blur: {
    sm: "blur(4px)",
    md: "blur(8px)",
    lg: "blur(12px)",
    xl: "blur(16px)",
  },
  surfaces: {
    glass: "rgba(255, 255, 255, 0.85)",
    glassHover: "rgba(255, 255, 255, 0.95)",
    glassFocus: "rgba(255, 255, 255, 1)",
    overlay: "rgba(16, 24, 40, 0.1)",
    border: "rgba(255, 255, 255, 0.2)",
  },
  animation: {
    smooth: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    bounce: "all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    spring: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  },
};

// Module augmentation to add our custom design tokens to the theme
declare module "@mui/material/styles" {
  interface Theme {
    designTokens: typeof designTokens;
  }
  interface ThemeOptions {
    designTokens?: typeof designTokens;
  }
  interface Palette {
    tertiary: Palette["primary"];
  }
  interface PaletteOptions {
    tertiary?: PaletteOptions["primary"];
  }
  interface Components {
    MuiLoadingButton?: unknown;
  }
}

// Module augmentation for custom button variants on <Button> and <LoadingButton>
declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    primary: true;
    secondary: true;
    tertiary: true;
    destructive: true;
    glass: true;
    glow: true;
  }
}
declare module "@mui/lab/LoadingButton" {
  interface LoadingButtonPropsVariantOverrides {
    primary: true;
    secondary: true;
    tertiary: true;
    destructive: true;
    glass: true;
    glow: true;
  }
}

let theme = createTheme({
  // Add our custom design tokens to the theme
  designTokens,

  palette: {
    mode: "light",
    primary: {
      main: "#3b82f6", // Modern blue (keeping brand recognition)
      light: "#60a5fa",
      dark: "#1e40af",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#6366f1", // Indigo for techy feel
      light: "#818cf8",
      dark: "#4f46e5",
      contrastText: "#FFFFFF",
    },
    tertiary: {
      main: "#f97316", // Modern orange (moved from secondary)
      light: "#fb923c",
      dark: "#ea580c",
      contrastText: "#FFFFFF",
    },
    success: {
      main: "#10b981", // Emerald
      light: "#34d399",
      dark: "#059669",
      contrastText: "#FFFFFF",
    },
    warning: {
      main: "#f59e0b", // Amber
      light: "#fbbf24",
      dark: "#d97706",
      contrastText: "#000000",
    },
    error: {
      main: "#ef4444", // Red
      light: "#f87171",
      dark: "#dc2626",
      contrastText: "#FFFFFF",
    },
    info: {
      main: "#06b6d4", // Cyan
      light: "#22d3ee",
      dark: "#0891b2",
      contrastText: "#FFFFFF",
    },
    background: {
      // Simplify background for light mode to avoid heavy gradients that
      // conflict with app content and spacing. Keep paper as a subtle glass.
      default: "#f8fafc",
      paper: designTokens.surfaces.glass,
    },
    text: {
      primary: "#0f172a", // Darker for better contrast
      secondary: "#475569", // Better contrast
      disabled: "#94a3b8",
    },
    divider: "rgba(148, 163, 184, 0.2)",
    // Custom surface colors for glass morphism
    grey: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
  },

  typography: {
    fontFamily: `'Inter', 'Manrope', 'SF Pro Display', system-ui, -apple-system, sans-serif`,

    h1: {
      fontFamily: `'Inter', 'Manrope', sans-serif`,
      fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: "-0.02em",
      background: designTokens.gradients.techy,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      textShadow: "0 2px 4px rgba(59, 130, 246, 0.1)",
    },
    h2: {
      fontFamily: `'Inter', 'Manrope', sans-serif`,
      fontSize: "clamp(2rem, 4vw, 2.75rem)",
      fontWeight: 700,
      lineHeight: 1.2,
      color: "#0f172a",
      letterSpacing: "-0.01em",
      textShadow: "0 1px 2px rgba(15, 23, 42, 0.1)",
    },
    h3: {
      fontFamily: `'Inter', 'Manrope', sans-serif`,
      fontSize: "clamp(1.5rem, 3vw, 2rem)",
      fontWeight: 600,
      lineHeight: 1.25,
      color: "#1e293b",
      letterSpacing: "-0.005em",
    },
    h4: {
      fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)",
      fontWeight: 600,
      lineHeight: 1.3,
      color: "#1e293b",
    },
    h5: {
      fontSize: "clamp(1.1rem, 2vw, 1.25rem)",
      fontWeight: 600,
      lineHeight: 1.4,
      color: "#334155",
    },
    h6: {
      fontSize: "clamp(1rem, 1.5vw, 1.1rem)",
      fontWeight: 600,
      lineHeight: 1.45,
      color: "#475569",
    },
    body1: {
      fontSize: "1rem",
      fontWeight: 400,
      lineHeight: 1.6,
      color: "#475569",
      letterSpacing: "0.01em",
    },
    body2: {
      fontSize: "0.875rem",
      fontWeight: 400,
      lineHeight: 1.5,
      color: "#64748b",
      letterSpacing: "0.01em",
    },
    caption: {
      fontSize: "0.75rem",
      fontWeight: 500,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      color: "#94a3b8",
    },
    subtitle1: {
      fontSize: "1.125rem",
      fontWeight: 500,
      lineHeight: 1.5,
      color: "#334155",
      letterSpacing: "0.005em",
    },
    subtitle2: {
      fontSize: "1rem",
      fontWeight: 500,
      lineHeight: 1.4,
      color: "#475569",
    },
    button: {
      fontWeight: 600,
      letterSpacing: "0.02em",
      textTransform: "none",
    },
  },

  components: {
    // ✅ ENHANCED GLOBAL resets with techy background and immersive effects
    MuiCssBaseline: {
      styleOverrides: (themeParam) => ({
        // Apply typography styles to HTML elements
        h1: { ...themeParam.typography.h1 },
        h2: { ...themeParam.typography.h2 },
        h3: { ...themeParam.typography.h3 },
        h4: { ...themeParam.typography.h4 },
        h5: { ...themeParam.typography.h5 },
        h6: { ...themeParam.typography.h6 },
        p: { ...themeParam.typography.body1 },

        // ✅ Enhanced body with layered gradients and particle effects
        body: {
          margin: 0,
          padding: 0,
          backgroundColor: themeParam.palette.background.default,
          fontFamily: themeParam.typography.fontFamily,
          overflowX: "hidden",
          minHeight: "100vh",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          textRendering: "optimizeLegibility",
        },

        // Keep root minimal; let layouts control content padding.
        "#root": {
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          boxSizing: "border-box",
          position: "relative",
        },

        // ✅ Enhanced accessibility and interaction standards
        "*": {
          boxSizing: "border-box",
        },
        "*:focus-visible": {
          outline: `2px solid ${themeParam.palette.primary.main}`,
          outlineOffset: "2px",
          borderRadius: "4px",
        },
        button: {
          minHeight: "44px",
          minWidth: "44px",
          cursor: "pointer",
          transition: designTokens.animation.smooth,
        },
        "button:disabled": {
          cursor: "not-allowed",
          opacity: 0.6,
        },
        input: {
          fontSize: "16px", // Prevent zoom on iOS
          boxSizing: "border-box",
        },
        textarea: {
          fontSize: "16px",
          resize: "vertical",
        },

        // ✅ EXPANDED Global helper classes for consistent styling
        ".glass-card": {
          background: designTokens.surfaces.glass,
          backdropFilter: designTokens.blur.md,
          borderRadius: "16px",
          border: `1px solid ${designTokens.surfaces.border}`,
          boxShadow: designTokens.shadows.surface,
          padding: "24px",
          transition: designTokens.animation.smooth,
          "&:hover": {
            background: designTokens.surfaces.glassHover,
            boxShadow: designTokens.shadows.surfaceHover,
            transform: "translateY(-2px)",
          },
        },

        ".glass-button": {
          background: designTokens.surfaces.glass,
          backdropFilter: designTokens.blur.sm,
          border: `1px solid ${designTokens.surfaces.border}`,
          borderRadius: "12px",
          color: themeParam.palette.primary.main,
          fontWeight: 600,
          padding: "12px 24px",
          transition: designTokens.animation.bounce,
          cursor: "pointer",
          "&:hover": {
            background: designTokens.surfaces.glassHover,
            transform: "translateY(-1px)",
            boxShadow: designTokens.shadows.glow,
          },
          "&:active": {
            transform: "translateY(0)",
          },
        },

        ".techy-gradient": {
          background: designTokens.gradients.techy,
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        },

        ".floating-container": {
          background: designTokens.surfaces.glass,
          backdropFilter: designTokens.blur.lg,
          borderRadius: "20px",
          border: `1px solid ${designTokens.surfaces.border}`,
          boxShadow: designTokens.shadows.floating,
          padding: "32px",
          margin: "16px 0",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: designTokens.gradients.techy,
            opacity: 0.5,
          },
        },

        ".tech-border": {
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            padding: "2px",
            background: designTokens.gradients.techy,
            borderRadius: "inherit",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "xor",
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
          },
        },

        ".glow-text": {
          color: themeParam.palette.primary.main,
          textShadow: `0 0 10px ${themeParam.palette.primary.main}40`,
          fontWeight: 600,
        },

        ".status-indicator": {
          display: "inline-block",
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          marginRight: "8px",
          "&.online": {
            background: themeParam.palette.success.main,
            boxShadow: `0 0 6px ${themeParam.palette.success.main}60`,
          },
          "&.offline": {
            background: themeParam.palette.grey[400],
          },
          "&.busy": {
            background: themeParam.palette.warning.main,
            boxShadow: `0 0 6px ${themeParam.palette.warning.main}60`,
          },
        },

        // ✅ Responsive helper classes
        ".mobile-only": {
          "@media (min-width: 768px)": { display: "none !important" },
        },
        ".desktop-only": {
          "@media (max-width: 767px)": { display: "none !important" },
        },
        ".tablet-only": {
          "@media (max-width: 767px), (min-width: 1024px)": {
            display: "none !important",
          },
        },
      }),
    },

    // ✅ Enhanced Paper/Card with glass morphism and depth levels
    MuiPaper: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          borderRadius: "16px",
          background: designTokens.surfaces.glass,
          backdropFilter: designTokens.blur.md,
          border: `1px solid ${designTokens.surfaces.border}`,
          transition: designTokens.animation.smooth,
          position: "relative",
          overflow: "hidden",
          // Elevation-based styling
          ...(ownerState?.elevation === 0 && {
            boxShadow: "none",
            background: "transparent",
            border: "none",
          }),
          ...(ownerState?.elevation === 1 && {
            boxShadow: designTokens.shadows.surface,
          }),
          ...(ownerState?.elevation === 2 && {
            boxShadow: designTokens.shadows.surfaceHover,
          }),
          ...(ownerState?.elevation === 3 && {
            boxShadow: designTokens.shadows.floating,
          }),
          // Subtle top border gradient
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: designTokens.gradients.techy,
            opacity: 0.3,
          },
        }),
      },
    },

    // ✅ Enhanced Button variants with glass morphism and glow effects
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "12px",
          fontWeight: 600,
          letterSpacing: "0.02em",
          minHeight: "44px",
          position: "relative",
          overflow: "hidden",
          transition: designTokens.animation.smooth,
          "&:active": {
            transform: "scale(0.98)",
          },
          "&:disabled": {
            opacity: 0.6,
            transform: "none",
          },
          // Subtle shine effect on all buttons
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: "-100%",
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
            transition: "left 0.5s ease",
          },
          "&:hover::before": {
            left: "100%",
          },
        },
        sizeSmall: {
          padding: "8px 16px",
          fontSize: "0.875rem",
          minHeight: "36px",
        },
        sizeMedium: {
          padding: "12px 24px",
          fontSize: "0.9rem",
          minHeight: "44px",
        },
        sizeLarge: {
          padding: "16px 32px",
          fontSize: "1rem",
          minHeight: "52px",
        },
      },
      variants: [
        {
          props: { variant: "primary" },
          style: {
            background: designTokens.gradients.primary,
            color: "#FFFFFF",
            boxShadow: designTokens.shadows.glow,
            border: "none",
            "&:hover": {
              background: designTokens.gradients.primaryHover,
              boxShadow: designTokens.shadows.glowHover,
              transform: "translateY(-2px)",
            },
            "&:disabled": {
              background: "#94a3b8",
              color: "#FFFFFF",
              boxShadow: "none",
            },
          },
        },
        {
          props: { variant: "secondary" },
          style: {
            background: designTokens.gradients.secondary,
            color: "#FFFFFF",
            boxShadow: "0 4px 14px rgba(139, 92, 246, 0.3)",
            border: "none",
            "&:hover": {
              background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              boxShadow: "0 6px 20px rgba(139, 92, 246, 0.4)",
              transform: "translateY(-2px)",
            },
            "&:disabled": {
              background: "#94a3b8",
              color: "#FFFFFF",
              boxShadow: "none",
            },
          },
        },
        {
          props: { variant: "tertiary" },
          style: {
            background: designTokens.surfaces.glass,
            backdropFilter: designTokens.blur.sm,
            border: `1px solid ${designTokens.surfaces.border}`,
            color: "#3b82f6",
            boxShadow: designTokens.shadows.surface,
            "&:hover": {
              background: designTokens.surfaces.glassHover,
              border: `1px solid rgba(59, 130, 246, 0.3)`,
              boxShadow: designTokens.shadows.surfaceHover,
              transform: "translateY(-1px)",
            },
            "&:disabled": {
              background: "#f1f5f9",
              color: "#94a3b8",
              border: "1px solid #e2e8f0",
              boxShadow: "none",
            },
          },
        },
        {
          props: { variant: "destructive" },
          style: {
            background: designTokens.gradients.error,
            color: "#FFFFFF",
            boxShadow: "0 4px 14px rgba(239, 68, 68, 0.3)",
            border: "none",
            "&:hover": {
              background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
              boxShadow: "0 6px 20px rgba(220, 38, 38, 0.4)",
              transform: "translateY(-2px)",
            },
            "&:disabled": {
              background: "#94a3b8",
              color: "#FFFFFF",
              boxShadow: "none",
            },
          },
        },
        {
          props: { variant: "glass" },
          style: {
            background: designTokens.surfaces.glass,
            backdropFilter: designTokens.blur.md,
            border: `1px solid ${designTokens.surfaces.border}`,
            color: "#334155",
            boxShadow: designTokens.shadows.surface,
            "&:hover": {
              background: designTokens.surfaces.glassHover,
              boxShadow: designTokens.shadows.surfaceHover,
              transform: "translateY(-2px)",
            },
            "&:disabled": {
              background: "rgba(241, 245, 249, 0.5)",
              color: "#94a3b8",
              boxShadow: "none",
            },
          },
        },
        {
          props: { variant: "glow" },
          style: {
            background: designTokens.gradients.techy,
            color: "#FFFFFF",
            boxShadow: `${designTokens.shadows.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
            border: "none",
            "&:hover": {
              boxShadow: `${designTokens.shadows.glowHover}, inset 0 1px 0 rgba(255,255,255,0.3)`,
              transform: "translateY(-3px)",
            },
            "&:disabled": {
              background: "#94a3b8",
              color: "#FFFFFF",
              boxShadow: "none",
            },
          },
        },
      ],
    },

    // ✅ Enhanced Loading Button to match main button variants
    MuiLoadingButton: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          textTransform: "none",
          fontWeight: 600,
          letterSpacing: "0.02em",
          minHeight: "44px",
          transition: designTokens.animation.smooth,
          "&.Mui-disabled": { opacity: 0.6 },
          "&:active": { transform: "scale(0.98)" },
        },
      },
      variants: [
        {
          props: { variant: "primary" },
          style: {
            background: designTokens.gradients.primary,
            color: "#FFFFFF",
            boxShadow: designTokens.shadows.glow,
            "&:hover": {
              background: designTokens.gradients.primaryHover,
              boxShadow: designTokens.shadows.glowHover,
              transform: "translateY(-2px)",
            },
            "&:disabled": {
              background: "#94a3b8",
              color: "#FFFFFF",
              boxShadow: "none",
            },
          },
        },
        {
          props: { variant: "secondary" },
          style: {
            background: designTokens.gradients.secondary,
            color: "#FFFFFF",
            boxShadow: "0 4px 14px rgba(139, 92, 246, 0.3)",
            "&:hover": {
              background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              boxShadow: "0 6px 20px rgba(139, 92, 246, 0.4)",
              transform: "translateY(-2px)",
            },
            "&:disabled": {
              background: "#94a3b8",
              color: "#FFFFFF",
              boxShadow: "none",
            },
          },
        },
        {
          props: { variant: "tertiary" },
          style: {
            background: designTokens.surfaces.glass,
            backdropFilter: designTokens.blur.sm,
            border: `1px solid ${designTokens.surfaces.border}`,
            color: "#3b82f6",
            "&:hover": {
              background: designTokens.surfaces.glassHover,
              border: `1px solid rgba(59, 130, 246, 0.3)`,
            },
            "&:disabled": {
              background: "#f1f5f9",
              color: "#94a3b8",
              border: "1px solid #e2e8f0",
            },
          },
        },
        {
          props: { variant: "glass" },
          style: {
            background: designTokens.surfaces.glass,
            backdropFilter: designTokens.blur.md,
            border: `1px solid ${designTokens.surfaces.border}`,
            color: "#334155",
            "&:hover": {
              background: designTokens.surfaces.glassHover,
              transform: "translateY(-1px)",
            },
            "&:disabled": {
              background: "rgba(241, 245, 249, 0.5)",
              color: "#94a3b8",
            },
          },
        },
        {
          props: { variant: "glow" },
          style: {
            background: designTokens.gradients.techy,
            color: "#FFFFFF",
            boxShadow: designTokens.shadows.glow,
            "&:hover": {
              boxShadow: designTokens.shadows.glowHover,
              transform: "translateY(-2px)",
            },
            "&:disabled": {
              background: "#94a3b8",
              color: "#FFFFFF",
              boxShadow: "none",
            },
          },
        },
      ],
    },

    // ✅ Enhanced TextField with advanced glass morphism and smooth interactions
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "14px",
            background: designTokens.surfaces.glass,
            backdropFilter: designTokens.blur.sm,
            border: `1px solid ${designTokens.surfaces.border}`,
            transition: designTokens.animation.smooth,
            fontSize: "1rem",
            "&:hover": {
              background: designTokens.surfaces.glassHover,
              border: `1px solid rgba(59, 130, 246, 0.3)`,
              boxShadow: designTokens.shadows.surface,
            },
            "&:hover fieldset": {
              borderColor: "transparent",
            },
            "&.Mui-focused": {
              background: designTokens.surfaces.glassFocus,
              border: `1px solid #3b82f6`,
              boxShadow: designTokens.shadows.focus,
            },
            "&.Mui-focused fieldset": {
              borderColor: "transparent",
            },
            "&.Mui-error": {
              border: "1px solid #ef4444",
              background: "rgba(254, 242, 242, 0.9)",
            },
            "&.Mui-error fieldset": {
              borderColor: "transparent",
            },
            "&.Mui-disabled": {
              background: "rgba(241, 245, 249, 0.5)",
              color: "#94a3b8",
            },
            "& fieldset": {
              borderColor: "transparent",
            },
            "& input": {
              padding: "14px 16px",
              fontSize: "1rem",
              "&::placeholder": {
                color: "#94a3b8",
                opacity: 0.7,
              },
            },
            "& textarea": {
              padding: "14px 16px",
              fontSize: "1rem",
              "&::placeholder": {
                color: "#94a3b8",
                opacity: 0.7,
              },
            },
          },
          "& .MuiFormHelperText-root": {
            marginLeft: "4px",
            fontSize: "0.875rem",
            "&.Mui-error": {
              color: "#ef4444",
              fontWeight: 500,
            },
          },
          "& .MuiInputLabel-root": {
            color: "#64748b",
            fontWeight: 500,
            fontSize: "1rem",
            transform: "translate(16px, 14px) scale(1)",
            transition: designTokens.animation.smooth,
            "&.Mui-focused, &.MuiFormLabel-filled": {
              color: "#3b82f6",
              transform: "translate(16px, -9px) scale(0.85)",
              background: "rgba(255, 255, 255, 0.95)",
              padding: "0 8px",
              borderRadius: "6px",
              fontWeight: 600,
            },
            "&.Mui-error": {
              color: "#ef4444",
              transform: "translate(16px, -9px) scale(0.85)",
              background: "rgba(254, 242, 242, 0.95)",
              padding: "0 8px",
              borderRadius: "6px",
              fontWeight: 600,
            },
          },
          // Enhanced date input styling
          '&:has(input[type="date"]) .MuiInputLabel-root': {
            transform: "translate(16px, -9px) scale(0.85)",
            background: "rgba(255, 255, 255, 0.95)",
            padding: "0 8px",
            borderRadius: "6px",
            color: "#3b82f6",
            fontWeight: 600,
          },
          // Enhanced select styling
          "& .MuiSelect-select": {
            padding: "14px 16px",
            fontSize: "1rem",
          },
          "& .MuiSelect-icon": {
            color: "#64748b",
            transition: designTokens.animation.smooth,
          },
          "&:hover .MuiSelect-icon": {
            color: "#3b82f6",
          },
        },
      },
    },

    // ✅ Enhanced Select component
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: "14px",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent",
          },
        },
      },
    },

    // ✅ Enhanced Menu for selects and dropdowns
    MuiMenu: {
      styleOverrides: {
        paper: {
          background: designTokens.surfaces.glass,
          backdropFilter: designTokens.blur.lg,
          border: `1px solid ${designTokens.surfaces.border}`,
          boxShadow: designTokens.shadows.floating,
          borderRadius: "12px",
          marginTop: "4px",
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: "1rem",
          padding: "12px 16px",
          transition: designTokens.animation.smooth,
          "&:hover": {
            background: "rgba(59, 130, 246, 0.1)",
            color: "#3b82f6",
          },
          "&.Mui-selected": {
            background: "rgba(59, 130, 246, 0.15)",
            color: "#3b82f6",
            fontWeight: 600,
            "&:hover": {
              background: "rgba(59, 130, 246, 0.2)",
            },
          },
        },
      },
    },

    // ✅ Enhanced Dialog components
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: designTokens.surfaces.glass,
          backdropFilter: designTokens.blur.xl,
          border: `1px solid ${designTokens.surfaces.border}`,
          boxShadow: designTokens.shadows.floating,
          borderRadius: "20px",
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "#0f172a",
          padding: "24px 24px 16px",
        },
      },
    },

    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: "16px 24px",
          fontSize: "1rem",
          lineHeight: 1.6,
        },
      },
    },

    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "16px 24px 24px",
          gap: "12px",
        },
      },
    },

    // ✅ Enhanced Chip component
    MuiChip: {
      styleOverrides: {
        root: {
          background: designTokens.surfaces.glass,
          backdropFilter: designTokens.blur.sm,
          border: `1px solid ${designTokens.surfaces.border}`,
          borderRadius: "12px",
          fontWeight: 500,
          fontSize: "0.875rem",
          transition: designTokens.animation.smooth,
          "&:hover": {
            background: designTokens.surfaces.glassHover,
            transform: "translateY(-1px)",
          },
        },
        colorPrimary: {
          background: designTokens.gradients.primary,
          color: "#FFFFFF",
          border: "none",
          "&:hover": {
            background: designTokens.gradients.primaryHover,
          },
        },
        colorSecondary: {
          background: designTokens.gradients.secondary,
          color: "#FFFFFF",
          border: "none",
          "&:hover": {
            background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
          },
        },
      },
    },

    // ✅ Enhanced Card component
    MuiCard: {
      styleOverrides: {
        root: {
          background: designTokens.surfaces.glass,
          backdropFilter: designTokens.blur.md,
          border: `1px solid ${designTokens.surfaces.border}`,
          borderRadius: "16px",
          boxShadow: designTokens.shadows.surface,
          transition: designTokens.animation.smooth,
          overflow: "hidden",
          position: "relative",
          "&:hover": {
            boxShadow: designTokens.shadows.surfaceHover,
            transform: "translateY(-4px)",
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: designTokens.gradients.techy,
            opacity: 0.4,
          },
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: "24px",
          "&:last-child": {
            paddingBottom: "24px",
          },
        },
      },
    },

    // ✅ Enhanced Alert component
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          border: "none",
          backdropFilter: designTokens.blur.sm,
          fontSize: "0.95rem",
          fontWeight: 500,
        },
        standardSuccess: {
          background: "rgba(16, 185, 129, 0.1)",
          color: "#059669",
          "& .MuiAlert-icon": {
            color: "#10b981",
          },
        },
        standardError: {
          background: "rgba(239, 68, 68, 0.1)",
          color: "#dc2626",
          "& .MuiAlert-icon": {
            color: "#ef4444",
          },
        },
        standardWarning: {
          background: "rgba(245, 158, 11, 0.1)",
          color: "#d97706",
          "& .MuiAlert-icon": {
            color: "#f59e0b",
          },
        },
        standardInfo: {
          background: "rgba(6, 182, 212, 0.1)",
          color: "#0891b2",
          "& .MuiAlert-icon": {
            color: "#06b6d4",
          },
        },
      },
    },

    // ✅ Enhanced Snackbar
    MuiSnackbar: {
      styleOverrides: {
        root: {
          "& .MuiSnackbarContent-root": {
            background: designTokens.surfaces.glass,
            backdropFilter: designTokens.blur.lg,
            border: `1px solid ${designTokens.surfaces.border}`,
            borderRadius: "12px",
            color: "#334155",
            fontWeight: 500,
          },
        },
      },
    },

    // ✅ Enhanced Tooltip
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: designTokens.surfaces.glass,
          backdropFilter: designTokens.blur.md,
          border: `1px solid ${designTokens.surfaces.border}`,
          borderRadius: "8px",
          color: "#334155",
          fontSize: "0.875rem",
          fontWeight: 500,
          boxShadow: designTokens.shadows.surface,
        },
        arrow: {
          color: designTokens.surfaces.glass,
        },
      },
    },

    // ✅ Enhanced Tab components
    MuiTabs: {
      styleOverrides: {
        root: {
          background: designTokens.surfaces.glass,
          backdropFilter: designTokens.blur.sm,
          borderRadius: "12px",
          border: `1px solid ${designTokens.surfaces.border}`,
          minHeight: "48px",
        },
        indicator: {
          background: designTokens.gradients.primary,
          borderRadius: "4px",
          height: "3px",
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.95rem",
          minHeight: "48px",
          color: "#64748b",
          transition: designTokens.animation.smooth,
          "&:hover": {
            color: "#3b82f6",
            background: "rgba(59, 130, 246, 0.05)",
          },
          "&.Mui-selected": {
            color: "#3b82f6",
            fontWeight: 700,
          },
        },
      },
    },
  },
});

// ✅ Make font sizes responsive globally (no page edits needed)
theme = responsiveFontSizes(theme);

export default theme;
