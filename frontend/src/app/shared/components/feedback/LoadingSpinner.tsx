import { Box, CircularProgress, Typography } from "@mui/material";

/**
 * LOADING SPINNER COMPONENT
 *
 * Standardized loading indicator with consistent sizing and optional message.
 * Use this component for all loading states to maintain UI consistency.
 *
 * Usage:
 *   <LoadingSpinner />
 *   <LoadingSpinner size="large" message="Loading your data..." />
 *   <LoadingSpinner size="small" />
 *
 * Features:
 * - Three size variants: small (24px), medium (40px), large (60px)
 * - Optional loading message
 * - Centered by default (can be overridden with sx prop)
 * - Accessible with aria-label
 */

type LoadingSpinnerSize = "small" | "medium" | "large";

interface LoadingSpinnerProps {
  size?: LoadingSpinnerSize;
  message?: string;
  fullHeight?: boolean; // If true, centers in full viewport height
  sx?: object; // Allow custom MUI sx styling
}

// Size mapping for CircularProgress component
const sizeMap: Record<LoadingSpinnerSize, number> = {
  small: 24,
  medium: 40,
  large: 60,
};

export default function LoadingSpinner({
  size = "medium",
  message,
  fullHeight = false,
  sx,
}: LoadingSpinnerProps) {
  const spinnerSize = sizeMap[size];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        minHeight: fullHeight ? "100vh" : "auto",
        py: fullHeight ? 0 : 4,
        ...sx,
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Spinner */}
      <CircularProgress size={spinnerSize} thickness={4} aria-label="Loading" />

      {/* Optional Message */}
      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center" }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
}
