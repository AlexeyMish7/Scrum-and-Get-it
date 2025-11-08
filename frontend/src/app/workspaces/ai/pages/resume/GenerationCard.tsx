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
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import { useAuth } from "@shared/context/AuthContext";
import useUserJobs from "@shared/hooks/useUserJobs";
import useResumeGenerationFlow from "@workspaces/ai/hooks/useResumeGenerationFlow";

/**
 * GenerationCard
 * Unified Step 2 input + progress card powered by useResumeGenerationFlow.
 * Inputs: job, tone, optional focus, toggles for skills/experience segments.
 * Output: dispatches sgt:resumeGenerated with merged content via the hook.
 */
export default function GenerationCard() {
  const { user } = useAuth();
  const { jobs, loading: loadingJobs } = useUserJobs(50);
  const [jobId, setJobId] = React.useState<number | "">("");
  const [tone, setTone] = React.useState("professional");
  const [focus, setFocus] = React.useState("");
  const [includeSkills, setIncludeSkills] = React.useState(true);
  const [includeExperience, setIncludeExperience] = React.useState(true);

  const { state, run, reset } = useResumeGenerationFlow(user?.id);

  React.useEffect(() => {
    if (jobs.length && jobId === "") setJobId(jobs[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs.length]);

  const generating =
    state.base === "running" ||
    state.skills === "running" ||
    state.experience === "running";

  function onGenerate() {
    if (!user?.id || !jobId || typeof jobId !== "number") return;
    run(jobId, {
      tone,
      focus: focus || undefined,
      includeSkills,
      includeExperience,
    });
  }

  function StatusRow({
    label,
    status,
  }: {
    label: string;
    status: "idle" | "running" | "success" | "error";
  }) {
    let icon: React.ReactNode = <RadioButtonUncheckedIcon fontSize="small" />;
    if (status === "running") icon = <HourglassEmptyIcon fontSize="small" />;
    if (status === "success")
      icon = <CheckCircleIcon color="success" fontSize="small" />;
    if (status === "error")
      icon = <ErrorOutlineIcon color="warning" fontSize="small" />;
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        {icon}
        <Typography variant="body2">{label}</Typography>
      </Stack>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ sm: "center" }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6">Unified Generation</Typography>
              <Typography variant="body2" color="text.secondary">
                Pick your job and options, then generate a merged result with
                optional skills optimization and experience tailoring.
              </Typography>
            </Box>
            <FormControl size="small" sx={{ minWidth: 220 }} disabled={loadingJobs}>
              <InputLabel id="gen-job-select">Job</InputLabel>
              <Select
                labelId="gen-job-select"
                value={jobId}
                label="Job"
                onChange={(e) => setJobId(e.target.value as number | "")}
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
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="gen-tone">Tone</InputLabel>
              <Select
                labelId="gen-tone"
                value={tone}
                label="Tone"
                onChange={(e) => setTone(String(e.target.value))}
              >
                <MenuItem value="professional">Professional</MenuItem>
                <MenuItem value="concise">Concise</MenuItem>
                <MenuItem value="impactful">Impactful</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 220 }}>
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
              >
                <MenuItem value="">(none)</MenuItem>
                <MenuItem value="leadership">Leadership</MenuItem>
                <MenuItem value="cloud">Cloud</MenuItem>
                <MenuItem value="frontend">Frontend</MenuItem>
                <MenuItem value="backend">Backend</MenuItem>
              </Select>
            </FormControl>
            <Box>
              <Button
                variant="contained"
                onClick={onGenerate}
                disabled={!jobId || generating || loadingJobs}
                startIcon={generating ? <CircularProgress size={16} /> : undefined}
              >
                {generating ? "Generating…" : "Generate"}
              </Button>
            </Box>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={includeSkills}
                  onChange={(e) => setIncludeSkills(e.target.checked)}
                />
              }
              label="Include Skills Optimization"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={includeExperience}
                  onChange={(e) => setIncludeExperience(e.target.checked)}
                />
              }
              label="Include Experience Tailoring"
            />
            <Box sx={{ flex: 1 }} />
            <Button variant="text" onClick={reset} disabled={generating}>
              Reset
            </Button>
          </Stack>

          <Divider />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
            <StatusRow label="Base Resume" status={state.base} />
            <StatusRow label="Skills Optimization" status={state.skills} />
            <StatusRow label="Experience Tailoring" status={state.experience} />
          </Stack>

          <Typography variant="caption" color="text.secondary">
            Tip: You can re-run with different tone/focus. Successful segments
            stay applied to the merged result.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
