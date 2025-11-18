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
   * TODO: Navigate to editor with new document
   */
  const handleComplete = (result: GenerationResult) => {
    console.log("Generated document:", result);
    // TODO: Navigate to editor or document library
    // navigate(`/ai-new/document/${result.documentId}`);
    navigate("/ai-new/library");
  };

  /**
   * Handle wizard cancellation
   */
  const handleCancel = () => {
    navigate("/ai-new");
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
