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
  onPractice: (id: string, response?: string) => void;
  practiced?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

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
          <DialogContent>
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
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => {
                onPractice(q.id, draft);
                setDraft("");
                setOpen(false);
              }}
            >
              Save Practice
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

  const handlePractice = (id: string, response?: string) => {
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
        
        createPreparationActivity(user.id, {
          activity_type: activityType,
          activity_description: `Practiced ${question.category} question: ${question.text.substring(0, 100)}`,
          time_spent_minutes: response ? Math.ceil(response.length / 50) : 5,
          completion_quality: response && response.length > 200 ? "thorough" : response ? "basic" : "basic",
          activity_date: new Date(),
          notes: response ? `Written response (${response.length} chars)` : "Question marked as practiced",
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
