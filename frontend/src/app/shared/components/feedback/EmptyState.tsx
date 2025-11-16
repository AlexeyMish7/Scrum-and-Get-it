import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

/**
 * EMPTY STATE COMPONENT
 *
 * Display when a list or view has no data to show.
 * Provides clear messaging and optional action to help users get started.
 *
 * Usage:
 *   <EmptyState
 *     icon={<InboxIcon />}
 *     title="No jobs yet"
 *     description="Get started by adding your first job opportunity"
 *     action={<Button onClick={handleAdd}>Add Job</Button>}
 *   />
 *
 * Features:
 * - Icon to visually represent empty state
 * - Clear title and description
 * - Optional action button or custom action component
 * - Responsive sizing and spacing
 */

interface EmptyStateProps {
  icon?: ReactNode; // Optional icon (Lucide or MUI icon component)
  title: string; // Main heading (required)
  description?: string; // Supporting text
  action?: ReactNode; // Optional action button or custom component
  sx?: object; // Custom MUI sx styling
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  sx,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        py: 8,
        px: 3,
        ...sx,
      }}
    >
      {/* Icon */}
      {icon && (
        <Box
          sx={{
            mb: 3,
            color: "text.secondary",
            opacity: 0.6,
            "& svg": {
              width: 64,
              height: 64,
            },
          }}
        >
          {icon}
        </Box>
      )}

      {/* Title */}
      <Typography
        variant="h5"
        component="h2"
        gutterBottom
        sx={{ fontWeight: 600 }}
      >
        {title}
      </Typography>

      {/* Description */}
      {description && (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3, maxWidth: 400 }}
        >
          {description}
        </Typography>
      )}

      {/* Action */}
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Box>
  );
}
