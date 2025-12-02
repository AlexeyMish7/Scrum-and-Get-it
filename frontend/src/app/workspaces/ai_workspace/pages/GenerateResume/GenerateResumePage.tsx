/**
 * GENERATE RESUME PAGE
 * Page that hosts the resume generation wizard.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { GenerationWizard } from "../../components/wizard";
import type { GenerationResult } from "../../types/generation.types";

/**
 * GenerateResumePage Component
 *
 * Hosts the generation wizard for creating AI-powered resumes.
 * Redirects to document editor on successful generation.
 */
const GenerateResumePage: React.FC = () => {
  const navigate = useNavigate();

  /**
   * Handle successful generation
   */
  const handleComplete = (result: GenerationResult) => {
    // Navigate to library where user can view their generated document
    navigate("/ai/library");
  };

  /**
   * Handle wizard cancellation
   */
  const handleCancel = () => {
    navigate("/ai");
  };

  return (
    <GenerationWizard
      documentType="resume"
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
};

export default GenerateResumePage;
