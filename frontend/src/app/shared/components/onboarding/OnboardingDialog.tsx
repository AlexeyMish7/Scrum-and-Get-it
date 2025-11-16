/**
 * ONBOARDING DIALOG
 * Welcome screen for new users guiding them through initial setup.
 *
 * FEATURES:
 * - Multi-step wizard (Profile, Jobs, AI Tools)
 * - Progress tracking
 * - Skip option
 * - localStorage persistence
 * - Responsive design
 *
 * USAGE:
 * ```tsx
 * const [showOnboarding, setShowOnboarding] = useState(false);
 *
 * useEffect(() => {
 *   const completed = localStorage.getItem('onboarding_completed');
 *   if (!completed) setShowOnboarding(true);
 * }, []);
 *
 * <OnboardingDialog
 *   open={showOnboarding}
 *   onClose={() => setShowOnboarding(false)}
 * />
 * ```
 */

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Box,
  Stack,
  Paper,
} from "@mui/material";
import { Person, Work, AutoAwesome, CheckCircle } from "@mui/icons-material";

interface OnboardingDialogProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  {
    label: "Welcome",
    icon: <CheckCircle />,
    title: "Welcome to ATS Tracker!",
    description:
      "Your personal job search assistant powered by AI. Let's get you started in just 3 quick steps.",
  },
  {
    label: "Profile",
    icon: <Person />,
    title: "Complete Your Profile",
    description:
      "Add your work experience, education, and skills to help AI generate tailored resumes and cover letters.",
    action: { label: "Go to Profile", path: "/profile" },
  },
  {
    label: "Jobs",
    icon: <Work />,
    title: "Track Your First Job",
    description:
      "Start managing your job search by adding opportunities you're interested in. Track applications through our visual pipeline.",
    action: { label: "Add Job", path: "/jobs/new" },
  },
  {
    label: "AI Tools",
    icon: <AutoAwesome />,
    title: "Explore AI Features",
    description:
      "Generate tailored resumes, cover letters, and get job matching insights powered by AI. Save hours on application materials.",
    action: { label: "Try AI Tools", path: "/ai" },
  },
];

export default function OnboardingDialog({
  open,
  onClose,
}: OnboardingDialogProps) {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleComplete();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_completed", "skipped");
    onClose();
  };

  const handleComplete = () => {
    localStorage.setItem("onboarding_completed", "true");
    localStorage.setItem("onboarding_completed_at", new Date().toISOString());
    onClose();
  };

  const currentStep = steps[activeStep];

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="div" gutterBottom>
          Getting Started
        </Typography>
        <Stepper activeStep={activeStep} sx={{ mt: 2 }}>
          {steps.map((step) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>

      <DialogContent>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            bgcolor: "grey.50",
            borderRadius: 2,
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 2,
              "& svg": {
                fontSize: 64,
                color: "primary.main",
              },
            }}
          >
            {currentStep.icon}
          </Box>

          <Typography variant="h6" gutterBottom fontWeight={600}>
            {currentStep.title}
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {currentStep.description}
          </Typography>

          {currentStep.action && (
            <Button
              variant="outlined"
              onClick={() => {
                handleComplete();
                window.location.href = currentStep.action!.path;
              }}
              sx={{ mt: 1 }}
            >
              {currentStep.action.label}
            </Button>
          )}
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ width: "100%", justifyContent: "space-between" }}
        >
          <Button onClick={handleSkip} color="inherit">
            Skip Tour
          </Button>

          <Stack direction="row" spacing={1}>
            <Button onClick={handleBack} disabled={activeStep === 0}>
              Back
            </Button>
            <Button onClick={handleNext} variant="contained">
              {activeStep === steps.length - 1 ? "Get Started" : "Next"}
            </Button>
          </Stack>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
