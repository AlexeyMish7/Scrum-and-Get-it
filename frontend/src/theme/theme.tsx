import { createTheme, responsiveFontSizes } from "@mui/material/styles";

// Module augmentation to let MUI know about @mui/lab's LoadingButton
declare module "@mui/material/styles" {
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
  }
}
declare module "@mui/lab/LoadingButton" {
  interface LoadingButtonPropsVariantOverrides {
    primary: true;
    secondary: true;
    tertiary: true;
    destructive: true;
  }
}

let theme = createTheme({
  palette: {
    primary: {
      main: "#3b82f6", // Modern blue
      light: "#60a5fa",
      dark: "#1e40af",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#f97316", // Modern orange
      light: "#fb923c",
      dark: "#ea580c",
      contrastText: "#FFFFFF",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
      contrastText: "#FFFFFF",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
      contrastText: "#000000",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
      contrastText: "#FFFFFF",
    },
    info: {
      main: "#06b6d4",
      light: "#22d3ee",
      dark: "#0891b2",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)",
      paper: "rgba(255, 255, 255, 0.95)",
    },
    text: {
      primary: "#1e293b",
      secondary: "#64748b",
    },
  },

  typography: {
    fontFamily: `'Inter', sans-serif`,

    h1: {
      fontFamily: `'Inter', sans-serif`,
      fontSize: "3rem",
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: "-0.02em",
      background: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    h2: {
      fontFamily: `'Inter', sans-serif`,
      fontSize: "2.25rem",
      fontWeight: 600,
      lineHeight: 1.25,
      color: "#1e293b",
      letterSpacing: "-0.01em",
    },
    h3: {
      fontFamily: `'Inter', sans-serif`,
      fontSize: "1.75rem",
      fontWeight: 600,
      lineHeight: 1.3,
      color: "#1e293b",
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
      color: "#1e293b",
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.45,
      color: "#1e293b",
    },
    h6: {
      fontSize: "1.05rem",
      fontWeight: 600,
      lineHeight: 1.5,
      color: "#1e293b",
    },
    body1: {
      fontSize: "1rem",
      fontWeight: 400,
      lineHeight: 1.7,
      color: "#475569",
    },
    body2: {
      fontSize: "0.9rem",
      fontWeight: 400,
      lineHeight: 1.6,
      color: "#64748b",
    },
    caption: {
      fontSize: "0.75rem",
      fontWeight: 500,
      letterSpacing: "0.02em",
      textTransform: "uppercase",
      color: "#94a3b8",
    },
  },

  components: {
    // ✅ GLOBAL resets, page layout, responsive typography + padding
    MuiCssBaseline: {
      styleOverrides: (themeParam) => ({
        h1: { ...themeParam.typography.h1 },
        h2: { ...themeParam.typography.h2 },
        h3: { ...themeParam.typography.h3 },
        h4: { ...themeParam.typography.h4 },
        h5: { ...themeParam.typography.h5 },
        h6: { ...themeParam.typography.h6 },
        p: { ...themeParam.typography.body1 },

        // ✅ Base universal page layout adjustments
        body: {
          margin: 0,
          padding: 0,
          background: `
            linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%),
            radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)
          `,
          backgroundAttachment: "fixed",
          backgroundSize: "100% 100%, 600px 600px, 400px 400px",
          fontFamily: "'Inter', sans-serif",
          overflowX: "hidden",
        },
        "#root": {
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          boxSizing: "border-box",
          padding: "0 5px 24px 5px", // ⬅ removes top padding
          "@media (min-width:900px)": { padding: "0 5px 32px 5px" },
          position: "relative",
          "&::before": {
            content: '""',
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%),
              radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)
            `,
            pointerEvents: "none",
            zIndex: -1,
          },
        },
        button: {
          minHeight: "48px",
          minWidth: "48px", // ensure touch accessibility
        },
        input: {
          fontSize: "16px", // prevent zoom on iOS
          boxSizing: "border-box",
        },
        textarea: {
          fontSize: "16px",
        },
        /* Global helper classes for the glossy theme so pages can opt-in without bespoke CSS files */
        ".glossy-card": {
          borderRadius: 12,
          background: themeParam.palette.background.paper,
          boxShadow: "0 12px 36px rgba(16,24,40,0.06)",
          border: "1px solid rgba(75,139,255,0.06)",
          padding: "20px",
        },
        ".glossy-timeline-container": {
          background: themeParam.palette.background.paper,
          borderRadius: 12,
          padding: "30px",
          marginTop: "-8px",
          boxShadow: "0 12px 36px rgba(16,24,40,0.06)",
          border: "1px solid rgba(75,139,255,0.06)",
        },
        ".glossy-title": {
          ...themeParam.typography.h5,
          color: themeParam.palette.text.primary,
          margin: 0,
        },
        ".glossy-subtitle": {
          ...themeParam.typography.body2,
          color: themeParam.palette.text.secondary,
          margin: 0,
        },
        ".glossy-btn": {
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          borderRadius: 10,
          padding: "10px 16px",
          color: "#fff",
          background: "linear-gradient(135deg, #3b82f6 0%, #6aa5ff 100%)",
          boxShadow: "0 8px 20px rgba(59,130,246,0.18)",
        },
      }),
    },

    // Global Paper/Card defaults - keep cards consistent across the app
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          background: "rgba(255, 255, 255, 0.95)",
          boxShadow: "0 8px 20px rgba(16,24,40,0.06)",
          border: "1px solid rgba(75,139,255,0.06)",
        },
      },
    },

    // ---- Button variants ----
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 12,
          fontWeight: 600,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:active": {
            transform: "scale(0.98)",
          },
        },
        sizeSmall: { padding: "8px 16px", fontSize: "0.875rem" },
        sizeMedium: { padding: "12px 24px", fontSize: "0.9rem" },
        sizeLarge: { padding: "14px 28px", fontSize: "1rem" },
      },
      variants: [
        {
          props: { variant: "primary" },
          style: {
            background: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
            color: "#FFFFFF",
            boxShadow: "0 4px 14px 0 rgba(59, 130, 246, 0.3)",
            "&:hover": {
              background: "linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)",
              boxShadow: "0 6px 20px 0 rgba(59, 130, 246, 0.4)",
              transform: "translateY(-1px)",
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
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            color: "#3b82f6",
            boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.1)",
            "&:hover": {
              background: "rgba(255, 255, 255, 0.95)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              boxShadow: "0 4px 12px 0 rgba(0, 0, 0, 0.15)",
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
            background: "linear-gradient(135deg,#ef4444 0%, #dc2626 100%)",
            color: "#FFFFFF",
            boxShadow: "0 6px 18px rgba(239,68,68,0.18)",
            borderRadius: 10,
            padding: "8px 12px",
            "&:hover": {
              background: "linear-gradient(135deg,#dc2626 0%, #b91c1c 100%)",
              boxShadow: "0 8px 22px rgba(219,39,39,0.2)",
              transform: "translateY(-1px)",
            },
            "&:disabled": {
              background: "#f1f5f9",
              color: "#94a3b8",
              boxShadow: "none",
            },
          },
        },
        {
          props: { variant: "tertiary" },
          style: {
            border: "1px solid #3b82f6",
            color: "#3b82f6",
            backgroundColor: "transparent",
            "&:hover": {
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              border: "1px solid #2563eb",
            },
            "&:disabled": {
              color: "#94a3b8",
              borderColor: "#94a3b8",
            },
          },
        },
      ],
    },

    // ---- Loading Button (from @mui/lab)
    MuiLoadingButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 500,
          "&.Mui-disabled": { opacity: 0.6 },
          "&:active": { transform: "scale(0.98)" },
        },
      },
      variants: [
        {
          props: { variant: "primary" },
          style: {
            backgroundColor: "#1976D2",
            color: "#FFFFFF",
            "&:hover": { backgroundColor: "#1565C0" },
            "&:disabled": { backgroundColor: "#90CAF9", color: "#FFFFFF" },
          },
        },
        {
          props: { variant: "secondary" },
          style: {
            backgroundColor: "#E0E0E0",
            color: "#212529",
            "&:hover": { backgroundColor: "#BDBDBD" },
            "&:disabled": { backgroundColor: "#EEEEEE", color: "#9E9E9E" },
          },
        },
        {
          props: { variant: "tertiary" },
          style: {
            border: "1px solid #1976D2",
            color: "#1976D2",
            backgroundColor: "transparent",
            "&:hover": { backgroundColor: "#E3F2FD" },
            "&:disabled": { color: "#90CAF9", borderColor: "#90CAF9" },
          },
        },
      ],
    },

    // ---- TextField input styling ----
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              boxShadow: "0 2px 8px 0 rgba(59, 130, 246, 0.1)",
            },
            "&:hover fieldset": {
              borderColor: "transparent",
            },
            "&.Mui-focused": {
              backgroundColor: "#FFFFFF",
              border: "1px solid #3b82f6",
              boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "transparent",
            },
            "&.Mui-error": {
              border: "1px solid #ef4444",
            },
            "&.Mui-error fieldset": {
              borderColor: "transparent",
            },
            "& fieldset": {
              borderColor: "transparent",
            },
          },
          "& .MuiFormHelperText-root.Mui-error": {
            color: "#ef4444",
            fontWeight: 500,
          },
          "& .MuiInputLabel-root": {
            color: "#64748b",
            fontWeight: 500,
            // Ensure the label floats above the outlined input and does not
            // sit in the middle of the input border. We position the label
            // and provide a small background so it masks the outline when
            // floating — this keeps label behavior consistent across pages.
            transform: "translate(14px, 12px) scale(1)",
            transition: "all 150ms cubic-bezier(0.0, 0, 0.2, 1)",
          },
          "& .MuiInputLabel-root.Mui-focused, & .MuiInputLabel-root.MuiFormLabel-filled":
            {
              color: "#3b82f6",
              transform: "translate(14px, -8px) scale(0.85)",
              // Give the floating label a matching background so it doesn't
              // visually collide with the input outline.
              background: "rgba(255, 255, 255, 0.95)",
              padding: "0 8px",
              borderRadius: 4,
            },
          // When there's an error, ensure the label uses the error color and
          // still floats correctly.
          "& .MuiInputLabel-root.Mui-error": {
            color: "#ef4444",
            transform: "translate(14px, -8px) scale(0.85)",
            background: "rgba(255, 255, 255, 0.95)",
            padding: "0 8px",
            borderRadius: 4,
          },
          // For date inputs the browser shows a native placeholder (eg. mm/dd/yyyy)
          // which can visually clash with the floating label. Use the :has selector
          // to detect TextFields that contain a date input and force the label to
          // be in its floated/shrunk position so the native hint and label don't overlap.
          // Note: :has is supported in modern browsers (Chromium, Safari, Edge). If
          // you need to support very old browsers, we can fall back to setting
          // InputLabelProps={{ shrink: true }} on individual date fields.
          '&:has(input[type="date"]) .MuiInputLabel-root': {
            transform: "translate(14px, -8px) scale(0.85)",
            background: "rgba(255, 255, 255, 0.95)",
            padding: "0 8px",
            borderRadius: 4,
            color: "#3b82f6",
          },
        },
      },
    },
  },
});

// ✅ Make font sizes responsive globally (no page edits needed)
theme = responsiveFontSizes(theme);

export default theme;
