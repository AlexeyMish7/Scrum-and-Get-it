/**
 * GENERATION WIZARD COMPONENT
 * Main wizard container orchestrating the document generation flow.
 * Manages state across all wizard steps and coordinates generation.
 */

import React, { useState } from "react";
import { Box, Button, Container, Paper, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "@shared/components/feedback/ErrorSnackbar";
import { errorNotifier } from "@shared/services/errorNotifier";
import { useGeneration } from "../../context/useGeneration";
import { WizardStepper, type WizardStep } from "./WizardStepper";
import { TemplateSelectionStep } from "./TemplateSelectionStep";
import { ThemeSelectionStep } from "./ThemeSelectionStep";
import { JobContextStep, type JobContext } from "./JobContextStep";
import { GenerationOptionsStep } from "./GenerationOptionsStep";
import { GenerationPreviewStep } from "./GenerationPreviewStep";
import { generateDocument } from "../../services/aiGenerationService";
import type {
  Template,
  Theme,
  TemplateCategory,
} from "../../types/template.types";
import type {
  GenerationOptions,
  GenerationProgress,
  GenerationResult,
} from "../../types/generation.types";

/**
 * Wizard step definitions
 */
const WIZARD_STEPS: WizardStep[] = [
  {
    id: "template",
    label: "Template",
    description: "Choose document structure",
  },
  {
    id: "theme",
    label: "Theme",
    description: "Select visual style",
  },
  {
    id: "context",
    label: "Job Context",
    description: "Select target job",
    optional: false,
  },
  {
    id: "options",
    label: "Options",
    description: "Configure AI settings",
  },
  {
    id: "preview",
    label: "Generate",
    description: "Review and create",
  },
];

/**
 * Default generation options
 */
const DEFAULT_OPTIONS: GenerationOptions = {
  atsOptimized: true,
  keywordMatch: false,
  skillsHighlight: true,
  includePortfolio: false,
  tone: "professional",
  length: "standard",
};

/**
 * GenerationWizard Props
 */
interface GenerationWizardProps {
  /** Document type to generate */
  documentType: TemplateCategory;

  /** Optional pre-selected template */
  initialTemplate?: Template;

  /** Optional pre-selected theme */
  initialTheme?: Theme;

  /** Optional job context */
  initialJobContext?: JobContext;

  /** Generation completion handler */
  onComplete?: (result: GenerationResult) => void;

  /** Cancel handler */
  onCancel?: () => void;
}

/**
 * GenerationWizard Component
 *
 * Inputs:
 * - documentType: Type of document to generate (resume | cover-letter)
 * - initialTemplate: Pre-selected template (optional)
 * - initialTheme: Pre-selected theme (optional)
 * - initialJobContext: Pre-filled job context (optional)
 * - onComplete: Callback when generation completes successfully
 * - onCancel: Callback when user cancels wizard
 *
 * Outputs:
 * - Multi-step wizard UI
 * - Calls onComplete with GenerationResult when done
 * - Calls onCancel if user cancels
 */
export const GenerationWizard: React.FC<GenerationWizardProps> = ({
  documentType,
  initialTemplate,
  initialTheme,
  initialJobContext,
  onComplete,
  onCancel,
}) => {
  // Auth and error handling
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notification, closeNotification, handleError, showSuccess } =
    useErrorHandler();

  // Track generation state for navigation warning
  const { setHasStartedGeneration } = useGeneration();

  // Wizard state
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Selection state
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    initialTemplate || null
  );
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(
    initialTheme || null
  );
  const [jobContext, setJobContext] = useState<JobContext>(
    initialJobContext || {}
  );
  const [options, setOptions] = useState<GenerationOptions>(DEFAULT_OPTIONS);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | undefined>();

  // Set generation started flag when template is selected
  // This enables the unsaved changes warning in navigation
  React.useEffect(() => {
    if (selectedTemplate) {
      setHasStartedGeneration(true);
    }
  }, [selectedTemplate, setHasStartedGeneration]);

  // Handle cancel - clear generation state and navigate away
  const handleCancel = () => {
    setHasStartedGeneration(false);
    if (onCancel) {
      onCancel();
    } else {
      window.history.back();
    }
  };

  /**
   * Check if current step can proceed
   */
  const canProceed = (): boolean => {
    switch (activeStep) {
      case 0: // Template selection
        return selectedTemplate !== null;
      case 1: // Theme selection
        return selectedTheme !== null;
      case 2: // Job context (required)
        return jobContext.jobId !== undefined;
      case 3: // Options
        return true;
      case 4: // Preview
        return !isGenerating;
      default:
        return false;
    }
  };

  /**
   * Navigate to next step
   */
  const handleNext = () => {
    if (!canProceed()) return;

    // Mark current step as completed
    if (!completedSteps.includes(activeStep)) {
      setCompletedSteps([...completedSteps, activeStep]);
    }

    // Move to next step
    setActiveStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  };

  /**
   * Navigate to previous step
   */
  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  /**
   * Start document generation with real AI backend integration
   * Wrapped in try-catch to display user-friendly error snackbars
   */
  const handleGenerate = async () => {
    if (!selectedTemplate || !selectedTheme) {
      errorNotifier.notifyWarning(
        "Please select a template and theme before generating",
        "Missing Configuration"
      );
      return;
    }

    if (!user?.id) {
      errorNotifier.notifyError(
        new Error("You must be logged in to generate documents"),
        "Authentication Required"
      );
      return;
    }

    setIsGenerating(true);
    setProgress({
      progress: 5,
      message: "Preparing your profile data...",
      complete: false,
    });

    // Mark that generation has started (for navigation warning)
    setHasStartedGeneration(true);

    try {
      // Call real AI generation service with progress updates
      const result = await generateDocument(
        user.id,
        documentType,
        selectedTemplate,
        selectedTheme,
        jobContext,
        options,
        (progress: GenerationProgress) => {
          setProgress(progress);
        }
      );

      setIsGenerating(false);

      // Mark preview step as completed
      if (!completedSteps.includes(4)) {
        setCompletedSteps([...completedSteps, 4]);
      }

      // Check if mock data was used and warn the user
      if (result.metadata?.isMockData) {
        errorNotifier.notifyWarning(
          "Generated content is sample data only - AI service unavailable",
          "Mock Data Used"
        );
      } else {
        // Show success notification
        showSuccess("Document generated successfully! Opening editor...");
      }

      // Clear generation state - user is navigating away
      setHasStartedGeneration(false);

      // Navigate to document editor instead of calling onComplete
      // This allows users to immediately edit and refine the generated document
      navigate(`/ai/document/${result.documentId}`);
    } catch (error) {
      setIsGenerating(false);

      // Use errorNotifier for user-friendly error display
      errorNotifier.notifyApiError(error, "Document Generation Failed");

      // Also log to console for debugging
      console.error("Generation error:", error);

      // Keep the old error handler for backwards compatibility
      handleError(error as Error);
    }
  };

  /**
   * Render current step content
   */
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <TemplateSelectionStep
            category={documentType}
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
          />
        );
      case 1:
        return (
          <ThemeSelectionStep
            selectedTheme={selectedTheme}
            onSelectTheme={setSelectedTheme}
          />
        );
      case 2:
        return (
          <JobContextStep
            jobContext={jobContext}
            onUpdateContext={setJobContext}
          />
        );
      case 3:
        return (
          <GenerationOptionsStep
            options={options}
            onUpdateOptions={setOptions}
            hasJobContext={Boolean(jobContext.jobDescription)}
          />
        );
      case 4:
        return selectedTemplate && selectedTheme ? (
          <GenerationPreviewStep
            template={selectedTemplate}
            theme={selectedTheme}
            jobContext={jobContext}
            options={options}
            progress={progress}
            isGenerating={isGenerating}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ p: 4 }}>
        {/* Stepper */}
        <WizardStepper
          steps={WIZARD_STEPS}
          activeStep={activeStep}
          completedSteps={completedSteps}
        />

        {/* Step Content */}
        <Box sx={{ minHeight: 400, mb: 4 }}>{renderStepContent()}</Box>

        {/* Navigation Buttons */}
        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Button onClick={handleCancel} disabled={isGenerating}>
            Cancel
          </Button>

          <Stack direction="row" spacing={2}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0 || isGenerating}
              startIcon={<ArrowBackIcon />}
            >
              Back
            </Button>

            {activeStep < WIZARD_STEPS.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!canProceed()}
                endIcon={<ArrowForwardIcon />}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleGenerate}
                disabled={!canProceed() || isGenerating || progress?.complete}
                startIcon={
                  isGenerating ? (
                    <Box
                      component="span"
                      sx={{
                        display: "inline-flex",
                        animation: "spin 1s linear infinite",
                        "@keyframes spin": {
                          "0%": { transform: "rotate(0deg)" },
                          "100%": { transform: "rotate(360deg)" },
                        },
                      }}
                    >
                      ⚙️
                    </Box>
                  ) : (
                    <AutoAwesomeIcon />
                  )
                }
              >
                {isGenerating
                  ? progress?.message?.split("...")[0] || "Generating"
                  : progress?.complete
                  ? "Generated"
                  : "Generate Document"}
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Error notifications */}
      <ErrorSnackbar notification={notification} onClose={closeNotification} />
    </Container>
  );
};
