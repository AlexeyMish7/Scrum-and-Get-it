import  { useMemo, useState } from "react";
import { Box, Paper, Stack, Typography, IconButton } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useAuth } from "@shared/context/AuthContext";

type Format = "email" | "linkedin";

export default function QuickTemplates({
  contactName,
  format: controlledFormat,
}: {
  contactName?: string | null;
  format?: Format;
}) {
  const { user } = useAuth();
  const userName = (user?.user_metadata?.full_name || user?.email || "") as string;
  const [internalFormat] = useState<Format>("linkedin");
  const format = controlledFormat ?? internalFormat;

  const templates = useMemo(() => {
    const name = contactName || "there";

    const birthdayMessage = `Hi ${name},
Wishing you a very happy birthday — hope you have a wonderful day celebrating!\n\nBest, ${userName}`;

    const congratsMessage = `Hi ${name},
Congratulations on your recent achievement — that’s fantastic news! I’d love to hear more when you have a moment.\n\nBest, ${userName}`;

    const updateMessage = `Hi ${name},
I wanted to share a quick update: [your update here]. Would love to catch up when you have time.\n\nBest, ${userName}`;

    const makeEmail = (body: string, subject: string) => ({
      subject,
      body: body.replace(`Best, ${userName}`, `Best regards,\n${userName}`),
    });

    return {
      birthday: { linkedin: birthdayMessage, email: makeEmail(birthdayMessage, "Happy Birthday") },
      congratulations: { linkedin: congratsMessage, email: makeEmail(congratsMessage, "Congratulations") },
      update: { linkedin: updateMessage, email: makeEmail(updateMessage, "Quick update") },
    };
  }, [contactName, user?.user_metadata, user?.email]);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <Box>
      <Stack spacing={1}>

        <Paper sx={{ p: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2">Birthday</Typography>
            <IconButton size="small" onClick={() => {
              if (format === "linkedin") copy(templates.birthday.linkedin);
              else copy(`Subject: ${templates.birthday.email.subject}\n\n${templates.birthday.email.body}`);
            }}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
            {format === "linkedin" ? templates.birthday.linkedin : `Subject: ${templates.birthday.email.subject}\n\n${templates.birthday.email.body}`}
          </Typography>
        </Paper>

        <Paper sx={{ p: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2">Congratulations</Typography>
            <IconButton size="small" onClick={() => {
              if (format === "linkedin") copy(templates.congratulations.linkedin);
              else copy(`Subject: ${templates.congratulations.email.subject}\n\n${templates.congratulations.email.body}`);
            }}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
            {format === "linkedin" ? templates.congratulations.linkedin : `Subject: ${templates.congratulations.email.subject}\n\n${templates.congratulations.email.body}`}
          </Typography>
        </Paper>

        <Paper sx={{ p: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2">Quick Update</Typography>
            <IconButton size="small" onClick={() => {
              if (format === "linkedin") copy(templates.update.linkedin);
              else copy(`Subject: ${templates.update.email.subject}\n\n${templates.update.email.body}`);
            }}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
            {format === "linkedin" ? templates.update.linkedin : `Subject: ${templates.update.email.subject}\n\n${templates.update.email.body}`}
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
}
