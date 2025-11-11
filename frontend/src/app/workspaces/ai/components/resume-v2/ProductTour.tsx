/**
 * ProductTour Component
 *
 * WHAT: Interactive tutorial that guides users through Resume Editor V2
 * WHY: First-time users need clear guidance on the three-panel workflow
 *
 * Features:
 * - Step-by-step walkthrough of all panels
 * - Spotlight effect highlighting current step
 * - Skip/Next/Previous controls
 * - "Don't show again" option
 * - localStorage tracking (shows once, unless requested)
 * - Manual trigger via "Show Tutorial" button
 *
 * Tour Steps:
 * 1. Welcome + overview
 * 2. Generation Panel (left) - Select job + generate
 * 3. AI Results Panel (middle) - Review and apply
 * 4. Draft Preview Panel (right) - See live updates
 * 5. Undo/Redo controls
 * 6. Export options
 * 7. Complete!
 *
 * Usage:
 * <ProductTour
 *   run={showTour}
 *   onComplete={() => setShowTour(false)}
 *   onSkip={() => setShowTour(false)}
 * />
 */

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  Typography,
  Fade,
  Backdrop,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface TourStep {
  target: string; // CSS selector or special identifier
  title: string;
  content: string;
  placement: "top" | "bottom" | "left" | "right" | "center";
  spotlightPadding?: number;
}

interface ProductTourProps {
  run: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "welcome",
    title: "👋 Welcome to Resume Editor V2!",
    content:
      "Let's take a quick tour to show you how to create tailored resumes in just a few clicks. This will only take 30 seconds!",
    placement: "center",
  },
  {
    target: "generation-panel",
    title: "1️⃣ Generate AI Content",
    content:
      'Start here! Select a job from your pipeline, choose optional tone/focus, and click "Generate Resume". The AI will create tailored content based on your profile.',
    placement: "right",
    spotlightPadding: 16,
  },
  {
    target: "ai-results-panel",
    title: "2️⃣ Review AI Results",
    content:
      'Your AI-generated content appears here! Browse tabs to see Summary, Skills, and Experience. Click individual "Apply" buttons or use "Apply All Sections" at the bottom.',
    placement: "left",
    spotlightPadding: 16,
  },
  {
    target: "draft-preview-panel",
    title: "3️⃣ Live Draft Preview",
    content:
      "Watch your resume update in real-time! Sections you apply turn green. Click the edit icon on any section to customize. Show/hide sections using the eye icons.",
    placement: "left",
    spotlightPadding: 16,
  },
  {
    target: "undo-redo-controls",
    title: "↶↷ Undo & Redo",
    content:
      "Made a mistake? No problem! Use these controls to undo/redo any changes. We keep 10 levels of history.",
    placement: "bottom",
    spotlightPadding: 8,
  },
  {
    target: "export-section",
    title: "📥 Export Your Resume",
    content:
      "When you're happy with your resume, export it as PDF or DOCX from the preview panel. All changes are auto-saved!",
    placement: "top",
    spotlightPadding: 12,
  },
  {
    target: "complete",
    title: "🎉 You're All Set!",
    content:
      'That\'s it! Generate tailored resumes for each job application in minutes. Click "Show Tutorial" in the top bar anytime you need a refresher.',
    placement: "center",
  },
];

const STORAGE_KEY = "sgt:resume_tour_completed";

export default function ProductTour({
  run,
  onComplete,
  onSkip,
}: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightBox, setSpotlightBox] = useState<DOMRect | null>(null);

  const step = TOUR_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isCenterPlacement = step.placement === "center";

  // Prevent body scroll while tour is active
  useEffect(() => {
    if (run) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [run]);

  // Update spotlight position when step changes or window scrolls/resizes
  useEffect(() => {
    if (!run || isCenterPlacement) {
      setSpotlightBox(null);
      return;
    }

    const updateSpotlight = () => {
      const target = document.querySelector(`[data-tour="${step.target}"]`);
      if (target) {
        const rect = target.getBoundingClientRect();
        setSpotlightBox(rect);
      }
    };

    // Initial update
    updateSpotlight();

    // Update on scroll and resize
    window.addEventListener("scroll", updateSpotlight, true); // true = capture phase
    window.addEventListener("resize", updateSpotlight);

    return () => {
      window.removeEventListener("scroll", updateSpotlight, true);
      window.removeEventListener("resize", updateSpotlight);
    };
  }, [currentStep, run, step.target, isCenterPlacement]);

  if (!run) return null;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem(STORAGE_KEY, "true");
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    onSkip();
  };

  const getTooltipPosition = () => {
    if (isCenterPlacement || !spotlightBox) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const padding = step.spotlightPadding || 16;

    switch (step.placement) {
      case "right":
        return {
          top: spotlightBox.top + spotlightBox.height / 2,
          left: spotlightBox.right + padding + 24,
          transform: "translateY(-50%)",
        };
      case "left":
        return {
          top: spotlightBox.top + spotlightBox.height / 2,
          right: window.innerWidth - spotlightBox.left + padding + 24,
          transform: "translateY(-50%)",
        };
      case "bottom":
        return {
          top: spotlightBox.bottom + padding + 24,
          left: spotlightBox.left + spotlightBox.width / 2,
          transform: "translateX(-50%)",
        };
      case "top":
        return {
          bottom: window.innerHeight - spotlightBox.top + padding + 24,
          left: spotlightBox.left + spotlightBox.width / 2,
          transform: "translateX(-50%)",
        };
      default:
        return {};
    }
  };

  return (
    <>
      {/* Backdrop overlay - divided into 4 sections around spotlight */}
      {run && !isCenterPlacement && spotlightBox && (
        <>
          {/* Top overlay */}
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              height: spotlightBox.top - (step.spotlightPadding || 16),
              bgcolor: "rgba(0, 0, 0, 0.75)",
              zIndex: 9998,
              pointerEvents: "none",
            }}
          />

          {/* Left overlay */}
          <Box
            sx={{
              position: "fixed",
              top: spotlightBox.top - (step.spotlightPadding || 16),
              left: 0,
              width: spotlightBox.left - (step.spotlightPadding || 16),
              height: spotlightBox.height + (step.spotlightPadding || 16) * 2,
              bgcolor: "rgba(0, 0, 0, 0.75)",
              zIndex: 9998,
              pointerEvents: "none",
            }}
          />

          {/* Right overlay */}
          <Box
            sx={{
              position: "fixed",
              top: spotlightBox.top - (step.spotlightPadding || 16),
              left: spotlightBox.right + (step.spotlightPadding || 16),
              right: 0,
              height: spotlightBox.height + (step.spotlightPadding || 16) * 2,
              bgcolor: "rgba(0, 0, 0, 0.75)",
              zIndex: 9998,
              pointerEvents: "none",
            }}
          />

          {/* Bottom overlay */}
          <Box
            sx={{
              position: "fixed",
              top: spotlightBox.bottom + (step.spotlightPadding || 16),
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: "rgba(0, 0, 0, 0.75)",
              zIndex: 9998,
              pointerEvents: "none",
            }}
          />

          {/* Spotlight border (animated ring around highlighted area) */}
          <Box
            sx={{
              position: "fixed",
              top: spotlightBox.top - (step.spotlightPadding || 16),
              left: spotlightBox.left - (step.spotlightPadding || 16),
              width: spotlightBox.width + (step.spotlightPadding || 16) * 2,
              height: spotlightBox.height + (step.spotlightPadding || 16) * 2,
              borderRadius: 2,
              border: "3px solid",
              borderColor: "primary.main",
              zIndex: 9999,
              pointerEvents: "none",
              animation: "pulse 2s ease-in-out infinite",
              "@keyframes pulse": {
                "0%, 100%": {
                  borderColor: "primary.main",
                  boxShadow: "0 0 0 4px rgba(25, 118, 210, 0.2)",
                },
                "50%": {
                  borderColor: "primary.light",
                  boxShadow: "0 0 0 8px rgba(66, 165, 245, 0.3)",
                },
              },
            }}
          />
        </>
      )}

      {/* Backdrop for center-placement steps */}
      {run && isCenterPlacement && (
        <Backdrop
          open
          sx={{
            zIndex: 9998,
            bgcolor: "rgba(0, 0, 0, 0.75)",
          }}
          onClick={handleSkip}
        />
      )}

      {/* Tooltip card */}
      <Fade in={run}>
        <Card
          sx={{
            position: "fixed",
            ...getTooltipPosition(),
            zIndex: 9999,
            maxWidth: 400,
            boxShadow: 24,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <CardContent sx={{ p: 3 }}>
            {/* Close button */}
            <IconButton
              size="small"
              onClick={handleSkip}
              sx={{ position: "absolute", top: 8, right: 8 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>

            {/* Content */}
            <Box sx={{ pr: 4 }}>
              <Typography variant="h6" gutterBottom>
                {step.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {step.content}
              </Typography>
            </Box>

            {/* Progress indicator */}
            <Stack direction="row" spacing={0.5} sx={{ mb: 2 }}>
              {TOUR_STEPS.map((_, idx) => (
                <Box
                  key={idx}
                  sx={{
                    flex: 1,
                    height: 4,
                    bgcolor: idx <= currentStep ? "primary.main" : "grey.300",
                    borderRadius: 2,
                    transition: "background-color 0.3s",
                  }}
                />
              ))}
            </Stack>

            {/* Controls */}
            <Stack
              direction="row"
              spacing={1}
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="caption" color="text.secondary">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </Typography>
              <Stack direction="row" spacing={1}>
                {!isFirst && (
                  <Button
                    size="small"
                    startIcon={<ArrowBackIcon />}
                    onClick={handlePrevious}
                  >
                    Back
                  </Button>
                )}
                <Button
                  size="small"
                  variant="contained"
                  endIcon={isLast ? <CheckCircleIcon /> : <ArrowForwardIcon />}
                  onClick={handleNext}
                >
                  {isLast ? "Finish" : "Next"}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Fade>
    </>
  );
}
