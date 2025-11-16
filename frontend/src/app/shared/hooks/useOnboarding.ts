/**
 * USE ONBOARDING HOOK
 * Manage onboarding state and completion tracking.
 *
 * USAGE:
 * ```tsx
 * const { shouldShowOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();
 *
 * return (
 *   <OnboardingDialog
 *     open={shouldShowOnboarding}
 *     onClose={completeOnboarding}
 *   />
 * );
 * ```
 */

import { useState, useEffect } from "react";

const ONBOARDING_KEY = "onboarding_completed";
const ONBOARDING_DATE_KEY = "onboarding_completed_at";

export function useOnboarding() {
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);

    // Show onboarding if never completed
    if (!completed) {
      setShouldShowOnboarding(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    localStorage.setItem(ONBOARDING_DATE_KEY, new Date().toISOString());
    setShouldShowOnboarding(false);
  };

  const skipOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, "skipped");
    localStorage.setItem(ONBOARDING_DATE_KEY, new Date().toISOString());
    setShouldShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    localStorage.removeItem(ONBOARDING_DATE_KEY);
    setShouldShowOnboarding(true);
  };

  const getOnboardingStatus = () => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    const completedAt = localStorage.getItem(ONBOARDING_DATE_KEY);

    return {
      completed: completed === "true",
      skipped: completed === "skipped",
      completedAt: completedAt ? new Date(completedAt) : null,
    };
  };

  return {
    shouldShowOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    getOnboardingStatus,
  };
}
