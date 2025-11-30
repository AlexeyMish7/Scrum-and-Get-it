import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Slider,
} from "@mui/material";
import aiClient from "@shared/services/ai/client";
import { useAuth } from "@shared/context/AuthContext";
import profileService from "@profile/services/profileService";
import employmentService from "@profile/services/employment";
import educationService from "@profile/services/education";

type NegotiationRecord = {
  id: string;
  role: string;
  location: string;
  offeredSalary?: number | null;
  counterOffer?: number | null;
  acceptedSalary?: number | null;
  notes?: string;
  createdAt: string;
};

const STORAGE_KEY = "sgt:salary_negotiations";

function uid(prefix = "sn") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function SalaryPrep() {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [offeredSalary, setOfferedSalary] = useState<number | "">("");
  const [targetSalary, setTargetSalary] = useState<number | "">("");
  const [marketData, setMarketData] = useState<{ min: number; med: number; max: number } | null>(null);
  const [talkingPoints, setTalkingPoints] = useState<string[]>([]);
  const [scripts, setScripts] = useState<Record<string, string>>({});
  const [outcomes, setOutcomes] = useState<NegotiationRecord[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as NegotiationRecord[]) : [];
    } catch {
      return [];
    }
  });

  const { user } = useAuth();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(outcomes));
    } catch {}
  }, [outcomes]);

  async function generateMarket(roleIn: string, locIn: string) {
    setMarketData(null);
    try {
      const payload = { role: roleIn, location: locIn } as any;
      const res = await aiClient.postJson("/api/generate/salary-research", payload).catch(() => null);
      if (res && (res as any).range) {
        const r = (res as any).range;
        setMarketData({ min: Number(r.min) || 0, med: Number(r.median) || 0, max: Number(r.max) || 0 });
        return;
      }
    } catch (e) {
      // ignore
    }
    // fallback: crude heuristic based on role keywords and location
    const base = inferBaseFromRole(roleIn);
    const locality = /san francisco|sf|bay area|san jose|silicon valley/i.test(locIn) ? 1.4 : /new york|nyc/i.test(locIn) ? 1.25 : 1.0;
    const min = Math.round(base * 0.8 * locality);
    const med = Math.round(base * locality);
    const max = Math.round(base * 1.3 * locality);
    setMarketData({ min, med, max });
  }

  function inferBaseFromRole(r: string) {
    const s = (r || "").toLowerCase();
    if (/senior|sr|lead|principal/.test(s)) return 160000;
    if (/engineer|developer|software/.test(s)) return 120000;
    if (/product manager|pm/.test(s)) return 125000;
    if (/designer|ux|ui/.test(s)) return 100000;
    if (/data scientist|data engineer/.test(s)) return 130000;
    if (/manager|director/.test(s)) return 140000;
    return 90000;
  }

  async function generateTalkingPoints() {
    setTalkingPoints([]);
    try {
      // If user is signed in, include profile + employment history to personalize talking points
      let profile: any = null;
      let employment: any[] = [];
      try {
        if (user && user.id) {
          profile = await profileService.getProfile(user.id).catch(() => null);
          employment = (await employmentService.listEmployment(user.id).catch(() => null)) || [];
        }
      } catch {}

      const payload: any = { role, location, offeredSalary, targetSalary };
      if (profile) payload.profile = profile;
      if (employment) payload.employment = employment;
      try {
        const edu = (await educationService.listEducation(user.id).catch(() => null)) || null;
        if (edu && (edu as any).data) payload.education = (edu as any).data;
      } catch {}

      const res = await aiClient.postJson("/api/generate/salary_talking_points", payload).catch(() => null);
      if (res && Array.isArray((res as any).points)) {
        setTalkingPoints((res as any).points.map((p: any) => String(p)));
        return;
      }
    } catch (e) {
      console.debug("AI talking points generation failed", e);
    }

    // fallback suggestions that try to leverage profile/employment text
    const pts = [] as string[];
    try {
      let profile: any = null;
      let employment: any[] = [];
      if (user && user.id) {
        profile = await profileService.getProfile(user.id).catch(() => null);
        employment = (await employmentService.listEmployment(user.id).catch(() => [])) || [];
      }

      if (employment && employment.length) {
        // pull up to 3 strong achievements from job_description fields if present
        let found = 0;
        for (const emp of employment) {
          if (emp.job_description && found < 3) {
            const txt = String(emp.job_description).split(/\n+/).map(s=>s.trim()).filter(Boolean)[0];
            if (txt) {
              pts.push(`From ${emp.job_title} at ${emp.company_name}: ${txt}`);
              found++;
            }
          }
        }
      }

      // include GPA from education if available
      try {
        if (!pts.length && user && user.id) {
          const ed = await educationService.listEducation(user.id).catch(() => null);
          if (ed && (ed as any).data && Array.isArray((ed as any).data) && (ed as any).data.length) {
            const first = (ed as any).data[0];
            if (first && first.gpa && !first.gpaPrivate) {
              pts.unshift(`Academic credentials: ${first.degree} from ${first.institution} with GPA ${first.gpa}`);
            }
          }
        }
      } catch {}

      if (profile && profile.bio && pts.length < 4) {
        pts.push(`Profile summary: ${String(profile.bio).slice(0, 220)}${String(profile.bio).length > 220 ? '...' : ''}`);
      }

      // generic points
      if (!pts.length) pts.push(`Highlight recent measurable impact (revenue, cost savings, efficiency) with specific numbers where possible.`);
      pts.push(`Reference market data: median for ${role || 'this role'} in ${location || 'your area'} is ${marketData ? `$${marketData.med.toLocaleString()}` : 'market rate'}.`);
      pts.push(`Frame the ask around total compensation and growth, and propose concrete alternatives (bonus, RSUs, signing bonus) if base can't move.`);
    } catch (e) {
      pts.push(`Highlight recent measurable impact and link to market data to justify your ask.`);
      pts.push(`Frame the conversation around total compensation and provide clear alternatives.`);
    }

    setTalkingPoints(pts);
  }

  function saveOutcome() {
    const rec: NegotiationRecord = {
      id: uid(),
      role,
      location,
      offeredSalary: offeredSalary === "" ? null : Number(offeredSalary),
      counterOffer: targetSalary === "" ? null : Number(targetSalary),
      acceptedSalary: null,
      notes: "",
      createdAt: new Date().toISOString(),
    };
    setOutcomes((s) => [rec, ...s]);
  }

  function recordAccepted(id: string, accepted: number) {
    setOutcomes((cur) => cur.map((o) => (o.id === id ? { ...o, acceptedSalary: accepted } : o)));
  }

  function renderTotalCompFramework() {
    return (
      <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
        <Typography variant="subtitle1">Total Compensation Framework</Typography>
        <Typography variant="body2">Break down offers into:</Typography>
        <List>
          <ListItem disableGutters>
            <ListItemText primary="Base salary" secondary="Guaranteed annual base pay" />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText primary="Bonus / performance" secondary="Target annual bonus or commission" />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText primary="Equity / RSUs" secondary="Value, vesting schedule, and refresh expectations" />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText primary="Benefits & perks" secondary="Healthcare, retirement match, PTO, relocation, signing bonus" />
          </ListItem>
        </List>
      </Box>
    );
  }

  // derived values
  const offerPosition = (() => {
    try {
      if (!marketData || !offeredSalary) return 0;
      const range = marketData.max - marketData.min;
      if (!range) return 0;
      const pct = ((Number(offeredSalary) - marketData.min) / range) * 100;
      return Math.max(0, Math.min(100, Math.round(pct)));
    } catch {
      return 0;
    }
  })();

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Salary Negotiation Prep</Typography>

      <Stack spacing={2} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
          <TextField label="Role / Title" value={role} onChange={(e) => setRole(e.target.value)} sx={{ minWidth: 300 }} />
          <TextField label="Location (city / remote)" value={location} onChange={(e) => setLocation(e.target.value)} sx={{ minWidth: 220 }} />
          <TextField label="Offered salary (USD)" type="number" value={offeredSalary as any} onChange={(e) => setOfferedSalary(e.target.value === '' ? '' : Number(e.target.value))} sx={{ width: 180 }} />
          <TextField label="Target / Counter (USD)" type="number" value={targetSalary as any} onChange={(e) => setTargetSalary(e.target.value === '' ? '' : Number(e.target.value))} sx={{ width: 180 }} />
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={() => generateMarket(role, location)}>Get market data</Button>
          <Button variant="outlined" onClick={generateTalkingPoints}>Generate talking points</Button>
          <Button onClick={saveOutcome}>Save negotiation draft</Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1">Market salary data</Typography>
            {marketData ? (
              <Box>
                <Typography>Range: ${marketData.min.toLocaleString()} — ${marketData.max.toLocaleString()}</Typography>
                <Typography>Median: ${marketData.med.toLocaleString()}</Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">Where does your offer sit?</Typography>
                  <Slider value={offerPosition} aria-label="offer-position" min={0} max={100} />
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">No market data yet — click Get market data.</Typography>
            )}
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1">Talking points</Typography>
            {talkingPoints.length ? (
              <List>
                {talkingPoints.map((p, i) => (
                  <ListItem key={i} disableGutters>
                    <ListItemText primary={`• ${p}`} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">Generate talking points to see suggestions.</Typography>
            )}
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            {renderTotalCompFramework()}
          </Paper>
        </Box>

        <Box sx={{ width: 360 }}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1">Scripts & Scenarios</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Scenario: Counteroffer request
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              "Thank you — I’m excited about the role. Based on my research and recent contributions (X, Y), I’d like to discuss a base salary of ${targetSalary || 'XXX,XXX'} or a structured increase in total comp. Could we explore options to bridge the gap?"
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2">Timing strategies</Typography>
            <List>
              <ListItem disableGutters>
                <ListItemText primary="Ask about salary once you have an offer or strong signal; avoid early-stage salary talk unless prompted" />
              </ListItem>
              <ListItem disableGutters>
                <ListItemText primary="Frame the conversation around total comp and growth rather than just base pay" />
              </ListItem>
            </List>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2">Confidence exercises</Typography>
            <List>
              <ListItem disableGutters>
                <ListItemText primary="Role-play the ask with a friend for 10 minutes" />
              </ListItem>
              <ListItem disableGutters>
                <ListItemText primary="Practice a 30-second elevator pitch of your top 3 impacts" />
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">Recent negotiations</Typography>
            <List>
              {outcomes.map((o) => (
                <ListItem key={o.id} disableGutters sx={{ py: 1 }}>
                  <ListItemText primary={`${o.role} • ${o.location}`} secondary={`Offered: ${o.offeredSalary ? `$${o.offeredSalary}` : 'N/A'} • Target: ${o.counterOffer ? `$${o.counterOffer}` : 'N/A'} • Accepted: ${o.acceptedSalary ? `$${o.acceptedSalary}` : '-'}`} />
                  <Box sx={{ ml: 1 }}>
                    <Button size="small" onClick={() => recordAccepted(o.id, (o.counterOffer || o.offeredSalary || 0))}>Mark accepted</Button>
                  </Box>
                </ListItem>
              ))}
              {!outcomes.length ? <Typography variant="body2" color="text.secondary">No saved negotiations yet.</Typography> : null}
            </List>
          </Paper>
        </Box>
      </Stack>
    </Box>
  );
}
