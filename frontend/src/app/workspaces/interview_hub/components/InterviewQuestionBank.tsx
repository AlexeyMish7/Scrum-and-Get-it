import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import hook from "../hooks/useInterviewQuestionBank";
import aiClient from "@shared/services/ai/client";
import { useAuth } from "@shared/context/AuthContext";
import { createPreparationActivity } from "@shared/services/dbMappers";

interface Props {
  // optional pre-fill values
  jobTitle?: string;
  industry?: string;
}

function QuestionCard({
  q,
  onPractice,
  practiced,
}: {
  q: any;
  onPractice: (id: string, response?: string, score?: number | null) => void;
  practiced?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [feedback, setFeedback] = useState<string[] | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [contentFeedback, setContentFeedback] = useState<string | null>(null);
  const [structureFeedback, setStructureFeedback] = useState<string | null>(null);
  const [clarityFeedback, setClarityFeedback] = useState<string | null>(null);
  const [impactScore, setImpactScore] = useState<number | null>(null);
  const [alternatives, setAlternatives] = useState<string[] | null>(null);
  const [improvementSuggestions, setImprovementSuggestions] = useState<string[] | null>(null);
  const [modelAnswerState, setModelAnswerState] = useState<string | null>(null);

  return (
    <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body1">{q.text}</Typography>
          <Chip label={q.category} size="small" />
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => setOpen(true)}>
            Practice (write response)
          </Button>
          <Button
            size="small"
            onClick={() => {
              onPractice(q.id);
            }}
          >
            Mark Practiced
          </Button>
          {practiced && <Chip label="Practiced" color="success" size="small" />}
        </Stack>

        {/* STAR guidance for behavioral questions */}
        {q.category === "behavioral" && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Use the STAR method: Situation, Task, Action, Result. Keep answers concise and focused on impact.
            </Typography>
          </Box>
        )}

        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Practice Response</DialogTitle>
          <DialogContent sx={{ maxHeight: '66vh', overflowY: 'auto' }}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2">Question:</Typography>
              <Typography variant="body1">{q.text}</Typography>
              <TextField
                label="Your written response"
                multiline
                minRows={6}
                fullWidth
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </Stack>

            {/* Prominent score display appears above the feedback sections */}
            {score != null && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6">Score</Typography>
                <Paper variant="outlined" sx={{ p: 1, mt: 1 }}>
                  <Typography variant="h5">{score}%</Typography>
                </Paper>
              </Box>
            )}

            {/* AI feedback (structured) */}
            {(contentFeedback || structureFeedback || clarityFeedback || impactScore != null) && (
              <Box sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle2">AI Review Summary</Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {contentFeedback && (
                    <Paper variant="outlined" sx={{ p: 1 }}>
                      <Typography variant="subtitle2">Content</Typography>
                      <Typography variant="body2">{contentFeedback}</Typography>
                    </Paper>
                  )}

                  {structureFeedback && (
                    <Paper variant="outlined" sx={{ p: 1 }}>
                      <Typography variant="subtitle2">Structure</Typography>
                      <Typography variant="body2">{structureFeedback}</Typography>
                    </Paper>
                  )}

                  {clarityFeedback && (
                    <Paper variant="outlined" sx={{ p: 1 }}>
                      <Typography variant="subtitle2">Clarity</Typography>
                      <Typography variant="body2">{clarityFeedback}</Typography>
                    </Paper>
                  )}

                  {/* {impactScore != null && (
                    <Paper variant="outlined" sx={{ p: 1 }}>
                      <Typography variant="subtitle2">Impact Score</Typography>
                      <Typography variant="body2">{impactScore}%</Typography>
                    </Paper>
                  )} */}
                </Stack>
              </Box>
            )}

            {/* Legacy generic feedback */}
            {feedback && (
              <Box sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle2">AI Feedback</Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {feedback.map((f, i) => (
                    <Paper key={i} variant="outlined" sx={{ p: 1 }}>
                      <Typography variant="body2">{f}</Typography>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Alternatives and suggestions */}
            {alternatives && (
              <Box sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle2">Alternative Approaches</Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {alternatives.map((a, i) => (
                    <Paper key={i} variant="outlined" sx={{ p: 1 }}>
                      <Typography variant="body2">{a}</Typography>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}

            {improvementSuggestions && (
              <Box sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle2">Improvement Suggestions</Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {improvementSuggestions.map((s, i) => (
                    <Paper key={i} variant="outlined" sx={{ p: 1 }}>
                      <Typography variant="body2">{s}</Typography>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Model answer (if provided) */}
            {modelAnswerState && (
              <Box sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle2">Model Answer</Typography>
                <Paper variant="outlined" sx={{ p: 1, mt: 1 }}>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {modelAnswerState}
                  </Typography>
                </Paper>
              </Box>
            )}

          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={reviewLoading}
              onClick={async () => {
                // Persist the practiced response locally / to DB
                try {
                  onPractice(q.id, draft);
                } catch (e) {
                  console.error("Failed to mark practiced:", e);
                }

                // Request AI feedback for the written response
                if (!draft || !String(draft).trim()) {
                  // nothing to review — just close
                  setDraft("");
                  setOpen(false);
                  return;
                }

                setReviewLoading(true);
                setFeedback(null);
                try {
                  const payload = await aiClient.postJson(`/api/generate/interview-feedback`, {
                    question: q.text,
                    answer: draft,
                    category: q.category,
                    include_detailed_feedback: true,
                  } as any);

                  // Generic feedback array (legacy)
                  const fb = (payload as any)?.feedback ?? null;

                  // Structured feedback fields (preferred)
                  const contentFb = (payload as any)?.content_feedback ?? (payload as any)?.contentFeedback ?? null;
                  const structureFb = (payload as any)?.structure_feedback ?? (payload as any)?.structureFeedback ?? null;
                  const clarityFb = (payload as any)?.clarity_feedback ?? (payload as any)?.clarityFeedback ?? null;
                  const rawImpact = (payload as any)?.impact_score ?? (payload as any)?.impactScore ?? (payload as any)?.impact_percent ?? (payload as any)?.impactPercent ?? null;
                  const alt = (payload as any)?.alternatives ?? (payload as any)?.alternative_approaches ?? (payload as any)?.alternatives_list ?? null;
                  const suggestions = (payload as any)?.improvement_suggestions ?? (payload as any)?.suggestions ?? (payload as any)?.improvementSuggestions ?? null;
                  const modelAnswer = (payload as any)?.modelAnswer ?? (payload as any)?.model_answer ?? null;

                  // Score extraction (try several common fields)
                  let scoreVal: number | null = null;
                  const rawScore = (payload as any)?.score ?? (payload as any)?.rating ?? (payload as any)?.scorePercent ?? (payload as any)?.score_percent ?? null;
                  if (rawScore != null) {
                    const n = Number(rawScore);
                    if (!Number.isNaN(n)) {
                      scoreVal = n > 0 && n <= 1 ? Math.round(n * 100) : Math.round(n);
                      if (scoreVal > 100) scoreVal = 100;
                      if (scoreVal < 0) scoreVal = 0;
                    }
                  }

                  // Impact score normalization
                  let impactVal: number | null = null;
                  if (rawImpact != null) {
                    const n2 = Number(rawImpact);
                    if (!Number.isNaN(n2)) {
                      impactVal = n2 > 0 && n2 <= 1 ? Math.round(n2 * 100) : Math.round(n2);
                      if (impactVal > 100) impactVal = 100;
                      if (impactVal < 0) impactVal = 0;
                    }
                  }

                  // Normalize legacy feedback array into strings
                  const fbArr = Array.isArray(fb)
                    ? fb
                    : fb
                    ? String(fb).split("\n").map((s) => s.trim()).filter(Boolean)
                    : [];

                  // Normalize alternatives and suggestions into arrays of strings
                  const altArr = alt
                    ? Array.isArray(alt)
                      ? alt.map(String)
                      : String(alt).split("\n").map((s) => s.trim()).filter(Boolean)
                    : null;

                  const sugArr = suggestions
                    ? Array.isArray(suggestions)
                      ? suggestions.map(String)
                      : String(suggestions).split("\n").map((s) => s.trim()).filter(Boolean)
                    : null;

                  setFeedback(fbArr.length ? fbArr : null);
                  setContentFeedback(contentFb ? String(contentFb) : null);
                  setStructureFeedback(structureFb ? String(structureFb) : null);
                  setClarityFeedback(clarityFb ? String(clarityFb) : null);
                  setImpactScore(impactVal ?? scoreVal ?? null);
                  setAlternatives(altArr);
                  setImprovementSuggestions(sugArr);
                  setModelAnswerState(modelAnswer ? String(modelAnswer) : null);
                  setScore(scoreVal);

                  // Persist score if present
                  if (scoreVal != null) {
                    try {
                      onPractice(q.id, draft, scoreVal);
                    } catch (e) {
                      console.error("Failed to update practice with score:", e);
                    }
                  }
                } catch (err) {
                  console.error("Failed to get AI feedback:", err);
                  setFeedback(["AI feedback unavailable. Try again later."]);
                } finally {
                  setReviewLoading(false);
                }
              }}
            >
              {reviewLoading ? "Reviewing..." : "Review Response"}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Paper>
  );
}

export default function InterviewQuestionBank({ jobTitle = "Software Engineer", industry = "Technology" }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState(jobTitle);
  const [ind, setInd] = useState(industry);
  const [difficulty, setDifficulty] = useState<"entry" | "mid" | "senior">("mid");
  const [includeCompanySpecific, setIncludeCompanySpecific] = useState(true);
  const [category, setCategory] = useState<"behavioral" | "technical" | "situational">("behavioral");

  const [generated, setGenerated] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const practiced = hook.listPracticed();

  const practicedQuestionIds = useMemo(() => new Set(practiced.map((p) => p.questionId)), [practiced]);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const bank = await hook.fetchQuestionBank({ jobTitle: title, industry: ind, difficulty, includeCompanySpecific });
      setGenerated(bank);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePractice = (id: string, response?: string, score?: number | null) => {
    hook.markPracticed(id, response);
    // force refresh by updating local state
    setGenerated((g) => [...g]);
    
    // Save to database for pattern recognition analysis
    if (user?.id) {
      const question = generated.find(q => q.id === id);
      if (question) {
        const activityType = question.category === "behavioral" || question.category === "situational"
          ? "interview_prep"
          : "skills_practice";
        const notesParts: string[] = [];
        if (response) notesParts.push(`Written response (${response.length} chars)`);
        if (score != null) notesParts.push(`AI score: ${score}%`);

        const completion_quality =
          score != null
            ? score >= 85
              ? "exceptional"
              : score >= 70
              ? "thorough"
              : score >= 50
              ? "basic"
              : "needs_improvement"
            : response && response.length > 200
            ? "thorough"
            : response
            ? "basic"
            : "basic";

        createPreparationActivity(user.id, {
          activity_type: activityType,
          activity_description: `Practiced ${question.category} question: ${question.text.substring(0, 100)}`,
          time_spent_minutes: response ? Math.ceil(response.length / 50) : 5,
          completion_quality,
          activity_date: new Date(),
          notes: notesParts.join("; ") || "Question marked as practiced",
        }).catch(err => {
          console.error("Failed to save prep activity to database:", err);
        });
      }
    }
  };

  const filtered = generated.filter((q) => q.category === category);

  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h6">Role-specific Interview Question Bank</Typography>

        <Stack direction="row" spacing={2}>
          <TextField label="Job Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField label="Industry" value={ind} onChange={(e) => setInd(e.target.value)} />
          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel>Difficulty</InputLabel>
            <Select
              value={difficulty}
              label="Difficulty"
              onChange={(e: SelectChangeEvent) => setDifficulty(e.target.value as any)}
            >
              <MenuItem value="entry">Entry</MenuItem>
              <MenuItem value="mid">Mid</MenuItem>
              <MenuItem value="senior">Senior</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? "Generating..." : "Generate Bank"}
          </Button>
          <Button
            onClick={() => {
              const payload = hook.exportPracticeJSON();
              const blob = new Blob([payload], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `practice-${new Date().toISOString()}.json`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            }}
          >
            Export Practice
          </Button>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Tabs value={category} onChange={(_, v) => setCategory(v)}>
            <Tab label="Behavioral" value="behavioral" />
            <Tab label="Technical" value="technical" />
            <Tab label="Situational" value="situational" />
          </Tabs>
          <Box sx={{ flexGrow: 1 }} />
          <Chip label={`Practiced: ${practiced.length}`} />
        </Stack>
      </Stack>

      <Box>
        {filtered.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No questions yet — generate a bank to begin.</Typography>
        ) : (
          filtered.map((q) => (
            <QuestionCard key={q.id} q={q} onPractice={handlePractice} practiced={practicedQuestionIds.has(q.id)} />
          ))
        )}
      </Box>
    </Box>
  );
}
