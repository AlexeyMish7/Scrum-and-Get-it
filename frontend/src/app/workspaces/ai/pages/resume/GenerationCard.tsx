import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Tooltip,
  Typography,
  IconButton,
  Collapse,
  TextField,
  Chip,
} from "@mui/material";
// Use HTML semantic divs; simplify layout to avoid Grid type issues for now.
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TuneIcon from "@mui/icons-material/Tune";
import CloseIcon from "@mui/icons-material/Close";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { useAuth } from "@shared/context/AuthContext";
import useUserJobs from "@shared/hooks/useUserJobs";
import useResumeGenerationFlowV2 from "@workspaces/ai/hooks/useResumeGenerationFlowV2";
import type { FlowOptionsV2 } from "@workspaces/ai/hooks/useResumeGenerationFlowV2";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { tooltipMap } from "@workspaces/ai/utils/tooltipMap";
export default function GenerationCard() {
  const { user } = useAuth();
  const { jobs, loading: loadingJobs } = useUserJobs(50);
  const [jobId, setJobId] = React.useState<number | "">("");
  const [tone, setTone] = React.useState("professional");
  const [focus, setFocus] = React.useState("");
  const [includeSkills, setIncludeSkills] = React.useState(true);
  const [includeExperience, setIncludeExperience] = React.useState(true);
  // Advanced prompt & model controls
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [model, setModel] = React.useState<string>("");
  const [customPrompt, setCustomPrompt] = React.useState("");
  const [promptPreset, setPromptPreset] = React.useState<string>("baseline");

  // Allowed models surfaced from env (injected at build via Vite). Fallback to simple defaults.
  const allowedModels = (
    import.meta.env.VITE_ALLOWED_AI_MODELS as string | undefined
  )
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) || ["gpt-4o-mini", "gpt-4o", "gpt-4o-lite"];

  const promptPresets: Record<string, string> = {
    baseline:
      "Produce an ATS-optimized professional software engineering resume.",
    concise:
      "Produce a concise (no fluff) resume emphasizing quantifiable impact.",
    leadership: "Emphasize leadership, team impact, and strategic initiatives.",
    technical_depth:
      "Highlight deep technical architecture, performance tuning, and scalability achievements.",
  };

  const [lastRun, setLastRun] = React.useState<{
    jobId: number;
    options: FlowOptionsV2;
  } | null>(null);
  const { state, run, reset, generating, retrySegment, abort, lastError } =
    useResumeGenerationFlowV2(user?.id);
  const { showSuccess, handleError } = useErrorHandler();

  React.useEffect(() => {
    if (jobs.length && jobId === "") setJobId(jobs[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs.length]);

  // generating provided by V2 hook

  // When a generation run finishes with all selected segments successful, show a success toast.
  const prevGeneratingRef = React.useRef(false);
  React.useEffect(() => {
    const prev = prevGeneratingRef.current;
    prevGeneratingRef.current = generating;
    if (prev && !generating) {
      // Finished a run; if any selected step errored, skip success toast
      const selectedSkillsOk = includeSkills
        ? state.skills === "success"
        : true;
      const selectedExpOk = includeExperience
        ? state.experience === "success"
        : true;
      const allOk =
        state.base === "success" && selectedSkillsOk && selectedExpOk;
      if (allOk) {
        showSuccess("Resume generated and merged successfully");
      }
    }
  }, [
    generating,
    state.base,
    state.skills,
    state.experience,
    includeSkills,
    includeExperience,
    showSuccess,
  ]);

  function effectiveCustomPrompt() {
    const base = promptPresets[promptPreset] || "";
    if (!customPrompt.trim()) return base;
    return `${base}\n\nUser Additions:\n${customPrompt.trim()}`.trim();
  }

  function onGenerate() {
    if (!user?.id || !jobId || typeof jobId !== "number") return;
    const options: FlowOptionsV2 = {
      tone,
      focus: focus || undefined,
      includeSkills,
      includeExperience,
      model: model || undefined,
      prompt: effectiveCustomPrompt(),
    };
    setLastRun({ jobId, options });
    try {
      run(jobId, options);
    } catch (err) {
      handleError(err);
    }
  }

  function StatusRow({
    label,
    status,
  }: {
    label: string;
    status: "idle" | "running" | "success" | "error" | "skipped";
  }) {
    let icon: React.ReactNode = <RadioButtonUncheckedIcon fontSize="small" />;
    let textColor: string | undefined;
    let displayLabel = label;
    if (status === "running") icon = <HourglassEmptyIcon fontSize="small" />;
    if (status === "success")
      icon = <CheckCircleIcon color="success" fontSize="small" />;
    if (status === "error") {
      icon = <ErrorOutlineIcon color="warning" fontSize="small" />;
      textColor = "warning.main";
    }
    if (status === "skipped") {
      icon = (
        <RemoveCircleOutlineIcon
          fontSize="small"
          sx={{ color: "text.disabled" }}
        />
      );
      textColor = "text.disabled";
      displayLabel = `${label} (skipped)`;
    }
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        {icon}
        <Typography variant="body2" color={textColor}>
          {displayLabel}
        </Typography>
      </Stack>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          {/* Flow overview & recommended defaults */}
          <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: "action.hover" }}>
            <Stack spacing={0.5}>
              <Typography variant="subtitle2">How this works</Typography>
              <Typography variant="body2" color="text.secondary">
                We generate a base resume tailored to the selected job, then
                optionally add Skills Optimization and Experience Tailoring. Use
                Quick Generate, or open Advanced to tweak.
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                sx={{ mt: 0.5 }}
              >
                <Chip
                  size="small"
                  label={tone ? `Tone: ${tone}` : "Tone: professional"}
                />
                <Chip
                  size="small"
                  label={focus ? `Focus: ${focus}` : "Focus: none"}
                />
                <Chip
                  size="small"
                  label={includeSkills ? "Skills: on" : "Skills: off"}
                />
                <Chip
                  size="small"
                  label={
                    includeExperience ? "Experience: on" : "Experience: off"
                  }
                />
                <Chip
                  size="small"
                  label={model ? `Model: ${model}` : "Model: default"}
                />
                <Chip
                  size="small"
                  label={
                    promptPreset
                      ? `Preset: ${promptPreset.replace(/_/g, " ")}`
                      : "Preset: baseline"
                  }
                />
              </Stack>
            </Stack>
          </Box>
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="h6">Unified Generation</Typography>
              <Typography variant="body2" color="text.secondary">
                Pick your job and options, then generate a merged result with
                optional skills optimization and experience tailoring.
              </Typography>
            </Box>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 16,
                alignItems: "flex-end",
              }}
            >
              <div style={{ flex: "1 1 250px", minWidth: 240 }}>
                <FormControl size="small" fullWidth disabled={loadingJobs}>
                  <InputLabel id="gen-job-select">Job</InputLabel>
                  <Select
                    labelId="gen-job-select"
                    value={jobId}
                    label="Job"
                    onChange={(e) => setJobId(e.target.value as number | "")}
                    aria-label={`${tooltipMap.job.title}. ${tooltipMap.job.desc}`}
                  >
                    {loadingJobs && (
                      <MenuItem value="">
                        <em>Loading…</em>
                      </MenuItem>
                    )}
                    {!loadingJobs && jobs.length === 0 && (
                      <MenuItem value="">
                        <em>No jobs</em>
                      </MenuItem>
                    )}
                    {jobs.map((j) => (
                      <MenuItem key={j.id} value={j.id}>
                        {j.title} {j.company ? `— ${j.company}` : ""}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    Pick the job whose requirements should steer this run.
                  </FormHelperText>
                </FormControl>
              </div>
              <div style={{ flex: "1 1 180px", minWidth: 200 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel id="gen-tone">Tone</InputLabel>
                  <Select
                    labelId="gen-tone"
                    value={tone}
                    label="Tone"
                    onChange={(e) => setTone(String(e.target.value))}
                    aria-label={`${tooltipMap.tone.title}. ${tooltipMap.tone.desc}`}
                  >
                    <MenuItem value="professional">Professional</MenuItem>
                    <MenuItem value="concise">Concise</MenuItem>
                    <MenuItem value="impactful">Impactful</MenuItem>
                  </Select>
                  <FormHelperText>
                    Tone nudges voice. Impactful = energetic; Concise = shorter.
                  </FormHelperText>
                </FormControl>
              </div>
              <div style={{ flex: "1 1 180px", minWidth: 200 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel shrink htmlFor="gen-focus">
                    Focus
                  </InputLabel>
                  <Select
                    value={focus}
                    onChange={(e) => setFocus(String(e.target.value))}
                    displayEmpty
                    renderValue={(val) =>
                      val ? String(val) : "Optional focus (e.g. leadership)"
                    }
                    inputProps={{ id: "gen-focus" }}
                    aria-label={`${tooltipMap.focus.title}. ${tooltipMap.focus.desc}`}
                  >
                    <MenuItem value="">(none)</MenuItem>
                    <MenuItem value="leadership">Leadership</MenuItem>
                    <MenuItem value="cloud">Cloud</MenuItem>
                    <MenuItem value="frontend">Frontend</MenuItem>
                    <MenuItem value="backend">Backend</MenuItem>
                  </Select>
                  <FormHelperText>
                    Optional focus highlights a theme for bullet emphasis.
                  </FormHelperText>
                </FormControl>
              </div>
              <div
                style={{
                  flex: "0 0 auto",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                    variant="contained"
                    onClick={onGenerate}
                    disabled={!jobId || generating || loadingJobs}
                    startIcon={
                      generating ? <CircularProgress size={16} /> : undefined
                    }
                    sx={{ width: { xs: "100%", md: "auto" } }}
                    aria-label="Quick generate resume"
                  >
                    {generating ? "Generating…" : "Quick Generate"}
                  </Button>
                  <Tooltip
                    title={
                      showAdvanced
                        ? "Hide advanced options"
                        : "Show advanced options (model, prompt presets)"
                    }
                  >
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => setShowAdvanced((v) => !v)}
                        aria-label="Toggle advanced generation options"
                      >
                        <TuneIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </div>
            </div>
            <Collapse in={showAdvanced} unmountOnExit>
              <Card
                variant="outlined"
                sx={{ p: 2, mt: 2, bgcolor: "background.default" }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  alignItems="flex-start"
                >
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel id="model-select">Model</InputLabel>
                    <Select
                      labelId="model-select"
                      value={model}
                      label="Model"
                      onChange={(e) => setModel(String(e.target.value))}
                      aria-label={`${tooltipMap.model.title}. ${tooltipMap.model.desc}`}
                    >
                      <MenuItem value="">
                        <em>Default</em>
                      </MenuItem>
                      {allowedModels.map((m) => (
                        <MenuItem key={m} value={m}>
                          {m}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      Select an allowed model (empty = server default).
                    </FormHelperText>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel id="preset-select">Prompt Preset</InputLabel>
                    <Select
                      labelId="preset-select"
                      value={promptPreset}
                      label="Prompt Preset"
                      onChange={(e) => setPromptPreset(String(e.target.value))}
                      aria-label={`${tooltipMap.preset.title}. ${tooltipMap.preset.desc}`}
                    >
                      {Object.keys(promptPresets).map((k) => (
                        <MenuItem key={k} value={k}>
                          {k.replace(/_/g, " ")}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      Baseline structure the model should follow.
                    </FormHelperText>
                  </FormControl>
                  <Box flex={1} minWidth={240}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      maxRows={6}
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      label="Custom Prompt Additions"
                      placeholder="Add specific achievements, technologies, or formatting wishes."
                      aria-label={`${tooltipMap.customPrompt.title}. ${tooltipMap.customPrompt.desc}`}
                    />
                    <FormHelperText>
                      Optional – appended after the preset.
                    </FormHelperText>
                  </Box>
                  <Stack spacing={1} direction="row" flexWrap="wrap">
                    <Chip
                      size="small"
                      label="Clear"
                      onClick={() => setCustomPrompt("")}
                    />
                    <Chip
                      size="small"
                      label="Preset Text"
                      onClick={() =>
                        setCustomPrompt(promptPresets[promptPreset])
                      }
                    />
                  </Stack>
                  <IconButton
                    size="small"
                    onClick={() => setShowAdvanced(false)}
                    aria-label="close advanced"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  The server sanitizes and truncates prompts; sensitive keys are
                  redacted automatically.
                </Typography>
              </Card>
            </Collapse>
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ md: "center" }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              flexWrap="wrap"
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={includeSkills}
                    onChange={(e) => setIncludeSkills(e.target.checked)}
                    inputProps={{
                      "aria-label": `${tooltipMap.includeSkills.title}. ${tooltipMap.includeSkills.desc}`,
                    }}
                  />
                }
                label={
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <span>Include Skills Optimization</span>
                    <Tooltip title="Ranks existing skills and suggests new additions based on job keywords.">
                      <InfoOutlinedIcon fontSize="small" color="action" />
                    </Tooltip>
                  </Stack>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={includeExperience}
                    onChange={(e) => setIncludeExperience(e.target.checked)}
                    inputProps={{
                      "aria-label": `${tooltipMap.includeExperience.title}. ${tooltipMap.includeExperience.desc}`,
                    }}
                  />
                }
                label={
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <span>Include Experience Tailoring</span>
                    <Tooltip title="Rewrites bullet points to emphasize achievements that match the posting.">
                      <InfoOutlinedIcon fontSize="small" color="action" />
                    </Tooltip>
                  </Stack>
                }
              />
            </Stack>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="text"
              onClick={() => {
                reset();
                setLastRun(null);
              }}
              disabled={generating}
              sx={{ width: { xs: "100%", md: "auto" } }}
              aria-label="Reset generation state"
            >
              Reset
            </Button>
          </Stack>

          <Typography variant="caption" color="text.secondary">
            Disable a toggle if you only need the base resume structure without
            extra optimization.
          </Typography>

          <Divider />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
            <StatusRow label="Base Resume" status={state.base} />
            <StatusRow label="Skills Optimization" status={state.skills} />
            <StatusRow label="Experience Tailoring" status={state.experience} />
          </Stack>

          {(state.base === "error" ||
            state.skills === "error" ||
            state.experience === "error") && (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ sm: "center" }}
            >
              <Typography variant="body2" color="warning.main">
                One or more segments failed. Retry individual segments or full
                run.
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  if (!lastRun || generating) return;
                  run(lastRun.jobId, lastRun.options);
                }}
                disabled={!lastRun || generating}
              >
                Retry last run
              </Button>
              {state.skills === "error" && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => retrySegment("skills")}
                  disabled={generating}
                >
                  Retry Skills
                </Button>
              )}
              {state.experience === "error" && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => retrySegment("experience")}
                  disabled={generating}
                >
                  Retry Experience
                </Button>
              )}
              {generating && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => abort()}
                  disabled={!generating}
                >
                  Abort
                </Button>
              )}
            </Stack>
          )}

          {lastError && (
            <Typography variant="caption" color="warning.main">
              Last error: {lastError}
            </Typography>
          )}

          <Typography variant="caption" color="text.secondary">
            Tip: You can re-run with different tone/focus. Successful segments
            stay applied to the merged result.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
