/**
 * BACK BUTTON COMPONENT
 * Reusable back navigation button for consistent UX.
 *
 * FEATURES:
 * - Custom back path or browser back()
 * - Optional label text
 * - Icon + text layout
 * - Keyboard accessible
 *
 * USAGE:
 * ```tsx
 * // Browser back
 * <BackButton />
 *
 * // Custom path
 * <BackButton to="/jobs" label="Back to Jobs" />
 * ```
 */

import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

interface BackButtonProps {
  to?: string;
  label?: string;
  variant?: "text" | "outlined" | "contained";
  size?: "small" | "medium" | "large";
}

export default function BackButton({
  to,
  label = "Back",
  variant = "text",
  size = "medium",
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      startIcon={<ArrowBack />}
      onClick={handleClick}
      sx={{ mb: 2 }}
    >
      {label}
    </Button>
  );
}
