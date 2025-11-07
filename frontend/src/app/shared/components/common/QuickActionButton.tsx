import { Button } from "@mui/material";
import { NavLink } from "react-router-dom";
import React from "react";

type QuickActionButtonProps = {
  label: string;
  to?: string;
  onClick?: () => void;
  startIcon?: React.ReactNode;
  color?: "primary" | "secondary" | "inherit" | "success" | "error";
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
