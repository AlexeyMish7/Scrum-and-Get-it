/**
 * Theme Settings Panel
 *
 * A reusable component for theme customization that can be used in:
 * - Profile dropdown (compact mode)
 * - Settings page (full mode)
 *
 * Features:
 * - Light/Dark mode toggle
 * - Theme preset selector with visual previews
 * - Border radius mode toggle (tiny vs default)
 */

import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  Card,
  CardActionArea,
  Stack,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ImageIcon from "@mui/icons-material/Image";
import GradientIcon from "@mui/icons-material/Gradient";
import GridViewIcon from "@mui/icons-material/GridView";
import {
  useThemeContext,
  type BackgroundMode,
} from "@shared/context/ThemeContext";
import { allPresets, type PresetId } from "@shared/theme";

interface ThemeSettingsPanelProps {
  /** Compact mode for dropdown menus - shows only mode toggle */
  compact?: boolean;
  /** Show preset selector */
  showPresets?: boolean;
  /** Show radius mode toggle */
  showRadiusMode?: boolean;
  /** Show background mode toggle */
  showBackgroundMode?: boolean;
  /** Callback when any setting changes (for closing menus etc.) */
  onSettingChange?: () => void;
}

/**
 * Color swatch component for preset preview
 */
function ColorSwatch({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        border: "1px solid",
        borderColor: "divider",
        flexShrink: 0,
      }}
    />
  );
}

/**
 * Preset card with visual preview of colors
 */
function PresetCard({
  name,
  description,
  isSelected,
  colors,
  onClick,
}: {
  name: string;
  description: string;
  isSelected: boolean;
  colors: { primary: string; secondary: string; background: string };
  onClick: () => void;
}) {
  const theme = useTheme();

  return (
    <Card
      elevation={isSelected ? 3 : 1}
      sx={{
        border: isSelected
          ? `2px solid ${theme.palette.primary.main}`
          : "1px solid",
        borderColor: isSelected ? "primary.main" : "divider",
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: "primary.light",
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ p: 1.5 }}>
        <Stack spacing={1}>
          {/* Color preview bar */}
          <Box
            sx={{
              height: 32,
              borderRadius: 1,
              background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primary} 50%, ${colors.secondary} 50%, ${colors.secondary} 100%)`,
              border: "1px solid",
              borderColor: "divider",
            }}
          />

          {/* Preset info */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                {name}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                {description}
              </Typography>
            </Box>
            {isSelected && <CheckCircleIcon color="primary" fontSize="small" />}
          </Stack>

          {/* Color swatches */}
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Primary">
              <Box>
                <ColorSwatch color={colors.primary} />
              </Box>
            </Tooltip>
            <Tooltip title="Secondary">
              <Box>
                <ColorSwatch color={colors.secondary} />
              </Box>
            </Tooltip>
            <Tooltip title="Background">
              <Box>
                <ColorSwatch color={colors.background} />
              </Box>
            </Tooltip>
          </Stack>
        </Stack>
      </CardActionArea>
    </Card>
  );
}

export function ThemeSettingsPanel({
  compact = false,
  showPresets = true,
  showRadiusMode = true,
  showBackgroundMode = true,
  onSettingChange,
}: ThemeSettingsPanelProps) {
  const theme = useTheme();
  const {
    mode,
    toggleMode,
    radiusMode,
    toggleRadiusMode,
    currentPreset,
    applyPreset,
    clearPreset,
    backgroundMode,
    setBackgroundMode,
  } = useThemeContext();

  // Filter presets to show only those matching current mode
  const filteredPresets = allPresets.filter(
    (preset) => preset.meta.mode === mode
  );

  const handleModeChange = () => {
    toggleMode();
    onSettingChange?.();
  };

  const handlePresetChange = (presetId: PresetId | null) => {
    if (presetId) {
      applyPreset(presetId);
    } else {
      clearPreset();
    }
    onSettingChange?.();
  };

  const handleRadiusModeChange = () => {
    toggleRadiusMode();
    onSettingChange?.();
  };

  const handleBackgroundModeChange = (newBgMode: BackgroundMode) => {
    setBackgroundMode(newBgMode);
    onSettingChange?.();
  };

  // Compact mode: just show mode toggle
  if (compact) {
    return (
      <Stack spacing={1} sx={{ minWidth: 180 }}>
        <Typography variant="overline" color="text.secondary" sx={{ px: 1 }}>
          Appearance
        </Typography>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          fullWidth
          size="small"
          sx={{ px: 1 }}
        >
          <ToggleButton value="light" sx={{ gap: 0.5 }}>
            <LightModeIcon fontSize="small" />
            Light
          </ToggleButton>
          <ToggleButton value="dark" sx={{ gap: 0.5 }}>
            <DarkModeIcon fontSize="small" />
            Dark
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    );
  }

  // Full mode: show all settings
  return (
    <Stack spacing={3}>
      {/* Mode Toggle */}
      <Box>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Color Mode
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Choose between light and dark appearance
        </Typography>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          size="medium"
        >
          <ToggleButton value="light" sx={{ gap: 1, px: 3 }}>
            <LightModeIcon />
            Light
          </ToggleButton>
          <ToggleButton value="dark" sx={{ gap: 1, px: 3 }}>
            <DarkModeIcon />
            Dark
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Preset Selector */}
      {showPresets && (
        <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Theme Preset
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Choose a pre-configured color scheme
          </Typography>

          {/* Default option */}
          <Card
            elevation={!currentPreset ? 2 : 0}
            sx={{
              mb: 2,
              border: !currentPreset
                ? `2px solid ${theme.palette.primary.main}`
                : "1px solid",
              borderColor: !currentPreset ? "primary.main" : "divider",
            }}
          >
            <CardActionArea
              onClick={() => handlePresetChange(null)}
              sx={{ p: 1.5 }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Default
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Use the standard {mode} theme
                  </Typography>
                </Box>
                {!currentPreset && (
                  <CheckCircleIcon color="primary" fontSize="small" />
                )}
              </Stack>
            </CardActionArea>
          </Card>

          {/* Preset grid */}
          <Grid container spacing={1.5}>
            {filteredPresets.map((preset) => (
              <Grid size={6} key={preset.meta.id}>
                <PresetCard
                  name={preset.meta.name.replace(
                    ` ${mode === "light" ? "Light" : "Dark"}`,
                    ""
                  )}
                  description={preset.meta.category}
                  isSelected={currentPreset === preset.meta.id}
                  colors={{
                    primary:
                      preset.tokens.palette?.primary ??
                      theme.palette.primary.main,
                    secondary:
                      preset.tokens.palette?.secondary ??
                      theme.palette.secondary.main,
                    background:
                      preset.tokens.palette?.background ??
                      theme.palette.background.default,
                  }}
                  onClick={() => handlePresetChange(preset.meta.id)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Radius Mode Toggle */}
      {showRadiusMode && (
        <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Corner Radius
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Adjust the roundness of UI elements
          </Typography>
          <ToggleButtonGroup
            value={radiusMode}
            exclusive
            onChange={handleRadiusModeChange}
            size="medium"
          >
            <ToggleButton value="tiny" sx={{ px: 3 }}>
              Sharp
            </ToggleButton>
            <ToggleButton value="default" sx={{ px: 3 }}>
              Rounded
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {/* Background Mode Toggle */}
      {showBackgroundMode && (
        <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Background Style
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Choose between solid, gradient, or flickering grid background
          </Typography>
          <ToggleButtonGroup
            value={backgroundMode}
            exclusive
            onChange={(_e, val) => val && handleBackgroundModeChange(val)}
            size="medium"
          >
            <ToggleButton value="default" sx={{ gap: 1, px: 2 }}>
              <ImageIcon fontSize="small" />
              Default
            </ToggleButton>
            <ToggleButton value="gradient" sx={{ gap: 1, px: 2 }}>
              <GradientIcon fontSize="small" />
              Gradient
            </ToggleButton>
            <ToggleButton value="flickering" sx={{ gap: 1, px: 2 }}>
              <GridViewIcon fontSize="small" />
              Flickering
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}
    </Stack>
  );
}

export default ThemeSettingsPanel;
