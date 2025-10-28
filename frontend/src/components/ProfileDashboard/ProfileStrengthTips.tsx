import React from "react";
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from "react-icons/fa";
import { Box, Typography, useTheme } from "@mui/material";

interface ProfileStrengthTipsProps {
  strengthScore: number; // 0–100
  recommendations: string[];
}

const ProfileStrengthTips: React.FC<ProfileStrengthTipsProps> = ({
  strengthScore,
  recommendations,
}) => {
  const theme = useTheme();

  // Determine label, color, and icon using theme palette
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
    <Box
      sx={{
        my: 4,
        p: 2,
        border: `1px solid ${color}`,
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Typography
        variant="h4"
        sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
      >
        {icon} Profile Strength:{" "}
        <Box component="span" sx={{ color }}>
          {label}
        </Box>{" "}
        ({strengthScore}%)
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
            width: `${strengthScore}%`,
            backgroundColor: theme.palette.success.main,
            transition: "width 0.5s ease",
          }}
        />
      </Box>

      {recommendations.length > 0 ? (
        <>
          <Typography variant="h5" gutterBottom>
            Recommendations:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 0 }}>
            {recommendations.map((rec, idx) => (
              <Typography
                key={idx}
                component="li"
                variant="body1"
                sx={{ mb: 0.5 }}
              >
                {rec}
              </Typography>
            ))}
          </Box>
        </>
      ) : (
        <Typography variant="body1" sx={{ color: theme.palette.success.main }}>
          Your profile looks great! 🎉
        </Typography>
      )}
    </Box>
  );
};

export default ProfileStrengthTips;
