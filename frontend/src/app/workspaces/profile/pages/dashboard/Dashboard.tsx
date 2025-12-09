/**
 * PROFILE DASHBOARD
 *
 * Purpose:
 * - Main dashboard view for user profile workspace
 * - Displays profile stats, completion progress, and career timeline
 * - Provides quick-add functionality for all profile sections
 *
 * Data Flow:
 * - Uses useDashboardData hook for all data fetching
 * - Listens for change events from dialogs to refresh data
 * - No direct CRUD operations - delegates to services via dialogs
 *
 * Performance:
 * - React.memo on child components to prevent unnecessary re-renders
 * - Lazy loading for heavy chart components
 * - useMemo for stable object references
 * - useCallback for event handlers
 *
 * UI Components:
 * - SummaryCards: Quick stats with add buttons
 * - ProfileCompletion: Progress percentage and tips
 * - ProfileStrengthTips: Personalized recommendations
 * - SkillsDistributionChart: Visual skills breakdown
 * - RecentActivityTimeline: Latest document activity
 * - CareerTimeline: Employment history visualization
 */
import { type FC, memo, useMemo, useCallback, lazy, Suspense } from "react";
import {
  Box,
  Typography,
  Avatar,
  Button,
  Divider,
  Snackbar,
  Alert,
  Skeleton,
} from "@mui/material";
import Icon from "@shared/components/common/Icon";
import { useAvatarContext } from "@shared/context/AvatarContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import LoadingSpinner from "@shared/components/feedback/LoadingSpinner";
import { AutoBreadcrumbs } from "@shared/components/navigation/AutoBreadcrumbs";

// Dashboard-specific hook for data management
import { useDashboardData } from "../../hooks/useDashboardData";

// Dashboard widgets - each handles its own display logic
import SummaryCards from "../../components/profile/SummaryCards";
import ProfileCompletion from "../../components/profile/ProfileCompletion";
import ProfileStrengthTips from "../../components/profile/ProfileStrengthTips";
import RecentActivityTimeline from "../../components/profile/RecentActivityTimeline";

// Lazy load heavy chart components to improve initial load time
const SkillsDistributionChart = lazy(
  () => import("../../components/profile/SkillsDistributionChart")
);
const CareerTimeline = lazy(
  () => import("../../components/profile/CareerTimeline")
);

// Skeleton fallback for lazy-loaded components
const ChartSkeleton = () => (
  <Box sx={{ p: 3, border: 1, borderColor: "divider", borderRadius: 2 }}>
    <Skeleton variant="text" width={150} height={32} />
    <Skeleton
      variant="rectangular"
      height={200}
      sx={{ mt: 2, borderRadius: 1 }}
    />
  </Box>
);

const Dashboard: FC = () => {
  // Avatar from global context (shared with navbar, no duplicate fetches)
  const { avatarUrl } = useAvatarContext();

  // Centralized error handling with snackbar notifications
  const { notification, closeNotification, showSuccess } = useErrorHandler();

  // Dashboard data hook - handles all data fetching and refresh logic
  const {
    header,
    counts,
    skills,
    careerEvents,
    recentActivity,
    loading,
    hasError,
    refresh,
  } = useDashboardData();

  /**
   * Export profile data as JSON file
   * Includes all profile sections for backup/portability
   * Memoized to prevent recreation on every render
   */
  const handleExport = useCallback(() => {
    if (!header) return;

    const exportData = {
      profile: {
        name: header.name,
        email: header.email,
        ...counts,
      },
      skills,
      career: careerEvents,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "profile-summary.json";
    link.click();
    URL.revokeObjectURL(url);

    showSuccess("Profile exported successfully!");
  }, [header, counts, skills, careerEvents, showSuccess]);

  // Memoize empty handlers to prevent SummaryCards re-renders
  const emptyHandlers = useMemo(
    () => ({
      onAddEmployment: async () => {},
      onAddSkill: async () => {},
      onAddEducation: async () => {},
      onAddProject: async () => {},
    }),
    []
  );

  // Show loading spinner while data is being fetched
  if (loading) {
    return <LoadingSpinner />;
  }

  // Show error state with retry option
  if (hasError) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          gap: 2,
        }}
      >
        <Typography color="error" variant="h6">
          Failed to load dashboard data
        </Typography>
        <Button variant="contained" onClick={refresh}>
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        pt: 2,
      }}
    >
      <AutoBreadcrumbs />

      {/* Dashboard Header - Welcome message with large avatar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          mb: 3,
        }}
      >
        <Avatar
          src={avatarUrl ?? undefined}
          sx={{
            width: 80,
            height: 80,
            fontSize: "2rem",
            border: (theme) =>
              `2px solid ${
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.2)"
                  : "rgba(0, 0, 0, 0.12)"
              }`,
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 2px 8px rgba(0,0,0,0.3)"
                : "0 2px 8px rgba(0,0,0,0.1)",
          }}
          aria-label={`Profile picture for ${header?.name || "User"}`}
        >
          {/* Fallback to first letter of name */}
          {!avatarUrl && header?.name
            ? header.name.charAt(0).toUpperCase()
            : "U"}
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Welcome back, {header?.firstName || header?.name || "User"}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {header?.email || ""}
          </Typography>
        </Box>
      </Box>

      {/* Export Button - Positioned separately */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<Icon name="Download" color="inherit" />}
          onClick={handleExport}
          aria-label="Export profile as JSON"
        >
          Export Profile
        </Button>
      </Box>

      {/* Main Dashboard Content */}
      <Box sx={{ p: 4, maxWidth: "1200px", margin: "0 auto" }}>
        <Typography variant="h2" mb={3} fontWeight="bold">
          Profile Overview
        </Typography>

        {/* Summary Cards - Quick stats with add buttons */}
        {/* Note: SummaryCards handles its own dialogs internally */}
        <SummaryCards counts={counts} {...emptyHandlers} />

        {/* Completion & Strength Section */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: 4 }}>
          <Box sx={{ flex: "1 1 300px" }}>
            <ProfileCompletion profile={counts} />
          </Box>
          <Box sx={{ flex: "1 1 300px" }}>
            <ProfileStrengthTips profile={counts} />
          </Box>
        </Box>

        {/* Skills Distribution & Recent Activity Section */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: 3 }}>
          <Box sx={{ flex: "1 1 400px" }}>
            <Suspense fallback={<ChartSkeleton />}>
              <SkillsDistributionChart skills={skills} />
            </Suspense>
          </Box>
          <Box sx={{ flex: "1 1 300px" }}>
            <RecentActivityTimeline activities={recentActivity} />
          </Box>
        </Box>

        {/* Career Timeline Section */}
        <Box mt={4}>
          <Divider sx={{ mb: 3 }} />
          <Suspense fallback={<ChartSkeleton />}>
            <CareerTimeline events={careerEvents} />
          </Suspense>
        </Box>
      </Box>

      {/* Global Snackbar for notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={notification.autoHideDuration}
        onClose={closeNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeNotification}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default memo(Dashboard);
