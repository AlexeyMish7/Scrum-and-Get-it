import React, { memo, useMemo } from "react";
import { Box, Typography, useTheme, Paper } from "@mui/material";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
} from "react-icons/fa";

interface ProfileData {
  employmentCount: number;
  skillsCount: number;
  educationCount: number;
  projectsCount: number;
}

interface ProfileStrengthProps {
  profile: ProfileData;
}

const REQUIRED_COUNTS = {
  employment: 2,
  skills: 5,
  education: 1,
  projects: 3,
};

const WEIGHTS = {
  employment: 0.3,
  skills: 0.3,
  education: 0.2,
  projects: 0.2,
};

const ProfileStrength: React.FC<ProfileStrengthProps> = ({ profile }) => {
  const theme = useTheme();

  const employmentStrength = Math.min(
    profile.employmentCount / REQUIRED_COUNTS.employment,
    1
  );
  const skillsStrength = Math.min(
    profile.skillsCount / REQUIRED_COUNTS.skills,
    1
  );
  const educationStrength = Math.min(
    profile.educationCount / REQUIRED_COUNTS.education,
    1
  );
  const projectsStrength = Math.min(
    profile.projectsCount / REQUIRED_COUNTS.projects,
    1
  );

  const strengthScore =
    (employmentStrength * WEIGHTS.employment +
      skillsStrength * WEIGHTS.skills +
      educationStrength * WEIGHTS.education +
      projectsStrength * WEIGHTS.projects) *
    100;

  const recommendations: string[] = [];

  if (employmentStrength < 1) {
    recommendations.push(
      "Include detailed descriptions of your responsibilities and achievements for each job.",
      "Highlight measurable results or projects you led in past roles."
    );
  }

  if (skillsStrength < 1) {
    recommendations.push(
      "List at least 3–5 key skills relevant to your career goals.",
      "Include both technical and soft skills."
    );
  }

  if (educationStrength < 1) {
    recommendations.push(
      "Include your degree, institution, and graduation year.",
      "Highlight relevant coursework, certifications, or awards."
    );
  }

  if (projectsStrength < 1) {
    recommendations.push(
      "Add at least one project with a clear description and your role.",
      "Include links to live demos, GitHub repos, or portfolios."
    );
  }

  let label = "Weak";
  let color = theme.palette.error.main;
  let icon = <FaTimesCircle color={color} />;

  if (strengthScore >= 70) {
    label = "Strong";
    color = theme.palette.success.main;
    icon = <FaCheckCircle color={color} />;
  } else if (strengthScore >= 40) {
    label = "Moderate";
    color = theme.palette.warning.main;
    icon = <FaExclamationTriangle color={color} />;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
      }}
    >
      <Typography
        variant="h6"
        fontWeight={600}
        sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
      >
        {icon} Profile Strength:{" "}
        <Box component="span" sx={{ color }}>
          {label}
        </Box>{" "}
        ({strengthScore.toFixed(0)}%)
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
            width: `${strengthScore}%`,
            backgroundColor: color,
            transition: "width 0.5s ease",
          }}
        />
      </Box>

      {recommendations.length > 0 ? (
        <>
          <Typography variant="h5" gutterBottom>
            Recommendations:
          </Typography>
          <Box component="ul" sx={{ pl: 4, pr: 2, mb: 0, mt: 1 }}>
            {recommendations.map((rec, idx) => (
              <li key={idx}>
                <Typography variant="body1">{rec}</Typography>
              </li>
            ))}
          </Box>
        </>
      ) : (
        <Typography variant="body1" sx={{ color: theme.palette.success.main }}>
          Your profile looks strong! 🎉
        </Typography>
      )}
    </Paper>
  );
};

export default memo(ProfileStrength);
