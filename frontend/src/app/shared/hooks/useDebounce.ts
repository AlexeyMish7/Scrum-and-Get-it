import { useState, useEffect, useCallback } from "react";

/**
 * USE DEBOUNCE HOOK
 *
 * Delays updating a value until after a specified delay has passed.
 * Useful for search inputs to avoid triggering API calls on every keystroke.
 *
 * Usage:
 *   const [searchTerm, setSearchTerm] = useState('');
 *   const debouncedSearch = useDebounce(searchTerm, 300);
 *
 *   useEffect(() => {
 *     if (debouncedSearch) {
 *       searchJobs(debouncedSearch);
 *     }
 *   }, [debouncedSearch]);
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced value
 */

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  // Update debounced value after delay
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup previous timeout on value/delay change
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * USE DEBOUNCED CALLBACK HOOK
 *
 * Returns a memoized callback that will only be called after a specified delay.
 * Useful for expensive operations that shouldn't run on every update.
 *
 * Usage:
 *   const debouncedSearch = useDebouncedCallback(
 *     (term: string) => searchJobs(term),
 *     300
 *   );
 *
 *   <input onChange={(e) => debouncedSearch(e.target.value)} />
 *
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced callback function
 */

export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      // Clear previous timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Set new timeout
      const newTimeoutId = setTimeout(() => {
        callback(...args);
      }, delay);

      setTimeoutId(newTimeoutId);
    },
    [callback, delay, timeoutId]
  );
}

export default useDebounce;
