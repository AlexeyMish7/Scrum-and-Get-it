/**
 * useShouldShowTour Hook
 *
 * WHAT: Determines if the product tour should run
 * WHY: Separate from component to avoid Fast Refresh warnings
 *
 * Returns: [showTour, startTour, endTour]
 * - showTour: boolean - whether tour is active
 * - startTour: () => void - manually trigger tour
 * - endTour: () => void - close tour
 */

import { useState, useEffect } from "react";

const STORAGE_KEY = "sgt:resume_tour_completed";

export function useShouldShowTour(): [boolean, () => void, () => void] {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Small delay so page loads first
      setTimeout(() => setShowTour(true), 500);
    }
  }, []);

  const startTour = () => setShowTour(true);
  const endTour = () => setShowTour(false);

  return [showTour, startTour, endTour];
}
