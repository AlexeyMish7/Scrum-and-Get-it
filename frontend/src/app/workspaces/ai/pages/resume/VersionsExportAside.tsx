import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Divider,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Chip,
} from "@mui/material";
import type {
  ResumeArtifactContent,
  AIArtifactSummary,
  AIArtifact,
} from "@workspaces/ai/types/ai";
import { aiGeneration } from "@workspaces/ai/services/aiGeneration";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import React from "react";
import { tooltipMap } from "@workspaces/ai/utils/tooltipMap";

/**
 * VersionsExportAside
 * Purpose: Right-column skeleton for version selection and export actions.
 * Inputs:
 *  - lastContent: latest generated content (optional)
 *  - onOpenVersions: open the full version manager (advanced tools)
 *  - onExportPDF: export current preview to PDF (wired later)
 *  - onAttachToJob: attach selected version to job (wired later)
 * Behavior: Non-destructive placeholder; buttons may be disabled until implemented.
 */
export default function VersionsExportAside({
  lastContent,
  jobId,
  onOpenVersions,
  onExportPDF,
  onExportDOCX,
  onAttachToJob,
  onSelectVersion,
}: {
  lastContent?: ResumeArtifactContent | null;
  jobId?: number | null;
  onOpenVersions?: () => void;
  onExportPDF?: () => void;
  onExportDOCX?: () => void;
  onAttachToJob?: () => void;
  onSelectVersion?: (
    content: ResumeArtifactContent | null,
    artifact?: AIArtifactSummary | AIArtifact
  ) => void;
}) {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<AIArtifactSummary[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user?.id || !jobId) return;
      setLoading(true);
      try {
        const resp = await aiGeneration.listArtifacts(user.id, {
          kind: "resume",
          jobId,
          limit: 8,
        });
        if (!mounted) return;
        setItems(resp.items);
      } catch (e) {
        handleError?.(e);
      } finally {
        setLoading(false);
        if (mounted) setSelectedId(null);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [user?.id, jobId, handleError]);

  async function selectArtifact(a: AIArtifactSummary) {
    setSelectedId(a.id);
    // Use embedded content if available; else fetch full
    let content: ResumeArtifactContent | null = null;
    if (a.content && typeof a.content === "object") {
      content = a.content as ResumeArtifactContent;
    } else if (user?.id) {
      try {
        const full = await aiGeneration.getArtifact(user.id, a.id);
        if (
          full?.artifact?.content &&
          typeof full.artifact.content === "object"
        ) {
          content = full.artifact.content as ResumeArtifactContent;
        }
        onSelectVersion?.(content, full.artifact);
        return;
      } catch (e) {
        handleError?.(e);
      }
    }
    onSelectVersion?.(content, a);
  }
  return (
    <Box component="aside">
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6">Versions</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {jobId
            ? "Recent generated versions for this job."
            : "Select a job to load versions."}
        </Typography>
        <List dense sx={{ mb: 1, maxHeight: 240, overflow: "auto" }}>
          {loading && (
            <ListItem disableGutters>
              <ListItemText primary="Loading versions…" />
            </ListItem>
          )}
          {!loading && items.length === 0 && (
            <ListItem disableGutters>
              <ListItemText
                primary="No versions yet"
                secondary={jobId ? "Generate to populate history" : undefined}
              />
            </ListItem>
          )}
          {items.map((a) => (
            <ListItem
              key={a.id}
              disableGutters
              onClick={() => selectArtifact(a)}
              role="button"
              tabIndex={0}
              aria-selected={selectedId === a.id}
              data-artifact-id={a.id}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  selectArtifact(a);
                }
              }}
              sx={{
                border: "1px solid",
                borderColor: selectedId === a.id ? "primary.main" : "divider",
                mb: 0.5,
                borderRadius: 1,
                cursor: "pointer",
                "&:hover": { backgroundColor: "action.hover" },
                backgroundColor:
                  selectedId === a.id ? "action.selected" : undefined,
              }}
            >
              <ListItemText
                primary={a.title || "Resume Artifact"}
                secondary={
                  a.created_at
                    ? new Date(a.created_at).toLocaleDateString()
                    : undefined
                }
              />
              <Chip size="small" label={a.kind} />
            </ListItem>
          ))}
        </List>
        <Tooltip title={tooltipMap.openVersionManager.desc}>
          <span>
            <Button
              aria-label={tooltipMap.openVersionManager.title}
              variant="text"
              onClick={onOpenVersions}
              sx={{ mb: 2 }}
              disabled={!jobId}
            >
              Open Version Manager
            </Button>
          </span>
        </Tooltip>
        <Divider sx={{ my: 1.5 }} />
        <Typography variant="h6">Export</Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
          <Tooltip
            title={
              onExportPDF ? tooltipMap.exportPDF.desc : "PDF export unavailable"
            }
          >
            <span>
              <Button
                variant="outlined"
                size="small"
                disabled={!onExportPDF || !lastContent}
                onClick={onExportPDF}
                aria-label={tooltipMap.exportPDF.title}
              >
                Export PDF
              </Button>
            </span>
          </Tooltip>
          <Tooltip
            title={
              onExportDOCX
                ? tooltipMap.exportDOCX.desc
                : "DOCX export unavailable"
            }
          >
            <span>
              <Button
                variant="outlined"
                size="small"
                disabled={!onExportDOCX || !lastContent}
                onClick={onExportDOCX}
                aria-label={tooltipMap.exportDOCX.title}
              >
                Export DOCX
              </Button>
            </span>
          </Tooltip>
          <Tooltip
            title={
              onAttachToJob ? tooltipMap.attachToJob.desc : "Attach unavailable"
            }
          >
            <span>
              <Button
                variant="outlined"
                size="small"
                disabled={!onAttachToJob || !selectedId || !jobId}
                onClick={onAttachToJob}
                aria-label={tooltipMap.attachToJob.title}
              >
                Attach to Job
              </Button>
            </span>
          </Tooltip>
        </Stack>
        {lastContent && (
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
            <Chip
              size="small"
              label={`Skills: ${lastContent.ordered_skills?.length ?? 0}`}
            />
            <Chip
              size="small"
              label={lastContent.summary ? "Summary: yes" : "Summary: no"}
            />
            <Chip
              size="small"
              label={`Experience: ${
                lastContent.sections?.experience?.length ?? 0
              }`}
            />
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
