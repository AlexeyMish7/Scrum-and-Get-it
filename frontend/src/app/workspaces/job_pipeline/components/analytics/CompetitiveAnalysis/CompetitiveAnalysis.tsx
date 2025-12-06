import React, { useMemo, useState } from "react";
import { Box, Typography, Button, Card, CardContent, LinearProgress, Alert, Chip, Stack, Divider } from "@mui/material";
import { aiClient } from "@shared/services/ai/client";
import { useAuth } from "@shared/context/AuthContext";

interface CompetitiveAnalysisProps {
  job?: any | null;
  matchData?: any | null; // pass match analysis if available
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function CompetitiveAnalysis({ job, matchData }: CompetitiveAnalysisProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any | null>(null);

  // Heuristic estimates
  const estimates = useMemo(() => {
    const postingAgeDays = (() => {
      const d = (job?.created_at ?? job?.posted_at ?? job?.application_posted_at) ? new Date(job?.created_at ?? job?.posted_at ?? job?.application_posted_at) : null;
      if (!d || isNaN(d.getTime())) return null;
      return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    })();

    const platformFactor = (() => {
      const src = (job?.source ?? job?.platform ?? "").toString().toLowerCase();
      if (src.includes("linkedin") || src.includes("indeed") || src.includes("glassdoor")) return 1.3; // broad platforms → more applicants
      if (src.includes("company") || src.includes("careers")) return 1.0; // company site
      if (src.includes("referral") || src.includes("internal")) return 0.7; // narrower pool
      return 1.1;
    })();

    const sizeFactor = (() => {
      const size = (job?.company_size ?? "").toString();
      if (!size) return 1.0;
      if (typeof size === "string") {
        if (size.includes("1-50") || size.includes("<50")) return 0.9;
        if (size.includes("50-200") || size.includes("50-250")) return 1.0;
        if (size.includes("200-500") || size.includes("250-500")) return 1.1;
        if (size.includes("500+") || size.includes(">500")) return 1.25;
      }
      const n = Number(size);
      if (Number.isFinite(n)) {
        if (n < 50) return 0.9; if (n < 200) return 1.0; if (n < 500) return 1.1; return 1.25;
      }
      return 1.0;
    })();

    const baseApplicants = 50; // baseline
    const ageFactor = postingAgeDays == null ? 1.0 : clamp(1 + (postingAgeDays / 30) * 0.5, 0.8, 1.8);
    const estApplicants = Math.round(baseApplicants * ageFactor * platformFactor * sizeFactor);

    // Competitive score based on matchData if available
    const skillsScore = Number(matchData?.breakdown?.skills ?? 0);
    const expScore = Number(matchData?.breakdown?.experience ?? 0);
    const eduScore = Number(matchData?.breakdown?.education ?? 0);
    let competitiveScore = 0;
    if (matchData?.overallScore != null) {
      competitiveScore = clamp(Number(matchData.overallScore), 0, 100);
    } else {
      // weighted blend of breakdowns
      competitiveScore = clamp(0.5 * skillsScore + 0.4 * expScore + 0.1 * eduScore, 0, 100);
    }

    // Likelihood buckets
    const likelihood = competitiveScore >= 75 ? "high" : competitiveScore >= 50 ? "medium" : "low";
    const confidencePct = clamp(60 + (competitiveScore - 50) * 0.5, 40, 90);

    // Advantages / disadvantages
    const strengths: string[] = Array.isArray(matchData?.strengths) ? matchData.strengths.slice() : [];
    // Augment advantages from user's profile (skills, experience)
    const meta = (user?.user_metadata ?? {}) as any;
    let profileSkills: string[] = [];
    if (Array.isArray(meta.skills)) {
      profileSkills = meta.skills as string[];
    } else if (typeof meta.skills === "string") {
      profileSkills = String(meta.skills)
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (Array.isArray(meta.top_skills)) {
      profileSkills = meta.top_skills as string[];
    }
    const yearsExp = Number(meta.years_experience ?? meta.experience_years ?? 0) || 0;
    if (profileSkills.length) {
      for (const s of profileSkills) strengths.push(`Skill: ${String(s)}`);
    }
    if (yearsExp > 0) strengths.push(`${yearsExp}+ years of experience`);

    // Derive advantages from match breakdown if profile/match strengths are sparse
    if (skillsScore >= 50) strengths.push("Strong skills alignment to job requirements");
    if (expScore >= 50) strengths.push("Relevant experience level for this role");
    if (eduScore >= 50) strengths.push("Education meets or exceeds requirements");
    const gaps: string[] = Array.isArray(matchData?.skillsGaps) ? matchData.skillsGaps : [];

    // Differentiation strategies
    const strategies: string[] = [];
    if (likelihood !== "high") strategies.push("Secure a referral from current employee or alumni to bypass crowded funnel");
    strategies.push("Tailor resume bullets to mirror role’s top requirements with quantified outcomes");
    strategies.push("Open your cover letter with a role-specific impact statement tied to company goals");

    // Prioritization score prefers high competitiveScore with manageable applicants
    const priorityScore = clamp(competitiveScore * (100 / Math.max(estApplicants, 10)), 0, 100);

    return {
      postingAgeDays,
      estApplicants,
      competitiveScore,
      likelihood,
      confidencePct,
      strengths,
      gaps,
      strategies,
      priorityScore: Math.round(priorityScore),
    };
  }, [job, matchData]);

  const runAIEnrichment = async () => {
    setError(null);
    setAiResult(null);
    setLoading(true);
    try {
      // Build mentee data for server-required schema using user metadata

      const menteeDataPayload = {
        name: (user?.user_metadata as any)?.full_name ?? user?.email ?? "User",
        jobStats: {
          total: Number((user?.user_metadata as any)?.job_total ?? 0) || 0,
          applied: Number((user?.user_metadata as any)?.job_applied ?? 0) || 0,
          interviewing: Number((user?.user_metadata as any)?.job_interviewing ?? 0) || 0,
          offers: Number((user?.user_metadata as any)?.job_offers ?? 0) || 0,
          rejected: Number((user?.user_metadata as any)?.job_rejected ?? 0) || 0,
        },
        engagementLevel: ((user?.user_metadata as any)?.engagement_level as any) ?? "medium",
        lastActiveAt: (user?.user_metadata as any)?.last_active_at ?? new Date().toISOString(),
        goals: Array.isArray((user?.user_metadata as any)?.goals) ? (user?.user_metadata as any)?.goals : [],
        recentActivity: Array.isArray((user?.user_metadata as any)?.recent_activity) ? (user?.user_metadata as any)?.recent_activity : [],
        documentsCount: Number((user?.user_metadata as any)?.documents_count ?? 0) || 0,
      };

      const payload = {
        job: {
          title: job?.title ?? job?.job_title ?? null,
          company: job?.company_name ?? job?.company ?? null,
          industry: job?.industry ?? null,
          companySize: job?.company_size ?? null,
          jobLevel: job?.job_level ?? null,
          location: job?.location ?? null,
        },
        menteeData: menteeDataPayload,
        match: matchData ?? null,
        estimates,
      };
      // Use a generation route to get structured recommendations
      const res = await aiClient.postJson<any>("/api/generate/coaching-insights", payload);
      setAiResult(res);
    } catch (e: any) {
      // Surface 400 requirement error nicely
      const msg = e?.message ?? String(e);
      setError(msg.includes("MenteeData") ? "Your profile is missing required mentee data (skills/experience). Please add them in your profile settings and try again." : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Competitive Analysis
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Understand role competitiveness and your positioning, with estimated applicants, competitive score, interview likelihood, and strategies to stand out.
      </Typography>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2">Job</Typography>
          {(() => {
            const jobTitle = (job?.title ?? job?.job_title ?? "—") as string;
            const company = (job?.company_name ?? job?.company ?? "—") as string;
            // Default industry to Technology when missing
            const industry = ((job?.industry ?? "Technology") as string);
            return (
              <>
                <Typography variant="body2">{jobTitle} @ {company}</Typography>
                <Typography variant="body2" color="text.secondary">Industry: {industry}</Typography>
              </>
            );
          })()}
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2">Estimated Applicants</Typography>
          <Typography variant="body2">{estimates.estApplicants} applicants (posting age: {estimates.postingAgeDays ?? "n/a"} days)</Typography>

          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2">Competitive Score</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap" }}>
            <Chip label={`Score: ${Math.round(estimates.competitiveScore)}/100`} size="small" color={estimates.competitiveScore>=75?"success":estimates.competitiveScore>=50?"warning":"default"} />
            <Chip label={`Interview likelihood: ${estimates.likelihood}`} size="small" />
            <Chip label={`Confidence: ${Math.round(estimates.confidencePct)}%`} size="small" />
            <Chip label={`Priority: ${Math.round(estimates.priorityScore)}`} size="small" />
          </Stack>

          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2">Competitive Advantages</Typography>
          {estimates.strengths?.length ? (
            <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap" }}>
              {estimates.strengths.map((s, i) => (<Chip key={i} label={s} size="small" color="success" />))}
            </Stack>
          ) : (
            <Typography variant="body2">No explicit advantages detected. Emphasize quantifiable outcomes aligned to role requirements.</Typography>
          )}

          {(() => {
            const meta = (user?.user_metadata ?? {}) as any;
            // Normalize skills from profile (array or comma-separated string)
            let profileSkills: string[] = [];
            if (Array.isArray(meta.skills)) profileSkills = meta.skills as string[];
            else if (typeof meta.skills === "string") profileSkills = String(meta.skills).split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
            else if (Array.isArray(meta.top_skills)) profileSkills = meta.top_skills as string[];
            const yearsExp = Number(meta.years_experience ?? meta.experience_years ?? 0) || 0;

            if (!profileSkills.length && yearsExp <= 0) return null;
            return (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">From Your Profile</Typography>
                {profileSkills.length > 0 && (
                  <>
                    <Typography variant="body2" color="text.secondary">Skills</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap" }}>
                      {profileSkills.map((s: string, i: number) => (
                        <Chip key={i} label={s} size="small" />
                      ))}
                    </Stack>
                  </>
                )}
                {yearsExp > 0 && (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>Experience: {yearsExp}+ years</Typography>
                )}
              </Box>
            );
          })()}

          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2">Competitive Disadvantages & Mitigation</Typography>
          {estimates.gaps?.length ? (
            <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap" }}>
              {estimates.gaps.map((g, i) => (<Chip key={i} label={g} size="small" color="warning" />))}
            </Stack>
          ) : (
            <Typography variant="body2">No major disadvantages identified.</Typography>
          )}
          <Typography variant="body2" component="div" sx={{ mt: 1 }}>
            {estimates.strategies.map((st, i) => (<Typography key={i} variant="body2" component="div">• {st}</Typography>))}
          </Typography>
        </CardContent>
      </Card>

      {/* Profile vs Typical Hired Candidate Comparison */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2">Profile Comparison</Typography>
          {(() => {
            const meta = (user?.user_metadata ?? {}) as any;
            // Normalize user's skills
            let userSkills: string[] = [];
            if (Array.isArray(meta.skills)) userSkills = meta.skills as string[];
            else if (typeof meta.skills === "string") userSkills = String(meta.skills).split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
            else if (Array.isArray(meta.top_skills)) userSkills = meta.top_skills as string[];

            const userYears = Number(meta.years_experience ?? meta.experience_years ?? 0) || 0;
            const userEducation = String(meta.education ?? meta.highest_education ?? "").trim();
            const userCerts: string[] = Array.isArray(meta.certifications) ? meta.certifications : [];

            // Example typical hired candidate profile (can be refined per role/industry)
            const typical = {
              requiredSkills: ["React", "TypeScript", "Node.js", "SQL"],
              preferredSkills: ["AWS", "Docker", "CI/CD"],
              minYears: 3,
              targetYears: 5,
              education: "Bachelor's in CS or related",
              certifications: ["AWS Cloud Practitioner", "Scrum Master"],
            };

            const overlapReq = userSkills.filter((s) => typical.requiredSkills.includes(s));
            const overlapPref = userSkills.filter((s) => typical.preferredSkills.includes(s));
            const skillsCoveragePct = Math.round((overlapReq.length / typical.requiredSkills.length) * 100);
            const yearsStatus = userYears >= typical.targetYears ? "meets/exceeds" : userYears >= typical.minYears ? "close" : "below";
            const eduMatch = userEducation ? (userEducation.toLowerCase().includes("bachelor") ? "likely match" : "unclear") : "missing";
            const certOverlap = userCerts.filter((c) => typical.certifications.includes(c));

            return (
              <Box sx={{ mt: 1 }}>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  {skillsCoveragePct > 0 && (
                    <Chip label={`Required skills coverage: ${skillsCoveragePct}%`} size="small" color={skillsCoveragePct>=75?"success":skillsCoveragePct>=50?"warning":"default"} />
                  )}
                  {overlapPref.length > 0 && (
                    <Chip label={`Preferred skills overlap: ${overlapPref.length}`} size="small" />
                  )}
                  {userYears > 0 && (
                    <Chip label={`Experience: ${userYears} yrs (${yearsStatus})`} size="small" />
                  )}
                  {eduMatch !== "missing" && (
                    <Chip label={`Education: ${eduMatch}`} size="small" />
                  )}
                  {certOverlap.length > 0 && (
                    <Chip label={`Certifications match: ${certOverlap.length}`} size="small" />
                  )}
                </Stack>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">Gaps vs typical</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap" }}>
                    {typical.requiredSkills.filter((s) => !userSkills.includes(s)).map((s, i) => (
                      <Chip key={i} label={`Add: ${s}`} size="small" color="warning" />
                    ))}
                    {typical.preferredSkills.filter((s) => !userSkills.includes(s)).slice(0,3).map((s, i) => (
                      <Chip key={i} label={`Bonus: ${s}`} size="small" />
                    ))}
                  </Stack>
                </Box>
                {certOverlap.length === 0 && userCerts.length > 0 && (
                  <Typography variant="body2" sx={{ mt: 1 }}>Consider certifications like {typical.certifications.join(", ")}</Typography>
                )}
              </Box>
            );
          })()}
        </CardContent>
      </Card>

      <Box sx={{ mb: 2 }}>
        <Button variant="contained" onClick={runAIEnrichment} disabled={loading}>Enrich with AI</Button>
      </Box>

      {loading && (
        <Box sx={{ width: "100%", mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary">Running analysis…</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {aiResult && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2">AI Insights</Typography>
          {typeof aiResult === 'object' && (aiResult.summary || aiResult.recommendations || aiResult.focusAreas || aiResult.suggestedGoals) ? (
            <Box sx={{ mt: 1 }}>
              {aiResult.summary && (
                <Card variant="outlined" sx={{ mb: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle2">Summary</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{String(aiResult.summary)}</Typography>
                  </CardContent>
                </Card>
              )}

              {Array.isArray(aiResult.recommendations) && aiResult.recommendations.length > 0 && (
                <Card variant="outlined" sx={{ mb: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle2">Recommendations</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {aiResult.recommendations.map((r: string, i: number) => (
                        <Typography key={i} variant="body2">• {r}</Typography>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {Array.isArray(aiResult.focusAreas) && aiResult.focusAreas.length > 0 && (
                <Card variant="outlined" sx={{ mb: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle2">Focus Areas</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {aiResult.focusAreas.map((f: any, i: number) => (
                        <Typography key={i} variant="body2">• {f.area} ({f.priority}) — {f.suggestion}</Typography>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {Array.isArray(aiResult.suggestedGoals) && aiResult.suggestedGoals.length > 0 && (
                <Card variant="outlined" sx={{ mb: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle2">Suggested Goals</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {aiResult.suggestedGoals.map((g: any, i: number) => (
                        <Typography key={i} variant="body2">• {g.title} ({g.type}) — {g.reason}</Typography>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {Array.isArray(aiResult.actionPlan) && aiResult.actionPlan.length > 0 && (
                <Card variant="outlined" sx={{ mb: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle2">Action Plan</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {aiResult.actionPlan.map((p: any, i: number) => (
                        <Typography key={i} variant="body2">Week {p.week}: {Array.isArray(p.actions) ? p.actions.join(', ') : ''}</Typography>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {aiResult.motivationalNote && (
                <Card variant="outlined" sx={{ mb: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle2">Note</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{String(aiResult.motivationalNote)}</Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          ) : (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
              {String(aiResult).replace(/<[^>]+>/g, '')}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
