import React from "react";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import { useTheme } from "@mui/material/styles";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";

/**
 * Centralized Icon system.
 * - Uses @mui/icons-material icons.
 * - Ensures consistent size, color, and accessibility.
 * - Allows easy replacement of the icon library in the future.
 */

const ICONS = {
  Download: DownloadIcon,
  Edit: EditIcon,
} as const;

type IconName = keyof typeof ICONS;

interface IconProps extends SvgIconProps {
  name: IconName;
  size?: number;
  colorType?:
    | "primary"
    | "secondary"
    | "error"
    | "warning"
    | "success"
    | "info"
    | "text";
}

const Icon: React.FC<IconProps> = ({
  name,
  size,
  colorType = "text",
  sx,
  ...props
}) => {
  const theme = useTheme();

  const MUIIcon = ICONS[name];

  const colorMap: Record<string, string> = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    error: theme.palette.error.main,
    warning: theme.palette.warning.main,
    success: theme.palette.success.main,
    info: theme.palette.info.main,
    text: theme.palette.text.primary,
  };

  const allowMuiColorPropToControlColor =
    props.color !== undefined || props.htmlColor !== undefined;

  return (
    <MUIIcon
      sx={{
        fontSize: size ?? 24,
        ...(allowMuiColorPropToControlColor
          ? {}
          : { color: colorMap[colorType] }),
        verticalAlign: "middle",
        ...sx,
      }}
      {...props}
    />
  );
};

export default Icon;
