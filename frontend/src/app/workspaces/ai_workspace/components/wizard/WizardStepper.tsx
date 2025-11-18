/**
 * WIZARD STEPPER COMPONENT
 * Visual progress indicator for the generation wizard.
 * Shows current step, completed steps, and upcoming steps.
 */

import React from "react";
import { Box, Step, StepLabel, Stepper, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

/**
 * Wizard step definition
 */
export interface WizardStep {
  /** Unique step identifier */
  id: string;

  /** Display label */
  label: string;

  /** Optional description */
  description?: string;

  /** Whether step is optional */
  optional?: boolean;
}

/**
 * WizardStepper Props
 */
interface WizardStepperProps {
  /** Array of wizard steps */
  steps: WizardStep[];

  /** Current active step index (0-based) */
  activeStep: number;

  /** Completed step indices */
  completedSteps?: number[];

  /** Orientation (default: horizontal) */
  orientation?: "horizontal" | "vertical";
}

/**
 * WizardStepper Component
 *
 * Inputs:
 * - steps: Array of step definitions with id, label, description
 * - activeStep: Current step index (0-based)
 * - completedSteps: Array of completed step indices
 * - orientation: Display orientation (horizontal | vertical)
 *
 * Outputs:
 * - Visual stepper showing progress through wizard
 * - Highlights current step, marks completed steps with checkmark
 */
export const WizardStepper: React.FC<WizardStepperProps> = ({
  steps,
  activeStep,
  completedSteps = [],
  orientation = "horizontal",
}) => {
  return (
    <Box sx={{ width: "100%", mb: 4 }}>
      <Stepper activeStep={activeStep} orientation={orientation}>
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isActive = activeStep === index;

          return (
            <Step key={step.id} completed={isCompleted}>
              <StepLabel
                optional={
                  step.optional ? (
                    <Typography variant="caption">Optional</Typography>
                  ) : undefined
                }
                StepIconComponent={
                  isCompleted
                    ? () => <CheckCircleIcon color="success" />
                    : undefined
                }
              >
                <Typography
                  variant={isActive ? "subtitle1" : "body2"}
                  fontWeight={isActive ? 600 : 400}
                >
                  {step.label}
                </Typography>
                {step.description && isActive && (
                  <Typography variant="caption" color="text.secondary">
                    {step.description}
                  </Typography>
                )}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
};
