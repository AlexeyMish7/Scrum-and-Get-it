/**
 * PipelineView — Kanban board for job application pipeline
 *
 * Purpose: Main kanban view showing job applications across pipeline stages.
 * Migrated from PipelinePage with AnalyticsPanel and DocumentsDrawer removed
 * (those features now accessible via navigation tabs).
 *
 * Contract:
 * - Inputs: None (authenticated user via context)
 * - Outputs: Drag-drop kanban board with job cards
 * - Features: Drag-drop status changes, bulk operations, filters, job details drawer
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Card,
  CardContent,
  Divider,
  Chip,
  Checkbox,
  IconButton,
  Button,
  Collapse,
  Tooltip,
  Alert,
  LinearProgress,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Work as WorkIcon,
  TrendingUp as TrendingUpIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import RightDrawer from "@shared/components/common/RightDrawer";
import { alpha } from "@mui/material/styles";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "@shared/components/feedback/ErrorSnackbar";
import { EmptyState } from "@shared/components/feedback";
import { useConfirmDialog } from "@shared/hooks/useConfirmDialog";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import type { JobRow } from "@shared/types/database";
import JobDetails from "@job_pipeline/components/details/JobDetails/JobDetails";
import JobSearchFilters, {
  type JobFilters,
} from "@job_pipeline/components/search/JobSearchFilters/JobSearchFilters";
import JobFormDialog from "@job_pipeline/components/dialogs/JobFormDialog";
import MatchScoreBadge from "@job_pipeline/components/analytics/MatchScoreBadge/MatchScoreBadge";
import { useJobMatch } from "@job_pipeline/hooks/useJobMatch";
import { useJobsPipeline } from "@job_pipeline/hooks/useJobsPipeline";
import PipelineAnalytics from "@job_pipeline/components/analytics/PipelineAnalytics/PipelineAnalytics";
import JobAnalyticsDialog from "@job_pipeline/components/dialogs/JobAnalyticsDialog";
import SuggestContacts from "@job_pipeline/components/contacts/SuggestContacts";

const STAGES = [
  "Interested",
  "Applied",
  "Phone Screen",
  "Interview",
  "Offer",
  "Rejected",
] as const;

type Stage = (typeof STAGES)[number];

/**
 * JobMatchBadgeWrapper: Renders match score badge for a job card in the pipeline.
 * Only fetches match data when job is in "Interested" stage (optimization).
 */
function JobMatchBadgeWrapper({
  jobId,
  userId,
  stage,
}: {
  jobId: number;
  userId: string;
  stage: Stage;
}) {
  // Only show match score for "Interested" stage (initial evaluation)
  const shouldShowMatch = stage === "Interested";
  const { data: matchData } = useJobMatch(
    shouldShowMatch ? userId : undefined,
    shouldShowMatch ? jobId : null
  );

  if (!shouldShowMatch || !matchData) return null;

  return (
    <Box sx={{ mt: 0.5 }}>
      <MatchScoreBadge
        score={matchData.matchScore}
        breakdown={matchData.breakdown}
        size="small"
      />
    </Box>
  );
}

export default function PipelineView() {
  const navigate = useNavigate();
  const { handleError, notification, closeNotification } = useErrorHandler();
  const { confirm } = useConfirmDialog();

  // ✨ CENTRALIZED STATE MANAGEMENT via useJobsPipeline hook
  const {
    allJobs,
    jobsByStage,
    loading,
    stats,
    user, // User for match badge
    moveJob,
    bulkMoveJobs,
    deleteJobs,
    refreshJobs,
  } = useJobsPipeline();

  const [open, setOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | number | null>(
    null
  );
  const [analyticsJobId, setAnalyticsJobId] = useState<number | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<JobFilters | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailedAnalytics, setShowDetailedAnalytics] = useState(false);

  // Add job dialog
  const [addJobOpen, setAddJobOpen] = useState(false);
  const [suggestContactsOpen, setSuggestContactsOpen] = useState(false);
  const [suggestJobTitle, setSuggestJobTitle] = useState<string | null>(
    null
  );
  const [suggestCompanyName, setSuggestCompanyName] = useState<string | null>(
    null
  );
  const [suggestAlumniSchool, setSuggestAlumniSchool] = useState<string | null>(
    null
  );

  const [filter, setFilter] = useState<"All" | Stage | "Selected">("All");
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  // Keyboard shortcut: A = add job
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        setAddJobOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Days in current stage
  function daysInStage(row: JobRow) {
    const d = row.status_changed_at ?? row.updated_at ?? row.created_at;
    if (!d) return "-";
    try {
      const then = new Date(String(d));
      const diff = Math.floor(
        (Date.now() - then.getTime()) / (1000 * 60 * 60 * 24)
      );
      return `${diff}d`;
    } catch {
      return "-";
    }
  }

  // Days until application deadline
  function daysUntilDeadline(row: JobRow) {
    const d = row.application_deadline ?? row.applicationDeadline;
    if (!d) return null;
    try {
      const then = new Date(String(d));
      const diff = Math.ceil(
        (then.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return Number.isFinite(diff) ? diff : null;
    } catch {
      return null;
    }
  }

  function deadlineColor(days: number | null) {
    if (days === null) return "grey";
    if (days < 0) return "error";
    if (days <= 7) return "error";
    if (days <= 14) return "warning";
    return "success";
  }

  // Note: Jobs are now automatically loaded by useJobsPipeline hook on mount
  // No need for manual loading useEffect here

  // Apply client-side filters (grouping is handled by the hook)
  function applyFilters(rows: JobRow[] | undefined, filters?: JobFilters) {
    const source = rows ?? allJobs;
    const f = filters ?? activeFilters ?? {};

    const filtered = source.filter((r) => {
      const isArchived =
        String(r.job_status ?? r.jobStatus ?? "").toLowerCase() === "archive";
      if (isArchived && !f.showArchived) return false;

      if (f.query) {
        const q = String(f.query).toLowerCase();
        const hay = (
          String(r.job_title ?? r.title ?? "") +
          " " +
          String(r.company_name ?? r.company ?? "") +
          " " +
          String(r.job_description ?? "")
        ).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (f.industry) {
        if (
          !String(r.industry ?? "")
            .toLowerCase()
            .includes(String(f.industry).toLowerCase())
        )
          return false;
      }
      if (f.location) {
        const loc = String(f.location).toLowerCase();
        const combined = (
          String(r.city_name ?? r.city ?? "") +
          " " +
          String(r.state_code ?? r.state ?? "") +
          " " +
          String(r.zipcode ?? "")
        ).toLowerCase();
        if (!combined.includes(loc)) return false;
      }
      if (f.salaryMin !== undefined && f.salaryMin !== "") {
        const val = Number(r.start_salary_range ?? r.startSalary ?? 0);
        if (isNaN(val) || val < Number(f.salaryMin)) return false;
      }
      if (f.salaryMax !== undefined && f.salaryMax !== "") {
        const val = Number(r.start_salary_range ?? r.startSalary ?? 0);
        if (isNaN(val) || val > Number(f.salaryMax)) return false;
      }
      if (f.deadlineFrom) {
        const d = r.application_deadline ?? r.applicationDeadline;
        if (!d) return false;
        if (new Date(String(d)) < new Date(f.deadlineFrom)) return false;
      }
      if (f.deadlineTo) {
        const d = r.application_deadline ?? r.applicationDeadline;
        if (!d) return false;
        if (new Date(String(d)) > new Date(f.deadlineTo)) return false;
      }
      return true;
    });

    const sorted = filtered.sort((a, b) => {
      const dir = f.sortDir === "asc" ? 1 : -1;
      switch (f.sortBy) {
        case "deadline": {
          const da = a.application_deadline
            ? new Date(String(a.application_deadline)).getTime()
            : 0;
          const db = b.application_deadline
            ? new Date(String(b.application_deadline)).getTime()
            : 0;
          return (da - db) * dir;
        }
        case "salary": {
          const sa = Number(a.start_salary_range ?? 0);
          const sb = Number(b.start_salary_range ?? 0);
          return (sa - sb) * dir;
        }
        case "company": {
          const ca = String(a.company_name ?? "").localeCompare(
            String(b.company_name ?? "")
          );
          return ca * dir;
        }
        case "date_added":
        default: {
          const ta = a.created_at
            ? new Date(String(a.created_at)).getTime()
            : 0;
          const tb = b.created_at
            ? new Date(String(b.created_at)).getTime()
            : 0;
          return (ta - tb) * dir;
        }
      }
    });

    // Note: Grouping by stage is now handled by useJobsPipeline hook
    // This filter just updates which jobs are displayed
    return sorted;
  }

  // ✨ SIMPLIFIED: handleDrop now uses centralized moveJob from hook
  async function handleDrop(res: DropResult) {
    if (!res.destination) return;

    const destStage = res.destination.droppableId as Stage;
    const jobId = Number(res.draggableId);

    // Hook handles optimistic update and rollback automatically
    await moveJob(jobId, destStage);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  // ✨ SIMPLIFIED: handleBulkSelect now uses centralized bulkMoveJobs from hook
  async function handleBulkSelect(newStage: string) {
    if (!newStage) return;
    const ids = Object.keys(selectedIds)
      .filter((k) => selectedIds[k])
      .map(Number);
    if (!ids.length) return;

    const ok = await confirm({
      title: `Move ${ids.length} job(s) to ${newStage}?`,
      message: "This will change the status of all selected jobs.",
    });
    if (!ok) return;

    // Hook handles the move and state sync
    await bulkMoveJobs(ids, newStage);
    setSelectedIds({});
  }

  // ✨ SIMPLIFIED: handleBulkDelete now uses centralized deleteJobs from hook
  async function handleBulkDelete() {
    const ids = Object.keys(selectedIds)
      .filter((k) => selectedIds[k])
      .map(Number);
    if (!ids.length) return;

    const ok = await confirm({
      title: `Delete ${ids.length} job(s)?`,
      message: "This action cannot be undone.",
    });
    if (!ok) return;

    // Hook handles the delete and state sync
    await deleteJobs(ids);
    setSelectedIds({});
  }

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;

  const filteredJobs = (() => {
    if (filter === "All") return jobsByStage;
    if (filter === "Selected") {
      const ids = Object.keys(selectedIds).filter((k) => selectedIds[k]);
      return STAGES.reduce<Record<Stage, JobRow[]>>((acc, s) => {
        acc[s] = jobsByStage[s].filter((j) => ids.includes(String(j.id)));
        return acc;
      }, {} as Record<Stage, JobRow[]>);
    }
    return {
      ...STAGES.reduce<Record<Stage, JobRow[]>>((acc, s) => {
        acc[s] = [];
        return acc;
      }, {} as Record<Stage, JobRow[]>),
      [filter]: jobsByStage[filter],
    };
  })();

  // Show empty state if no jobs exist at all
  if (allJobs.length === 0) {
    return (
      <Box sx={{ width: "100%", p: 3 }}>
        <Box sx={{ maxWidth: 1400, mx: "auto" }}>
          <Typography variant="h4" sx={{ mb: 3 }}>
            Jobs Pipeline
          </Typography>
          <EmptyState
            icon={
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"
                  fill="currentColor"
                />
              </svg>
            }
            title="No Jobs Yet"
            description="Start tracking your job search by adding your first opportunity. You can manually enter job details or import from a URL."
            action={
              <Button variant="contained" onClick={() => setAddJobOpen(true)}>
                Add First Job
              </Button>
            }
          />
        </Box>

        {/* Add Job Dialog */}
        <JobFormDialog
          open={addJobOpen}
          onClose={() => setAddJobOpen(false)}
          onSuccess={() => {
            setAddJobOpen(false);
            // ✨ SIMPLIFIED: Just refresh jobs through the hook
            refreshJobs();
          }}
        />

        <ErrorSnackbar
          notification={notification}
          onClose={closeNotification}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        p: 2,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Fixed Header Section - doesn't scroll */}
      <Box sx={{ flexShrink: 0 }}>
        {/* AI-Powered Pipeline Analytics with cumulative stats */}
        <PipelineAnalytics jobs={allJobs} cumulativeStats={stats} />

        {/* Stats Header */}
        <Stack
          direction="row"
          spacing={2}
          sx={{
            mb: 2,
            p: 1.5,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 1,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Total Jobs
            </Typography>
            <Typography variant="h5" fontWeight={600}>
              {stats.total}
            </Typography>
          </Box>
          {STAGES.slice(0, 4).map((stage) => (
            <Box key={stage} sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {stage}
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {stats.currentByStage[stage] ?? 0}
              </Typography>
            </Box>
          ))}
        </Stack>

        {/* Action Bar */}
        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
          <Button
            variant="contained"
            onClick={() => setAddJobOpen(true)}
            size="small"
          >
            Add Job (A)
          </Button>
          <Button
            variant="outlined"
            onClick={() => setShowFilters(!showFilters)}
            size="small"
          >
            {showFilters ? "Hide" : "Show"} Filters
          </Button>
          {/* suggest contacts moved into per-job action buttons */}
          {selectedCount > 0 && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleBulkDelete}
              size="small"
            >
              Delete {selectedCount} Selected
            </Button>
          )}
        </Stack>

        {/* Filters Collapse */}
        <Collapse in={showFilters}>
          <Box sx={{ mb: 1.5 }}>
            <JobSearchFilters
              initial={activeFilters ?? undefined}
              onApply={(f) => {
                setActiveFilters(f);
                applyFilters(undefined, f);
              }}
              onClear={() => {
                setActiveFilters(null);
                applyFilters(undefined, undefined);
              }}
            />
          </Box>
        </Collapse>

        {/* Filter and Bulk Controls */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="h4">Jobs Pipeline</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              select
              label="Filter"
              size="medium"
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value as "All" | Stage | "Selected")
              }
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="All">All</MenuItem>
              {STAGES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Bulk move"
              size="medium"
              onChange={(e) => handleBulkSelect(e.target.value as string)}
              value={""}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">Move selected...</MenuItem>
              {STAGES.map((s) => (
                <MenuItem key={`bulk-${s}`} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>
      </Box>

      {/* Scrollable Kanban Section - takes remaining height */}
      <Box
        sx={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDrop}>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              overflowX: "auto",
              overflowY: "hidden",
              pb: 1.5,
              flex: 1,
              minHeight: 0,
            }}
          >
            {STAGES.map((stage) => {
              const jobs = filteredJobs[stage] ?? [];
              return (
                <Box
                  key={stage}
                  sx={{
                    flex: "1 1 0",
                    minWidth: 240,
                  }}
                >
                  <Card
                    variant="outlined"
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <CardContent sx={{ flex: 1, p: 1, overflow: "auto" }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{ mb: 1, px: 0.5 }}
                      >
                        {stage} ({jobs.length})
                      </Typography>
                      <Droppable droppableId={stage}>
                        {(provided, snapshot) => (
                          <Box
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            sx={{
                              minHeight: 400,
                              bgcolor: snapshot.isDraggingOver
                                ? "action.hover"
                                : "transparent",
                              borderRadius: 1,
                              transition: "background-color 0.2s",
                            }}
                          >
                            <Stack spacing={1}>
                              {jobs.map((job, index) => (
                                <Draggable
                                  key={String(job.id)}
                                  draggableId={String(job.id)}
                                  index={index}
                                >
                                  {(dragProvided, dragSnapshot) => (
                                    <Card
                                      ref={dragProvided.innerRef}
                                      {...dragProvided.draggableProps}
                                      {...dragProvided.dragHandleProps}
                                      variant="outlined"
                                      sx={{
                                        position: "relative",
                                        cursor: dragSnapshot.isDragging
                                          ? "grabbing"
                                          : "grab",
                                        boxShadow: dragSnapshot.isDragging
                                          ? 3
                                          : 0,
                                        bgcolor: dragSnapshot.isDragging
                                          ? "background.paper"
                                          : (theme) => {
                                              const token = (() => {
                                                switch (stage) {
                                                  case "Interested":
                                                    return theme.palette.info;
                                                  case "Applied":
                                                    return theme.palette
                                                      .primary;
                                                  case "Phone Screen":
                                                    return theme.palette
                                                      .warning;
                                                  case "Interview":
                                                    return theme.palette
                                                      .secondary;
                                                  case "Offer":
                                                    return theme.palette
                                                      .success;
                                                  case "Rejected":
                                                    return theme.palette.error;
                                                  default:
                                                    return undefined;
                                                }
                                              })();
                                              return token?.main
                                                ? alpha(token.main, 0.4)
                                                : "transparent";
                                            },
                                      }}
                                    >
                                      {/* Checkbox - TOP RIGHT */}
                                      <Checkbox
                                        size="small"
                                        checked={!!selectedIds[String(job.id)]}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          toggleSelect(String(job.id));
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        sx={{
                                          position: "absolute",
                                          top: 4,
                                          right: 4,
                                          zIndex: 2,
                                          p: 0,
                                          transform: "scale(0.85)",
                                        }}
                                      />

                                      {/* Main Content */}
                                      <Box
                                        sx={{
                                          p: 1.5,
                                          pr: 5, // Space for checkbox
                                        }}
                                      >
                                        <Typography
                                          sx={{
                                            fontWeight: 600,
                                            fontSize: "0.95rem",
                                            lineHeight: 1.15,
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "normal",
                                            overflowWrap: "anywhere",
                                            wordBreak: "break-word",
                                          }}
                                        >
                                          {String(
                                            job.job_title ??
                                              job.title ??
                                              "Untitled"
                                          )}
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          sx={{
                                            display: "block",
                                            fontSize: "0.75rem",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          {String(
                                            job.company_name ??
                                              job.company ??
                                              "Unknown"
                                          )}
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          sx={{ fontSize: "0.7rem", mt: 0.5 }}
                                        >
                                          {daysInStage(job)}
                                        </Typography>

                                        {/* AI Match Score Badge */}
                                        {user && job.id && (
                                          <JobMatchBadgeWrapper
                                            jobId={Number(job.id)}
                                            userId={user.id}
                                            stage={stage}
                                          />
                                        )}

                                        {/* Action Icon Buttons */}
                                        <Stack
                                          direction="row"
                                          spacing={0.5}
                                          sx={{
                                            mt: 1,
                                            justifyContent: "flex-end",
                                          }}
                                        >
                                          <IconButton
                                            size="small"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedJobId(String(job.id));
                                              setOpen(true);
                                            }}
                                            sx={{
                                              bgcolor: "action.hover",
                                              "&:hover": {
                                                bgcolor: "action.selected",
                                              },
                                            }}
                                          >
                                            <Tooltip title="Details">
                                              <WorkIcon fontSize="small" />
                                            </Tooltip>
                                          </IconButton>
                                          <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setAnalyticsJobId(Number(job.id));
                                              setAnalyticsOpen(true);
                                            }}
                                            sx={{
                                              bgcolor: "primary.main",
                                              color: "primary.contrastText",
                                              "&:hover": {
                                                bgcolor: "primary.dark",
                                              },
                                            }}
                                          >
                                            <Tooltip title="Analytics">
                                              <TrendingUpIcon fontSize="small" />
                                            </Tooltip>
                                          </IconButton>
                                          <IconButton
                                            size="small"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedJobId(String(job.id));
                                              setSuggestJobTitle(
                                                String(
                                                  job.job_title ?? job.title ?? ""
                                                )
                                              );
                                              setSuggestCompanyName(
                                                String(
                                                  job.company_name ?? job.company ?? ""
                                                )
                                              );
                                              setSuggestAlumniSchool(
                                                user?.institution_name ?? null
                                              );
                                              setSuggestContactsOpen(true);
                                            }}
                                            sx={{
                                              bgcolor: "action.hover",
                                              "&:hover": { bgcolor: "action.selected" },
                                            }}
                                          >
                                            <Tooltip title="Suggest Contacts">
                                              <PersonAddIcon fontSize="small" />
                                            </Tooltip>
                                          </IconButton>
                                        </Stack>
                                      </Box>

                                      {/* Deadline Chip - BOTTOM LEFT */}
                                      {stage === "Interested" &&
                                        (() => {
                                          const d = daysUntilDeadline(job);
                                          if (d === null) return null;
                                          const token = deadlineColor(d);
                                          const display = Math.max(0, d);
                                          const label =
                                            d < 0
                                              ? `Overdue`
                                              : display === 0
                                              ? `Today`
                                              : `${display}d`;
                                          return (
                                            <Chip
                                              label={label}
                                              size="small"
                                              color={
                                                token as
                                                  | "error"
                                                  | "warning"
                                                  | "success"
                                              }
                                              sx={{
                                                position: "absolute",
                                                left: 8,
                                                bottom: 8,
                                                fontSize: "0.65rem",
                                                height: 18,
                                                px: 0.5,
                                              }}
                                            />
                                          );
                                        })()}
                                    </Card>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </Stack>
                          </Box>
                        )}
                      </Droppable>
                    </CardContent>
                  </Card>
                </Box>
              );
            })}
          </Stack>
        </DragDropContext>

        {/* Detailed Analytics Section (Collapsible) */}
        <Box sx={{ mt: 2, flexShrink: 0 }}>
          <Button
            onClick={() => setShowDetailedAnalytics(!showDetailedAnalytics)}
            endIcon={
              showDetailedAnalytics ? <ExpandLessIcon /> : <ExpandMoreIcon />
            }
            variant="outlined"
            fullWidth
            sx={{ mb: 2 }}
          >
            {showDetailedAnalytics ? "Hide" : "Show"} Detailed Analytics &
            Insights
          </Button>

          <Collapse in={showDetailedAnalytics}>
            <Card variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Performance Metrics
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Stack spacing={3}>
                {/* Response Time */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Average Response Time by Stage
                  </Typography>
                  {STAGES.slice(1, 5).map((stage) => {
                    const stageJobs = jobsByStage[stage] || [];
                    const avgDays =
                      stageJobs.length > 0
                        ? stageJobs.reduce((sum, job) => {
                            const days = job.status_changed_at
                              ? Math.floor(
                                  (new Date().getTime() -
                                    new Date(job.status_changed_at).getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )
                              : 0;
                            return sum + days;
                          }, 0) / stageJobs.length
                        : 0;

                    return (
                      <Box key={stage} sx={{ mb: 1.5 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          sx={{ mb: 0.5 }}
                        >
                          <Typography variant="body2">{stage}</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {avgDays.toFixed(1)} days
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((avgDays / 30) * 100, 100)}
                          color={
                            avgDays < 14
                              ? "success"
                              : avgDays < 21
                              ? "warning"
                              : "error"
                          }
                        />
                      </Box>
                    );
                  })}
                </Box>

                {/* Application Stats */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Application Activity
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <Chip
                      label={`This Week: ${
                        allJobs.filter((j) => {
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return new Date(j.created_at || "") >= weekAgo;
                        }).length
                      }`}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={`This Month: ${
                        allJobs.filter((j) => {
                          const monthAgo = new Date();
                          monthAgo.setMonth(monthAgo.getMonth() - 1);
                          return new Date(j.created_at || "") >= monthAgo;
                        }).length
                      }`}
                      color="secondary"
                      variant="outlined"
                    />
                  </Stack>
                </Box>

                {/* AI Recommendations */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    AI-Powered Recommendations
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {(() => {
                      const applied = (jobsByStage["Applied"] || []).length;
                      const total = allJobs.length;
                      const appRate = total > 0 ? (applied / total) * 100 : 0;

                      const recommendations = [];

                      if (appRate < 30) {
                        recommendations.push(
                          "Consider applying to more positions - only " +
                            appRate.toFixed(0) +
                            "% of tracked jobs have applications submitted."
                        );
                      }
                      if (total < 10) {
                        recommendations.push(
                          "Build your pipeline - aim for 10-20 active opportunities to increase your chances."
                        );
                      }
                      if (
                        (jobsByStage["Interested"] || []).length >
                        total * 0.6
                      ) {
                        recommendations.push(
                          "You have many jobs in 'Interested' stage - prioritize applying to the best matches."
                        );
                      }

                      return recommendations.length > 0 ? (
                        recommendations.map((rec, i) => (
                          <Alert
                            key={i}
                            severity="info"
                            sx={{ fontSize: "0.875rem" }}
                          >
                            {rec}
                          </Alert>
                        ))
                      ) : (
                        <Alert severity="success" sx={{ fontSize: "0.875rem" }}>
                          Your pipeline looks healthy! Keep up the good work.
                        </Alert>
                      );
                    })()}
                  </Stack>
                </Box>
              </Stack>
            </Card>
          </Collapse>
        </Box>
      </Box>

      {/* Job Details Drawer */}
      <RightDrawer
        title="Job Details"
        open={open}
        onClose={() => {
          setOpen(false);
          setSelectedJobId(null);
        }}
      >
        <JobDetails jobId={selectedJobId} />
      </RightDrawer>

      {/* Add Job Dialog */}
      <JobFormDialog
        open={addJobOpen}
        onClose={() => setAddJobOpen(false)}
        onSuccess={() => {
          setAddJobOpen(false);
          // ✨ SIMPLIFIED: Just refresh jobs through the hook
          refreshJobs();
        }}
      />

      {/* Job Analytics Dialog */}
      <JobAnalyticsDialog
        jobId={analyticsJobId}
        open={analyticsOpen}
        onClose={() => {
          setAnalyticsOpen(false);
          setAnalyticsJobId(null);
        }}
      />

      {/* Suggest Contacts Dialog */}
      <SuggestContacts
        open={suggestContactsOpen}
        onClose={() => setSuggestContactsOpen(false)}
        jobTitle={suggestJobTitle}
        companyName={suggestCompanyName}
        alumniSchool={suggestAlumniSchool}
        job={allJobs.find((j) => String(j.id) === String(selectedJobId))}
      />

      <ErrorSnackbar notification={notification} onClose={closeNotification} />
    </Box>
  );
}
