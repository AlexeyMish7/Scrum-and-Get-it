/**
 * GENERATE COVER LETTER PAGE
 * Page that hosts the cover letter generation wizard.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { GenerationWizard } from "../../components/wizard";
import type { GenerationResult } from "../../types/generation.types";

/**
 * GenerateCoverLetterPage Component
 *
 * Hosts the generation wizard for creating AI-powered cover letters.
 * Redirects to document editor on successful generation.
 */
const GenerateCoverLetterPage: React.FC = () => {
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
      documentType="cover-letter"
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
};

export default GenerateCoverLetterPage;
