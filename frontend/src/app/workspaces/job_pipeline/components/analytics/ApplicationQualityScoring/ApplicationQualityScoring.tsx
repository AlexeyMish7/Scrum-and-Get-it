import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, Card, CardContent, Chip, Stack, Divider, Alert, Button, Switch, FormControlLabel } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@shared/context/AuthContext";
import { generateSkillsOptimization } from "@shared/services/ai/aiGeneration";
import { listJobMaterials, getDocumentText } from "@shared/services/jobMaterials";
import { getDocument, getSignedDownloadUrl } from "@shared/services/documents";
import type { JobMaterial } from "@shared/services/jobMaterials";
import { errorNotifier } from "@shared/services/errorNotifier";

interface ApplicationQualityScoringProps {
  job?: any | null;
  matchData?: any | null;
}

export default function ApplicationQualityScoring({ job, matchData }: ApplicationQualityScoringProps) {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const title = (job as any)?.title ?? (job as any)?.job_title ?? "";
  const company = (job as any)?.company_name ?? (job as any)?.company ?? "";
  const md = (matchData ?? {}) as any;

  const STORAGE_FLAGS = "jobs:application_quality_flags";
  const jobId = String((job as any)?.id ?? "");
  const [flags, setFlags] = useState<{ [jobId: string]: { tailoredResume?: boolean; coverLetter?: boolean; linkedIn?: boolean } }>({});
  const [materials, setMaterials] = useState<JobMaterial[]>([]);
  const [resumeTextAuto, setResumeTextAuto] = useState<string>("");
  const [coverTextAuto, setCoverTextAuto] = useState<string>("");
  const [aiHighlights, setAiHighlights] = useState<{
    keyFeatures?: string[];
    keySkills?: string[];
    keyExperiences?: string[];
    summary?: string;
  }>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_FLAGS) || "{}";
      const obj = JSON.parse(raw) as typeof flags;
      setFlags(obj);
    } catch { setFlags({}); }
  }, [jobId]);

  // Load materials (server route) and try to fetch text for keyword analysis
  useEffect(() => {
    const jwt = (session as any)?.access_token as string | undefined;
    if (!user || !jobId) return;
    (async () => {
      const res = await listJobMaterials(Number(jobId), jwt);
      if (res.error) {
        errorNotifier.notifyWarning(res.error.message || "Failed to load job materials", "Job Materials");
      }
      const mats = res.data || [];
      setMaterials(mats);

      const resumeDoc = mats.find(m => m.material_type === "resume" && m.document_id);
      const coverDoc = mats.find(m => m.material_type === "cover_letter" && m.document_id);

      if (resumeDoc?.document_id) {
        const t = await getDocumentText(resumeDoc.document_id, jwt);
        if (t.error) {
          errorNotifier.notifyWarning(t.error.message || "Failed to load resume text", "Artifacts");
        }
        if (t.data) setResumeTextAuto(String(t.data).toLowerCase());
      }

      if (coverDoc?.document_id) {
        const t = await getDocumentText(coverDoc.document_id, jwt);
        if (t.error) {
          errorNotifier.notifyWarning(t.error.message || "Failed to load cover letter text", "Artifacts");
        }
        if (t.data) setCoverTextAuto(String(t.data).toLowerCase());
      }
    })();
  }, [user, session, jobId]);
  const flagForJob = flags[jobId] ?? {};

  // AI extraction: understand job title/company and extract key features, skills, experiences
  useEffect(() => {
    const run = async () => {
      if (!user || !jobId) return;
      try {
        const res = await generateSkillsOptimization(user.id, Number(jobId));
        // The backend may return structured content or plain text; normalize to arrays
        const content: any = (res as any)?.content || {};
        const features = Array.isArray(content.keyFeatures)
          ? content.keyFeatures
          : Array.isArray(content.features)
          ? content.features
          : [];
        const skills = Array.isArray(content.keySkills)
          ? content.keySkills
          : Array.isArray(content.skills)
          ? content.skills
          : [];
        const experiences = Array.isArray(content.keyExperiences)
          ? content.keyExperiences
          : Array.isArray(content.experiences)
          ? content.experiences
          : [];
        setAiHighlights({
          keyFeatures: features.map((s: unknown) => String(s)).filter(Boolean),
          keySkills: skills.map((s: unknown) => String(s)).filter(Boolean),
          keyExperiences: experiences
            .map((s: unknown) => String(s))
            .filter(Boolean),
          summary: typeof content.summary === "string" ? content.summary : undefined,
        });
      } catch (e: any) {
        const status = (e && typeof e === "object" && "status" in e) ? (e as any).status : undefined;
        if (status === 406) {
          // Backend cannot provide acceptable response; show a gentle info message
          errorNotifier.notifyInfo(
            "AI highlights are temporarily unavailable (406).",
            "AI Highlights"
          );
        } else {
          errorNotifier.notifyWarning(
            e?.message || "AI extraction failed",
            "AI Highlights"
          );
        }
      }
    };
    run();
  }, [user, jobId]);

  const autoTailoredResume = materials.some(m => m.material_type === "resume" && (m.is_tailored ?? false));
  // Discover tailored resume document id from known sources (materials or matchData)
  const resumeDocId: string | null = (
    (materials.find(m => m.material_type === "resume" && m.document_id)?.document_id as string | undefined) ||
    (md?.resume?.documentId as string | undefined) ||
    (md?.materials?.resume_document_id as string | undefined) ||
    null
  );

  const openTailoredResume = async (newTab?: boolean) => {
      // If we have a document ID, try to open the editor; also attempt a direct signed file URL as a fallback
      if (resumeDocId && user) {
        // Attempt direct file open first if text-like
        const docRes = await getDocument(user.id, resumeDocId);
        const doc = docRes.data;
        if (doc?.file_path) {
          const urlRes = await getSignedDownloadUrl(doc.file_path, 60);
          const signed = urlRes.data?.url;
          if (signed && (doc.mime_type?.startsWith("text/") || doc.mime_type === "application/json")) {
            window.open(signed, "_blank");
            return;
          }
        }
        const editorUrl = `/ai/document/${resumeDocId}`;
        if (newTab) {
          window.open(editorUrl, "_blank");
        } else {
          navigate(editorUrl);
        }
        return;
      }

      // No document id: go to library with query hints to filter by job/company
      const companyName = (job as any)?.company_name ?? (job as any)?.company ?? "";
      const titleName = (job as any)?.title ?? (job as any)?.job_title ?? "";
      const query = new URLSearchParams({ job: titleName || "", company: companyName || "", type: "resume" }).toString();
      const url = `/ai/library?${query}`;
      if (newTab) {
        window.open(url, "_blank");
      } else {
        navigate(url);
      }
    };
  const autoTailoredCover = materials.some(m => m.material_type === "cover_letter" && (m.is_tailored ?? false));
  const autoLinkedInReady = materials.some(m => m.material_type === "linkedin" && (m.is_tailored ?? false));

  const hasTailoredResume = Boolean(md?.resume?.tailoredForJob ?? md?.resumeTailored ?? flagForJob.tailoredResume ?? autoTailoredResume);
  const hasCoverLetter = Boolean(md?.coverLetter?.exists ?? md?.hasCoverLetter ?? flagForJob.coverLetter ?? autoTailoredCover);
  const hasLinkedIn = Boolean(md?.linkedin?.profileUrl ?? md?.hasLinkedIn ?? flagForJob.linkedIn ?? autoLinkedInReady);
  const keywordAlignment = Number(md?.breakdown?.skills ?? 0);
  const experienceAlignment = Number(md?.breakdown?.experience ?? 0);
  const achievements = Array.isArray(md?.achievements) ? md.achievements.length : 0;

  // Extract job keywords from description/requirements
  const jobDesc: string = ((job as any)?.job_description ?? (job as any)?.description ?? (job as any)?.posting_text ?? "").toString();
  const jobReqList: string[] = Array.isArray((job as any)?.requirements) ? (job as any)?.requirements : [];
  const normalizedKeywords = useMemo(() => {
    const set = new Set<string>();
    const add = (s: string) => {
      s.split(/[\,\.;\n\-•]/).map((t) => t.trim().toLowerCase()).filter(Boolean).forEach((t) => set.add(t));
    };
    if (jobDesc) add(jobDesc);
    for (const r of jobReqList) add(String(r));
    // keep only word-like tokens length >= 3
    return Array.from(set).filter((t) => /[a-z]/.test(t) && t.length >= 3);
  }, [jobDesc, jobReqList]);

  // Materials text (if available in matchData)
  const resumeText: string = (resumeTextAuto || md?.resume?.text || md?.resumeText || "").toString().toLowerCase();
  const coverLetterText: string = (coverTextAuto || md?.coverLetter?.text || md?.coverLetterText || "").toString().toLowerCase();
  const linkedInSummary: string = (md?.linkedin?.about ?? md?.linkedinSummary ?? "").toString().toLowerCase();

  function missingKeywordsFrom(texts: string[]): string[] {
    const present = new Set<string>();
    for (const t of texts) {
      t.split(/[\s\,\.\;\n]/).forEach((w) => {
        const norm = w.trim().toLowerCase();
        if (norm.length >= 3) present.add(norm);
      });
    }
    const missing: string[] = [];
    for (const k of normalizedKeywords) {
      if (!present.has(k)) missing.push(k);
    }
    // return top 10 meaningful missing keywords
    return missing.slice(0, 10);
  }

  const missingKeywords = missingKeywordsFrom([resumeText, coverLetterText, linkedInSummary]);

  // Basic formatting checks: overly long lines, excessive passive voice keywords, inconsistent dates
  function formattingIssues(text: string): string[] {
    const issues: string[] = [];
    if (text && text.length > 0) {
      const lines = text.split(/\n/);
      const longLines = lines.filter((l) => l.length > 180).length;
      if (longLines > 0) issues.push(`${longLines} long line(s) found — break into shorter bullet points.`);
      const passiveHits = (text.match(/\b(was|were|being|been|by)\b/gi) || []).length;
      if (passiveHits > 10) issues.push("Passive voice detected frequently — prefer active outcomes and verbs.");
      const dateYearHits = (text.match(/\b(19|20)\d{2}\b/g) || []).length;
      if (dateYearHits === 0) issues.push("No dates found — add year ranges to roles where applicable.");
    }
    return issues;
  }

  const formattingFindings = [
    ...formattingIssues(resumeText),
    ...formattingIssues(coverLetterText),
  ];

  let score = 0;
  score += hasTailoredResume ? 30 : 10;
  score += hasCoverLetter ? 20 : 5;
  score += hasLinkedIn ? 10 : 0;
  // Material alignment
  score += Math.min(20, Math.round((keywordAlignment / 100) * 20));
  score += Math.min(15, Math.round((experienceAlignment / 100) * 15));
  score += Math.min(5, achievements >= 3 ? 5 : achievements >= 1 ? 3 : 0);
  // Penalty for many missing keywords / formatting issues
  score -= Math.min(10, Math.floor(missingKeywords.length / 3));
  score -= Math.min(10, formattingFindings.length);
  score = Math.max(0, Math.min(100, score));

  const level = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs Work";

  const improvements: Array<{ text: string; priority: "high" | "medium" | "low" }> = [];
  if (!hasTailoredResume) improvements.push({ text: "Tailor your resume to this job by mirroring top requirements and using the job title in summary.", priority: "high" });
  if (!hasCoverLetter) improvements.push({ text: "Add a concise cover letter referencing the role at " + (company || "the company") + ".", priority: "high" });
  if (!hasLinkedIn) improvements.push({ text: "Add or update your LinkedIn profile link; ensure headline and About section reflect the role.", priority: "medium" });
  if (keywordAlignment < 70) improvements.push({ text: "Increase keywords alignment by matching skills in the posting.", priority: "high" });
  if (experienceAlignment < 70) improvements.push({ text: "Highlight directly relevant experience with quantified outcomes.", priority: "high" });
  if (achievements < 3) improvements.push({ text: "Add 3–5 quantified achievements aligned to the role.", priority: "medium" });
  for (const f of formattingFindings) improvements.push({ text: f, priority: "medium" });
  if (missingKeywords.length > 0) improvements.push({ text: `Add missing keywords: ${missingKeywords.join(", ")}`, priority: "high" });

  // Priority ranking: high first
  improvements.sort((a, b) => (a.priority === b.priority ? 0 : a.priority === "high" ? -1 : b.priority === "high" ? 1 : a.priority === "medium" ? -1 : 1));

  // Local tracking of score history per job
  const STORAGE_KEY = "jobs:application_quality_history";
  const [history, setHistory] = useState<Array<{ jobId: string; score: number; at: string }>>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || "[]";
      const arr = JSON.parse(raw) as Array<{ jobId: string; score: number; at: string }>;
      setHistory(arr.filter((h) => h.jobId === jobId));
    } catch {
      setHistory([]);
    }
  }, [jobId]);

  const averageScoreAll = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || "[]";
      const arr = JSON.parse(raw) as Array<{ jobId: string; score: number; at: string }>;
      if (arr.length === 0) return null;
      const avg = Math.round(arr.reduce((s, v) => s + v.score, 0) / arr.length);
      const top = Math.max(...arr.map((v) => v.score));
      return { avg, top };
    } catch { return null; }
  }, []);

  const recordCurrentScore = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || "[]";
      const arr = JSON.parse(raw) as Array<{ jobId: string; score: number; at: string }>;
      arr.push({ jobId, score, at: new Date().toISOString() });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      setHistory(arr.filter((h) => h.jobId === jobId));
    } catch {}
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Application Quality Scoring
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        AI-informed assessment of resume, cover letter, and LinkedIn alignment to this job. Shows missing keywords, formatting issues, and prioritized improvements.
      </Typography>

      <Card variant="outlined" sx={{ p: 1 }}>
        <CardContent sx={{ pb: 2 }}>
          <Typography variant="subtitle2">Job</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>{title || "—"} @ {company || "—"}</Typography>

          {/* AI Highlights: key features, skills, experiences */}
          {/* Always render AI Highlights block for visibility */}
          {true ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">AI Key Highlights</Typography>
              {aiHighlights.summary && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>{aiHighlights.summary}</Typography>
              )}
              {aiHighlights.keyFeatures && aiHighlights.keyFeatures.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">Key Features</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap", gap: 1 }}>
                    {aiHighlights.keyFeatures.slice(0, 10).map((f, i) => (
                      <Chip key={`f-${i}`} label={f} size="small" />
                    ))}
                  </Stack>
                </Box>
              )}
              {aiHighlights.keySkills && aiHighlights.keySkills.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">Key Skills</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap", gap: 1 }}>
                    {aiHighlights.keySkills.slice(0, 12).map((s, i) => (
                      <Chip key={`s-${i}`} label={s} size="small" />
                    ))}
                  </Stack>
                </Box>
              )}
              {aiHighlights.keyExperiences && aiHighlights.keyExperiences.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">Key Experiences</Typography>
                  <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                    {aiHighlights.keyExperiences.slice(0, 6).map((e, i) => (
                      <Typography key={`e-${i}`} variant="body2">• {e}</Typography>
                    ))}
                  </Stack>
                </Box>
              )}
              {(!aiHighlights.keyFeatures || aiHighlights.keyFeatures.length === 0) &&
                (!aiHighlights.keySkills || aiHighlights.keySkills.length === 0) &&
                (!aiHighlights.keyExperiences || aiHighlights.keyExperiences.length === 0) && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    No AI highlights yet for this job. They will appear once analysis completes.
                  </Alert>
              )}
            </Box>
          ) : null}

          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mb: 2, gap: 1 }}>
            <Chip label={`Score: ${score}/100`} size="small" color={score>=80?"success":score>=60?"warning":"default"} />
            <Chip label={`Level: ${level}`} size="small" />
            <Chip label={`Tailored resume: ${hasTailoredResume?"yes":"no"}`} size="small" />
            <Chip label={`Cover letter: ${hasCoverLetter?"yes":"no"}`} size="small" />
            <Chip label={`LinkedIn: ${hasLinkedIn?"yes":"no"}`} size="small" />
          </Stack>

          <Stack direction="row" spacing={3} sx={{ mb: 2, flexWrap: "wrap", rowGap: 1 }}>
            <FormControlLabel control={<Switch checked={!!flagForJob.tailoredResume} onChange={(e) => {
              const next = { ...flags, [jobId]: { ...flagForJob, tailoredResume: e.target.checked } };
              setFlags(next);
              try { localStorage.setItem(STORAGE_FLAGS, JSON.stringify(next)); } catch {}
            }} />} label="I tailored the resume for this job" />
            <FormControlLabel control={<Switch checked={!!flagForJob.coverLetter} onChange={(e) => {
              const next = { ...flags, [jobId]: { ...flagForJob, coverLetter: e.target.checked } };
              setFlags(next);
              try { localStorage.setItem(STORAGE_FLAGS, JSON.stringify(next)); } catch {}
            }} />} label="I wrote a cover letter" />
            <FormControlLabel control={<Switch checked={!!flagForJob.linkedIn} onChange={(e) => {
              const next = { ...flags, [jobId]: { ...flagForJob, linkedIn: e.target.checked } };
              setFlags(next);
              try { localStorage.setItem(STORAGE_FLAGS, JSON.stringify(next)); } catch {}
            }} />} label="LinkedIn profile ready" />
          </Stack>

          <Divider sx={{ my: 2 }} />
          {/* Submission gating threshold */}
          {score < 70 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Minimum score threshold (70) not met — improve materials before submitting.
            </Alert>
          )}

          {/* Missing keywords */}
          {missingKeywords.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Missing Keywords</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
                {missingKeywords.map((k, i) => (
                  <Chip key={i} label={k} size="small" />
                ))}
              </Stack>
            </Box>
          )}

          {/* Formatting issues */}
          {formattingFindings.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Formatting Issues</Typography>
              <Stack spacing={0.75} sx={{ mt: 1 }}>
                {formattingFindings.map((f, i) => (
                  <Typography key={i} variant="body2">• {f}</Typography>
                ))}
              </Stack>
            </Box>
          )}

          <Typography variant="subtitle2">Recommendations</Typography>
          {improvements.length === 0 ? (
            <Typography variant="body2">Looks great — your application materials are well-tailored.</Typography>
          ) : (
            <Stack spacing={0.75} sx={{ mt: 1 }}>
              {improvements.map((r, i) => (
                <Typography key={i} variant="body2">• [{r.priority}] {r.text}</Typography>
              ))}
            </Stack>
          )}

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2">Score History</Typography>
          {history.length === 0 ? (
            <Typography variant="body2">No previous scores recorded for this job.</Typography>
          ) : (
            <Stack spacing={0.75} sx={{ mt: 1 }}>
              {history.slice(-5).map((h, i) => (
                <Typography key={i} variant="body2">{new Date(h.at).toLocaleString()}: {h.score}/100</Typography>
              ))}
            </Stack>
          )}
          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
            <Button size="small" variant="outlined" onClick={recordCurrentScore}>Record current score</Button>
            {averageScoreAll && (
              <Chip label={`Your avg: ${averageScoreAll.avg}/100`} size="small" />
            )}
            {averageScoreAll && (
              <Chip label={`Your top: ${averageScoreAll.top}/100`} size="small" />
            )}
            {averageScoreAll && (
              <Chip
                label={`vs avg: ${(score / Math.max(1, averageScoreAll.avg)).toFixed(2)}× (${score >= averageScoreAll.avg ? "Above" : Math.abs(score - averageScoreAll.avg) <= 5 ? "Similar" : "Below"})`}
                size="small"
                color={score >= averageScoreAll.avg ? "success" : Math.abs(score - averageScoreAll.avg) <= 5 ? "warning" : "default"}
              />
            )}
            {averageScoreAll && (
              <Chip
                label={`vs top: ${(score / Math.max(1, averageScoreAll.top)).toFixed(2)}× (${score > averageScoreAll.top ? "New Best" : Math.abs(score - averageScoreAll.top) <= 5 ? "Near Best" : "Below Best"})`}
                size="small"
                color={score > averageScoreAll.top ? "success" : Math.abs(score - averageScoreAll.top) <= 5 ? "warning" : "default"}
              />
            )}
            {/* Open tailored resume in AI workspace */}
            <Button size="small" variant="contained" disabled={!hasTailoredResume} onClick={() => openTailoredResume(false)}>
              Open Tailored Resume
            </Button>
            <Button size="small" variant="outlined" disabled={!hasTailoredResume} onClick={() => openTailoredResume(true)}>
              Open in New Tab
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}