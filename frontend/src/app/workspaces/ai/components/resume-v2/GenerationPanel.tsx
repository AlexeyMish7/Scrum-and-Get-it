/**
 * GenerationPanel Component
 *
 * WHAT: Simplified resume generation interface with job selection and generate button
 * WHY: Replace confusing multi-step stepper with clear single-action generation
 *
 * Features:
 * - Job dropdown with recent jobs
 * - Tone and focus quick options
 * - Collapsible advanced options (model, custom prompt)
 * - Clear loading states with progress indication
 * - Success/error feedback
 *
 * Inputs: userId (from auth context)
 * Output: Triggers AI generation, emits results to parent container
 * Error Modes: No job selected, API failure, network timeout
 */

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  Collapse,
  CircularProgress,
  Alert,
  Chip,
  TextField,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useAuth } from "@shared/context/AuthContext";
import useUserJobs from "@shared/hooks/useUserJobs";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { generateResume } from "@workspaces/ai/services/aiGeneration";
import { useResumeDraftsV2 } from "@workspaces/ai/hooks/useResumeDraftsV2";
import type { ResumeArtifactContent } from "@workspaces/ai/types/ai";

interface GenerationPanelProps {
  initialJobId?: number; // Pre-select job from URL parameter
  onGenerationStart?: () => void;
  onGenerationComplete?: (
    content: ResumeArtifactContent,
    jobId: number
  ) => void;
  onGenerationError?: (error: Error) => void;
}

export default function GenerationPanel({
  initialJobId,
  onGenerationStart,
  onGenerationComplete,
  onGenerationError,
}: GenerationPanelProps) {
  const { user } = useAuth();
  const { jobs, loading: loadingJobs } = useUserJobs(50);
  const { handleError, showSuccess } = useErrorHandler();
  const { getActiveDraft } = useResumeDraftsV2();

  // Form state
  const [jobId, setJobId] = useState<number | "">("");
  const [tone, setTone] = useState("professional");
  const [focus, setFocus] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [model, setModel] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-select initial job or first job if none selected
  useEffect(() => {
    if (initialJobId && jobs.some((j) => j.id === initialJobId)) {
      setJobId(initialJobId);
    } else if (jobs.length && jobId === "") {
      setJobId(jobs[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs.length, jobId, initialJobId]);

  const allowedModels = (
    import.meta.env.VITE_ALLOWED_AI_MODELS as string | undefined
  )
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) || ["gpt-4o-mini", "gpt-4o"];

  const handleJobChange = (event: SelectChangeEvent<number | "">) => {
    setJobId(event.target.value as number | "");
    setError(null);
  };

  const handleGenerate = async () => {
    if (!user?.id || !jobId || typeof jobId !== "number") {
      setError("Please select a job before generating");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationStatus("Analyzing job requirements...");

    if (onGenerationStart) {
      onGenerationStart();
    }

    try {
      // Simulate progress stages
      setTimeout(
        () => setGenerationStatus("Generating professional summary..."),
        2000
      );
      setTimeout(
        () => setGenerationStatus("Optimizing skills for ATS..."),
        5000
      );
      setTimeout(
        () => setGenerationStatus("Tailoring experience bullets..."),
        10000
      );

      // Get current draft's TEMPLATE for AI content generation
      // Template controls AI behavior: tone, emphasis, industry language
      // (Visual styling is separate and chosen at export time)
      const activeDraft = getActiveDraft();
      const templateId = activeDraft?.templateId || "classic";

      const result = await generateResume(user.id, jobId, {
        tone,
        focus: focus || undefined,
        model: model || undefined,
        prompt: customPrompt || undefined,
        templateId,
      });

      if (!result.content) {
        throw new Error("No content returned from generation");
      }

      setGenerationStatus("");
      setLastGenerated(new Date());
      showSuccess("Resume generated successfully!");

      if (onGenerationComplete) {
        onGenerationComplete(result.content, jobId);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Generation failed";
      setError(errorMsg);
      handleError(err);

      if (onGenerationError && err instanceof Error) {
        onGenerationError(err);
      }
    } finally {
      setIsGenerating(false);
      setGenerationStatus("");
    }
  };

  const selectedJob = jobs.find((j) => j.id === jobId);

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Stack spacing={2.5}>
          {/* Header */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Generate Resume
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Select a target job and customize options to generate a tailored
              resume
            </Typography>
            <Alert severity="info" sx={{ py: 0.5 }}>
              <Typography variant="caption">
                <strong>How it works:</strong> Your draft's template (e.g.,
                Modern Tech, Classic) sets the AI's base style—tone, language,
                and emphasis. Options below (Tone, Focus, Custom Prompt)
                fine-tune each generation while maintaining the template's
                professional framework.
              </Typography>
            </Alert>
          </Box>

          {/* Status Alert */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {lastGenerated && !isGenerating && !error && (
            <Alert severity="success" sx={{ py: 0.5 }}>
              ✓ Last generated: {lastGenerated.toLocaleTimeString()}
            </Alert>
          )}

          {/* Job Selection */}
          <FormControl
            fullWidth
            size="small"
            disabled={loadingJobs || isGenerating}
          >
            <InputLabel id="job-select-label">Target Job</InputLabel>
            <Select
              labelId="job-select-label"
              value={jobId}
              label="Target Job"
              onChange={handleJobChange}
            >
              {loadingJobs && (
                <MenuItem value="">
                  <em>Loading jobs...</em>
                </MenuItem>
              )}
              {!loadingJobs && jobs.length === 0 && (
                <MenuItem value="">
                  <em>No jobs found - add a job first</em>
                </MenuItem>
              )}
              {jobs.map((job) => (
                <MenuItem key={job.id} value={job.id}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ width: "100%" }}
                  >
                    <Typography component="span">
                      {job.title || "Untitled Job"}
                    </Typography>
                    {job.company && (
                      <Typography
                        component="span"
                        color="text.secondary"
                        variant="body2"
                      >
                        — {job.company}
                      </Typography>
                    )}
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Quick Options */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl
              size="small"
              sx={{ minWidth: { xs: "100%", sm: 160 } }}
              disabled={isGenerating}
            >
              <InputLabel id="tone-label">Tone</InputLabel>
              <Select
                labelId="tone-label"
                value={tone}
                label="Tone"
                onChange={(e) => setTone(e.target.value)}
              >
                <MenuItem value="professional">Professional</MenuItem>
                <MenuItem value="concise">Concise</MenuItem>
                <MenuItem value="impactful">Impactful</MenuItem>
              </Select>
            </FormControl>

            <FormControl
              size="small"
              sx={{ minWidth: { xs: "100%", sm: 160 } }}
              disabled={isGenerating}
            >
              <InputLabel id="focus-label">Focus (Optional)</InputLabel>
              <Select
                labelId="focus-label"
                value={focus}
                label="Focus (Optional)"
                onChange={(e) => setFocus(e.target.value)}
              >
                <MenuItem value="">(None)</MenuItem>
                <MenuItem value="leadership">Leadership</MenuItem>
                <MenuItem value="cloud">Cloud</MenuItem>
                <MenuItem value="frontend">Frontend</MenuItem>
                <MenuItem value="backend">Backend</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Current Settings Preview */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip size="small" label={`Tone: ${tone}`} />
            {focus && <Chip size="small" label={`Focus: ${focus}`} />}
            {model && <Chip size="small" label={`Model: ${model}`} />}
            {customPrompt && <Chip size="small" label="Custom prompt" />}
          </Stack>

          {/* Advanced Options Toggle */}
          <Box>
            <Button
              size="small"
              startIcon={<TuneIcon />}
              endIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: showAdvanced ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              }
              onClick={() => setShowAdvanced(!showAdvanced)}
              disabled={isGenerating}
            >
              Advanced Options
            </Button>
          </Box>

          {/* Advanced Options Panel */}
          <Collapse in={showAdvanced} unmountOnExit>
            <Card
              variant="outlined"
              sx={{ p: 2, bgcolor: "background.default" }}
            >
              <Stack spacing={2}>
                <FormControl size="small" fullWidth disabled={isGenerating}>
                  <InputLabel id="model-label">AI Model</InputLabel>
                  <Select
                    labelId="model-label"
                    value={model}
                    label="AI Model"
                    onChange={(e) => setModel(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Default (gpt-4o-mini)</em>
                    </MenuItem>
                    {allowedModels.map((m) => (
                      <MenuItem key={m} value={m}>
                        {m}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  maxRows={6}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  label="Custom Prompt Instructions"
                  placeholder="Add specific requirements, achievements, or formatting preferences..."
                  disabled={isGenerating}
                  helperText="Optional: Additional instructions for the AI (appended to base prompt)"
                />
              </Stack>
            </Card>
          </Collapse>

          {/* Generate Button */}
          <Box>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleGenerate}
              disabled={!jobId || isGenerating || loadingJobs}
              startIcon={isGenerating ? <CircularProgress size={20} /> : null}
              sx={{
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
              }}
            >
              {isGenerating ? generationStatus : "Generate Resume"}
            </Button>
          </Box>

          {/* Status Info */}
          {selectedJob && !isGenerating && (
            <Box sx={{ px: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Generating for:{" "}
                <strong>{selectedJob.title || "Untitled Job"}</strong>
                {selectedJob.company && ` at ${selectedJob.company}`}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
