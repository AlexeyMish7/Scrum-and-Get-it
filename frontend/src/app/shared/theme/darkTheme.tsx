import { createTheme, alpha, type Shadows } from "@mui/material/styles";

// Glass-tuned shadows used for elevated surfaces
const glassShadows: Shadows = [
  "none",
  "0 1px 3px rgba(0,0,0,0.2)",
  "0 2px 6px rgba(0,0,0,0.24)",
  "0 8px 20px rgba(0,229,255,0.08)",
  ...Array(21).fill("0 12px 28px rgba(0,229,255,0.06)"),
] as unknown as Shadows;

// AI workspace theme: component tokens and sensible global styles.
const aiThemeCore = createTheme({
  palette: {
    mode: "dark",
    primary: {
      light: "#7BAFFF",
      main: "#3F7BFF",
      dark: "#1F4ED8",
      contrastText: "#F5F8FF",
    },
    secondary: {
      light: "#66FFF9",
      main: "#00E5FF",
      dark: "#00ACC1",
      contrastText: "#061018",
    },
    // Provide a very dark cyan/blue background for AI pages.
    background: {
      default: "#001F24",
      paper: alpha("#061018", 0.6),
    },
    divider: alpha("#7BE9FF", 0.18),
    text: {
      primary: "#DDEBFF",
      secondary: "rgba(189,214,255,.82)",
      disabled: "rgba(189,214,255,.42)",
    },
    info: { main: "#27C3FF" },
    success: { main: "#35F0B2" },
    warning: { main: "#FFC857" },
    error: { main: "#FF5573" },
  },
  typography: {
    fontFamily: [
      "Inter",
      "Segoe UI",
      "Roboto",
      "Helvetica Neue",
      "Arial",
      "sans-serif",
    ].join(","),
    h1: { fontWeight: 800, letterSpacing: "-0.2px" },
    h2: { fontWeight: 700, letterSpacing: "-0.2px" },
    h3: { fontWeight: 700, letterSpacing: "-0.1px" },
    h4: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 700 },
  },

  shape: { borderRadius: 12 },
  shadows: glassShadows,

  transitions: {
    duration: {
      shortest: 100,
      shorter: 120,
      short: 140,
      standard: 140,
      complex: 220,
      enteringScreen: 140,
      leavingScreen: 120,
    },
    easing: {
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        ":root": {
          "--motion-micro": "140ms ease-out",
          "--motion-enter": "240ms cubic-bezier(.2,.8,.2,1)",
          "--motion-exit": "220ms cubic-bezier(.2,.8,.2,1)",
          "--motion-hover-in": "220ms cubic-bezier(.22,.61,.36,1)",
          "--motion-hover-out": "180ms cubic-bezier(.4,0,.2,1)",
        },
        html: {
          scrollPaddingTop: "96px",
          [theme.breakpoints.down("sm")]: { scrollPaddingTop: "80px" },
        },
        "@keyframes underlineGrow": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },

        // Keep layout height; continuous background is applied to body
        "html, body, #root": { height: "100%" },
        // root should sit above decorative layers
        "#root": {
          position: "relative",
          zIndex: 1,
        },
        body: {
          position: "relative",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          textRendering: "optimizeLegibility",
          backgroundColor: theme.palette.background.default,
          backgroundImage:
            "linear-gradient(180deg, #001F24 0%, #002935 45%, #00121A 100%)",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          "@media (prefers-reduced-motion: reduce)": {
            "*": {
              animationDuration: "0.001ms !important",
              animationIterationCount: "1 !important",
              transitionDuration: "0.001ms !important",
              scrollBehavior: "auto !important",
            },
            "html, body, #root": { backgroundAttachment: "initial !important" },
          },
        },
        ".ai-glow": {
          textShadow: "0 0 10px rgba(76,157,255,0.5)",
          filter: "drop-shadow(0 0 12px rgba(63,123,255,0.32))",
        },
      }),
    },

    MuiTypography: {
      variants: [
        {
          props: { variant: "h1" },
          style: {
            color: "#7BAFFF",
            textShadow:
              "0 0 14px rgba(76,157,255,0.45), 0 0 30px rgba(0,229,255,0.14)",
            filter: "drop-shadow(0 0 12px rgba(63,123,255,0.28))",
          },
        },
        {
          props: { variant: "h2" },
          style: {
            color: "#6CA5FF",
            textShadow:
              "0 0 12px rgba(76,157,255,0.38), 0 0 22px rgba(0,229,255,0.12)",
            filter: "drop-shadow(0 0 9px rgba(63,123,255,0.22))",
          },
        },
        {
          props: { variant: "h3" },
          style: {
            color: "#5D97FF",
            textShadow:
              "0 0 10px rgba(76,157,255,0.32), 0 0 18px rgba(0,229,255,0.1)",
            filter: "drop-shadow(0 0 7px rgba(63,123,255,0.18))",
          },
        },
        {
          props: { variant: "h4" },
          style: {
            color: "#4F86FF",
            textShadow:
              "0 0 8px rgba(76,157,255,0.26), 0 0 14px rgba(0,229,255,0.08)",
            filter: "drop-shadow(0 0 5px rgba(63,123,255,0.14))",
          },
        },
        {
          props: { variant: "overline" },
          style: {
            color: "#00D0FF",
            fontWeight: 600,
            letterSpacing: "0.12em",
          },
        },
      ],
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          background:
            "linear-gradient(180deg, rgba(16,28,46,.78), rgba(9,16,28,.6))",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: `1px solid ${alpha("#7BAFFF", 0.22)}`,
          borderRadius: 12,
          boxShadow: "0 20px 40px rgba(4,12,24,0.55)",
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 1,
            borderRadius: "inherit",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.18), transparent 40%)",
            opacity: 0.45,
            pointerEvents: "none",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          position: "relative",
          borderRadius: 12,
          border: `1px solid ${alpha("#7BAFFF", 0.24)}`,
          background:
            "linear-gradient(180deg, rgba(16,28,46,.78), rgba(9,16,28,.6))",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          willChange: "transform, box-shadow, opacity",
          transition:
            "transform var(--motion-hover-out), box-shadow var(--motion-hover-out), background var(--motion-hover-out), border-color var(--motion-hover-out)",
          boxShadow: "0 20px 38px rgba(4,12,24,0.5)",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 1,
            borderRadius: "inherit",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.16), transparent 42%)",
            opacity: 0.42,
            pointerEvents: "none",
            transition: "opacity var(--motion-hover-out)",
          },
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
            transform: "none",
            "&:hover": {
              transform: "none",
              boxShadow: "0 20px 38px rgba(4,12,24,0.5)",
              borderColor: alpha("#7BAFFF", 0.24),
              "&::before": { opacity: 0.42 },
            },
          },
          "&:hover": {
            transform: "translateY(-1px)",
            transition:
              "transform var(--motion-hover-in), box-shadow var(--motion-hover-in), background var(--motion-hover-in), border-color var(--motion-hover-in)",
            boxShadow:
              "0 26px 44px rgba(18,48,108,0.46), 0 0 0 1px rgba(0,229,255,.18)",
            borderColor: alpha("#00E5FF", 0.32),
            "&::before": {
              opacity: 0.56,
              transition: "opacity var(--motion-hover-in)",
            },
          },
          // Subtle static gradient overlay (no sweeping shine)
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(120% 60% at 0% 0%, rgba(102,170,255,.16), transparent 60%), radial-gradient(120% 60% at 100% 0%, rgba(21,63,190,.14), transparent 60%)",
            opacity: 0,
            pointerEvents: "none",
            transition: "opacity var(--motion-hover-out)",
          },
          "&:hover::after": {
            opacity: 0.18,
            transition: "opacity var(--motion-hover-in)",
          },
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          background:
            "linear-gradient(180deg, rgba(11,22,44,.62), rgba(9,18,36,.42))",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: `1px solid ${alpha("#7BE9FF", 0.18)}`,
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 20,
          paddingBlock: 10,
          willChange:
            "transform, box-shadow, background-position, color, border-color",
          transition:
            "transform var(--motion-hover-out), box-shadow var(--motion-hover-out), background var(--motion-hover-out), border-color var(--motion-hover-out), color var(--motion-hover-out), background-position var(--motion-hover-out)",
          "&:hover": {
            transform: "translateY(-2px)",
            transition:
              "transform var(--motion-hover-in), box-shadow var(--motion-hover-in), background var(--motion-hover-in), border-color var(--motion-hover-in), color var(--motion-hover-in), background-position var(--motion-hover-in)",
          },
          "&:active": { transform: "translateY(0) scale(.985)" },
          "&:focus-visible": {
            boxShadow:
              "0 0 0 2px rgba(8,16,28,0.82), 0 0 0 4px rgba(76,157,255,0.3)",
            outline: 0,
          },
          position: "relative",
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
            transform: "none",
            "&:hover": { transform: "none" },
            "&:active": { transform: "none" },
          },
        },
        contained: {
          backgroundImage:
            "linear-gradient(135deg, #4C9DFF 0%, #3F7BFF 45%, #1F4ED8 100%)",
          backgroundSize: "200% 100%",
          backgroundPosition: "0% 50%",
          color: "#F7FAFF",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,.22), 0 10px 24px rgba(18,54,162,.4)",
          "&:hover": {
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,.24), 0 16px 32px rgba(18,54,162,.42)",
            backgroundPosition: "100% 50%",
          },
          "&::before": {
            content: '""',
            position: "absolute",
            left: 1,
            right: 1,
            top: 1,
            height: "46%",
            borderTopLeftRadius: 11,
            borderTopRightRadius: 11,
            background:
              "linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,.06) 60%, rgba(255,255,255,0))",
            pointerEvents: "none",
            transition: "opacity var(--motion-hover-out)",
            opacity: 0.85,
          },
          "&:hover::before": { opacity: 1 },
          "&:active::before": { opacity: 0.75 },
          "&.Mui-disabled": {
            backgroundColor: "rgba(45,74,140,.34)",
            color: "rgba(214,228,255,.48)",
            boxShadow: "none",
          },
        },
        outlined: {
          border: "1px solid transparent",
          background:
            "linear-gradient(rgba(16,22,30,.45), rgba(16,22,30,.45)) padding-box, linear-gradient(135deg, #4C9DFF, #00E5FF) border-box",
          color: "#E0EDFF",
          "&:hover": {
            background:
              "linear-gradient(rgba(16,22,30,.62), rgba(16,22,30,.62)) padding-box, linear-gradient(135deg, #4C9DFF, #00E5FF) border-box",
          },
          "&:focus-visible": {
            boxShadow:
              "0 0 0 2px rgba(8,16,28,0.82), 0 0 0 4px rgba(76,157,255,0.3)",
            outline: 0,
          },
        },
        text: {
          position: "relative",
          color: "#7BAFFF",
          fontWeight: 600,
          letterSpacing: "0.02em",
          "&::after": {
            content: '""',
            position: "absolute",
            left: 8,
            right: 8,
            bottom: 6,
            height: 2,
            background:
              "linear-gradient(90deg, #4C9DFF 0%, #3F7BFF 50%, #00E5FF 100%)",
            transformOrigin: "left",
            transform: "scaleX(0.35)",
            opacity: 0.45,
            transition:
              "transform var(--motion-micro), opacity var(--motion-micro)",
          },
          "&:hover": { color: "#8EC2FF" },
          "&:hover::after, &:focus-visible::after": {
            transform: "scaleX(1)",
            opacity: 1,
          },
        },
      },
    },
    MuiLoadingButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 20,
          paddingBlock: 10,
          willChange:
            "transform, box-shadow, background-position, color, border-color",
          transition:
            "transform var(--motion-hover-out), box-shadow var(--motion-hover-out), background var(--motion-hover-out), border-color var(--motion-hover-out), color var(--motion-hover-out), background-position var(--motion-hover-out)",
          "&:hover": {
            transform: "translateY(-2px)",
            transition:
              "transform var(--motion-hover-in), box-shadow var(--motion-hover-in), background var(--motion-hover-in), border-color var(--motion-hover-in), color var(--motion-hover-in), background-position var(--motion-hover-in)",
          },
          "&:active": { transform: "translateY(0) scale(.985)" },
          "&:focus-visible": {
            boxShadow:
              "0 0 0 2px rgba(8,16,28,0.82), 0 0 0 4px rgba(76,157,255,0.3)",
            outline: 0,
          },
          position: "relative",
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
            transform: "none",
            "&:hover": { transform: "none" },
            "&:active": { transform: "none" },
          },
        },
        contained: {
          backgroundImage:
            "linear-gradient(135deg, #4C9DFF 0%, #3F7BFF 45%, #1F4ED8 100%)",
          backgroundSize: "200% 100%",
          backgroundPosition: "0% 50%",
          color: "#F7FAFF",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,.22), 0 10px 24px rgba(18,54,162,.4)",
          "&:hover": {
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,.24), 0 16px 32px rgba(18,54,162,.42)",
            backgroundPosition: "100% 50%",
          },
          "&::before": {
            content: '""',
            position: "absolute",
            left: 1,
            right: 1,
            top: 1,
            height: "46%",
            borderTopLeftRadius: 11,
            borderTopRightRadius: 11,
            background:
              "linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,.06) 60%, rgba(255,255,255,0))",
            pointerEvents: "none",
            transition: "opacity var(--motion-hover-out)",
            opacity: 0.85,
          },
          "&:hover::before": { opacity: 1 },
          "&:active::before": { opacity: 0.75 },
        },
        outlined: {
          border: "1px solid transparent",
          background:
            "linear-gradient(rgba(16,22,30,.45), rgba(16,22,30,.45)) padding-box, linear-gradient(135deg, #4C9DFF, #00E5FF) border-box",
          color: "#E0EDFF",
          "&:hover": {
            background:
              "linear-gradient(rgba(16,22,30,.62), rgba(16,22,30,.62)) padding-box, linear-gradient(135deg, #4C9DFF, #00E5FF) border-box",
          },
          "&:focus-visible": {
            boxShadow:
              "0 0 0 2px rgba(8,16,28,0.82), 0 0 0 4px rgba(76,157,255,0.3)",
            outline: 0,
          },
        },
        text: {
          position: "relative",
          color: "#7BAFFF",
          fontWeight: 600,
          letterSpacing: "0.02em",
          "&::after": {
            content: '""',
            position: "absolute",
            left: 8,
            right: 8,
            bottom: 6,
            height: 2,
            background:
              "linear-gradient(90deg, #4C9DFF 0%, #3F7BFF 50%, #00E5FF 100%)",
            transformOrigin: "left",
            transform: "scaleX(0.35)",
            opacity: 0.45,
            transition:
              "transform var(--motion-micro), opacity var(--motion-micro)",
          },
          "&:hover": { color: "#8EC2FF" },
          "&:hover::after, &:focus-visible::after": {
            transform: "scaleX(1)",
            opacity: 1,
          },
        },
      },
    },
    MuiTextField: { defaultProps: { variant: "outlined" } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(10,18,30,.52)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          transition:
            "background-color var(--motion-micro), border-color var(--motion-micro), box-shadow var(--motion-micro)",
          "& fieldset": { borderColor: "rgba(76,157,255,.24)" },
          "&:hover fieldset": { borderColor: "rgba(76,157,255,.38)" },
          "&.Mui-focused fieldset": {
            borderColor: "rgba(76,157,255,.62)",
            boxShadow:
              "inset 0 0 0 1px rgba(76,157,255,.32), 0 0 0 3px rgba(63,123,255,.24)",
          },
          ".MuiOutlinedInput-input::placeholder": {
            color: "rgba(189,214,255,.32)",
            opacity: 1,
          },
          ".MuiSvgIcon-root": {
            color: "rgba(189,214,255,.32)",
            transition: "color var(--motion-micro)",
          },
          "&.Mui-focused .MuiSvgIcon-root": { color: "#7BAFFF" },
          "& input[type='date']": { paddingRight: 8 },
          "& input[type='date']::-webkit-calendar-picker-indicator": {
            filter: "drop-shadow(0 0 4px rgba(76,157,255,.35))",
          },
          "&.Mui-error fieldset": { borderColor: "rgba(255,85,115,.55)" },
          "&.Mui-error.Mui-focused fieldset": {
            borderColor: "rgba(255,85,115,.75)",
            boxShadow:
              "inset 0 0 0 1px rgba(255,85,115,.35), 0 0 0 3px rgba(255,85,115,.35)",
          },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: { root: { color: "rgba(189,214,255,.72)" } },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: alpha("#3F7BFF", 0.12),
          border: `1px solid ${alpha("#3F7BFF", 0.32)}`,
          boxShadow: "none",
          transition:
            "background-color var(--motion-micro), border-color var(--motion-micro), box-shadow var(--motion-micro)",
          "& .MuiChip-label": {
            color: "#DDEBFF",
            fontWeight: 600,
            letterSpacing: "0.02em",
          },
          "&.MuiChip-filledPrimary, &.MuiChip-filledSecondary, &.MuiChip-colorPrimary.MuiChip-filled":
            {
              backgroundColor: alpha("#3F7BFF", 0.18),
              borderColor: alpha("#00E5FF", 0.36),
              boxShadow: "0 0 12px rgba(63,123,255,0.28)",
            },
          "&.MuiChip-outlined": {
            borderColor: alpha("#3F7BFF", 0.28),
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 999,
          backgroundImage:
            "linear-gradient(90deg, #4C9DFF 0%, #3F7BFF 60%, #00E5FF 100%)",
          boxShadow: "0 4px 18px rgba(63,123,255,.32)",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "rgba(12,18,26,.9)",
          border: `1px solid ${alpha("#7BAFFF", 0.26)}`,
          backdropFilter: "blur(10px)",
          borderRadius: 10,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background:
            "linear-gradient(180deg, rgba(18,24,32,.82), rgba(12,18,26,.7))",
          border: `1px solid ${alpha("#7BAFFF", 0.26)}`,
          backdropFilter: "blur(20px)",
          borderRadius: 12,
        },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: alpha("#3F7BFF", 0.22) } },
    },
  },
});

export default aiThemeCore;
