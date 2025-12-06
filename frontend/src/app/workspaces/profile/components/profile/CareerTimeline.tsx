import React, { memo, useMemo } from "react";
import { Box, Typography, useTheme, Chip, alpha } from "@mui/material";
import WorkIcon from "@mui/icons-material/Work";
import BusinessIcon from "@mui/icons-material/Business";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

interface CareerEvent {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

interface CareerTimelineProps {
  events: CareerEvent[];
}

/**
 * Formats a date string to a more readable format
 * e.g., "2023-01-15" → "Jan 2023"
 */
const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

/**
 * Calculates duration between two dates
 * Returns a human-readable string like "2 yrs 3 mos"
 */
const calculateDuration = (startDate: string, endDate?: string): string => {
  if (!startDate) return "";
  try {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());

    if (months < 1) return "< 1 mo";
    if (months < 12) return `${months} mo${months > 1 ? "s" : ""}`;

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (remainingMonths === 0) return `${years} yr${years > 1 ? "s" : ""}`;
    return `${years} yr${years > 1 ? "s" : ""} ${remainingMonths} mo${
      remainingMonths > 1 ? "s" : ""
    }`;
  } catch {
    return "";
  }
};

const CareerTimeline: React.FC<CareerTimelineProps> = ({ events }) => {
  const theme = useTheme();

  // Sort events by start date (most recent first) - memoized to prevent re-sorting on every render
  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        const dateA = new Date(a.startDate || 0);
        const dateB = new Date(b.startDate || 0);
        return dateB.getTime() - dateA.getTime();
      }),
    [events]
  );

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        p: 3,
        backgroundColor: theme.palette.background.paper,
      }}
      role="region"
      aria-label="Career timeline"
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <WorkIcon sx={{ color: theme.palette.primary.main }} />
        <Typography variant="h4" component="h2" sx={{ m: 0 }}>
          Career Timeline
        </Typography>
        {events.length > 0 && (
          <Chip
            label={`${events.length} position${events.length > 1 ? "s" : ""}`}
            size="small"
            sx={{ ml: "auto" }}
          />
        )}
      </Box>

      {sortedEvents.length === 0 ? (
        <Box
          sx={{
            py: 4,
            textAlign: "center",
            backgroundColor: alpha(theme.palette.action.hover, 0.3),
            borderRadius: 1,
          }}
        >
          <WorkIcon
            sx={{ fontSize: 40, color: theme.palette.text.disabled, mb: 1 }}
          />
          <Typography color="text.secondary">
            No employment history yet
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Add your work experience to see your career timeline
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            position: "relative",
            pl: 4,
          }}
        >
          {/* Vertical timeline line */}
          <Box
            sx={{
              position: "absolute",
              left: 11,
              top: 8,
              bottom: 8,
              width: 2,
              backgroundColor: theme.palette.divider,
              borderRadius: 1,
            }}
          />

          {sortedEvents.map((event, index) => {
            const isFirst = index === 0;
            const isCurrent = !event.endDate;
            const duration = calculateDuration(event.startDate, event.endDate);

            return (
              <Box
                key={event.id}
                sx={{
                  position: "relative",
                  pb: index === sortedEvents.length - 1 ? 0 : 3,
                }}
              >
                {/* Timeline dot */}
                <Box
                  sx={{
                    position: "absolute",
                    left: -28,
                    top: 4,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    backgroundColor: isFirst
                      ? theme.palette.primary.main
                      : theme.palette.background.paper,
                    border: `3px solid ${
                      isFirst
                        ? theme.palette.primary.main
                        : theme.palette.divider
                    }`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1,
                  }}
                >
                  {isFirst && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: theme.palette.primary.contrastText,
                      }}
                    />
                  )}
                </Box>

                {/* Event card */}
                <Box
                  sx={{
                    backgroundColor: isFirst
                      ? alpha(theme.palette.primary.main, 0.04)
                      : "transparent",
                    border: `1px solid ${
                      isFirst
                        ? alpha(theme.palette.primary.main, 0.2)
                        : theme.palette.divider
                    }`,
                    borderRadius: 2,
                    p: 2,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: theme.palette.primary.main,
                      boxShadow: theme.shadows[2],
                    },
                  }}
                >
                  {/* Title and current badge */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        lineHeight: 1.3,
                      }}
                    >
                      {event.title}
                    </Typography>
                    {isCurrent && (
                      <Chip
                        label="Current"
                        size="small"
                        color="success"
                        sx={{
                          height: 22,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>

                  {/* Company name */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mt: 0.5,
                    }}
                  >
                    <BusinessIcon
                      sx={{ fontSize: 16, color: theme.palette.text.secondary }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontWeight: 500,
                      }}
                    >
                      {event.company}
                    </Typography>
                  </Box>

                  {/* Date range and duration */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mt: 1,
                    }}
                  >
                    <CalendarTodayIcon
                      sx={{ fontSize: 14, color: theme.palette.text.disabled }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(event.startDate)} –{" "}
                      {event.endDate ? formatDate(event.endDate) : "Present"}
                      {duration && (
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{
                            ml: 1.5,
                            color: theme.palette.primary.main,
                            fontWeight: 500,
                          }}
                        >
                          ({duration})
                        </Typography>
                      )}
                    </Typography>
                  </Box>

                  {/* Description */}
                  {event.description && (
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1.5,
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6,
                        borderTop: `1px solid ${theme.palette.divider}`,
                        pt: 1.5,
                      }}
                    >
                      {event.description}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default memo(CareerTimeline);
