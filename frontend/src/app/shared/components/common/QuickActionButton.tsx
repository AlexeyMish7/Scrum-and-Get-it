/**
 * QuickActionButton Component
 *
 * Reusable button with consistent styling for quick actions in navigation bars.
 * Supports both navigation (via React Router Link) and click handlers.
 *
 * Usage:
 *   // Navigation variant
 *   <QuickActionButton label="New Job" to="/jobs/new" startIcon={<AddIcon />} />
 *
 *   // Click handler variant
 *   <QuickActionButton label="Export" onClick={handleExport} color="success" />
 *
 * Features:
 * - Automatic NavLink integration when `to` prop is provided
 * - MUI Material-UI button with consistent styling
 * - Icon support via startIcon prop
 * - Size and color variants
 * - No text transform (maintains natural casing)
 */

import { Button } from "@mui/material";
import { NavLink } from "react-router-dom";
import React from "react";

type QuickActionButtonProps = {
  /** Button text label */
  label: string;
  /** Route path for navigation (uses NavLink when provided) */
  to?: string;
  /** Click handler (only used when `to` is not provided) */
  onClick?: () => void;
  /** Optional icon to display before label */
  startIcon?: React.ReactNode;
  /** Button color variant */
  color?: "primary" | "secondary" | "inherit" | "success" | "error";
  /** Button size */
  size?: "small" | "medium";
};

export default function QuickActionButton({
  label,
  to,
  onClick,
  startIcon,
  color = "primary",
  size = "small",
}: QuickActionButtonProps) {
  if (to) {
    return (
      <Button
        component={NavLink}
        to={to}
        startIcon={startIcon}
        variant="contained"
        color={color}
        size={size}
        sx={{ textTransform: "none" }}
      >
        {label}
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      startIcon={startIcon}
      variant="contained"
      color={color}
      size={size}
      sx={{ textTransform: "none" }}
    >
      {label}
    </Button>
  );
}
