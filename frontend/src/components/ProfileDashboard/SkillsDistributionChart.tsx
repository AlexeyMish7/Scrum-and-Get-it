

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Box, Typography } from "@mui/material";

interface SkillData {
  name: string;
  value: number;
}

interface SkillsDistributionChartProps {
  skills: SkillData[];
}

const COLORS = ["#4CAF50", "#2196F3", "#FF9800", "#E91E63", "#9C27B0"];

const SkillsDistributionChart: React.FC<SkillsDistributionChartProps> = ({ skills }) => {
  const chartData = skills.map((s) => ({
    name: s.name,
    value: s.value,
  }));

  return (
    <Box
      sx={{
        border: "1px solid #000", // thin black outline
        borderRadius: 2,
        p: 3,
        mt: 0,
      }}
    >
      <h2 style={{ marginTop: 0 }}>Skills Distribution</h2>
      <Box sx={{ width: "100%", height: 250 }}>
        <ResponsiveContainer>
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
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default SkillsDistributionChart;