import React from "react";
import { Card, CardContent, Typography } from "@mui/material";

interface AppCardProps {
  title?: string;
  children: React.ReactNode;
  variant?: "outlined" | "filled";
}

const AppCard: React.FC<AppCardProps> = ({ title, children, variant = "outlined" }) => {
  return (
    <Card variant={variant} sx={{ marginBottom: 3 }}>
      <CardContent>
        {title && (
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
        )}
        {children}
      </CardContent>
    </Card>
  );
};

export default AppCard;