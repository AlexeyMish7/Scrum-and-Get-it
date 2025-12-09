/**
 * Theme Settings Panel
 *
 * A reusable component for theme customization that can be used in:
 * - Profile dropdown (compact mode)
 * - Settings page (full mode)
 *
 * Features:
 * - Light/Dark mode toggle
 * - Color preset selector (defines colors)
 * - Design preset selector (defines shapes, shadows, effects)
 * - Background mode toggle
 * - Font scale for accessibility
 * - Reduced motion toggle
 * - UI density control
 * - Custom accent color picker
 * - Export/Import settings
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
  alpha,
  Slider,
  Switch,
  Button,
  Divider,
  TextField,
  IconButton,
  Collapse,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ImageIcon from "@mui/icons-material/Image";
import GradientIcon from "@mui/icons-material/Gradient";
import GridViewIcon from "@mui/icons-material/GridView";
import PaletteIcon from "@mui/icons-material/Palette";
import BrushIcon from "@mui/icons-material/Brush";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import SpeedIcon from "@mui/icons-material/Speed";
import ViewCompactIcon from "@mui/icons-material/ViewCompact";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import RestoreIcon from "@mui/icons-material/Restore";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import {
  useThemeContext,
  type BackgroundMode,
  type FontScale,
  type UIDensity,
} from "@shared/context/ThemeContext";
import {
  allColorPresets,
  allDesignPresets,
  type ColorPresetId,
  type DesignPresetId,
} from "@shared/theme";

interface ThemeSettingsPanelProps {
  /** Compact mode for dropdown menus - shows only mode toggle */
  compact?: boolean;
  /** Show color preset selector */
  showColorPresets?: boolean;
  /** Show design preset selector */
  showDesignPresets?: boolean;
  /** Show background mode toggle */
  showBackgroundMode?: boolean;
  /** Show accessibility options */
  showAccessibility?: boolean;
  /** Show advanced options (export/import, reset) */
  showAdvanced?: boolean;
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
 * Color preset card with visual preview
 */
function ColorPresetCard({
  preset,
  isSelected,
  isDarkMode,
  onClick,
}: {
  preset: (typeof allColorPresets)[0];
  isSelected: boolean;
  isDarkMode: boolean;
  onClick: () => void;
}) {
  const theme = useTheme();
  const modeColors = isDarkMode ? preset.dark : preset.light;

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
              height: 28,
              borderRadius: 1,
              background: `linear-gradient(90deg, ${preset.palette.primary} 0%, ${preset.palette.primary} 50%, ${preset.palette.secondary} 50%, ${preset.palette.secondary} 100%)`,
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
              <Typography
                variant="subtitle2"
                fontWeight={600}
                sx={{ fontSize: "0.85rem" }}
              >
                {preset.name}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", fontSize: "0.7rem" }}
              >
                {preset.description}
              </Typography>
            </Box>
            {isSelected && <CheckCircleIcon color="primary" fontSize="small" />}
          </Stack>

          {/* Color swatches */}
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Primary">
              <Box>
                <ColorSwatch color={preset.palette.primary} size={14} />
              </Box>
            </Tooltip>
            <Tooltip title="Secondary">
              <Box>
                <ColorSwatch color={preset.palette.secondary} size={14} />
              </Box>
            </Tooltip>
            <Tooltip title="Background">
              <Box>
                <ColorSwatch color={modeColors.background} size={14} />
              </Box>
            </Tooltip>
          </Stack>
        </Stack>
      </CardActionArea>
    </Card>
  );
}

/**
 * Design preset card with shape preview
 */
function DesignPresetCard({
  preset,
  isSelected,
  onClick,
}: {
  preset: (typeof allDesignPresets)[0];
  isSelected: boolean;
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
          {/* Shape preview - shows border radius and shadow */}
          <Box
            sx={{
              height: 28,
              borderRadius: `${preset.borderRadius.md}px`,
              backgroundColor: alpha(theme.palette.primary.main, 0.15),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              boxShadow: preset.elevation.level2,
            }}
          />

          {/* Preset info */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography
                variant="subtitle2"
                fontWeight={600}
                sx={{ fontSize: "0.85rem" }}
              >
                {preset.name}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", fontSize: "0.7rem" }}
              >
                {preset.description}
              </Typography>
            </Box>
            {isSelected && <CheckCircleIcon color="primary" fontSize="small" />}
          </Stack>

          {/* Effect indicators */}
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            <Tooltip title={`Border radius: ${preset.borderRadius.md}px`}>
              <Typography
                variant="caption"
                sx={{
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 0.5,
                  backgroundColor: "action.hover",
                  fontSize: "0.65rem",
                }}
              >
                {preset.borderRadius.md}px
              </Typography>
            </Tooltip>
            {preset.glow.enabled && (
              <Tooltip title="Glow effects enabled">
                <Typography
                  variant="caption"
                  sx={{
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 0.5,
                    backgroundColor: "action.hover",
                    fontSize: "0.65rem",
                  }}
                >
                  Glow
                </Typography>
              </Tooltip>
            )}
            {preset.glass.enabled && (
              <Tooltip title="Glass effects enabled">
                <Typography
                  variant="caption"
                  sx={{
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 0.5,
                    backgroundColor: "action.hover",
                    fontSize: "0.65rem",
                  }}
                >
                  Glass
                </Typography>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      </CardActionArea>
    </Card>
  );
}

export function ThemeSettingsPanel({
  compact = false,
  showColorPresets = true,
  showDesignPresets = true,
  showBackgroundMode = true,
  showAccessibility = true,
  showAdvanced = true,
  onSettingChange,
}: ThemeSettingsPanelProps) {
  const theme = useTheme();
  const {
    mode,
    toggleMode,
    colorPreset,
    setColorPreset,
    designPreset,
    setDesignPreset,
    backgroundMode,
    setBackgroundMode,
    fontScale,
    setFontScale,
    reducedMotion,
    setReducedMotion,
    uiDensity,
    setUIDensity,
    customAccentColor,
    setCustomAccentColor,
    resetToDefaults,
    exportSettings,
    importSettings,
  } = useThemeContext();

  // State for advanced section collapse
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [importValue, setImportValue] = useState("");
  const [importError, setImportError] = useState(false);

  const handleModeChange = () => {
    toggleMode();
    onSettingChange?.();
  };

  const handleColorPresetChange = (presetId: ColorPresetId) => {
    setColorPreset(presetId);
    onSettingChange?.();
  };

  const handleDesignPresetChange = (presetId: DesignPresetId) => {
    setDesignPreset(presetId);
    onSettingChange?.();
  };

  const handleBackgroundModeChange = (newBgMode: BackgroundMode) => {
    setBackgroundMode(newBgMode);
    onSettingChange?.();
  };

  const handleFontScaleChange = (scale: FontScale) => {
    setFontScale(scale);
    onSettingChange?.();
  };

  const handleReducedMotionChange = (enabled: boolean) => {
    setReducedMotion(enabled);
    onSettingChange?.();
  };

  const handleUIDensityChange = (density: UIDensity) => {
    setUIDensity(density);
    onSettingChange?.();
  };

  const handleCustomAccentChange = (color: string | null) => {
    setCustomAccentColor(color);
    onSettingChange?.();
  };

  const handleExport = () => {
    const settings = exportSettings();
    navigator.clipboard.writeText(settings);
    // Could add a toast notification here
  };

  const handleImport = () => {
    const success = importSettings(importValue);
    if (success) {
      setImportValue("");
      setImportError(false);
      onSettingChange?.();
    } else {
      setImportError(true);
    }
  };

  const handleReset = () => {
    resetToDefaults();
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

  // Font scale labels
  const fontScaleMarks = [
    { value: 0, label: "S" },
    { value: 1, label: "M" },
    { value: 2, label: "L" },
    { value: 3, label: "XL" },
  ];
  const fontScaleValues: FontScale[] = ["small", "default", "large", "x-large"];
  const fontScaleIndex = fontScaleValues.indexOf(fontScale);

  // Predefined accent colors for quick selection
  const accentColors = [
    "#3b82f6", // Blue
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#ef4444", // Red
    "#f97316", // Orange
    "#eab308", // Yellow
    "#22c55e", // Green
    "#06b6d4", // Cyan
  ];

  // Full mode: show all settings
  return (
    <Stack spacing={3}>
      {/* Mode Toggle */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <LightModeIcon fontSize="small" color="action" />
          <Typography variant="subtitle1" fontWeight={600}>
            Appearance Mode
          </Typography>
        </Stack>
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

      {/* Color Preset Selector */}
      {showColorPresets && (
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <PaletteIcon fontSize="small" color="action" />
            <Typography variant="subtitle1" fontWeight={600}>
              Color Theme
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Choose a color palette for the app
          </Typography>

          <Grid container spacing={1.5}>
            {allColorPresets.map((preset) => (
              <Grid size={6} key={preset.id}>
                <ColorPresetCard
                  preset={preset}
                  isSelected={colorPreset === preset.id}
                  isDarkMode={mode === "dark"}
                  onClick={() => handleColorPresetChange(preset.id)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Design Preset Selector */}
      {showDesignPresets && (
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <BrushIcon fontSize="small" color="action" />
            <Typography variant="subtitle1" fontWeight={600}>
              Design Style
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Choose shapes, shadows, and effects
          </Typography>

          <Grid container spacing={1.5}>
            {allDesignPresets.map((preset) => (
              <Grid size={6} key={preset.id}>
                <DesignPresetCard
                  preset={preset}
                  isSelected={designPreset === preset.id}
                  onClick={() => handleDesignPresetChange(preset.id)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Background Mode Toggle */}
      {showBackgroundMode && (
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <ImageIcon fontSize="small" color="action" />
            <Typography variant="subtitle1" fontWeight={600}>
              Background Style
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Choose between solid, gradient, or animated background
          </Typography>
          <ToggleButtonGroup
            value={backgroundMode}
            exclusive
            onChange={(_e, val) => val && handleBackgroundModeChange(val)}
            size="medium"
          >
            <ToggleButton value="default" sx={{ gap: 1, px: 2 }}>
              <ImageIcon fontSize="small" />
              Solid
            </ToggleButton>
            <ToggleButton value="gradient" sx={{ gap: 1, px: 2 }}>
              <GradientIcon fontSize="small" />
              Gradient
            </ToggleButton>
            <ToggleButton value="flickering" sx={{ gap: 1, px: 2 }}>
              <GridViewIcon fontSize="small" />
              Animated
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {/* Accessibility Section */}
      {showAccessibility && (
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <AccessibilityNewIcon fontSize="small" color="action" />
            <Typography variant="subtitle1" fontWeight={600}>
              Accessibility
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Customize for better readability and comfort
          </Typography>

          {/* Font Scale Control */}
          <Box sx={{ mb: 3 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 1 }}
            >
              <TextFieldsIcon fontSize="small" color="action" />
              <Typography variant="body2" fontWeight={500}>
                Text Size
              </Typography>
            </Stack>
            <Slider
              value={fontScaleIndex}
              min={0}
              max={3}
              step={1}
              marks={fontScaleMarks}
              onChange={(_e, val) =>
                handleFontScaleChange(fontScaleValues[val as number])
              }
              sx={{ mx: 1, width: "calc(100% - 16px)" }}
            />
          </Box>

          {/* UI Density Control */}
          <Box sx={{ mb: 2 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 1 }}
            >
              <ViewCompactIcon fontSize="small" color="action" />
              <Typography variant="body2" fontWeight={500}>
                Interface Density
              </Typography>
            </Stack>
            <ToggleButtonGroup
              value={uiDensity}
              exclusive
              onChange={(_e, val) => val && handleUIDensityChange(val)}
              size="small"
            >
              <ToggleButton value="comfortable" sx={{ px: 2 }}>
                Comfortable
              </ToggleButton>
              <ToggleButton value="compact" sx={{ px: 2 }}>
                Compact
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Reduced Motion Toggle */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              p: 1.5,
              bgcolor: alpha(theme.palette.background.default, 0.5),
              borderRadius: 1,
            }}
          >
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <SpeedIcon fontSize="small" color="action" />
                <Typography variant="body2" fontWeight={500}>
                  Reduce Motion
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Minimize animations throughout the app
              </Typography>
            </Box>
            <Switch
              checked={reducedMotion}
              onChange={(e) => handleReducedMotionChange(e.target.checked)}
              size="small"
            />
          </Stack>
        </Box>
      )}

      {/* Custom Accent Color */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <ColorLensIcon fontSize="small" color="action" />
          <Typography variant="subtitle1" fontWeight={600}>
            Custom Accent
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Override the primary color with your own choice
        </Typography>

        {/* Quick Color Swatches */}
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ mb: 1.5, flexWrap: "wrap", gap: 0.5 }}
        >
          {accentColors.map((color) => (
            <Tooltip key={color} title={color}>
              <IconButton
                size="small"
                onClick={() => handleCustomAccentChange(color)}
                sx={{
                  width: 28,
                  height: 28,
                  backgroundColor: color,
                  border:
                    customAccentColor === color
                      ? `2px solid ${theme.palette.text.primary}`
                      : "none",
                  "&:hover": { backgroundColor: color, opacity: 0.8 },
                }}
              />
            </Tooltip>
          ))}
          <Tooltip title="Clear custom color">
            <IconButton
              size="small"
              onClick={() => handleCustomAccentChange(null)}
              sx={{
                width: 28,
                height: 28,
                border: `1px dashed ${theme.palette.divider}`,
              }}
            >
              <RestoreIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Custom Hex Input */}
        <TextField
          size="small"
          placeholder="#3b82f6"
          value={customAccentColor || ""}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "" || /^#[0-9A-Fa-f]{0,6}$/.test(val)) {
              handleCustomAccentChange(val || null);
            }
          }}
          slotProps={{
            input: {
              startAdornment: (
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: 0.5,
                    backgroundColor:
                      customAccentColor || theme.palette.primary.main,
                    mr: 1,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                />
              ),
            },
          }}
          sx={{ width: 150 }}
        />
      </Box>

      {/* Advanced Section */}
      {showAdvanced && (
        <Box>
          <Divider sx={{ my: 1 }} />
          <Button
            variant="text"
            size="small"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            endIcon={advancedOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ mb: 1 }}
          >
            Advanced Options
          </Button>

          <Collapse in={advancedOpen}>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {/* Export Settings */}
              <Box>
                <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5 }}>
                  Export Settings
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 1 }}
                >
                  Copy your theme settings to share or backup
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={handleExport}
                >
                  Copy to Clipboard
                </Button>
              </Box>

              {/* Import Settings */}
              <Box>
                <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5 }}>
                  Import Settings
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 1 }}
                >
                  Paste exported settings to apply them
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    placeholder="Paste settings here"
                    value={importValue}
                    onChange={(e) => {
                      setImportValue(e.target.value);
                      setImportError(false);
                    }}
                    error={importError}
                    helperText={
                      importError ? "Invalid settings format" : undefined
                    }
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<UploadIcon />}
                    onClick={handleImport}
                    disabled={!importValue}
                  >
                    Apply
                  </Button>
                </Stack>
              </Box>

              {/* Reset to Defaults */}
              <Box>
                <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5 }}>
                  Reset Settings
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 1 }}
                >
                  Restore all theme settings to their defaults
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  color="warning"
                  startIcon={<RestoreIcon />}
                  onClick={handleReset}
                >
                  Reset to Defaults
                </Button>
              </Box>
            </Stack>
          </Collapse>
        </Box>
      )}
    </Stack>
  );
}

export default ThemeSettingsPanel;
