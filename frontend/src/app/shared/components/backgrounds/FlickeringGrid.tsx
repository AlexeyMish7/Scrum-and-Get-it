/**
 * FLICKERING GRID BACKGROUND
 *
 * Purpose:
 * - Animated grid background with flickering squares
 * - Respects light/dark theme automatically
 * - Performance optimized with canvas rendering
 * - Only animates when in viewport (IntersectionObserver)
 *
 * Usage:
 *   <FlickeringGrid /> // Full screen background
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTheme } from "@mui/material/styles";

interface FlickeringGridProps {
  /** Size of each square in pixels (default: 12) */
  squareSize?: number;
  /** Gap between squares in pixels (default: 8) */
  gridGap?: number;
  /** Probability of a square changing opacity per second (default: 0.08, lower = slower, more subtle) */
  flickerChance?: number;
  /** Override color (defaults to theme-based) */
  color?: string;
  /** Fixed width (defaults to container width) */
  width?: number;
  /** Fixed height (defaults to container height) */
  height?: number;
  /** Additional CSS class */
  className?: string;
  /** Maximum opacity for squares (0-1) */
  maxOpacity?: number;
}

/**
 * FlickeringGrid creates an animated canvas-based grid background
 * that flickers squares randomly for a subtle animated effect.
 */
const FlickeringGrid: React.FC<FlickeringGridProps> = ({
  squareSize = 12,
  gridGap = 8,
  flickerChance = 0.04,
  color,
  width,
  height,
  className,
  maxOpacity = 0.06,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Get theme for automatic color selection
  const theme = useTheme();

  // Determine color based on theme mode if not explicitly provided
  const effectiveColor = useMemo(() => {
    if (color) return color;
    // Use primary color for light mode, lighter color for dark mode
    return theme.palette.mode === "dark"
      ? theme.palette.primary.light
      : theme.palette.primary.dark;
  }, [
    color,
    theme.palette.mode,
    theme.palette.primary.light,
    theme.palette.primary.dark,
  ]);

  // Convert color to RGBA prefix for opacity support
  const memoizedColor = useMemo(() => {
    const toRGBA = (colorStr: string) => {
      if (typeof window === "undefined") {
        return `rgba(0, 0, 0,`;
      }
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext("2d");
      if (!ctx) return "rgba(255, 0, 0,";
      ctx.fillStyle = colorStr;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
      return `rgba(${r}, ${g}, ${b},`;
    };
    return toRGBA(effectiveColor);
  }, [effectiveColor]);

  // Setup canvas with device pixel ratio for sharp rendering
  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement, w: number, h: number) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const cols = Math.floor(w / (squareSize + gridGap));
      const rows = Math.floor(h / (squareSize + gridGap));

      // Initialize squares with random opacities
      const squares = new Float32Array(cols * rows);
      for (let i = 0; i < squares.length; i++) {
        squares[i] = Math.random() * maxOpacity;
      }

      return { cols, rows, squares, dpr };
    },
    [squareSize, gridGap, maxOpacity]
  );

  // Update square opacities based on flicker chance
  // Uses gradual transitions instead of instant changes for smoother effect
  const updateSquares = useCallback(
    (squares: Float32Array, deltaTime: number) => {
      const transitionSpeed = 0.8; // How fast squares transition to new opacity

      for (let i = 0; i < squares.length; i++) {
        // Randomly decide if this square should start transitioning to a new target
        if (Math.random() < flickerChance * deltaTime) {
          // Set a new random target opacity
          const targetOpacity = Math.random() * maxOpacity;

          // Smoothly transition toward target (not instant)
          const currentOpacity = squares[i];
          const diff = targetOpacity - currentOpacity;
          squares[i] = currentOpacity + diff * transitionSpeed * deltaTime;
        }
        // No else clause - squares that aren't transitioning stay at their current opacity
        // This maintains variety instead of all converging to the same value
      }
    },
    [flickerChance, maxOpacity]
  );

  // Draw the grid on the canvas
  const drawGrid = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      cols: number,
      rows: number,
      squares: Float32Array,
      dpr: number
    ) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "transparent";
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const opacity = squares[i * rows + j];
          ctx.fillStyle = `${memoizedColor}${opacity})`;
          ctx.fillRect(
            i * (squareSize + gridGap) * dpr,
            j * (squareSize + gridGap) * dpr,
            squareSize * dpr,
            squareSize * dpr
          );
        }
      }
    },
    [memoizedColor, squareSize, gridGap]
  );

  // Main animation effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let gridParams: ReturnType<typeof setupCanvas>;

    const updateCanvasSize = () => {
      const newWidth = width || container.clientWidth;
      const newHeight = height || container.clientHeight;
      setCanvasSize({ width: newWidth, height: newHeight });
      gridParams = setupCanvas(canvas, newWidth, newHeight);
    };

    updateCanvasSize();

    let lastTime = 0;
    const animate = (time: number) => {
      if (!isInView) return;

      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;

      updateSquares(gridParams.squares, deltaTime);
      drawGrid(
        ctx,
        canvas.width,
        canvas.height,
        gridParams.cols,
        gridParams.rows,
        gridParams.squares,
        gridParams.dpr
      );
      animationFrameId = requestAnimationFrame(animate);
    };

    // Watch for container resize
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    resizeObserver.observe(container);

    // Only animate when in viewport for performance
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0 }
    );
    intersectionObserver.observe(canvas);

    if (isInView) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [setupCanvas, updateSquares, drawGrid, width, height, isInView]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export { FlickeringGrid };
export default FlickeringGrid;
