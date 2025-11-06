// Central MUI module augmentations for custom variants/components

import "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Components {
    // Ensure theme.components.MuiLoadingButton is allowed when overrides are added
    MuiLoadingButton?: unknown;
  }
}

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
