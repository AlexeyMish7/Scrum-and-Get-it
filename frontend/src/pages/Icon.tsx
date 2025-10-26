// src/components/Icon.tsx
import React from "react";
import * as Icons from "@mui/icons-material";
import type { SvgIconProps } from '@mui/material/SvgIcon';
import { useTheme } from "@mui/material/styles";

/**
 * Centralized Icon system.
 * - Uses @mui/icons-material icons.
 * - Ensures consistent size, color, and accessibility.
 * - Allows easy replacement of the icon library in the future.
 */

interface IconProps extends SvgIconProps {
  name: keyof typeof Icons;
  colorType?: "primary" | "secondary" | "error" | "warning" | "success" | "info" | "text";
}

const Icon: React.FC<IconProps> = ({ name, colorType = "text", sx, ...props }) => {
  const theme = useTheme();
  const MUIIcon = Icons[name];

  if (!MUIIcon) {
    console.warn(`Icon "${name}" not found in @mui/icons-material`);
    return null;
  }

  const colorMap: Record<string, string> = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    error: theme.palette.error.main,
    warning: theme.palette.warning.main,
    success: theme.palette.success.main,
    info: theme.palette.info.main,
    text: theme.palette.text.primary,
  };

  return (
    <MUIIcon
      sx={{
        fontSize: 24,
        color: colorMap[colorType],
        verticalAlign: "middle",
        ...sx,
      }}
      {...props}
    />
  );
};

export default Icon;
