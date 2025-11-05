import React from "react";
import { Box, Typography, useTheme } from "@mui/material";

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
    <Box
      sx={{
        my: 4,
        p: 3,
        border: `1px solid ${theme.palette.primary.main}`,
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Typography variant="h4" gutterBottom>
        Profile Completion:{" "}
        <Box component="span" sx={{ color: theme.palette.success.main }}>
          {completionPercentage.toFixed(0)}%
        </Box>
      </Typography>

      <Box
        sx={{
          backgroundColor: theme.palette.grey[300],
          height: 10,
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
          <Typography variant="h5" gutterBottom>
            Suggestions:
          </Typography>
          <Box component="ul" sx={{ color: theme.palette.primary.main, pl: 3 }}>
            {suggestions.map((sugg, idx) => (
              <li key={idx}>
                <Typography variant="body1">{sugg}</Typography>
              </li>
            ))}
          </Box>
        </>
      ) : (
        <Typography variant="body1" sx={{ color: theme.palette.success.main }}>
          Your profile is complete! 🎉
        </Typography>
      )}
    </Box>
  );
};

export default ProfileCompletion;
