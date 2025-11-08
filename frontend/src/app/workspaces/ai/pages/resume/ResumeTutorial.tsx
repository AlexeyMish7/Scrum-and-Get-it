import { useEffect, useRef, useState } from "react";
import { Alert, Button, Collapse, Stack, Typography } from "@mui/material";

/**
 * ResumeTutorial (skeleton)
 * Purpose: lightweight, dismissible tutorial banner with Start/Skip controls.
 * Accessibility: Static text; full coach-marks arrive in later phase.
 */
export default function ResumeTutorial() {
  const KEY = "resumeTutorialCompleted";
  const [open, setOpen] = useState(false);
  const regionRef = useRef<HTMLDivElement | null>(null);
  const [announce, setAnnounce] = useState<string>("");

  useEffect(() => {
    try {
      const done = localStorage.getItem(KEY);
      // Show tutorial for first-time users only
      setOpen(!done);
    } catch {
      setOpen(true);
    }
  }, []);

  function markDone() {
    try {
      localStorage.setItem(KEY, "1");
    } catch (e) {
      // swallow write errors (private mode, etc.)
      console.warn("tutorial localStorage write failed", e);
    }
    setOpen(false);
    // After closing, move focus to generation controls for quick start
    setTimeout(() => {
      const target = document.getElementById("generation-controls");
      if (target) {
        (target as HTMLElement).focus?.();
        (target as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 0);
  }

  // Focus the alert region when shown and announce opening for screen readers
  useEffect(() => {
    if (open) {
      regionRef.current?.focus();
      setAnnounce(
        "Resume tutorial opened. Use Start to proceed or Skip to hide."
      );
    } else {
      setAnnounce("");
    }
  }, [open]);

  return (
    <Collapse in={open} unmountOnExit>
      <Alert
        severity="info"
        sx={{ mb: 2 }}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              onClick={markDone}
              aria-label="Start tutorial and focus generation controls"
            >
              Start tutorial
            </Button>
            <Button size="small" onClick={markDone} aria-label="Skip tutorial">
              Skip
            </Button>
            <Button size="small" variant="text" href="#generation-controls">
              Skip to Step 2
            </Button>
          </Stack>
        }
        role="region"
        aria-labelledby="resume-tutorial-title"
        tabIndex={-1}
        ref={regionRef}
      >
        <Typography id="resume-tutorial-title" variant="subtitle2">
          Welcome to the Resume Editor
        </Typography>
        <Typography variant="body2">
          This tutorial will guide you through choosing a job, configuring
          options, generating, previewing, and exporting your resume.
        </Typography>
        {/* Live region for announcements */}
        <Typography
          component="div"
          aria-live="polite"
          sx={{
            position: "absolute",
            width: 1,
            height: 1,
            overflow: "hidden",
            clip: "rect(0 0 0 0)",
          }}
        >
          {announce}
        </Typography>
      </Alert>
    </Collapse>
  );
}
