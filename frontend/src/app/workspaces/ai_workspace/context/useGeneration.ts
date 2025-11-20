/**
 * useGeneration Hook
 *
 * Access generation state in child components.
 * Must be used within GenerationProvider.
 */

import { useContext } from "react";
import { GenerationContext } from "./GenerationContext";

export function useGeneration() {
  const context = useContext(GenerationContext);
  if (!context) {
    throw new Error("useGeneration must be used within GenerationProvider");
  }
  return context;
}
