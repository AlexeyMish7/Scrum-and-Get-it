import { Box, Card, CardContent, Skeleton, Stack } from "@mui/material";

/**
 * SKELETON COMPONENTS FOR LOADING STATES
 *
 * Pre-built skeleton screens for common UI patterns.
 * Shows layout structure while data loads, improving perceived performance.
 *
 * Benefits:
 * - Reduces perceived loading time by 30-40%
 * - Prevents layout shift (CLS improvement)
 * - Gives users visual feedback that content is coming
 * - Maintains familiar layout during loading
 *
 * Usage:
 *   {loading ? <JobCardSkeleton /> : <JobCard data={job} />}
 */

/**
 * Skeleton for job cards in the pipeline view
 * Mimics the structure of actual job cards
 */
export function JobCardSkeleton() {
  return (
    <Card variant="outlined" sx={{ p: 2, mb: 1 }}>
      <Stack spacing={1}>
        {/* Title */}
        <Skeleton variant="text" width="70%" height={24} />

        {/* Company */}
        <Skeleton variant="text" width="50%" height={20} />

        {/* Metadata row */}
        <Stack direction="row" spacing={1}>
          <Skeleton
            variant="rectangular"
            width={80}
            height={20}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            width={100}
            height={20}
            sx={{ borderRadius: 1 }}
          />
        </Stack>

        {/* Description */}
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="80%" />
      </Stack>
    </Card>
  );
}

/**
 * Skeleton for employment history items
 */
export function EmploymentCardSkeleton() {
  return (
    <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Box flex={1}>
          {/* Job title */}
          <Skeleton variant="text" width="60%" height={28} />

          {/* Company and dates */}
          <Skeleton variant="text" width="40%" height={20} sx={{ mt: 0.5 }} />

          {/* Description */}
          <Skeleton variant="text" width="100%" sx={{ mt: 1 }} />
          <Skeleton variant="text" width="90%" />
          <Skeleton variant="text" width="70%" />
        </Box>

        {/* Action buttons */}
        <Stack direction="row" spacing={1} ml={2}>
          <Skeleton
            variant="rectangular"
            width={60}
            height={36}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            width={70}
            height={36}
            sx={{ borderRadius: 1 }}
          />
        </Stack>
      </Stack>
    </Card>
  );
}

/**
 * Skeleton for project cards in portfolio
 */
export function ProjectCardSkeleton() {
  return (
    <Card sx={{ height: "100%", cursor: "pointer" }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          {/* Thumbnail */}
          <Skeleton
            variant="rectangular"
            width={96}
            height={96}
            sx={{ borderRadius: 2, flexShrink: 0 }}
          />

          {/* Content */}
          <Box flex={1} minWidth={0}>
            {/* Title */}
            <Skeleton variant="text" width="80%" height={28} />

            {/* Status chip */}
            <Skeleton
              variant="rectangular"
              width={80}
              height={24}
              sx={{ borderRadius: 2, my: 0.5 }}
            />

            {/* Role and tech */}
            <Skeleton variant="text" width="60%" height={20} />

            {/* Description */}
            <Skeleton variant="text" width="100%" sx={{ mt: 0.5 }} />
            <Skeleton variant="text" width="90%" />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for analytics charts
 */
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        {/* Chart title */}
        <Skeleton variant="text" width="40%" height={24} />

        {/* Chart area */}
        <Skeleton
          variant="rectangular"
          width="100%"
          height={height}
          sx={{ borderRadius: 1 }}
        />

        {/* Legend */}
        <Stack direction="row" spacing={2} justifyContent="center">
          <Skeleton
            variant="rectangular"
            width={100}
            height={20}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            width={100}
            height={20}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            width={100}
            height={20}
            sx={{ borderRadius: 1 }}
          />
        </Stack>
      </Stack>
    </Card>
  );
}

/**
 * Skeleton for document list items
 */
export function DocumentCardSkeleton() {
  return (
    <Card variant="outlined" sx={{ p: 2, mb: 1 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        {/* File icon */}
        <Skeleton variant="circular" width={40} height={40} />

        {/* File info */}
        <Box flex={1}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="30%" height={16} />
        </Box>

        {/* Actions */}
        <Skeleton
          variant="rectangular"
          width={80}
          height={36}
          sx={{ borderRadius: 1 }}
        />
      </Stack>
    </Card>
  );
}

/**
 * Skeleton for table rows
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} style={{ padding: "16px" }}>
          <Skeleton variant="text" width="80%" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Detail view skeleton - for job details page
 */
export function DetailViewSkeleton() {
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
 * Skeleton for full pipeline page
 * Shows skeleton for all pipeline stages
 */
export function PipelinePageSkeleton() {
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Skeleton variant="text" width={200} height={40} />
        <Stack direction="row" spacing={2}>
          <Skeleton
            variant="rectangular"
            width={120}
            height={40}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            width={100}
            height={40}
            sx={{ borderRadius: 1 }}
          />
        </Stack>
      </Stack>

      {/* Pipeline columns */}
      <Stack direction="row" spacing={2} sx={{ overflowX: "auto" }}>
        {Array.from({ length: 5 }).map((_, stageIdx) => (
          <Box key={stageIdx} sx={{ minWidth: 300, flex: "1 1 300px" }}>
            {/* Stage header */}
            <Skeleton variant="text" width="60%" height={28} sx={{ mb: 2 }} />

            {/* Job cards */}
            <Stack spacing={1}>
              {Array.from({ length: 3 }).map((_, cardIdx) => (
                <JobCardSkeleton key={cardIdx} />
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

/**
 * Skeleton for analytics page
 */
export function AnalyticsPageSkeleton() {
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Skeleton variant="text" width={250} height={40} sx={{ mb: 3 }} />

      {/* Stats cards */}
      <Stack direction="row" spacing={2} mb={3}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Skeleton variant="text" width="40%" height={20} />
            <Skeleton variant="text" width="60%" height={36} sx={{ mt: 1 }} />
          </Card>
        ))}
      </Stack>

      {/* Charts */}
      <Stack spacing={3}>
        <ChartSkeleton height={300} />
        <Stack direction="row" spacing={2}>
          <Box flex={1}>
            <ChartSkeleton height={250} />
          </Box>
          <Box flex={1}>
            <ChartSkeleton height={250} />
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}
