import React, { useMemo, useState, useEffect, useRef, memo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface SkillData {
  name: string;
  value: number;
}

interface SkillsDistributionChartProps {
  skills: SkillData[];
}

// Generate colors from theme or use a nice palette
const generateColors = (count: number, theme: ReturnType<typeof useTheme>) => {
  const baseColors = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
    theme.palette.secondary.main,
  ];

  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  return colors;
};

const SkillsDistributionChart: React.FC<SkillsDistributionChartProps> = ({
  skills,
}) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  // Auto-switch to bar chart when there are many skills
  const skillCount = skills.length;
  const defaultView = skillCount > 8 ? "bar" : "pie";
  const [chartType, setChartType] = useState<"pie" | "bar">(defaultView);

  // Update default view when skill count changes significantly
  useEffect(() => {
    if (skillCount > 8 && chartType === "pie") {
      setChartType("bar");
    }
  }, [skillCount]);

  const chartData = useMemo(
    () => skills.map((s) => ({ name: s.name, value: s.value })),
    [skills]
  );

  const total = chartData.reduce((sum, item) => sum + (item.value || 0), 0);
  const colors = useMemo(
    () => generateColors(chartData.length, theme),
    [chartData.length, theme]
  );

  // Dynamic height based on number of skills for bar chart
  const barChartHeight = Math.max(250, skillCount * 35);

  // Wait for container to have dimensions before rendering chart
  useEffect(() => {
    const checkReady = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          setIsReady(true);
        }
      }
    };

    checkReady();
    const timeout = setTimeout(checkReady, 100);

    return () => clearTimeout(timeout);
  }, [total]);

  const handleChartTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: "pie" | "bar" | null
  ) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  // Custom tooltip for better readability
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const levelLabels = [
        "",
        "Beginner",
        "Intermediate",
        "Advanced",
        "Expert",
      ];
      return (
        <Box
          component="div"
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: 1,
            p: 1.5,
            boxShadow: theme.shadows[2],
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            {data.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Level: {levelLabels[data.value] || data.value}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        p: 3,
        mt: 0,
      }}
      role="region"
      aria-label="Skills distribution chart"
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4" component="h2" sx={{ m: 0 }}>
          Skills Distribution
        </Typography>

        {total > 0 && skillCount > 3 && (
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
            size="small"
            aria-label="chart type"
          >
            <ToggleButton value="pie" aria-label="pie chart">
              Pie
            </ToggleButton>
            <ToggleButton value="bar" aria-label="bar chart">
              Bar
            </ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      {total === 0 ? (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography color="text.secondary">No skills to display</Typography>
        </Box>
      ) : (
        <Box
          ref={containerRef}
          sx={{
            width: "100%",
            height:
              chartType === "bar" ? Math.min(barChartHeight, 400) : "auto",
            minHeight: 250,
            overflowY:
              chartType === "bar" && skillCount > 10 ? "auto" : "visible",
            overflow: "hidden",
          }}
        >
          {isReady && chartType === "pie" && (
            <ResponsiveContainer
              width="100%"
              height={skillCount > 6 ? 200 : 250}
            >
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={skillCount > 8 ? 60 : skillCount > 6 ? 70 : 80}
                  innerRadius={skillCount > 6 ? 30 : 0}
                  paddingAngle={skillCount > 6 ? 2 : 0}
                  label={false}
                  labelLine={false}
                >
                  {chartData.map((s, index) => (
                    <Cell key={`${s.name}-${index}`} fill={colors[index]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}

          {isReady && chartType === "bar" && (
            <ResponsiveContainer
              width="100%"
              height={Math.min(barChartHeight, 380)}
            >
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={theme.palette.divider}
                />
                <XAxis
                  type="number"
                  domain={[0, 4]}
                  ticks={[1, 2, 3, 4]}
                  tickFormatter={(value) => {
                    const labels = [
                      "",
                      "Beginner",
                      "Intermediate",
                      "Advanced",
                      "Expert",
                    ];
                    return labels[value] || "";
                  }}
                  tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fill: theme.palette.text.primary, fontSize: 11 }}
                  tickLine={false}
                  tickFormatter={(value: string) =>
                    value.length > 12 ? `${value.substring(0, 12)}...` : value
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={25}>
                  {chartData.map((_, index) => (
                    <Cell key={`bar-${index}`} fill={colors[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Legend for pie chart - always show since labels are disabled */}
          {chartType === "pie" && (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 0.75,
                mt: 2,
                justifyContent: "center",
                px: 1,
                maxHeight: 80,
                overflowY: "auto",
              }}
            >
              {chartData.map((item, index) => (
                <Box
                  key={item.name}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: colors[index],
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      whiteSpace: "nowrap",
                      fontSize: "0.7rem",
                    }}
                  >
                    {item.name.length > 12
                      ? `${item.name.substring(0, 12)}...`
                      : item.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default memo(SkillsDistributionChart);
