import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import useInterviewBank from "../hooks/useInterviewQuestionBank";
import type { InterviewQuestion } from "../hooks/useInterviewQuestionBank";
import aiClient from "@shared/services/ai/client";

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function TechnicalPrep() {
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState<InterviewQuestion | null>(null);
  const [open, setOpen] = useState(false);
  const [timeStart, setTimeStart] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [attempts, setAttempts] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem("sgt:technical_prep_attempts");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  

  const bank = useInterviewBank;
  const all = bank.generateQuestionBank({ jobTitle: "Software Engineer", industry: "Technology", difficulty: "mid" });
  const [jobTitle, setJobTitle] = useState("Software Engineer");
  const [industry, setIndustry] = useState("Technology");
  const [difficulty, setDifficulty] = useState<"entry" | "mid" | "senior">("mid");

  const [aiQuestions, setAiQuestions] = useState<InterviewQuestion[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const technical = useMemo(() => {
    if (aiQuestions && aiQuestions.length) return aiQuestions.filter((q) => q.category === "technical");
    return all.filter((q) => q.category === "technical");
  }, [aiQuestions, all]);

  const [sysDesignText, setSysDesignText] = useState(
    "Design a scalable session store for a high-traffic ecommerce site."
  );
  const [caseStudyText, setCaseStudyText] = useState(
    "You are advising a mid-size retailer on improving online conversion — outline your approach."
  );
  const [whiteboardText, setWhiteboardText] = useState(
    "Sketch an algorithm to deduplicate massive datasets in streaming fashion and discuss complexity."
  );

  function makeLocalId(prefix = "m") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
  }

  function openChallenge(q: InterviewQuestion, origin?: string) {
    // attach origin so attempts can be filtered per-tab
    const withOrigin: any = { ...(q as any), origin };
    setSelected(withOrigin as InterviewQuestion);
    setCode("");
    setTimeStart(Date.now());
    setOpen(true);
  }

  function openCustomPrompt(text: string, category: InterviewQuestion["category"], origin?: string) {
    const q: any = {
      id: makeLocalId("c"),
      text,
      category,
      difficulty: "mid",
      skillTags: [],
      companySpecific: false,
      origin,
    };
    openChallenge(q as InterviewQuestion, origin);
  }

  async function generateFromAI() {
    try {
      setIsGenerating(true);
      const payload = await aiClient.postJson("/api/generate/interview-questions", {
        jobTitle: jobTitle || undefined,
        industry: industry || undefined,
        difficulty,
        includeCompanySpecific: true,
      } as any);
      const items = ((payload as any)?.questions ?? (payload as any)) as InterviewQuestion[];
      if (Array.isArray(items)) {
        setAiQuestions(items);
        // Pick representative prompts for other tabs
        const tech = items.filter((q) => q.category === "technical");
        const situ = items.filter((q) => q.category === "situational");
        const beh = items.filter((q) => q.category === "behavioral");

        const pickSystem = tech.find((q) => /design|architecture|scalab|system/i.test(q.text)) || tech[0];
        const pickCase = situ[0] || beh[0] || tech[0];
        const pickWhite = tech.find((q) => /algorithm|complexit|data|stream|dedup/i.test(q.text)) || tech[1] || tech[0];

        if (pickSystem) setSysDesignText(pickSystem.text);
        if (pickCase) setCaseStudyText(pickCase.text);
        if (pickWhite) setWhiteboardText(pickWhite.text);
      }
    } catch (e) {
      console.error("AI generation failed", e);
    } finally {
      setIsGenerating(false);
    }
  }

  function submitAttempt(status = "completed") {
    if (!selected || timeStart == null) return;
    const now = Date.now();
    const elapsed = now - timeStart;
    const rec: any = {
      id: `${selected.id}_${now}`,
      questionId: selected.id,
      text: selected.text,
      category: selected.category,
      origin: (selected as any).origin,
      practicedAt: new Date(now).toISOString(),
      elapsedMs: elapsed,
      code,
      status,
      feedback: null,
      modelAnswer: null,
    };
    // Persist immediately so UI is responsive; we'll patch feedback when ready
    const next = [rec, ...attempts].slice(0, 50);
    setAttempts(next);
    localStorage.setItem("sgt:technical_prep_attempts", JSON.stringify(next));
    setOpen(false);
    setSelected(null);
    setTimeStart(null);

    // Asynchronously request AI feedback for the answer the user submitted
    (async () => {
      // only request feedback when the user actually submitted text
      if (!rec.code || !String(rec.code).trim()) return;
      try {
        const payload = await aiClient.postJson("/api/generate/interview-feedback", {
          question: rec.text,
          answer: rec.code,
          category: rec.category,
          jobTitle,
          industry,
          difficulty,
        } as any);

        const modelAnswer = (payload as any)?.modelAnswer ?? null;
        const feedback = (payload as any)?.feedback ?? null;

        // Patch the stored attempt with feedback using functional state update to avoid stale closures
        setAttempts((prev) => {
          const updated = prev.map((a) => (a.id === rec.id ? { ...a, modelAnswer, feedback } : a)).slice(0, 50);
          try {
            localStorage.setItem("sgt:technical_prep_attempts", JSON.stringify(updated));
          } catch {}
          return updated;
        });

        // no in-place dialog to refresh anymore
      } catch (e) {
        console.error("Failed to get feedback", e);
      }
    })();
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">Technical Interview Preparation</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Coding Challenges" />
        <Tab label="System Design" />
        <Tab label="Case Studies" />
        <Tab label="Whiteboarding" />
      </Tabs>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField label="Job title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} size="small" />
          <TextField label="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} size="small" />
          <TextField
            label="Difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as any)}
            size="small"
          />
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" onClick={generateFromAI} disabled={isGenerating}>
            {isGenerating ? "Generating with AI..." : "Generate role-specific questions"}
          </Button>
        </Stack>
      </Paper>

      {tab === 0 && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Timed coding challenges tailored to core skills
          </Typography>
          <List>
            {technical.map((q) => (
                <ListItem
                  key={q.id}
                  secondaryAction={<Button onClick={() => openChallenge(q, aiQuestions ? "ai" : "coding")}>Start</Button>}
                >
                  <ListItemText primary={q.text} secondary={q.skillTags?.join(", ") || ""} />
                </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2">Recent attempts (Coding)</Typography>
          <List dense>
            {attempts
              .filter((a) => a.category === "technical" && !String(a.questionId).startsWith("c"))
                .map((a) => (
                  <ListItem key={a.id}>
                    <ListItemText primary={a.text} secondary={`${formatElapsed(a.elapsedMs)} — ${a.status}`} />
                  </ListItem>
                ))}
          </List>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <Typography variant="subtitle1">System design frameworks for senior roles</Typography>
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography>
              Start by clarifying requirements, sketch high-level components, discuss data flow and storage, then address scaling, reliability and trade-offs.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Example: design a scalable session store for a high-traffic ecommerce site — discuss storage, sharding, consistency, and failure modes.
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography>{sysDesignText}</Typography>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                <Button variant="contained" onClick={() => openCustomPrompt(sysDesignText, "technical", "system")}>
                  Start
                </Button>
              </Box>
            </Paper>
          </Stack>
        </Box>
      )}

      {tab === 2 && (
        <Box>
          <Typography variant="subtitle1">Case study practice</Typography>
          <Typography sx={{ mt: 1 }}>
            Practice structuring an approach: clarify the problem, make assumptions, show analysis, propose recommendations and next steps. Try a 20–30 minute mock.
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
            <Typography>{caseStudyText}</Typography>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
              <Button variant="contained" onClick={() => openCustomPrompt(caseStudyText, "situational", "case")}>
                Start
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      {tab === 3 && (
        <Box>
          <Typography variant="subtitle1">Whiteboarding techniques</Typography>
          <Typography sx={{ mt: 1 }}>
            Use a step-by-step approach: clarify, draw data flow, incremental implementation, test cases, and complexity analysis. Verbally walk through trade-offs.
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
            <Typography>{whiteboardText}</Typography>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
              <Button variant="contained" onClick={() => openCustomPrompt(whiteboardText, "technical", "whiteboard")}>
                Start
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{selected?.text}</DialogTitle>
        <DialogContent>
          <Typography variant="caption" display="block" sx={{ mb: 1 }}>
            Timer: {timeStart ? formatElapsed(Date.now() - timeStart) : "0:00"}
          </Typography>
          <TextField
            label="Your solution / notes"
            multiline
            minRows={10}
            fullWidth
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={() => submitAttempt("skipped")}>Skip</Button>
            <Button variant="contained" onClick={() => submitAttempt("completed")}>
              Submit
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
      {/* Feedback list removed — feedback viewed inline on attempts when available (no separate list) */}
    </Paper>
  );
}
