import { Box } from "@mui/material";
import RegionAnchor from "@shared/components/common/RegionAnchor";
import CoverLetterTemplates from "../cover_letters/CoverLetterTemplates";

export default function GenerateCoverLetter() {
  // Reuse the existing CoverLetterTemplates component under the AI workspace
  // so the AI sidebar's Cover Letters link shows the functional templates UI.
  return (
    <Box>
      <RegionAnchor
        id="[B]"
        desc="Cover Letter editor + company research pane"
      />
      <CoverLetterTemplates />
    </Box>
  );
}
