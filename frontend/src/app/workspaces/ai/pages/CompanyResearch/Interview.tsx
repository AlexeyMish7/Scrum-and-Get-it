import { useMemo, useState, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Button,
  Avatar,
  Divider,
} from "@mui/material";

type CompanyMinimal = {
  name: string;
  website?: string;
  industry?: string;
  size?: string;
};

type Interviewer = {
  name: string;
  title?: string;
  linkedin?: string;
  bio?: string;
};

export default function Interview({ company }: { company: CompanyMinimal }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  // Mock analysis: in a real implementation this would be powered by API/AI
  const stages = useMemo(
    () => ["Application", "Phone Screen", "Technical Interview", "Onsite", "Offer/Negotiation"],
    []
  );

  const commonQuestions = useMemo(
    () => [
      "Tell me about yourself / your background.",
      "Why do you want to work here?",
      "Walk me through a challenging technical problem you've solved.",
      "Describe a time you had a conflict on a team and how you resolved it.",
      "How do you prioritize tasks under pressure?",
    ],
    []
  );

  const interviewers: Interviewer[] = [
    { name: "Jordan Smith", title: "Engineering Manager", linkedin: "https://linkedin.com/in/jordansmith", bio: "Leads the frontend org; focuses on performance and team growth." },
    { name: "Priya Patel", title: "Senior Recruiter", linkedin: "https://linkedin.com/in/priyapatel", bio: "Covers hiring across product and design; screens candidates for culture fit." },
  ];

  const formats = useMemo(() => ["Phone (30m)", "Video (45-60m)", "Coding exercise", "Whiteboard / System design", "Pair programming"], []);

  const recommendations = useMemo(
    () => [
      `Customize examples to ${company.name} — reference their product or recent news.`,
      "Prepare 3-4 STAR stories that show impact and collaboration.",
      "Practice a short 60–90 second elevator pitch about your background.",
      "If technical: review system design basics and common algorithms for your level.",
    ],
    [company.name]
  );

  const timeline = useMemo(
    () => ({ average_days: 14, notes: "Company typically schedules interviews within 2 weeks of application; hiring decisions may take an additional week." }),
    []
  );

  const tips = useMemo(
    () => [
      "Ask specific questions about the team's roadmap and success metrics.",
      "Follow up within 24 hours with a personalized thank-you note.",
      "Be ready to discuss trade-offs and performance implications for design questions.",
    ],
    []
  );

  const checklist = [
    { id: "research", label: "Research company mission, products, and recent news" },
    { id: "stories", label: "Prepare STAR stories (3-4)" },
    { id: "tech", label: "Review role-specific technical topics" },
    { id: "questions", label: "Prepare 5 thoughtful questions for the interviewer" },
    { id: "logistics", label: "Confirm time, location, and logistics" },
  ];

  function toggle(id: string) {
    setChecked((s) => ({ ...s, [id]: !s[id] }));
  }

  const checklistRef = useRef<HTMLDivElement | null>(null);

  // Print only the checklist section by opening a new window containing
  // just that markup and invoking print. This avoids printing the rest
  // of the page.
  function printChecklist() {
    if (!checklistRef.current) return;

    const markup = checklistRef.current.innerHTML;
    const win = window.open("", "_blank", "toolbar=0,location=0,menubar=0");
    if (!win) {
      window.alert("Unable to open print window — please allow popups for this site.");
      return;
    }

    const styles = `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin: 20px; color: #222 }
      h2 { margin-top: 0 }
      ul { padding-left: 0; list-style: none }
      /* Ensure list items align nicely with checkboxes */
      li, .MuiListItem-root { margin: 8px 0; font-size: 14px; display: flex; align-items: center; gap: 8px }
      /* Normalize native checkbox size */
      input[type="checkbox"] { width: 16px; height: 16px; margin: 0; vertical-align: middle; transform: none !important }
      /* MUI renders SVG icons for checkboxes; ensure they are small for print */
      .MuiSvgIcon-root { width: 16px; height: 16px; font-size: 16px }
      .MuiCheckbox-root { padding: 0 }
      .MuiListItemText-root { margin: 0 }
    `;

    win.document.write(`<!doctype html><html><head><title>Interview Checklist</title><style>${styles}</style></head><body><h2>Interview Preparation Checklist</h2><div>${markup}</div></body></html>`);
    win.document.close();
    // Give the new window a moment to render before printing
    setTimeout(() => {
      win.focus();
      win.print();
      // Close the window after printing
      win.close();
    }, 250);
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h5" sx={{ mb: 1 }}>
          Interview Insights & Preparation
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Tailored guidance for {company.name} — quick reference for process, common questions, interviewer backgrounds, and a practical checklist.
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1">Typical Process</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
              {stages.map((s) => (
                <Chip key={s} label={s} variant="outlined" />
              ))}
            </Stack>
          </Box>

          <Box sx={{ width: 260 }}>
            <Typography variant="subtitle1">Timeline</Typography>
            <Typography color="text.secondary">Avg time to hire: {timeline.average_days} days</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>{timeline.notes}</Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1">Common Interview Questions</Typography>
            <List>
              {commonQuestions.map((q, i) => (
                <ListItem key={i} disableGutters>
                  <ListItemText primary={`${i + 1}. ${q}`} />
                </ListItem>
              ))}
            </List>

            <Typography variant="subtitle1" sx={{ mt: 2 }}>Preparation Recommendations</Typography>
            <List>
              {recommendations.map((r, i) => (
                <ListItem key={i} disableGutters>
                  <ListItemText primary={`• ${r}`} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Box sx={{ width: 320 }}>
            <Typography variant="subtitle1">Interviewers</Typography>
            <Stack spacing={1} sx={{ mt: 1, mb: 2 }}>
              {interviewers.map((iv) => (
                <Stack key={iv.name} direction="row" spacing={1} alignItems="center">
                  <Avatar>{iv.name.split(" ")[0][0]}</Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>{iv.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{iv.title}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{iv.bio}</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {iv.linkedin ? (
                        <Button size="small" component="a" href={iv.linkedin} target="_blank" rel="noopener">View LinkedIn</Button>
                      ) : (
                        <Button size="small" disabled>LinkedIn</Button>
                      )}
                    </Box>
                  </Box>
                </Stack>
              ))}
            </Stack>

            <Typography variant="subtitle1">Formats</Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {formats.map((f) => (
                <Chip key={f} label={f} />
              ))}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1">Success Tips</Typography>
            <List>
              {tips.map((t, i) => (
                <ListItem key={i} disableGutters>
                  <ListItemText primary={`• ${t}`} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1">Interview Preparation Checklist</Typography>
        <div ref={checklistRef} id="sgt-interview-checklist">
          <List>
            {checklist.map((c) => (
              <ListItem key={c.id} disableGutters>
                <Checkbox checked={!!checked[c.id]} onChange={() => toggle(c.id)} />
                <ListItemText primary={c.label} />
              </ListItem>
            ))}
          </List>
        </div>

        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button variant="contained" onClick={() => window.alert("Mock: Start mock interview")}>Start Mock Interview</Button>
          <Button variant="outlined" onClick={printChecklist}>Print Checklist</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
