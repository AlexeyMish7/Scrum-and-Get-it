/**
 * SUMMARY CARDS COMPONENT
 *
 * Purpose:
 * - Display profile section counts (Employment, Skills, Education, Projects)
 * - Provide quick-add buttons that open dedicated dialogs
 * - Show visual feedback with icons and theme-based colors
 *
 * Pattern:
 * - Cards open dedicated dialog components (AddSkillDialog, etc.)
 * - Dialogs handle their own form state, validation, and DB operations
 * - Dialogs dispatch events (skills:changed, etc.) when data changes
 * - Parent components listen for events to refresh data
 *
 * Performance:
 * - Wrapped with React.memo to prevent unnecessary re-renders
 * - cardsConfig memoized to maintain stable reference
 * - Dialog handlers memoized with useCallback
 *
 * No inline forms - all add/edit operations use dedicated dialogs
 */
import React, { useState, useMemo, useCallback, memo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  useTheme,
  Snackbar,
  Alert,
  alpha,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import WorkIcon from "@mui/icons-material/Work";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SchoolIcon from "@mui/icons-material/School";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { AddSkillDialog } from "../dialogs/AddSkillDialog";
import { AddEducationDialog } from "../dialogs/AddEducationDialog";
import { AddEmploymentDialog } from "../dialogs/AddEmploymentDialog";
import { AddProjectDialog } from "../dialogs/AddProjectDialog";
import { GlowBorder } from "@shared/components/effects/GlowBorder";

interface SummaryCardsProps {
  counts: {
    employmentCount: number;
    skillsCount: number;
    educationCount: number;
    projectsCount: number;
  };
  // Legacy props - kept for compatibility but no longer used
  // Dialogs handle their own DB operations and dispatch events
  onAddEmployment?: (
    data: Record<string, string | number | boolean | undefined>
  ) => Promise<void> | void;
  onAddSkill?: (
    data: Record<string, string | number | boolean | undefined>
  ) => Promise<void> | void;
  onAddEducation?: (
    data: Record<string, string | number | boolean | undefined>
  ) => Promise<void> | void;
  onAddProject?: (
    data: Record<string, string | number | boolean | undefined>
  ) => Promise<void> | void;
}

// Card configuration for consistent styling
interface CardConfig {
  title: string;
  subtitle: string;
  countKey: keyof SummaryCardsProps["counts"];
  icon: React.ReactNode;
  colorPath: "primary" | "success" | "warning" | "info";
  dialogKey: "skill" | "education" | "employment" | "project";
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ counts }) => {
  const theme = useTheme();
  const { notification, closeNotification } = useErrorHandler();

  // Dialog open states - one for each section
  const [dialogState, setDialogState] = useState({
    skill: false,
    education: false,
    employment: false,
    project: false,
  });

  // Card configurations - memoized to prevent recreation on every render
  const cardsConfig: CardConfig[] = useMemo(
    () => [
      {
        title: "Employment",
        subtitle: "Work Experience",
        countKey: "employmentCount",
        icon: <WorkIcon sx={{ fontSize: 28 }} />,
        colorPath: "primary",
        dialogKey: "employment",
      },
      {
        title: "Skills",
        subtitle: "Capabilities",
        countKey: "skillsCount",
        icon: <PsychologyIcon sx={{ fontSize: 28 }} />,
        colorPath: "success",
        dialogKey: "skill",
      },
      {
        title: "Education",
        subtitle: "Academic Background",
        countKey: "educationCount",
        icon: <SchoolIcon sx={{ fontSize: 28 }} />,
        colorPath: "warning",
        dialogKey: "education",
      },
      {
        title: "Projects",
        subtitle: "Portfolio Work",
        countKey: "projectsCount",
        icon: <RocketLaunchIcon sx={{ fontSize: 28 }} />,
        colorPath: "info",
        dialogKey: "project",
      },
    ],
    []
  );

  // Open a specific dialog - memoized to prevent recreation
  const openDialog = useCallback((key: CardConfig["dialogKey"]) => {
    setDialogState((prev) => ({ ...prev, [key]: true }));
  }, []);

  // Close a specific dialog - memoized to prevent recreation
  const closeDialog = useCallback((key: CardConfig["dialogKey"]) => {
    setDialogState((prev) => ({ ...prev, [key]: false }));
  }, []);

  // Success handlers - memoized, dialogs dispatch events
  const handleSuccess = useCallback(() => {
    // Dialogs already dispatch their own events (skills:changed, etc.)
    // The useDashboardData hook listens for these events and refreshes
  }, []);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          lg: "repeat(4, 1fr)",
        },
        gap: 2.5,
        mt: 2,
        mb: 3,
      }}
      role="region"
      aria-label="Profile summary cards"
    >
      {cardsConfig.map((card) => {
        const cardColor = theme.palette[card.colorPath].main;
        const lightBg = alpha(cardColor, 0.08);
        const count = counts[card.countKey];

        return (
          <GlowBorder
            key={card.title}
            intensity={0.25}
            spread={15}
            glowColor={cardColor}
            borderRadius={3}
          >
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                backgroundColor: theme.palette.background.paper,
                position: "relative",
                overflow: "visible",
                transition: "all 0.2s ease",
                // Theme border will apply automatically - don't override
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: `0 8px 24px ${alpha(cardColor, 0.15)}`,
                  // Theme hover border will apply automatically
                },
              }}
            >
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                {/* Top row: Icon and Add button */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  {/* Icon container */}
                  <Box
                    sx={{
                      backgroundColor: lightBg,
                      borderRadius: 2,
                      width: 48,
                      height: 48,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: cardColor,
                    }}
                    aria-hidden="true"
                  >
                    {card.icon}
                  </Box>

                  {/* Add button */}
                  <Tooltip title={`Add ${card.title}`} arrow>
                    <IconButton
                      onClick={() => openDialog(card.dialogKey)}
                      size="small"
                      sx={{
                        backgroundColor: lightBg,
                        color: cardColor,
                        width: 32,
                        height: 32,
                        "&:hover": {
                          backgroundColor: cardColor,
                          color: theme.palette.getContrastText(cardColor),
                          transform: "rotate(90deg)",
                        },
                        transition: "all 0.2s ease",
                      }}
                      aria-label={`Add new ${card.title.toLowerCase()}`}
                    >
                      <AddIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Count - large and prominent */}
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    lineHeight: 1,
                    mb: 0.5,
                  }}
                >
                  {count}
                </Typography>

                {/* Title */}
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    lineHeight: 1.3,
                  }}
                >
                  {card.title}
                </Typography>

                {/* Subtitle */}
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    display: "block",
                  }}
                >
                  {card.subtitle}
                </Typography>

                {/* Status indicator */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mt: 1.5,
                    pt: 1.5,
                    borderTop: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor:
                        count > 0
                          ? theme.palette.success.main
                          : theme.palette.warning.main,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color:
                        count > 0
                          ? theme.palette.success.main
                          : theme.palette.warning.main,
                      fontWeight: 500,
                    }}
                  >
                    {count > 0 ? "Active" : "Add entries"}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </GlowBorder>
        );
      })}

      {/* Dedicated Dialogs - Each handles its own form, validation, and DB operations */}
      <AddSkillDialog
        open={dialogState.skill}
        onClose={() => closeDialog("skill")}
        onSuccess={handleSuccess}
        mode="add"
      />

      <AddEducationDialog
        open={dialogState.education}
        onClose={() => closeDialog("education")}
        onSuccess={handleSuccess}
        mode="add"
      />

      <AddEmploymentDialog
        open={dialogState.employment}
        onClose={() => closeDialog("employment")}
        onSuccess={handleSuccess}
        mode="add"
      />

      <AddProjectDialog
        open={dialogState.project}
        onClose={() => closeDialog("project")}
        onSuccess={handleSuccess}
        mode="add"
      />

      {/* Snackbar for any error notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={notification.autoHideDuration}
        onClose={closeNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeNotification}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default memo(SummaryCards);
