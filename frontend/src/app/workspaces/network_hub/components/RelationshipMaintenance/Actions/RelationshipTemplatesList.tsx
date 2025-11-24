import { Box, Paper, Typography, Stack, IconButton} from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const TEMPLATES = {
    birthday: `Hi {{name}},
Happy Birthday! Wishing you a wonderful day filled with joy and a fantastic year ahead. Hope you get to celebrate in style! — {{sender}}`,
    congratulations: `Hi {{name}},
Congratulations on {{event}}! That's an incredible milestone — I'm really happy for you and would love to hear more about it.`,
    update: `Hi {{name}},
I wanted to share a quick update: {{update_text}}. If you have a moment I’d love to hear your thoughts.`,
};

export default function RelationshipTemplatesList({
    showCopyOnly,
}: {
    showCopyOnly?: boolean;
}) {
    function copy(text: string) {
        navigator.clipboard.writeText(text);
    }

    return (
        <Box>
            <Stack spacing={1}>
                <Paper sx={{ p: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2">Birthday</Typography>
                        <IconButton size="small" onClick={() => copy(TEMPLATES.birthday)}>
                            <ContentCopyIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{TEMPLATES.birthday}</Typography>
                </Paper>

                <Paper sx={{ p: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2">Congratulations</Typography>
                        <IconButton size="small" onClick={() => copy(TEMPLATES.congratulations)}>
                            <ContentCopyIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{TEMPLATES.congratulations}</Typography>
                </Paper>

                <Paper sx={{ p: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2">Quick Update</Typography>
                        <IconButton size="small" onClick={() => copy(TEMPLATES.update)}>
                            <ContentCopyIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{TEMPLATES.update}</Typography>
                </Paper>
            </Stack>
        </Box>
    );
}
