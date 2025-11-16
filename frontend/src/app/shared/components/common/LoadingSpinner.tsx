import { CircularProgress, Box, useTheme } from "@mui/material";

/**
 * LOADING SPINNER COMPONENT
 *
 * Centered loading indicator that respects the current theme.
 * Used throughout the app for async data loading states.
 *
 * Features:
 * - Theme-aware color (uses primary color from active theme)
 * - Centered in viewport with consistent spacing
 * - Accessible with implicit loading role
 */
export default function LoadingSpinner() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        height: "70vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <CircularProgress size={70} sx={{ color: theme.palette.primary.main }} />
    </Box>
  );
}
