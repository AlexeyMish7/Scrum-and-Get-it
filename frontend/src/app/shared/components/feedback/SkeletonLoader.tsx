/**
 * SKELETON LOADER COMPONENT
 * Skeleton placeholders for loading states of lists and cards.
 *
 * FEATURES:
 * - Job card skeleton (for pipeline and lists)
 * - List item skeleton (for generic lists)
 * - Card grid skeleton (for multiple cards)
 * - Customizable count and spacing
 *
 * USAGE:
 * ```tsx
 * <SkeletonLoader variant="job-card" count={3} />
 * <SkeletonLoader variant="list-item" count={5} />
 * <SkeletonLoader variant="card-grid" count={6} columns={3} />
 * ```
 */

import { Box, Card, CardContent, Skeleton, Stack } from "@mui/material";

type SkeletonVariant = "job-card" | "list-item" | "card-grid" | "detail-view";

interface SkeletonLoaderProps {
  variant: SkeletonVariant;
  count?: number;
  columns?: number; // For card-grid variant
}

/**
 * Job card skeleton - mimics pipeline job cards
 */
function JobCardSkeleton() {
  return (
    <Card sx={{ mb: 1 }}>
      <CardContent sx={{ p: 2 }}>
        <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rectangular" width={60} height={20} />
          <Skeleton variant="rectangular" width={40} height={20} />
        </Stack>
      </CardContent>
    </Card>
  );
}

/**
 * List item skeleton - for simple lists
 */
function ListItemSkeleton() {
  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="70%" height={20} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width="40%" height={16} />
        </Box>
      </Stack>
    </Box>
  );
}

/**
 * Detail view skeleton - for job details page
 */
function DetailViewSkeleton() {
  return (
    <Box>
      {/* Header */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="50%" height={32} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="30%" height={24} />
        </Box>
      </Stack>

      {/* Content sections */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Skeleton variant="text" width="30%" height={24} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
          <Stack direction="row" spacing={2}>
            <Skeleton variant="rectangular" width={100} height={36} />
            <Skeleton variant="rectangular" width={100} height={36} />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

/**
 * Main SkeletonLoader component
 */
export default function SkeletonLoader({
  variant,
  count = 3,
  columns = 3,
}: SkeletonLoaderProps) {
  if (variant === "job-card") {
    return (
      <Box>
        {Array.from({ length: count }).map((_, index) => (
          <JobCardSkeleton key={index} />
        ))}
      </Box>
    );
  }

  if (variant === "list-item") {
    return (
      <Box>
        {Array.from({ length: count }).map((_, index) => (
          <ListItemSkeleton key={index} />
        ))}
      </Box>
    );
  }

  if (variant === "card-grid") {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: `repeat(${Math.min(2, columns)}, 1fr)`,
            md: `repeat(${columns}, 1fr)`,
          },
          gap: 2,
        }}
      >
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index}>
            <CardContent>
              <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="60%" height={20} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={100} />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  if (variant === "detail-view") {
    return <DetailViewSkeleton />;
  }

  return null;
}
