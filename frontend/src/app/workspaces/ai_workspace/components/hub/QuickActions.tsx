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
  Stack,
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
    action: "/ai-new/generate/resume",
    color: "#1976d2",
    tooltip: "Create a new resume with AI assistance",
  },
  {
    id: "new-cover-letter",
    label: "New Cover Letter",
    icon: "cover-letter",
    action: "/ai-new/generate/cover-letter",
    color: "#388e3c",
    tooltip: "Generate a tailored cover letter",
  },
  {
    id: "company-research",
    label: "Company Research",
    icon: "research",
    action: "/ai-new/research",
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
      <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
        Quick Actions
      </Typography>

      <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", gap: 2 }}>
        {actions.map((action) => {
          const IconComponent = ICON_MAP[action.icon];

          return (
            <Box
              key={action.id}
              sx={{ flex: "1 1 calc(33.33% - 16px)", minWidth: 250 }}
            >
              <Card
                elevation={0}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  height: "100%",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: action.color || "primary.main",
                    transform: "translateY(-2px)",
                    boxShadow: 2,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled}
                  sx={{ height: "100%", p: 2 }}
                >
                  <CardContent sx={{ textAlign: "center" }}>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        backgroundColor: `${action.color}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 16px",
                      }}
                    >
                      {IconComponent && (
                        <IconComponent
                          sx={{
                            fontSize: 32,
                            color: action.color || "primary.main",
                          }}
                        />
                      )}
                    </Box>

                    <Typography variant="h6" gutterBottom>
                      {action.label}
                    </Typography>

                    {action.tooltip && (
                      <Typography variant="body2" color="text.secondary">
                        {action.tooltip}
                      </Typography>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
