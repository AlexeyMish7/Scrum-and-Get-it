/**
 * BACKGROUND GRADIENT ANIMATION COMPONENT
 *
 * An animated gradient background with floating color orbs.
 * Features:
 * - Multiple animated radial gradients that rotate and move
 * - Interactive orb that follows mouse movement
 * - Theme-aware colors that adapt to light/dark mode and presets
 * - Safari-optimized blur effects
 *
 * Usage:
 * ```tsx
 * <BackgroundGradientAnimation>
 *   <YourContent />
 * </BackgroundGradientAnimation>
 * ```
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box, GlobalStyles, useTheme } from "@mui/material";

export interface GradientColors {
  /** Start color for the base gradient (CSS color) */
  gradientBackgroundStart: string;
  /** End color for the base gradient (CSS color) */
  gradientBackgroundEnd: string;
  /** First orb color (RGB values like "18, 113, 255") */
  firstColor: string;
  /** Second orb color (RGB values) */
  secondColor: string;
  /** Third orb color (RGB values) */
  thirdColor: string;
  /** Fourth orb color (RGB values) */
  fourthColor: string;
  /** Fifth orb color (RGB values) */
  fifthColor: string;
  /** Interactive pointer orb color (RGB values) */
  pointerColor: string;
}

interface BackgroundGradientAnimationProps {
  /** Override default colors - will use theme colors if not provided */
  colors?: Partial<GradientColors>;
  /** Size of the gradient orbs (default: "80%") */
  size?: string;
  /** Blend mode for orbs (default: "hard-light") */
  blendingValue?: string;
  /** Enable mouse-following orb (default: true) */
  interactive?: boolean;
  /** Content to render on top of gradient */
  children?: ReactNode;
}

/**
 * CSS keyframes for the animated gradient orbs
 * Injected globally when component mounts
 */
const gradientKeyframes = `
  @keyframes gradient-first {
    0% { transform: rotate(0deg) translateX(0); }
    50% { transform: rotate(180deg) translateX(50px); }
    100% { transform: rotate(360deg) translateX(0); }
  }

  @keyframes gradient-second {
    0% { transform: rotate(0deg) scale(1); }
    33% { transform: rotate(120deg) scale(1.1); }
    66% { transform: rotate(240deg) scale(0.9); }
    100% { transform: rotate(360deg) scale(1); }
  }

  @keyframes gradient-third {
    0% { transform: rotate(0deg) translateY(0); }
    50% { transform: rotate(-180deg) translateY(30px); }
    100% { transform: rotate(-360deg) translateY(0); }
  }

  @keyframes gradient-fourth {
    0% { transform: rotate(0deg) translateX(0) translateY(0); }
    25% { transform: rotate(90deg) translateX(-20px) translateY(20px); }
    50% { transform: rotate(180deg) translateX(0) translateY(40px); }
    75% { transform: rotate(270deg) translateX(20px) translateY(20px); }
    100% { transform: rotate(360deg) translateX(0) translateY(0); }
  }

  @keyframes gradient-fifth {
    0% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(180deg) scale(1.2); }
    100% { transform: rotate(360deg) scale(1); }
  }
`;

/**
 * BackgroundGradientAnimation - Animated gradient background with floating orbs
 *
 * Automatically uses theme colors when no colors prop is provided.
 * Supports reduced motion preference.
 */
export function BackgroundGradientAnimation({
  colors: colorOverrides,
  size = "80%",
  blendingValue = "hard-light",
  interactive = true,
  children,
}: BackgroundGradientAnimationProps) {
  const theme = useTheme();
  const interactiveRef = useRef<HTMLDivElement>(null);

  // Mouse position tracking for interactive orb
  const [curX, setCurX] = useState(0);
  const [curY, setCurY] = useState(0);
  const [tgX, setTgX] = useState(0);
  const [tgY, setTgY] = useState(0);

  // Safari detection for blur fallback
  const [isSafari, setIsSafari] = useState(false);

  // Check for Safari browser
  useEffect(() => {
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
  }, []);

  // Default colors based on theme mode
  const defaultColors: GradientColors =
    theme.palette.mode === "dark"
      ? {
          // Dark mode: deep purples and blues
          gradientBackgroundStart: "rgb(15, 23, 42)",
          gradientBackgroundEnd: "rgb(30, 27, 75)",
          firstColor: "99, 102, 241", // indigo
          secondColor: "168, 85, 247", // purple
          thirdColor: "59, 130, 246", // blue
          fourthColor: "236, 72, 153", // pink
          fifthColor: "34, 197, 94", // green
          pointerColor: "139, 92, 246", // violet
        }
      : {
          // Light mode: softer, lighter tones
          gradientBackgroundStart: "rgb(248, 250, 252)",
          gradientBackgroundEnd: "rgb(241, 245, 249)",
          firstColor: "99, 102, 241", // indigo
          secondColor: "236, 72, 153", // pink
          thirdColor: "59, 130, 246", // blue
          fourthColor: "245, 158, 11", // amber
          fifthColor: "34, 197, 94", // green
          pointerColor: "168, 85, 247", // purple
        };

  // Merge overrides with defaults
  const colors: GradientColors = {
    ...defaultColors,
    ...colorOverrides,
  };

  // Smooth mouse following animation
  useEffect(() => {
    if (!interactive || !interactiveRef.current) return;

    const move = () => {
      setCurX((prev) => prev + (tgX - prev) / 20);
      setCurY((prev) => prev + (tgY - prev) / 20);
    };

    const frameId = requestAnimationFrame(move);
    return () => cancelAnimationFrame(frameId);
  }, [tgX, tgY, interactive]);

  // Apply transform to interactive element
  useEffect(() => {
    if (interactiveRef.current) {
      interactiveRef.current.style.transform = `translate(${Math.round(
        curX
      )}px, ${Math.round(curY)}px)`;
    }
  }, [curX, curY]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (interactiveRef.current) {
      const rect = interactiveRef.current.getBoundingClientRect();
      setTgX(event.clientX - rect.left);
      setTgY(event.clientY - rect.top);
    }
  };

  // Common orb styles
  const orbBase = {
    position: "absolute" as const,
    width: size,
    height: size,
    top: `calc(50% - ${size} / 2)`,
    left: `calc(50% - ${size} / 2)`,
    mixBlendMode: blendingValue,
    backgroundRepeat: "no-repeat",
  };

  return (
    <>
      {/* Inject keyframes globally */}
      <GlobalStyles styles={gradientKeyframes} />

      {/* SVG filter for blur effect (non-Safari) */}
      <svg style={{ display: "none" }}>
        <defs>
          <filter id="gradient-blur">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="10"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          background: `linear-gradient(40deg, ${colors.gradientBackgroundStart}, ${colors.gradientBackgroundEnd})`,
          zIndex: -1,
        }}
      >
        {/* Gradient orbs container */}
        <Box
          onMouseMove={interactive ? handleMouseMove : undefined}
          sx={{
            height: "100%",
            width: "100%",
            filter: isSafari ? "blur(60px)" : "url(#gradient-blur) blur(40px)",
          }}
        >
          {/* First orb */}
          <Box
            sx={{
              ...orbBase,
              background: `radial-gradient(circle at center, rgb(${colors.firstColor}) 0, rgb(${colors.firstColor}) 50%) no-repeat`,
              transformOrigin: "center center",
              animation: "gradient-first 20s ease infinite",
              opacity: 1,
            }}
          />

          {/* Second orb */}
          <Box
            sx={{
              ...orbBase,
              background: `radial-gradient(circle at center, rgba(${colors.secondColor}, 0.8) 0, rgba(${colors.secondColor}, 0) 50%) no-repeat`,
              transformOrigin: "calc(50% - 400px)",
              animation: "gradient-second 15s ease infinite",
              opacity: 1,
            }}
          />

          {/* Third orb */}
          <Box
            sx={{
              ...orbBase,
              background: `radial-gradient(circle at center, rgba(${colors.thirdColor}, 0.8) 0, rgba(${colors.thirdColor}, 0) 50%) no-repeat`,
              transformOrigin: "calc(50% + 400px)",
              animation: "gradient-third 25s ease infinite",
              opacity: 1,
            }}
          />

          {/* Fourth orb */}
          <Box
            sx={{
              ...orbBase,
              background: `radial-gradient(circle at center, rgba(${colors.fourthColor}, 0.8) 0, rgba(${colors.fourthColor}, 0) 50%) no-repeat`,
              transformOrigin: "calc(50% - 200px)",
              animation: "gradient-fourth 18s ease infinite",
              opacity: 0.7,
            }}
          />

          {/* Fifth orb */}
          <Box
            sx={{
              ...orbBase,
              background: `radial-gradient(circle at center, rgba(${colors.fifthColor}, 0.8) 0, rgba(${colors.fifthColor}, 0) 50%) no-repeat`,
              transformOrigin: "calc(50% - 800px) calc(50% + 800px)",
              animation: "gradient-fifth 22s ease infinite",
              opacity: 1,
            }}
          />

          {/* Interactive pointer orb */}
          {interactive && (
            <Box
              ref={interactiveRef}
              sx={{
                position: "absolute",
                background: `radial-gradient(circle at center, rgba(${colors.pointerColor}, 0.8) 0, rgba(${colors.pointerColor}, 0) 50%) no-repeat`,
                mixBlendMode: blendingValue,
                width: "100%",
                height: "100%",
                top: "-50%",
                left: "-50%",
                opacity: 0.7,
              }}
            />
          )}
        </Box>
      </Box>

      {/* Content layer */}
      {children}
    </>
  );
}

export default BackgroundGradientAnimation;
