import { useMemo, useState } from "react";
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
function genId(prefix = "r") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
}

interface Props {
  // optional pre-fill values
  jobTitle?: string;
  industry?: string;
}

function QuestionCard({
  q,
  onPractice,
  onSaveToLibrary,
  practiced,
}: {
  q: any;
  onPractice: (id: string, response?: string, score?: number | null) => void;
  onSaveToLibrary?: (question: any, response: string, aiFeedback?: any) => void;
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

        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          maxWidth="sm"
          fullWidth
          // ensure practice dialog appears above other dialogs (save dialog) so inputs remain interactive
          PaperProps={{ sx: { zIndex: (theme) => theme.zIndex.modal + 2000 } }}
          BackdropProps={{ sx: { zIndex: (theme) => theme.zIndex.modal + 1999 } }}
          disableEnforceFocus
        >
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
            <Button
              sx={{ ml: 1 }}
              onClick={() => {
                const aiPayload = {
                  feedback,
                  contentFeedback,
                  structureFeedback,
                  clarityFeedback,
                  impactScore,
                  alternatives,
                  improvementSuggestions,
                  modelAnswer: modelAnswerState,
                  score,
                };
                onSaveToLibrary?.(q, draft || "", aiPayload);
              }}
            >
              Save to Library
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

  // Response library stored in localStorage under this key
  const LIB_KEY = "sgt:response_library";
  const [library, setLibrary] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem(LIB_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveDraft, setSaveDraft] = useState("");
  const [saveQuestion, setSaveQuestion] = useState<any | null>(null);
  const [saveTags, setSaveTags] = useState("");
  const [saveSkills, setSaveSkills] = useState("");
  const [saveCompanies, setSaveCompanies] = useState("");
  // when viewing/editing from the library, keep the library item here so we can show versions
  const [saveLibraryItem, setSaveLibraryItem] = useState<any | null>(null);
  // optional AI feedback to attach to the version when saving
  const [saveFeedback, setSaveFeedback] = useState<any | null>(null);

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

  function persistLibrary(next: any[]) {
    try {
      localStorage.setItem(LIB_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Failed to persist response library:", e);
    }
    setLibrary(next);
  }

  function saveResponseToLibrary(question: any, responseText: string, tagsText = "", skillsText = "", companiesText = "", aiFeedback: any = null) {
    if (!question || !responseText) return;
    const tags = tagsText.split(",").map((s) => s.trim()).filter(Boolean);
    const skills = skillsText.split(",").map((s) => s.trim()).filter(Boolean);
    const companies = companiesText.split(",").map((s) => s.trim()).filter(Boolean);

    // Find existing item by questionId + question text (to support multiple versions)
    const existing = library.find((l) => l.questionId === question.id && l.questionText === question.text);
    const version = {
      id: genId("v"),
      content: responseText,
      tags,
      skills,
      companies,
      aiFeedback: aiFeedback ?? null,
      jobTitle: title,
      level: difficulty,
      createdAt: new Date().toISOString(),
      outcome: null,
    };

    let next;
    if (existing) {
      // prepend version
      next = library.map((l) => (l === existing ? { ...l, versions: [version, ...l.versions], updatedAt: version.createdAt } : l));
    } else {
      const item = {
        id: genId("i"),
        questionId: question.id,
        questionText: question.text,
        category: question.category,
        jobTitle: title,
        level: difficulty,
        createdAt: version.createdAt,
        updatedAt: version.createdAt,
        versions: [version],
        tags: tags,
        skills: skills,
        companies: companies,
        practiceCount: 1,
      };
      next = [item, ...library];
    }

    persistLibrary(next as any[]);
  }

  function deleteVersion(itemId: string, versionId: string) {
    if (!window.confirm("Delete this version? This cannot be undone.")) return;
    // remove the version from the library; if no versions remain, remove the item
    const next = library
      .map((item) => {
        if (item.id !== itemId) return item;
        const versions = (item.versions || []).filter((v: any) => v.id !== versionId);
        if (!versions || versions.length === 0) return null;
        return { ...item, versions, updatedAt: new Date().toISOString() };
      })
      .filter(Boolean) as any[];

    persistLibrary(next);

    // update the open library item in the dialog if it was affected
    if (saveLibraryItem?.id === itemId) {
      const updated = next.find((it: any) => it.id === itemId) || null;
      setSaveLibraryItem(updated);
      if (!updated) {
        setSaveDialogOpen(false);
      }
    }
  }

  function exportLibrary() {
    // Build printable HTML and open print dialog so user can save as PDF
    try {
      const html = `
        <h1>Response Library</h1>
        <p>Exported: ${new Date().toLocaleString()}</p>
        ${library
          .map(
            (item) => `
            <section style="margin-bottom:20px;">
              <h2 style="margin:0 0 4px 0">${escapeHtml(item.questionText || "(no question)")}</h2>
              <div style="color:#666;font-size:0.9em;margin-bottom:8px">${escapeHtml(item.category || "")}${item.jobTitle ? ' • ' + escapeHtml(item.jobTitle) : ''}${item.level ? ' • ' + escapeHtml(item.level) : ''} • ${item.versions?.length || 0} version(s)</div>
              ${
                (item.versions || [])
                  .map(
                    (v: any, idx: number) => `
                      <article style="border:1px solid #ddd;padding:8px;margin-bottom:8px;">
                        <div style="font-size:0.85em;color:#666">Version ${idx + 1} — ${new Date(v.createdAt).toLocaleString()}</div>
                        <pre style="white-space:pre-wrap;font-family:inherit;margin:8px 0;padding:6px;background:#fafafa;border-radius:4px;">${escapeHtml(v.content || "")}</pre>
                        ${v.aiFeedback ? `<details style="margin-top:6px;"><summary>AI Review</summary><div style="margin-top:6px">${renderAiFeedbackHtml(v.aiFeedback)}</div></details>` : ''}
                      </article>
                    `
                  )
                  .join('\n')
              }
            </section>
          `
          )
          .join("\n")}
      `;

      openPrintWindow(html, `response-library-${new Date().toISOString()}`);
    } catch (e) {
      console.error("Failed to export library as PDF:", e);
      // fallback to JSON download
      const payload = { exportedAt: new Date().toISOString(), items: library };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `response-library-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  }

  function openPrintWindow(htmlContent: string, title = "export") {
    const w = window.open("", "_blank");
    if (!w) return;
    const doc = w.document;
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:Arial,Helvetica,sans-serif;font-size:14px;padding:16px;color:#222} h1{font-size:20px;margin-bottom:6px} h2{font-size:16px;margin:6px 0} pre{font-family:inherit;}</style></head><body>${htmlContent}</body></html>`);
    doc.close();
    w.focus();
    setTimeout(() => {
      try {
        w.print();
      } catch (e) {
        console.error('Print failed', e);
      }
    }, 300);
  }

  function escapeHtml(str: any) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderAiFeedbackHtml(ai: any) {
    if (!ai) return "";
    const parts: string[] = [];
    if (ai.contentFeedback) parts.push(`<div><strong>Content:</strong><div>${escapeHtml(ai.contentFeedback)}</div></div>`);
    if (ai.structureFeedback) parts.push(`<div><strong>Structure:</strong><div>${escapeHtml(ai.structureFeedback)}</div></div>`);
    if (ai.clarityFeedback) parts.push(`<div><strong>Clarity:</strong><div>${escapeHtml(ai.clarityFeedback)}</div></div>`);
    if (ai.modelAnswer) parts.push(`<div><strong>Model Answer:</strong><div>${escapeHtml(ai.modelAnswer)}</div></div>`);
    if (ai.feedback && Array.isArray(ai.feedback)) parts.push(`<div><strong>Feedback:</strong><div>${escapeHtml(ai.feedback.join('\n'))}</div></div>`);
    if (ai.alternatives && Array.isArray(ai.alternatives)) parts.push(`<div><strong>Alternatives:</strong><div>${escapeHtml(ai.alternatives.join('\n'))}</div></div>`);
    if (ai.improvementSuggestions && Array.isArray(ai.improvementSuggestions)) parts.push(`<div><strong>Improvement Suggestions:</strong><div>${escapeHtml(ai.improvementSuggestions.join('\n'))}</div></div>`);
    if (ai.score != null) parts.push(`<div><strong>AI Score:</strong> ${escapeHtml(ai.score)}</div>`);
    return parts.join('\n');
  }

  const filtered = generated.filter((q) => q.category === category);

  // (suggest feature removed) suggestion state no longer used

  function handleSaveToLibrary(question: any, responseText: string, aiFeedback?: any) {
    setSaveDraft(responseText || "");
    setSaveQuestion(question);
    setSaveLibraryItem(null);
    setSaveFeedback(aiFeedback ?? null);
    setSaveTags("");
    setSaveSkills("");
    setSaveCompanies("");
    setSaveDialogOpen(true);
  }

  // suggest functionality removed per user request

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

      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Save Response to Library</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Question" value={saveQuestion?.text ?? ""} fullWidth onChange={(e) => setSaveQuestion((q:any) => ({ ...(q||{}), text: e.target.value }))} />
            <TextField label="Your response" multiline minRows={6} fullWidth value={saveDraft} onChange={(e) => setSaveDraft(e.target.value)} />
            <TextField label="Tags (comma-separated)" fullWidth value={saveTags} onChange={(e) => setSaveTags(e.target.value)} />
            <TextField label="Skills (comma-separated)" fullWidth value={saveSkills} onChange={(e) => setSaveSkills(e.target.value)} />
            <TextField label="Companies (comma-separated)" fullWidth value={saveCompanies} onChange={(e) => setSaveCompanies(e.target.value)} />

            {saveLibraryItem && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">Versions</Typography>
                {(saveLibraryItem.versions || []).map((v: any, i: number) => (
                  <Paper key={v.id || i} variant="outlined" sx={{ p: 1, mt: 1 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="text.secondary">{new Date(v.createdAt).toLocaleString()}</Typography>
                          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>{v.content}</Typography>
                        </Box>
                        <Box>
                          <Button size="small" onClick={() => setSaveDraft(v.content)}>Load</Button>
                          <Button size="small" color="error" sx={{ ml: 1 }} onClick={() => deleteVersion(saveLibraryItem!.id, v.id)}>Delete</Button>
                        </Box>
                      </Stack>

                      {/* Display AI feedback if present on the version */}
                      {v.aiFeedback && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="subtitle2">AI Review</Typography>
                          <Stack spacing={1} sx={{ mt: 1 }}>
                            {v.aiFeedback.contentFeedback && (
                              <Paper variant="outlined" sx={{ p: 1 }}>
                                <Typography variant="subtitle2">Content</Typography>
                                <Typography variant="body2">{v.aiFeedback.contentFeedback}</Typography>
                              </Paper>
                            )}

                            {v.aiFeedback.structureFeedback && (
                              <Paper variant="outlined" sx={{ p: 1 }}>
                                <Typography variant="subtitle2">Structure</Typography>
                                <Typography variant="body2">{v.aiFeedback.structureFeedback}</Typography>
                              </Paper>
                            )}

                            {v.aiFeedback.clarityFeedback && (
                              <Paper variant="outlined" sx={{ p: 1 }}>
                                <Typography variant="subtitle2">Clarity</Typography>
                                <Typography variant="body2">{v.aiFeedback.clarityFeedback}</Typography>
                              </Paper>
                            )}

                            {v.aiFeedback.modelAnswer && (
                              <Paper variant="outlined" sx={{ p: 1 }}>
                                <Typography variant="subtitle2">Model Answer</Typography>
                                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{v.aiFeedback.modelAnswer}</Typography>
                              </Paper>
                            )}

                            {v.aiFeedback.feedback && Array.isArray(v.aiFeedback.feedback) && (
                              <Paper variant="outlined" sx={{ p: 1 }}>
                                <Typography variant="subtitle2">Feedback</Typography>
                                <Stack spacing={1} sx={{ mt: 1 }}>
                                  {v.aiFeedback.feedback.map((f: any, idx: number) => (
                                    <Typography key={idx} variant="body2">{f}</Typography>
                                  ))}
                                </Stack>
                              </Paper>
                            )}

                            {v.aiFeedback.alternatives && (
                              <Paper variant="outlined" sx={{ p: 1 }}>
                                <Typography variant="subtitle2">Alternative Approaches</Typography>
                                <Stack spacing={1} sx={{ mt: 1 }}>
                                  {v.aiFeedback.alternatives.map((a: any, idx: number) => (
                                    <Typography key={idx} variant="body2">{a}</Typography>
                                  ))}
                                </Stack>
                              </Paper>
                            )}

                            {v.aiFeedback.improvementSuggestions && (
                              <Paper variant="outlined" sx={{ p: 1 }}>
                                <Typography variant="subtitle2">Improvement Suggestions</Typography>
                                <Stack spacing={1} sx={{ mt: 1 }}>
                                  {v.aiFeedback.improvementSuggestions.map((s: any, idx: number) => (
                                    <Typography key={idx} variant="body2">{s}</Typography>
                                  ))}
                                </Stack>
                              </Paper>
                            )}

                            {v.aiFeedback.score != null && (
                              <Paper variant="outlined" sx={{ p: 1 }}>
                                <Typography variant="subtitle2">AI Score</Typography>
                                <Typography variant="body2">{v.aiFeedback.score}%</Typography>
                              </Paper>
                            )}
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!saveQuestion) {
                // create a minimal question placeholder
                setSaveQuestion({ id: genId("i"), text: "(manual)" });
              }
              saveResponseToLibrary(saveQuestion || { id: genId("i"), text: "(manual)" }, saveDraft, saveTags, saveSkills, saveCompanies, saveFeedback);
              setSaveDialogOpen(false);
              setSaveDraft("");
              setSaveQuestion(null);
              setSaveLibraryItem(null);
              setSaveFeedback(null);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ display: "flex", gap: 2 }}>
        <Box sx={{ flex: 2 }}>
        {filtered.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No questions yet — generate a bank to begin.</Typography>
        ) : (
          filtered.map((q) => (
            <QuestionCard
              key={q.id}
              q={q}
              onPractice={handlePractice}
              onSaveToLibrary={handleSaveToLibrary}
              practiced={practicedQuestionIds.has(q.id)}
            />
          ))
        )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 320 }}>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle1">Response Library</Typography>
              <Typography variant="body2" color="text.secondary">Save and manage your best answers for reuse.</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button size="small" onClick={() => { setSaveLibraryItem(null); setSaveQuestion(null); setSaveDraft(""); setSaveFeedback(null); setSaveDialogOpen(true); }}>Add Manual</Button>
                <Button size="small" onClick={exportLibrary}>Export</Button>
              </Stack>
            </Stack>
          </Paper>

          {library.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">No saved responses yet.</Typography>
            </Paper>
          ) : (
            library.map((item) => (
              <Paper key={item.id} variant="outlined" sx={{ p: 1, mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.questionText}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.category} • {item.versions.length} version(s)
                  {item.jobTitle ? ` • ${item.jobTitle}` : ""}
                  {item.level ? ` • ${item.level}` : ""}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Button size="small" onClick={() => {
                    // open view/edit dialog and surface all versions
                    const v = item.versions[0];
                    setSaveDraft(v.content);
                    setSaveQuestion({ id: item.questionId, text: item.questionText, category: item.category });
                    setSaveLibraryItem(item);
                    setSaveDialogOpen(true);
                  }}>View/Edit</Button>
                </Box>
              </Paper>
            ))
          )}
        </Box>
      </Box>
      {/* Suggest dialog removed */}
    </Box>
  );
}
