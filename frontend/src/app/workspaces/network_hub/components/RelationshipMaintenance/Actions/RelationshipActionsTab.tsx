import { useState } from "react";
import { Box, Button, Typography, Paper, Stack, IconButton } from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import QuickTemplates from "./QuickTemplates";
import RelationshipStrengthActivities from "./RelationshipStrengthActivities";
import aiClient from "@shared/services/ai/client";
import { useAuth } from "@shared/context/AuthContext";

type ContactRow = {
    id?: string;
    first_name?: string | null;
    last_name?: string | null;
    company?: string | null;
    industry?: string | null;
    relationship_strength?: number | null;
    personal_notes?: string | null;
    professional_notes?: string | null;
};

export default function RelationshipActionsTab({ contact, onRefresh }: { contact?: ContactRow | null; onRefresh?: () => void }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [outreach, setOutreach] = useState<string[]>([]);
    const [templateFormat, setTemplateFormat] = useState<'email' | 'linkedin'>('linkedin');
    // selectedIndex intentionally omitted for now

    const name = `${contact?.first_name ?? ""} ${contact?.last_name ?? ""}`.trim();

    // Activity suggestions are rendered by <RelationshipStrengthActivities />

    async function generateOutreach() {
        setLoading(true);
        setOutreach([]);

        // Attempt server-side AI via aiClient (adds auth headers)
        try {
            const payload = {
                name,
                company: contact?.company,
                industry: contact?.industry,
                personal_notes: contact?.personal_notes,
                professional_notes: contact?.professional_notes,
                relationship_strength: contact?.relationship_strength,
            };

            const resp = await aiClient.postJson<{ suggestions: Array<{ message: string; tone?: string; rationale?: string }> }>(
                "/api/generate/relationship",
                payload,
                user?.id
            );

            if (resp && Array.isArray(resp.suggestions) && resp.suggestions.length > 0) {
                const messages = resp.suggestions.map((s) => s?.message ?? String(s));
                setOutreach(messages.slice(0, 5));
                setLoading(false);
                // notify parent that generation happened so it can refresh if desired
                try { onRefresh?.(); } catch {};
                return;
            }
        } catch (err) {
            // ignore and fallback to heuristic generation
            console.warn("Relationship AI generation failed:", err);
        }

        // Fallback heuristic generation
        const heuristics = [] as string[];
        const shortName = contact?.first_name ?? "there";
        if (contact?.personal_notes) {
            heuristics.push(`Hi ${shortName}, I came across something that reminded me of what you mentioned before: ${contact.personal_notes}. Would love to hear any updates when you have a moment.`);
        }
        if (contact?.professional_notes) {
            heuristics.push(`Hi ${shortName}, I enjoyed reading about ${contact.professional_notes}. If you're open, I'd love to hear more about how that project went and whether there's any way I can help.`);
        }
        heuristics.push(`Hi ${shortName}, hope you're well! I saw something in ${contact?.industry ?? "your field"} that I thought you'd find interesting — can I send it over?`);
        heuristics.push(`Hi ${shortName}, it's been a while — would you be open to a quick virtual coffee to catch up on what you're working on at ${contact?.company ?? "your company"}?`);

        setOutreach(heuristics);
        setLoading(false);
    }

    function copyText(text: string) {
        navigator.clipboard.writeText(text);
    }

    if (!contact) return null;

    return (
        <Box>
            <Stack spacing={2}>
                <Paper sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Personalized Outreach</Typography>
                        <Box>
                            <Button variant="contained" onClick={generateOutreach} disabled={loading}>
                                {loading ? "Generating…" : "Generate Suggestions"}
                            </Button>
                        </Box>
                    </Stack>

                    <Box sx={{ mt: 2 }}>
                        {outreach.length === 0 ? (
                            <Typography color="text.secondary">No suggestions yet. Click Generate Suggestions to create personalized outreach messages.</Typography>
                        ) : (
                            outreach.map((s, i) => (
                                <Paper key={i} sx={{ p: 2, mb: 1 }}>
                                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                                        <Box sx={{ pr: 1, flex: 1 }}>
                                            <Typography variant="body2">{s}</Typography>
                                        </Box>
                                        <Stack>
                                            <IconButton size="small" onClick={() => { copyText(s); }} title="Copy">
                                                <ContentCopyIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </Stack>
                                </Paper>
                            ))
                        )}
                    </Box>
                </Paper>

                <RelationshipStrengthActivities relationshipStrength={contact?.relationship_strength} contactName={name} company={contact?.company} industry={contact?.industry} />

                <Paper sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Quick Templates</Typography>
                        <Box>
                            <Button variant={templateFormat === 'linkedin' ? 'contained' : 'outlined'} onClick={() => setTemplateFormat('linkedin')}>LinkedIn</Button>
                            <Button sx={{ ml: 1 }} variant={templateFormat === 'email' ? 'contained' : 'outlined'} onClick={() => setTemplateFormat('email')}>Email</Button>
                        </Box>
                    </Stack>
                    <Box sx={{ mt: 1 }}>
                        <QuickTemplates contactName={name} format={templateFormat} />
                    </Box>
                </Paper>
            </Stack>
        </Box>
    );
}
