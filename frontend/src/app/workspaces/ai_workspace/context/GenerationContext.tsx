/**
 * GenerationContext - Track Generation State
 *
 * Provides context to track whether user has started document generation
 * (e.g., selected a template) to determine if navigation warning is needed.
 */

import React, { createContext, useState } from "react";

export interface GenerationContextValue {
  /** Whether user has started generation (selected template) */
  hasStartedGeneration: boolean;

  /** Set generation started state */
  setHasStartedGeneration: (started: boolean) => void;
}

export const GenerationContext = createContext<GenerationContextValue | undefined>(
  undefined
);

/**
 * GenerationProvider Component
 *
 * Wraps the AI workspace to track generation state.
 */
export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const [hasStartedGeneration, setHasStartedGeneration] = useState(false);

  return (
    <GenerationContext.Provider
      value={{ hasStartedGeneration, setHasStartedGeneration }}
    >
      {children}
    </GenerationContext.Provider>
  );
}
