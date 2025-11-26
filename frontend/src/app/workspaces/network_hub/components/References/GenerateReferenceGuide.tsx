import React, {useState } from "react";
import { Box, Button, Typography, TextField, CircularProgress, Paper } from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import profileService from "@profile/services/profileService";
import skillsService from "@profile/services/skills";

type Props = {
    contact: Record<string, any>;
    job?: Record<string, any> | null;
};

const GenerateReferenceGuide: React.FC<Props> = ({ contact, job }) => {
    const { user, session } = useAuth();
    const [loading, setLoading] = useState(false);
    const [guide, setGuide] = useState<string | null>(null);
    const [talkingPoints, setTalkingPoints] = useState<string[] | null>(null);
    const [notes, setNotes] = useState<string>("");

    const handleGenerate = async () => {
        if (!user) return;
        setLoading(true);
            try {
                // Fetch user profile and skills to provide context
                const profileRes = await profileService.getProfile(user.id);
                const skillsRes = await skillsService.listSkills(user.id);

                // Build job descriptions array (try common fields, fall back to JSON)
                const jobDescriptions: string[] = [];
                if (job) {
                    const jd = job.description ?? job.job_description ?? job.content ?? JSON.stringify(job);
                    jobDescriptions.push(jd);
                }

                const skills = (skillsRes?.data ?? []).map((s: any) => s?.name ?? s);

                const body = {
                    job_descriptions: jobDescriptions,
                    skills,
                    notes: notes || null,
                    contact_name: contact?.name ?? contact?.full_name ?? null,
                    // include profile for possible future use, but primary fields above are used by the endpoint
                    profile: profileRes ?? null,
                };

                const apiBase = (import.meta as any).env?.VITE_API_BASE || `http://localhost:8787`;
                const url = `${apiBase.replace(/\/$/, "")}/api/generate/reference-points`;
                console.debug("GenerateReferenceGuide: POST", url, body);

                const resp = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session?.access_token ?? ""}`,
                    },
                    body: JSON.stringify(body),
                });

                if (!resp.ok) {
                    const text = await resp.text();
                    throw new Error(`HTTP ${resp.status}: ${text || "Server error"}`);
                }

                const json = await resp.json();
                // Expect server to return { guide: string, talking_points: string[] }
                if (json?.guide) setGuide(String(json.guide));
                else if (json?.data?.guide) setGuide(String(json.data.guide));
                else setGuide(JSON.stringify(json, null, 2));

                if (Array.isArray(json?.talking_points)) setTalkingPoints(json.talking_points.map((p: any) => String(p)));
                else if (Array.isArray(json?.data?.talking_points)) setTalkingPoints(json.data.talking_points.map((p: any) => String(p)));
                else setTalkingPoints(null);
            } catch (err: any) {
                console.error("GenerateReferenceGuide failed", err);
                setGuide(`Error: ${err?.message ?? String(err)}`);
                setTalkingPoints(null);
            } finally {
                setLoading(false);
            }
    };

    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Generate Reference Guide</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Use AI to generate a short guide and talking points for your reference contact. The generation will use the selected job and your skills.
            </Typography>

            <TextField
                label="Optional notes for the guide"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                multiline
                minRows={2}
                sx={{ mb: 2 }}
            />

            <Box display="flex" gap={2} alignItems="center" sx={{ mb: 2 }}>
                <Button variant="contained" onClick={handleGenerate} disabled={loading}>
                    {loading ? <CircularProgress size={18} /> : "Generate Guide"}
                </Button>
            </Box>

            {guide && (
                <Paper sx={{ p: 2, whiteSpace: "pre-wrap" }} elevation={1}>
                    <Typography variant="subtitle1">Generated Guide</Typography>
                    <Typography variant="body2">{guide}</Typography>
                    {talkingPoints && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="subtitle2">Talking Points</Typography>
                            {talkingPoints.map((p, idx) => (
                                <Typography key={idx} variant="body2">• {p}</Typography>
                            ))}
                        </Box>
                    )}
                </Paper>
            )}
        </Box>
    );
};

export default GenerateReferenceGuide;
//This is where we will generate a reference guide that the user can send to the contact to guide them on talking points 
//Use AI to generate this, it must read the job description to generate relevant talking points for the reference.


