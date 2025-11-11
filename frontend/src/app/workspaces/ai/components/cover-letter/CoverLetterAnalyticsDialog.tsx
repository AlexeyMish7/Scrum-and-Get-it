import React from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  Box,
} from "@mui/material";
import analytics from "@workspaces/ai/hooks/useCoverLetterAnalytics";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CoverLetterAnalyticsDialog({ open, onClose }: Props) {
  const overall = analytics.getOverallStats();
  const byTemplate = analytics.getTemplateStats();
  const abSummary = analytics.getABTestSummary();

  const handleExport = () => {
    const payload = analytics.exportReportsJSON();
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-reports-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Cover Letter Performance</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Box>
            <Typography variant="subtitle2">Overview</Typography>
            <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
              <Typography variant="body2">Total Sent: {overall.sent}</Typography>
              <Typography variant="body2">
                Responses: {overall.responses} ({Math.round(overall.responseRate * 100)}%)
              </Typography>
              <Typography variant="body2">
                Interviews: {overall.interviews} ({Math.round(overall.interviewRate * 100)}%)
              </Typography>
              <Typography variant="body2">
                Offers: {overall.offers} ({Math.round(overall.offerRate * 100)}%)
              </Typography>
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2">By Template</Typography>
            <Table size="small" sx={{ mt: 1 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Template</TableCell>
                  <TableCell align="right">Sent</TableCell>
                  <TableCell align="right">Responses</TableCell>
                  <TableCell align="right">Interviews</TableCell>
                  <TableCell align="right">Offers</TableCell>
                  <TableCell align="right">Response %</TableCell>
                  <TableCell align="right">Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {byTemplate.map((t) => (
                  <TableRow key={t.templateId}>
                    <TableCell>{t.templateId}</TableCell>
                    <TableCell align="right">{t.sent}</TableCell>
                    <TableCell align="right">{t.responses}</TableCell>
                    <TableCell align="right">{t.interviews}</TableCell>
                    <TableCell align="right">{t.offers}</TableCell>
                    <TableCell align="right">{Math.round(t.responseRate * 100)}%</TableCell>
                    <TableCell align="right">{t.score.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2">A/B Test Summary</Typography>
            <Table size="small" sx={{ mt: 1 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Group</TableCell>
                  <TableCell align="right">Sent</TableCell>
                  <TableCell align="right">Responses</TableCell>
                  <TableCell align="right">Response %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {abSummary.map((g) => (
                  <TableRow key={g.group}>
                    <TableCell>{g.group}</TableCell>
                    <TableCell align="right">{g.sent}</TableCell>
                    <TableCell align="right">{g.responses}</TableCell>
                    <TableCell align="right">{Math.round(g.responseRate * 100)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Recommendations: Use the template with the highest score above; consider A/B testing changes to the opening paragraph and subject lines for further improvements.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleExport}>Export Reports (JSON)</Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
