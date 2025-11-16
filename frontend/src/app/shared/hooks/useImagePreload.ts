import { useEffect, useState } from "react";

/**
 * IMAGE PRELOAD HOOK
 *
 * Preloads images in the background to improve perceived performance.
 * Useful for prefetching images that will be shown after user interaction.
 *
 * Features:
 * - Preloads single or multiple images
 * - Returns loading state for each image
 * - Automatic cleanup on unmount
 * - Error handling
 *
 * Usage:
 *   // Single image
 *   const { loaded, error } = useImagePreload('/path/to/image.jpg');
 *
 *   // Multiple images
 *   const { loaded, error } = useImagePreload([
 *     '/image1.jpg',
 *     '/image2.jpg'
 *   ]);
 *
 * Performance Impact:
 * - Eliminates loading delay when showing images
 * - Improves UX for image-heavy interactions (galleries, modals)
 * - Reduces perceived lag in navigation
 */

interface UseImagePreloadResult {
  /** True when all images have loaded successfully */
  loaded: boolean;

  /** Error object if any image failed to load */
  error: Error | null;

  /** Loading progress (0-1) */
  progress: number;
}

/**
 * Preloads one or more images
 *
 * @param src - Image URL or array of URLs to preload
 * @returns Loading state, error, and progress
 *
 * @example
 * // Preload avatar before showing profile
 * const { loaded } = useImagePreload(user.avatarUrl);
 * if (loaded) {
 *   // Show profile with avatar
 * }
 *
 * @example
 * // Preload gallery images
 * const { loaded, progress } = useImagePreload(galleryUrls);
 * return <div>Loading: {Math.round(progress * 100)}%</div>;
 */
export function useImagePreload(src: string | string[]): UseImagePreloadResult {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Normalize to array
    const sources = Array.isArray(src) ? src : [src];
    if (sources.length === 0) {
      setLoaded(true);
      return;
    }

    let loadedCount = 0;
    let isMounted = true;
    const images: HTMLImageElement[] = [];

    // Create and load each image
    sources.forEach((url) => {
      if (!url) return;

      const img = new Image();
      images.push(img);

      img.onload = () => {
        if (!isMounted) return;
        loadedCount++;
        setProgress(loadedCount / sources.length);

        if (loadedCount === sources.length) {
          setLoaded(true);
        }
      };

      img.onerror = () => {
        if (!isMounted) return;
        setError(new Error(`Failed to load image: ${url}`));
        loadedCount++;
        setProgress(loadedCount / sources.length);

        // Still mark as "loaded" even with errors so UI can proceed
        if (loadedCount === sources.length) {
          setLoaded(true);
        }
      };

      // Start loading
      img.src = url;
    });

    // Cleanup
    return () => {
      isMounted = false;
      images.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [src]);

  return { loaded, error, progress };
}

/**
 * Preloads images on idle (when browser is not busy)
 * More efficient than useImagePreload for non-critical images
 *
 * @param src - Image URL or array of URLs to preload
 *
 * @example
 * // Preload workspace images when user is idle
 * useIdleImagePreload(workspaceBackgrounds);
 */
export function useIdleImagePreload(src: string | string[]): void {
  useEffect(() => {
    const sources = Array.isArray(src) ? src : [src];
    if (sources.length === 0 || !("requestIdleCallback" in window)) {
      return;
    }

    const handles: number[] = [];

    sources.forEach((url) => {
      if (!url) return;

      const handle = window.requestIdleCallback(() => {
        const img = new Image();
        img.src = url;
      });

      handles.push(handle);
    });

    return () => {
      handles.forEach((handle) => {
        window.cancelIdleCallback(handle);
      });
    };
  }, [src]);
}
