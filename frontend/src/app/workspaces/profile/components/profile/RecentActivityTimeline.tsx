import React, { memo } from "react";
import { Box, Typography, useTheme, Paper } from "@mui/material";

// Activity item from unified cache
interface ActivityItem {
  id: string;
  type: "employment" | "skill" | "education" | "project" | "certification";
  title: string;
  subtitle: string;
  date: string;
}

interface RecentActivityTimelineProps {
  activities: ActivityItem[] | null | undefined;
}

const RecentActivityTimeline: React.FC<RecentActivityTimelineProps> = ({
  activities,
}) => {
  const theme = useTheme();
  const safeActivities = Array.isArray(activities) ? activities : [];

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        p: 3,
        height: 323,
        overflowY: "auto",
      }}
    >
      <Typography variant="h6" fontWeight={600} sx={{ mt: 0, mb: 2 }}>
        Recent Activity
      </Typography>

      {safeActivities.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No recent activity yet. Add employment, skills, education, or projects
          to see your activity here!
        </Typography>
      ) : (
        <Box
          sx={{
            listStyle: "none",
            p: 0,
            borderLeft: `2px solid ${theme.palette.divider}`,
          }}
        >
          {safeActivities.map(({ id, date, title, subtitle }) => (
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
                  left: -5,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: theme.palette.primary.main,
                  border: `2px solid ${theme.palette.background.paper}`,
                }}
              />

              <Typography variant="body2" color="text.secondary">
                {new Date(date).toLocaleString()}
              </Typography>
              <Typography variant="body1" color="text.primary" fontWeight={600}>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default memo(RecentActivityTimeline);
