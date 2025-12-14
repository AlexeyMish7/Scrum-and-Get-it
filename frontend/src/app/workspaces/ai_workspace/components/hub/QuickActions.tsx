/**
 * QuickActions - Quick Action Cards
 *
 * Displays quick action cards for common tasks like creating
 * new resumes, cover letters, and running company research.
 */

import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
  Grid,
} from "@mui/material";
import type { SvgIconProps } from "@mui/material";
import {
  Description as ResumeIcon,
  Email as CoverLetterIcon,
  Search as ResearchIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import type { QuickAction } from "../../types";

/**
 * Default quick actions
 */
const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: "new-resume",
    label: "New Resume",
    icon: "resume",
    action: "/ai/generate/resume",
    color: "#1976d2",
    tooltip: "Create a new resume with AI assistance",
  },
  {
    id: "new-cover-letter",
    label: "New Cover Letter",
    icon: "cover-letter",
    action: "/ai/generate/cover-letter",
    color: "#388e3c",
    tooltip: "Generate a tailored cover letter",
  },
  {
    id: "company-research",
    label: "Company Research",
    icon: "research",
    action: "/ai/research",
    color: "#f57c00",
    tooltip: "Research companies for your applications",
  },
];

/**
 * Icon mapping
 */
const ICON_MAP: Record<string, React.ComponentType<SvgIconProps>> = {
  resume: ResumeIcon,
  "cover-letter": CoverLetterIcon,
  research: ResearchIcon,
};

interface QuickActionsProps {
  /** Custom quick actions (optional) */
  actions?: QuickAction[];
}

/**
 * QuickActions Component
 *
 * Renders a grid of quick action cards for common tasks.
 */
export default function QuickActions({
  actions = DEFAULT_QUICK_ACTIONS,
}: QuickActionsProps) {
  const navigate = useNavigate();

  const handleActionClick = (action: QuickAction) => {
    if (typeof action.action === "string") {
      navigate(action.action);
    } else {
      action.action();
    }
  };

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
        Quick Actions
      </Typography>

      <Grid container spacing={3}>
        {actions.map((action) => {
          const IconComponent = ICON_MAP[action.icon];
          // Primary action gets elevated treatment
          const isPrimary = action.id === "new-resume";

          return (
            <Grid
              size={{ xs: 12, sm: 6, md: isPrimary ? 5 : 3.5 }}
              key={action.id}
            >
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  border: 1,
                  borderColor: isPrimary ? `${action.color}30` : "divider",
                  background: isPrimary
                    ? (theme) =>
                        theme.palette.mode === "dark"
                          ? `linear-gradient(135deg, ${action.color}08 0%, ${action.color}15 100%)`
                          : `linear-gradient(135deg, ${action.color}05 0%, ${action.color}10 100%)`
                    : "background.paper",
                  boxShadow: (theme) =>
                    isPrimary
                      ? theme.palette.mode === "dark"
                        ? `0 4px 20px ${action.color}15, 0 2px 8px rgba(0, 0, 0, 0.3)`
                        : `0 4px 20px ${action.color}12, 0 2px 8px rgba(0, 0, 0, 0.08)`
                      : theme.palette.mode === "dark"
                      ? "0 2px 12px rgba(0, 0, 0, 0.25)"
                      : "0 2px 12px rgba(0, 0, 0, 0.05)",
                  "&:hover": {
                    borderColor: action.color || "primary.main",
                    transform: isPrimary
                      ? "translateY(-6px)"
                      : "translateY(-4px)",
                    boxShadow: (theme) =>
                      isPrimary
                        ? theme.palette.mode === "dark"
                          ? `0 12px 40px ${action.color}25, 0 6px 16px rgba(0, 0, 0, 0.4)`
                          : `0 12px 40px ${action.color}20, 0 6px 16px rgba(0, 0, 0, 0.12)`
                        : theme.palette.mode === "dark"
                        ? "0 8px 28px rgba(0, 0, 0, 0.35)"
                        : "0 8px 28px rgba(0, 0, 0, 0.1)",
                  },
                }}
              >
                <CardActionArea
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled}
                  sx={{ height: "100%", p: isPrimary ? 0.5 : 0 }}
                >
                  <CardContent
                    sx={{
                      textAlign: "center",
                      py: isPrimary ? 4 : 3,
                      px: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: isPrimary ? 80 : 64,
                        height: isPrimary ? 80 : 64,
                        borderRadius: "50%",
                        backgroundColor: `${action.color}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto",
                        mb: isPrimary ? 2.5 : 2,
                        transition: "all 0.25s",
                      }}
                    >
                      {IconComponent && (
                        <IconComponent
                          sx={{
                            fontSize: isPrimary ? 40 : 32,
                            color: action.color || "primary.main",
                          }}
                        />
                      )}
                    </Box>

                    <Typography
                      variant={isPrimary ? "h5" : "h6"}
                      sx={{
                        fontWeight: isPrimary ? 700 : 600,
                        mb: 1,
                      }}
                    >
                      {action.label}
                    </Typography>

                    {action.tooltip && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          lineHeight: 1.6,
                        }}
                      >
                        {action.tooltip}
                      </Typography>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
