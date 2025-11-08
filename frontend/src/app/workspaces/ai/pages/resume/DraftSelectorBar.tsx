import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import useResumeDrafts from "@workspaces/ai/hooks/useResumeDrafts";

/**
 * DraftSelectorBar
 * A small control that lets the user select the active resume draft (from localStorage-created resumes).
 * Renders a note if no resumes exist, directing the user to create one via Templates.
 */
export default function DraftSelectorBar() {
  const { resumes, activeId, setActive } = useResumeDrafts();

  if (!resumes.length) {
    return (
      <Box
        sx={{
          p: 2,
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ sm: "center" }}
        >
          <Typography variant="body2">
            No local resumes yet. Create one from a template to enable applying
            AI output.
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button
            size="small"
            variant="outlined"
            href="#ai-templates"
            onClick={(e) => e.preventDefault()}
          >
            Open Templates
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      alignItems={{ sm: "center" }}
    >
      <Typography variant="subtitle1">Active Draft</Typography>
      <FormControl size="small" sx={{ minWidth: 260 }}>
        <InputLabel id="active-resume-select">Select resume</InputLabel>
        <Select
          labelId="active-resume-select"
          label="Select resume"
          value={activeId ?? ""}
          onChange={(e) => setActive(String(e.target.value) || null)}
        >
          {resumes.map((r) => (
            <MenuItem key={r.id} value={r.id}>
              {r.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}
