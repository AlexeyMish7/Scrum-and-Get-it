/**
 * BulkOnboardingPage.tsx
 *
 * Full-page wrapper for the bulk onboarding wizard.
 * Allows administrators to import and onboard multiple users at once.
 *
 * Route: /team/enterprise/onboarding
 * Part of UC-114: Corporate Career Services Integration
 */

import { useNavigate } from "react-router-dom";
import { Box, Typography, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useTeam } from "@shared/context/useTeam";
import { BulkOnboardingWizard } from "../components/enterprise/BulkOnboardingWizard";

/**
 * BulkOnboardingPage - Full-page bulk user onboarding
 *
 * Features:
 * - CSV file upload for bulk user import
 * - User validation and preview
 * - Configurable onboarding options
 * - Progress tracking for large imports
 */
export const BulkOnboardingPage = () => {
  const navigate = useNavigate();
  const { currentTeam } = useTeam();
  const teamId = currentTeam?.id || "";

  // Handle wizard completion - navigate back to enterprise dashboard
  const handleComplete = (jobId: string) => {
    console.log("Bulk onboarding job started:", jobId);
    // Could show a toast notification here
  };

  // Handle wizard cancellation - go back to enterprise dashboard
  const handleCancel = () => {
    navigate("/team/enterprise");
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: "auto" }}>
      {/* Header with navigation */}
      <Box display="flex" alignItems="center" mb={4}>
        <IconButton
          onClick={() => navigate("/team/enterprise")}
          sx={{ mr: 2 }}
          aria-label="Back to enterprise dashboard"
        >
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1">
            <CloudUploadIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Bulk User Onboarding
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Import multiple users at once using a CSV file
          </Typography>
        </Box>
      </Box>

      {/* Bulk onboarding wizard component */}
      <BulkOnboardingWizard
        teamId={teamId}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </Box>
  );
};

export default BulkOnboardingPage;
