import React from "react";
import { Box, Typography, useTheme } from "@mui/material";


interface CareerEvent {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate?: string; // optional if "Present"
  description?: string;
}

interface CareerTimelineProps {
  events: CareerEvent[];
}

const CareerTimeline: React.FC<CareerTimelineProps> = ({ events }) => {
  const theme = useTheme();
    return (
    <Box sx={{ my: 4 }}>
      <Typography variant="h4" gutterBottom>
        Career Timeline
      </Typography>

      <Box
        sx={{
          position: "relative",
          my: 4,
          pl: 3,
          borderLeft: `3px solid ${theme.palette.primary.main}`,
        }}
      >
        {events.map((event) => (
          <Box key={event.id} sx={{ mb: 4, position: "relative" }}>
            {/* timeline dot */}
            <Box
              sx={{
                position: "absolute",
                left: -2,
                top: 1,
                width: 3.5,
                height: 3.5,
                borderRadius: "50%",
                bgcolor: theme.palette.primary.main,
              }}
            />

            <Box>
              <Typography variant="h5">{event.title}</Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mt: 0.5 }}>
                {event.company}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {event.startDate} – {event.endDate ?? "Present"}
              </Typography>
              {event.description && (
                <Typography variant="body1" color="text.primary" sx={{ mt: 0.5 }}>
                  Job Description: {event.description}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default CareerTimeline;