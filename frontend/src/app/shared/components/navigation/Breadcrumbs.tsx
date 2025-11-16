/**
 * Breadcrumbs Component
 *
 * Provides consistent breadcrumb navigation across the application.
 * Automatically generates breadcrumbs based on the provided items array.
 *
 * Usage:
 * ```tsx
 * <Breadcrumbs
 *   items={[
 *     { label: 'Profile', path: '/profile' },
 *     { label: 'Education', path: '/profile/education' },
 *     { label: 'Add' } // Current page (no path)
 *   ]}
 * />
 * ```
 */

import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

export interface BreadcrumbItem {
  label: string;
  path?: string; // If path is omitted, item is rendered as current page (not clickable)
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <MuiBreadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ mb: 2 }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (isLast || !item.path) {
          // Current page - render as non-clickable text
          return (
            <Typography key={index} color="text.primary" fontSize="inherit">
              {item.label}
            </Typography>
          );
        }

        // Parent page - render as clickable link
        return (
          <Link
            key={index}
            component={RouterLink}
            to={item.path}
            underline="hover"
            color="inherit"
            fontSize="inherit"
          >
            {item.label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
}
