/**
 * useGenerateResumeState Hook
 *
 * Centralizes all state management for the GenerateResume page.
 * Consolidates useState calls to reduce component complexity and improve readability.
 *
 * @returns {Object} State object with all stateful values and their setters
 */

import { useState, useRef } from "react";
import type { ResumeArtifactContent } from "@workspaces/ai/types/ai";
import type { AIArtifactSummary, AIArtifact } from "@workspaces/ai/types/ai";
import type { FlowState } from "@workspaces/ai/hooks/useResumeGenerationFlow";

export default function useGenerateResumeState() {
  // Generation state
  const [lastContent, setLastContent] = useState<ResumeArtifactContent | null>(
    null
  );
  const [lastJobId, setLastJobId] = useState<number | null>(null);
  const [lastSegments, setLastSegments] = useState<FlowState | null>(null);
  const [newBullets, setNewBullets] = useState<Set<string> | null>(null);

  // Dialog state
  const [mergeOpen, setMergeOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  // Version compare & attach state
  const [selectedContent, setSelectedContent] =
    useState<ResumeArtifactContent | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<
    AIArtifactSummary | AIArtifact | null
  >(null);

  // UI state
  const [srMessage, setSrMessage] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewTab, setPreviewTab] = useState<
    "ai" | "formatted" | "draft" | "variations" | "skills" | "raw"
  >("ai");

  // Refs
  const prevContentRef = useRef<ResumeArtifactContent | null>(null);
  const lastFocusArtifactIdRef = useRef<string | null>(null);
  const lastGenTsRef = useRef<number>(0);
  const generationRunTokenRef = useRef<number>(0);

  return {
    // Generation state
    lastContent,
    setLastContent,
    lastJobId,
    setLastJobId,
    lastSegments,
    setLastSegments,
    newBullets,
    setNewBullets,

    // Dialog state
    mergeOpen,
    setMergeOpen,
    compareOpen,
    setCompareOpen,

    // Version compare state
    selectedContent,
    setSelectedContent,
    selectedArtifact,
    setSelectedArtifact,

    // UI state
    srMessage,
    setSrMessage,
    showAdvanced,
    setShowAdvanced,
    previewTab,
    setPreviewTab,

    // Refs
    prevContentRef,
    lastFocusArtifactIdRef,
    lastGenTsRef,
    generationRunTokenRef,
  };
}
