import { useMemo } from "react";
import { Box, Paper, Stack, Typography, IconButton } from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

type Props = {
  relationshipStrength?: number | null;
  contactName?: string | null;
  company?: string | null;
  industry?: string | null;
};

export default function RelationshipStrengthActivities({ relationshipStrength, contactName, company, industry }: Props) {
  // Normalize incoming strength into a 0-10 scale when possible.
  // Some users store 0-10, others 0-100. We detect and normalize accordingly.
  const normalized = useMemo(() => {
    const raw = Number(relationshipStrength ?? 0);
    if (Number.isNaN(raw)) return 0;
    // If the raw value looks like 0-10 scale (<= 10), use as-is (clamped)
    if (raw <= 10) return Math.max(0, Math.min(10, raw));
    // Otherwise assume 0-100 and convert to 0-10 float
    const clamped = Math.max(0, Math.min(100, raw));
    return Number((clamped / 10).toFixed(1));
  }, [relationshipStrength]);

  const label = useMemo(() => {
    if (normalized >= 9) return "Very strong relationship — you're close.";
    if (normalized > 6) return "Strong relationship — maintain with personal touches.";
    if (normalized > 3) return "Moderate relationship — engage with value and brief catch-ups.";
    if (normalized >= 0) return "Not close — prefer short, polite emails to reintroduce yourself.";
    return "Not close — prefer short, polite emails to reintroduce yourself.";
  }, [normalized]);

  const suggestions = useMemo(() => {
    // Apply groups: 0-3, >3-6, >6-8, >=9 (we treat 8-9 as part of >6-8)
    if (normalized >= 9) {
      return [
        `Invite ${contactName ?? 'them'} to a coffee or virtual catch-up to stay connected.`,
        `Ask for a warm introduction to someone in their network who aligns with your goals.`,
        `Send a short, personal note celebrating a recent accomplishment of theirs.`,
      ];
    }
    if (normalized > 6) {
      return [
        `Share a relevant article or resource and ask for their opinion.`,
        `Request a short catch-up to learn about what they're working on.`,
        `Engage with their recent post and add a thoughtful comment.`,
      ];
    }
    if (normalized > 3) {
      return [
        `Send a short LinkedIn message mentioning a shared interest and ask for a quick catch-up.`,
        `Share a helpful resource and ask whether they'd like to discuss it.`,
        `Comment on a recent update of theirs to start a light conversation.`,
      ];
    }

    // normalized <= 3
    return [
      `Send a short email re-introducing yourself and the context of your connection.`,
      `Offer a small piece of value (article, intro) and ask if they'd like to hear more.`,
      `Keep the message brief and end with a clear, low-friction next step (e.g., "If you're open, can I send a quick note?").`,
    ];
  }, [normalized, contactName]);

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">Relationship Strength — Activity Suggestions</Typography>
      <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>{label} (score: {normalized})</Typography>

      <Box sx={{ mt: 1 }}>
        {suggestions.map((s, i) => (
          <Paper key={i} sx={{ p: 1, mb: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">{s}</Typography>
              <IconButton size="small" onClick={() => copyText(s)}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Paper>
        ))}
      </Box>
    </Paper>
  );
}
