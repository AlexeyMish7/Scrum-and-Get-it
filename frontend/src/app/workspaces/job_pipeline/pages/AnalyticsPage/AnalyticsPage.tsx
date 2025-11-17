/**
 * AnalyticsPage — Wrapper for analytics panel
 *
 * This page now uses the reusable AnalyticsPanel component.
 * Kept as a separate route for backward compatibility, but the actual
 * logic is in AnalyticsPanel which can be used as collapsible panel elsewhere.
 */

import { useState } from "react";
import { Box } from "@mui/material";
import AnalyticsPanel from "../../components/AnalyticsPanel";

export default function AnalyticsPage() {
  const [expanded, setExpanded] = useState(true);
  const [expanded, setExpanded] = useState(true);

  return (
    <Box>
      <AnalyticsPanel
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      />
    </Box>
  );
}
