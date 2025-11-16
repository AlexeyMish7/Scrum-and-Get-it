/**
 * Theme Preset Selector Component
 *
 * UI for browsing and selecting theme presets with live previews.
 */

import { useState } from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useThemeContext } from "@context/ThemeContext";
import { allPresets, type PresetId, type PresetCategory } from "@shared/theme";

interface PresetSelectorProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Theme preset selector dialog
 *
 * Displays all available presets grouped by category with live previews.
 * Allows users to quickly switch between preset themes.
 */
export function ThemePresetSelector({ open, onClose }: PresetSelectorProps) {
  const { currentPreset, applyPreset, clearPreset, mode } = useThemeContext();
  const [selectedCategory, setSelectedCategory] = useState<
    PresetCategory | "all"
  >("all");

  // Filter presets by category and mode
  const filteredPresets = allPresets.filter((preset) => {
    const matchesCategory =
      selectedCategory === "all" || preset.meta.category === selectedCategory;
    const matchesMode = preset.meta.mode === mode;
    return matchesCategory && matchesMode;
  });

  const categories: Array<PresetCategory | "all"> = [
    "all",
    "professional",
    "creative",
    "accessible",
    "minimal",
  ];

  const handlePresetSelect = (presetId: PresetId) => {
    applyPreset(presetId);
    onClose();
  };

  const handleClearPreset = () => {
    clearPreset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: "80vh",
        },
      }}
    >
      <DialogTitle>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6">Choose Theme Preset</Typography>
          <IconButton onClick={onClose} size="small" aria-label="close">
            <CloseIcon />
          </IconButton>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Select a preset to quickly customize your theme. Currently showing{" "}
          {mode} mode presets.
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Category Filters */}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {categories.map((category) => (
              <Chip
                key={category}
                label={category.charAt(0).toUpperCase() + category.slice(1)}
                onClick={() => setSelectedCategory(category)}
                color={selectedCategory === category ? "primary" : "default"}
                variant={selectedCategory === category ? "filled" : "outlined"}
                sx={{ textTransform: "capitalize" }}
              />
            ))}
          </Stack>

          {/* Default Theme Option */}
          <Card
            variant="outlined"
            sx={{
              borderColor: !currentPreset ? "primary.main" : "divider",
              borderWidth: !currentPreset ? 2 : 1,
            }}
          >
            <CardActionArea onClick={handleClearPreset}>
              <CardContent>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Stack spacing={0.5}>
                    <Typography variant="h6">Default Theme</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Use the built-in {mode} theme without preset customization
                    </Typography>
                  </Stack>
                  {!currentPreset && (
                    <CheckCircleIcon color="primary" sx={{ fontSize: 32 }} />
                  )}
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>

          {/* Preset Grid */}
          <Grid container spacing={2}>
            {filteredPresets.map((preset) => {
              const isSelected = currentPreset === preset.meta.id;

              return (
                <Grid size={{ xs: 12, sm: 6 }} key={preset.meta.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderColor: isSelected ? "primary.main" : "divider",
                      borderWidth: isSelected ? 2 : 1,
                      height: "100%",
                    }}
                  >
                    <CardActionArea
                      onClick={() => handlePresetSelect(preset.meta.id)}
                      sx={{ height: "100%" }}
                    >
                      <CardContent>
                        <Stack spacing={1.5}>
                          {/* Header */}
                          <Stack
                            direction="row"
                            alignItems="flex-start"
                            justifyContent="space-between"
                          >
                            <Stack spacing={0.5} flex={1}>
                              <Typography variant="h6" fontSize="1rem">
                                {preset.meta.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                fontSize="0.875rem"
                              >
                                {preset.meta.description}
                              </Typography>
                            </Stack>
                            {isSelected && (
                              <CheckCircleIcon
                                color="primary"
                                sx={{ fontSize: 24, flexShrink: 0, ml: 1 }}
                              />
                            )}
                          </Stack>

                          {/* Preview Colors */}
                          <Stack direction="row" spacing={1}>
                            {preset.tokens.palette?.primary && (
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 1,
                                  bgcolor: preset.tokens.palette.primary,
                                  border: "1px solid",
                                  borderColor: "divider",
                                }}
                                title="Primary"
                              />
                            )}
                            {preset.tokens.palette?.secondary && (
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 1,
                                  bgcolor: preset.tokens.palette.secondary,
                                  border: "1px solid",
                                  borderColor: "divider",
                                }}
                                title="Secondary"
                              />
                            )}
                            {preset.tokens.palette?.tertiary && (
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 1,
                                  bgcolor: preset.tokens.palette.tertiary,
                                  border: "1px solid",
                                  borderColor: "divider",
                                }}
                                title="Tertiary"
                              />
                            )}
                          </Stack>

                          {/* Tags */}
                          {preset.meta.tags && preset.meta.tags.length > 0 && (
                            <Stack
                              direction="row"
                              spacing={0.5}
                              flexWrap="wrap"
                              useFlexGap
                            >
                              {preset.meta.tags.slice(0, 3).map((tag) => (
                                <Chip
                                  key={tag}
                                  label={tag}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    fontSize: "0.75rem",
                                    height: 20,
                                    textTransform: "capitalize",
                                  }}
                                />
                              ))}
                            </Stack>
                          )}
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {filteredPresets.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                No presets found for the selected category in {mode} mode.
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
