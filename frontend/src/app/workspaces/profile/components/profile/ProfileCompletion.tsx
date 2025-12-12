import React, { memo } from "react";
import { Box, Typography, useTheme, Paper } from "@mui/material";

interface ProfileData {
  employmentCount: number;
  skillsCount: number;
  educationCount: number;
  projectsCount: number;
}

interface ProfileCompletionProps {
  profile: ProfileData;
}

const REQUIRED_COUNTS = {
  employment: 2,
  skills: 5,
  education: 1,
  projects: 3,
};

const ProfileCompletion: React.FC<ProfileCompletionProps> = ({ profile }) => {
  // Calculate completeness per section (0-1)
  const employmentComplete = Math.min(
    profile.employmentCount / REQUIRED_COUNTS.employment,
    1
  );
  const skillsComplete = Math.min(
    profile.skillsCount / REQUIRED_COUNTS.skills,
    1
  );
  const educationComplete = Math.min(
    profile.educationCount / REQUIRED_COUNTS.education,
    1
  );
  const projectsComplete = Math.min(
    profile.projectsCount / REQUIRED_COUNTS.projects,
    1
  );

  // Overall percentage (weighted equally)
  const completionPercentage =
    ((employmentComplete +
      skillsComplete +
      educationComplete +
      projectsComplete) /
      4) *
    100;

  // Suggestions
  const suggestions: string[] = [];
  if (employmentComplete < 1) suggestions.push("Add more employment history");
  if (skillsComplete < 1) suggestions.push("Add more skills");
  if (educationComplete < 1) suggestions.push("Add more education details");
  if (projectsComplete < 1) suggestions.push("Add more projects");

  // Determine color via theme (use semantic colors from theme)

  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
      }}
    >
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Profile Completion:{" "}
        <Box component="span" sx={{ color: theme.palette.success.main }}>
          {completionPercentage.toFixed(0)}%
        </Box>
      </Typography>

      <Box
        sx={{
          backgroundColor: theme.palette.action.hover,
          height: 8,
          borderRadius: 1,
          overflow: "hidden",
          mb: 2,
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${completionPercentage}%`,
            backgroundColor: theme.palette.success.main,
            transition: "width 0.5s ease",
          }}
        />
      </Box>

      {suggestions.length > 0 ? (
        <>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Suggestions:
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 4, pr: 2 }}>
            {suggestions.map((sugg, idx) => (
              <li key={idx}>
                <Typography variant="body2" color="text.secondary">
                  {sugg}
                </Typography>
              </li>
            ))}
          </Box>
        </>
      ) : (
        <Typography variant="body2" sx={{ color: theme.palette.success.main }}>
          Your profile is complete! 🎉
        </Typography>
      )}
    </Paper>
  );
};

export default memo(ProfileCompletion);
