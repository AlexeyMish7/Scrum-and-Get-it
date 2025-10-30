import React from "react";
import { Box, Typography, useTheme } from "@mui/material";


interface ActivityItem {
  id: string;
  date: string; // ISO string or formatted date
  description: string;
}

interface RecentActivityTimelineProps {
  activities: ActivityItem[];
}

const RecentActivityTimeline: React.FC<RecentActivityTimelineProps> = ({ activities }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        my: 0,
        border: `1px solid ${theme.palette.text.primary}`,
        borderRadius: 3,
        p: 2,
        height: 323, // same height as Skills Distribution
        overflowY: "auto",
      }}
    >
      <Typography variant="h4" sx={{ mt: 0, mb: 2 }}>
        Recent Activity
      </Typography>

      <Box sx={{ listStyle: "none", p: 0, borderLeft: `2px solid ${theme.palette.divider}` }}>
        {activities.map(({ id, date, description }) => (
          <Box
            key={id}
            component="li"
            sx={{
              position: "relative",
              pl: 4,
              py: 1,
              mb: 3,
            }}
          >
            {/* Timeline dot */}
            <Box
              sx={{
                position: "absolute",
                left: -1.5,
                top: "50%",
                transform: "translateY(-50%)",
                width: 3,
                height: 3,
                borderRadius: "50%",
                bgcolor: theme.palette.primary.main,
              }}
            />

            <Typography variant="body2" color="text.secondary">
              {new Date(date).toLocaleString()}
            </Typography>
            <Typography variant="body1" color="text.primary">
              {description}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default RecentActivityTimeline;