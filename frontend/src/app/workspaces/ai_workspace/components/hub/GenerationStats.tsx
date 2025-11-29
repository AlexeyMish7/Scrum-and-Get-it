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
      subtitle: `+${weeklyDocuments} this week`,
    },
    {
      label: "Versions",
      value: totalVersions,
      icon: VersionIcon,
      color: "#9c27b0",
    },
    {
      label: "Avg ATS Score",
      value: averageAtsScore ? `${averageAtsScore}%` : "N/A",
      icon: TrendIcon,
      color: "#2e7d32",
    },
    {
      label: "Jobs Applied",
      value: jobsApplied || 0,
      icon: CheckIcon,
      color: "#ed6c02",
    },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
        Statistics
      </Typography>

      <Grid container spacing={2}>
        {stats.map((stat) => {
          const IconComponent = stat.icon;

          return (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
              <Card
                elevation={0}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  height: "100%",
                }}
              >
                <CardContent>
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
                      }}
                    >
                      <IconComponent
                        sx={{
                          fontSize: 24,
                          color: stat.color,
                        }}
                      />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h4" gutterBottom>
                        {stat.value}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        {stat.label}
                      </Typography>

                      {stat.subtitle && (
                        <Typography variant="caption" color="success.main">
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
