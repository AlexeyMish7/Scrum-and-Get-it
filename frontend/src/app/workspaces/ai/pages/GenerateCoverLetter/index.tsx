import { Box } from "@mui/material";
import RegionAnchor from "@shared/components/common/RegionAnchor";
import CoverLetterEditor from "../CoverLetterEditor";

export default function GenerateCoverLetter() {
  // Use the new CoverLetterEditor with AI generation, company research, and export
  return (
    <Box>
      <RegionAnchor
        id="[B]"
        desc="Cover Letter editor + company research pane"
      />
      <CoverLetterEditor />
    </Box>
  );
}
