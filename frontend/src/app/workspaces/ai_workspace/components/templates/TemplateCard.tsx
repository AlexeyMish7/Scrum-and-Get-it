/**
 * TemplateCard - Display template with preview and actions
 */

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  Stack,
} from "@mui/material";
import { CheckCircle, Star } from "@mui/icons-material";
import type { Template } from "../../types";
import { TemplatePreview } from "./TemplatePreview";

export interface TemplateCardProps {
  template: Template;
  onSelect?: (template: Template) => void;
  onPreview?: (template: Template) => void;
  isSelected?: boolean;
}

export function TemplateCard({
  template,
  onSelect,
  onPreview,
  isSelected = false,
}: TemplateCardProps) {
  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? "primary.main" : "divider",
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: 4,
          transform: "translateY(-4px)",
        },
      }}
    >
      {/* Selected indicator */}
      {isSelected && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 1,
          }}
        >
          <CheckCircle color="primary" />
        </Box>
      )}

      {/* Template preview thumbnail */}
      <Box
        sx={{
          height: 200,
          bgcolor: "background.paper",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: 1,
          borderColor: "divider",
          cursor: onPreview ? "pointer" : "default",
          overflow: "hidden",
          position: "relative",
        }}
        onClick={() => onPreview?.(template)}
      >
        <TemplatePreview template={template} compact />
      </Box>

      <CardContent sx={{ flexGrow: 1 }}>
        {/* Template name */}
        <Typography variant="h6" gutterBottom>
          {template.name}
        </Typography>

        {/* Description */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {template.metadata.description}
        </Typography>

        {/* Features */}
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          gap={1}
          sx={{ mb: 2 }}
        >
          {template.features.atsOptimized && (
            <Chip label="ATS Optimized" size="small" color="success" />
          )}
          {template.isDefault && (
            <Chip label="Recommended" size="small" color="primary" />
          )}
          {template.layout.columns === 2 && (
            <Chip label="2-Column" size="small" variant="outlined" />
          )}
          {template.features.photoSupport && (
            <Chip label="Photo" size="small" variant="outlined" />
          )}
        </Stack>

        {/* Rating */}
        {template.metadata.rating && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Star sx={{ fontSize: 16, color: "warning.main" }} />
            <Typography variant="body2" color="text.secondary">
              {template.metadata.rating.toFixed(1)}
            </Typography>
          </Box>
        )}

        {/* Tags */}
        <Box sx={{ mt: 1 }}>
          {template.metadata.tags.slice(0, 3).map((tag: string) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              variant="outlined"
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant={isSelected ? "outlined" : "contained"}
          fullWidth
          onClick={() => onSelect?.(template)}
          disabled={isSelected}
        >
          {isSelected ? "Selected" : "Use Template"}
        </Button>
      </CardActions>
    </Card>
  );
}
