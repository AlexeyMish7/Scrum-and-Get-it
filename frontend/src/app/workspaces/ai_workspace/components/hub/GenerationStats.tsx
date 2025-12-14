/**
 * GenerationStats - Statistics Dashboard
 *
 * Displays key statistics about documents, versions, and usage.
 */

import { Card, CardContent, Typography, Box, Stack, Grid } from "@mui/material";
import type { SvgIconProps } from "@mui/material";
import {
  Description as DocumentIcon,
  History as VersionIcon,
  TrendingUp as TrendIcon,
  CheckCircle as CheckIcon,
  LockOutlined as LockIcon,
} from "@mui/icons-material";

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ComponentType<SvgIconProps>;
  color: string;
  subtitle?: string;
}

interface GenerationStatsProps {
  /** Total documents */
  totalDocuments: number;

  /** Total versions */
  totalVersions: number;

  /** Documents created this week */
  weeklyDocuments: number;

  /** Average ATS score */
  averageAtsScore?: number;

  /** Jobs applied to */
  jobsApplied?: number;
}

/**
 * GenerationStats Component
 *
 * Displays statistics cards with key metrics.
 */
export default function GenerationStats({
  totalDocuments,
  totalVersions,
  weeklyDocuments,
  averageAtsScore,
  jobsApplied,
}: GenerationStatsProps) {
  const stats: StatCard[] = [
    {
      label: "Documents",
      value: totalDocuments,
      icon: DocumentIcon,
      color: "#1976d2",
      subtitle:
        weeklyDocuments > 0 ? `${weeklyDocuments} this week` : undefined,
    },
    {
      label: "Versions",
      value: totalVersions,
      icon: VersionIcon,
      color: "#9c27b0",
      subtitle: totalVersions > 0 ? "Tracked automatically" : undefined,
    },
    {
      label: "Avg ATS Score",
      value: averageAtsScore ? `${averageAtsScore}%` : "N/A",
      icon: TrendIcon,
      color: "#2e7d32",
      subtitle: averageAtsScore
        ? "Beating the bots"
        : "Generate a resume to unlock",
    },
    {
      label: "Jobs Applied",
      value: jobsApplied || 0,
      icon: CheckIcon,
      color: "#ed6c02",
      subtitle: jobsApplied && jobsApplied > 0 ? "Great progress!" : undefined,
    },
  ];

  return (
    <Box>
      <Typography
        variant="h5"
        sx={{
          mb: 3,
          fontWeight: 700,
          letterSpacing: "-0.01em",
        }}
      >
        Statistics
      </Typography>

      <Grid container spacing={3}>
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          const isUnavailable = stat.value === "N/A";

          return (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  border: 1,
                  borderColor: isUnavailable ? "divider" : `${stat.color}20`,
                  opacity: 1,
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: isUnavailable ? "divider" : `${stat.color}40`,
                  },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 1.5,
                        backgroundColor: `${stat.color}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        opacity: isUnavailable ? 0.5 : 1,
                      }}
                    >
                      {isUnavailable ? (
                        <LockIcon
                          sx={{
                            fontSize: 24,
                            color: "text.disabled",
                          }}
                        />
                      ) : (
                        <IconComponent
                          sx={{
                            fontSize: 24,
                            color: stat.color,
                          }}
                        />
                      )}
                    </Box>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="h3"
                        sx={{
                          fontWeight: 700,
                          fontSize: isUnavailable ? "1.75rem" : "2.125rem",
                          mb: 0.5,
                          color: isUnavailable
                            ? "text.disabled"
                            : "text.primary",
                        }}
                      >
                        {stat.value}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 500,
                          mb: stat.subtitle ? 0.5 : 0,
                        }}
                      >
                        {stat.label}
                      </Typography>

                      {stat.subtitle && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: isUnavailable
                              ? "text.disabled"
                              : "success.main",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            fontStyle: isUnavailable ? "italic" : "normal",
                          }}
                        >
                          {stat.subtitle}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
