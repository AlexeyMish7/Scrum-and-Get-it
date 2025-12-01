import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface SkillData {
  name: string;
  value: number;
}

interface SkillsDistributionChartProps {
  skills: SkillData[];
}

const COLORS = ["#4CAF50", "#2196F3", "#FF9800", "#E91E63", "#9C27B0"];

const SkillsDistributionChart: React.FC<SkillsDistributionChartProps> = ({
  skills,
}) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  
  const chartData = useMemo(
    () => skills.map((s) => ({ name: s.name, value: s.value })),
    [skills]
  );

  const total = chartData.reduce((sum, item) => sum + (item.value || 0), 0);

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
    
    // Check immediately and after a short delay (for layout settling)
    checkReady();
    const timeout = setTimeout(checkReady, 100);
    
    return () => clearTimeout(timeout);
  }, [total]);

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: theme.palette.divider,
        borderRadius: 2,
        p: 3,
        mt: 0,
      }}
      role="region"
      aria-label="Skills distribution chart"
    >
      <Typography variant="h4" component="h2" sx={{ mt: 0 }}>
        Skills Distribution
      </Typography>

      {total === 0 ? (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography color="text.secondary">No skills to display</Typography>
        </Box>
      ) : (
        <Box 
          ref={containerRef}
          sx={{ width: "100%", height: 250, minHeight: 250 }}
        >
          {isReady && (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {chartData.map((s, index) => (
                    <Cell
                      key={`${s.name}-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Box>
      )}
    </Box>
  );
};

export default SkillsDistributionChart;
