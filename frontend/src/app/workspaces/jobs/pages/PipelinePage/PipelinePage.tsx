import { useEffect, useRef, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  Checkbox,
  IconButton,
  Button,
  Paper,
  Collapse,
} from "@mui/material";
import RightDrawer from "@shared/components/common/RightDrawer";
import { alpha } from "@mui/material/styles";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import ErrorSnackbar from "@shared/components/common/ErrorSnackbar";
import ConfirmDialog from "@shared/components/common/ConfirmDialog";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import type { ListOptions } from "@shared/services/types";
import { listJobs, updateJob } from "@shared/services/dbMappers";
import JobDetails from "../../components/JobDetails/JobDetails";
import JobSearchFilters, { type JobFilters } from "../../components/JobSearchFilters/JobSearchFilters";

const STAGES = [
  "Interested",
  "Applied",
  "Phone Screen",
  "Interview",
  "Offer",
  "Rejected",
] as const;

type Stage = (typeof STAGES)[number];

type JobRow = Record<string, unknown>;

export default function PipelinePage() {
  const { user } = useAuth();
  const { handleError, notification, closeNotification, showSuccess } =
    useErrorHandler();

  const [open, setOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | number | null>(
    null
  );
  const [jobsByStage, setJobsByStage] = useState<Record<Stage, JobRow[]>>(() =>
    STAGES.reduce<Record<Stage, JobRow[]>>((acc, s) => {
      acc[s] = [];
      return acc;
    }, {} as Record<Stage, JobRow[]>)
  );
  const [allJobs, setAllJobs] = useState<JobRow[]>([]);
  const [activeFilters, setActiveFilters] = useState<JobFilters | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filter, setFilter] = useState<"All" | Stage | "Selected">("All");
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  const preDragRef = useRef<Record<Stage, JobRow[]> | undefined>(undefined);

  // (kept for reference) previously used to show relative day count; now unused
  /* function daysInStage(row: JobRow) {
    const d = row.status_changed_at ?? row.updated_at ?? row.created_at;
    if (!d) return "-";
    const then = new Date(String(d));
    const diff = Math.floor((Date.now() - then.getTime()) / (1000 * 60 * 60 * 24));
    return `${diff}d`;
  } */

  // Format a date to a readable string; prefer status_changed_at then updated_at then created_at
  /*
  function formatStatusDate(row: JobRow) {
    const d = row.status_changed_at ?? row.updated_at ?? row.created_at;
    if (!d) return "-";
    try {
      const dt = new Date(String(d));
      return dt.toLocaleDateString();
    } catch {
      return String(d);
    }
  }*/
  // Days in current stage: difference between today and status_changed_at (or fallback)
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

  // Days until application deadline (positive means days remaining, negative = past due)
  function daysUntilDeadline(row: JobRow) {
    const d = row.application_deadline ?? row.applicationDeadline;
    if (!d) return null;
    try {
      const then = new Date(String(d));
      const diff = Math.ceil((then.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
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

  useEffect(() => {
    let mounted = true;
    if (!user) return;
    const opts: ListOptions = {
      order: { column: "created_at", ascending: false },
    };
    (async () => {
      try {
        const res = await listJobs(user.id, opts);
        if (res.error) return handleError(res.error);
        const rows = (res.data ?? []) as JobRow[];
        if (!mounted) return;
        setAllJobs(rows);
        // apply any active filters or default grouping
        applyFilters(rows, activeFilters ?? undefined);
      } catch (err) {
        handleError(err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user, handleError]);

  // Apply client-side filters and sorting then group into stages
  function applyFilters(rows: JobRow[] | undefined, filters?: JobFilters) {
    const source = rows ?? allJobs;
    const f = filters ?? activeFilters ?? {};

    const filtered = source.filter((r) => {
      // Exclude archived jobs from the active pipeline view
      if (String(r.job_status ?? r.jobStatus ?? "").toLowerCase() === "archive") return false;
      // query search across title, company, description
      if (f.query) {
        const q = String(f.query).toLowerCase();
        const hay = (
          String(r.job_title ?? r.title ?? "") + " " +
          String(r.company_name ?? r.company ?? "") + " " +
          String(r.job_description ?? "")
        ).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (f.industry) {
        if (!String(r.industry ?? "").toLowerCase().includes(String(f.industry).toLowerCase())) return false;
      }
      if (f.location) {
        const loc = String(f.location).toLowerCase();
        const combined = (
          String(r.city_name ?? r.city ?? "") + " " + String(r.state_code ?? r.state ?? "") + " " + String(r.zipcode ?? "")
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

    // sorting
    const sorted = filtered.sort((a, b) => {
      const dir = (f.sortDir === "asc" ? 1 : -1);
      switch (f.sortBy) {
        case "deadline": {
          const da = a.application_deadline ? new Date(String(a.application_deadline)).getTime() : 0;
          const db = b.application_deadline ? new Date(String(b.application_deadline)).getTime() : 0;
          return (da - db) * dir;
        }
        case "salary": {
          const sa = Number(a.start_salary_range ?? 0);
          const sb = Number(b.start_salary_range ?? 0);
          return (sa - sb) * dir;
        }
        case "company": {
          const ca = String(a.company_name ?? "").localeCompare(String(b.company_name ?? ""));
          return ca * dir;
        }
        case "date_added":
        default: {
          const ta = a.created_at ? new Date(String(a.created_at)).getTime() : 0;
          const tb = b.created_at ? new Date(String(b.created_at)).getTime() : 0;
          return (ta - tb) * dir;
        }
      }
    });

    const grouped = STAGES.reduce<Record<Stage, JobRow[]>>((acc, s) => {
      acc[s] = [];
      return acc;
    }, {} as Record<Stage, JobRow[]>);
    sorted.forEach((r) => {
      const status = (r.job_status as Stage) ?? "Interested";
      if (STAGES.includes(status)) grouped[status].push(r);
      else grouped["Interested"].push(r);
    });
    setJobsByStage(grouped);
  }

  const handleDragStart = () => {
    preDragRef.current = JSON.parse(JSON.stringify(jobsByStage));
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    const from = source.droppableId as Stage;
    const to = destination.droppableId as Stage;
    const srcIdx = source.index;
    const dstIdx = destination.index;
    if (from === to && srcIdx === dstIdx) return;

    // optimistic move
    const copy = STAGES.reduce<Record<Stage, JobRow[]>>((acc, s) => {
      acc[s] = [...jobsByStage[s]];
      return acc;
    }, {} as Record<Stage, JobRow[]>);
    const [moved] = copy[from].splice(srcIdx, 1);
    copy[to].splice(dstIdx, 0, moved);
    setJobsByStage(copy);

    // persist change: update job_status and status_changed_at
    (async () => {
      try {
        if (!user) throw new Error("Not signed in");
        const payload: Record<string, unknown> = {
          job_status: to,
          status_changed_at: new Date().toISOString(),
        };
        const jobId = String(
          (moved && (moved.id as string | number)) ?? draggableId
        );
        const res = await updateJob(user.id, jobId, payload);
        if (res.error) {
          throw res.error;
        }
        showSuccess("Status updated");
      } catch (err) {
        // rollback
        handleError(err);
        if (preDragRef.current) setJobsByStage(preDragRef.current);
      } finally {
        preDragRef.current = undefined;
      }
    })();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((s) => ({ ...s, [id]: !s[id] }));
  };

  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [bulkTarget, setBulkTarget] = useState<string | null>(null);

  const bulkMove = async (to: string) => {
    const ids = Object.keys(selectedIds).filter((k) => selectedIds[k]);
    if (ids.length === 0) return handleError("No jobs selected");
    // optimistic update
    const copy = STAGES.reduce<Record<Stage, JobRow[]>>((acc, s) => {
      acc[s] = [...jobsByStage[s]];
      return acc;
    }, {} as Record<Stage, JobRow[]>);
    const movedRows: JobRow[] = [];
    STAGES.forEach((s) => {
      copy[s] = copy[s].filter((r) => {
        if (ids.includes(String(r.id))) {
          movedRows.push(r);
          return false;
        }
        return true;
      });
    });
    // If target is 'archive' we don't have a stage column in grouped map; just remove rows from their stages.
    if (to === "archive") {
      // no-op for adding to a stage column; they'll be removed from view
    } else {
      copy[to as Stage].unshift(...movedRows);
    }
    setJobsByStage(copy);

    try {
      if (!user) throw new Error("Not signed in");
      // update each selected job (could be batched server-side later)
      await Promise.all(
        ids.map(async (id) => {
          const changed_at = new Date().toISOString();
          const r = await updateJob(user.id, id, {
            job_status: to,
            status_changed_at: changed_at,
          });
          if (r.error) throw r.error;
        })
      );
      showSuccess(`${to === "archive" ? "Archived" : `Moved ${ids.length} job(s) to ${to}`}`);
      setSelectedIds({});
    } catch (err) {
      handleError(err);
      // simple rollback by refetching
      if (user) {
          const res = await listJobs(user.id);
          if (!res.error) {
            const rows = (res.data ?? []) as JobRow[];
            setAllJobs(rows);
            applyFilters(rows, activeFilters ?? undefined);
          }
      }
    }
  };

  function handleBulkSelect(value: string) {
    if (value === "archive") {
      // open confirmation before archiving selected jobs
      setBulkTarget("archive");
      setConfirmBulkOpen(true);
      return;
    }
    // normal stage move
    bulkMove(value);
  }

  // derive counts
  const counts = STAGES.reduce(
    (acc, s) => ({ ...acc, [s]: jobsByStage[s]?.length ?? 0 }),
    {} as Record<string, number>
  );

  // stages to render based on filter: when a specific stage is selected, only show that column
  const stagesToRender: readonly Stage[] =
    filter === "All" || filter === "Selected" ? STAGES : [filter as Stage];

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
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
              <MenuItem value="archive">Move to Archive</MenuItem>
            </TextField>
          </Stack>
        </Stack>

        {/* Compact clickable bar that expands/collapses the search/filter panel */}
        <Box sx={{ mb: 2, maxWidth: 1400, mx: "auto" }}>
          <Paper
            onClick={() => setShowFilters((s) => !s)}
            sx={{
              p: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
            elevation={0}
          >
            <Typography variant="subtitle1">Search / Filter</Typography>
            <Button
              size="small"
              onClick={(e) => {
                // prevent outer Paper click from toggling twice
                e.stopPropagation();
                setShowFilters((s) => !s);
              }}
            >
              {showFilters ? "Hide" : "Show"}
            </Button>
          </Paper>

          <Collapse in={showFilters} timeout="auto">
            <Paper sx={{ p: 2, mt: 1 }} elevation={0}>
              <JobSearchFilters
                onApply={(f) => {
                  setActiveFilters(f);
                  applyFilters(undefined, f);
                  // close after apply to return to pipeline view
                  setShowFilters(false);
                }}
              />
            </Paper>
          </Collapse>
        </Box>

        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Drag cards between columns to update status. Use the checkboxes to
          select jobs for bulk actions.
        </Typography>

        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              // Responsive wrapping grid using minmax to allow columns to shrink and avoid horizontal scroll
              gridTemplateColumns: {
                xs: "repeat(1, minmax(0, 1fr))",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(3, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
                xl: "repeat(6, minmax(0, 1fr))",
              },
              alignItems: "stretch",
            }}
          >
            {stagesToRender.map((stage) => {
              const items = jobsByStage[stage] ?? [];
              // apply filter
              const visible =
                filter === "All"
                  ? items
                  : filter === "Selected"
                  ? items.filter((r) => selectedIds[String(r.id)])
                  : items.filter((r) => r.job_status === filter);

              return (
                <Droppable droppableId={stage} key={stage}>
                  {(provided) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      variant="outlined"
                      sx={{
                        minWidth: 0,
                        width: "100%",
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <CardHeader
                        title={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography>{stage}</Typography>
                            <Chip label={counts[stage]} size="small" />
                          </Box>
                        }
                        subheader={`${visible.length} shown`}
                      />
                      <Divider />
                      <CardContent
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                          minHeight: 120,
                        }}
                      >
                        {visible.map((job, idx) => (
                          <Draggable key={String(job.id)} draggableId={String(job.id)} index={idx}>
                            {(prov) => (
                              <Box
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                sx={{
                                  position: "relative",
                                  p: 1,
                                  borderRadius: 1,
                                  border: "1px solid",
                                  borderColor: "divider",
                                  minHeight: 70,
                                  bgcolor: (theme) => {
                                    const token = (() => {
                                      switch (stage) {
                                        case "Interested":
                                          return theme.palette.info;
                                        case "Applied":
                                          return theme.palette.primary;
                                        case "Phone Screen":
                                          return theme.palette.warning;
                                        case "Interview":
                                          return theme.palette.secondary;
                                        case "Offer":
                                          return theme.palette.success;
                                        case "Rejected":
                                          return theme.palette.error;
                                        default:
                                          return undefined;
                                      }
                                    })();
                                    return token?.main ? alpha(token.main, 0.4) : "transparent";
                                  },
                                }}
                              >
                                {/* top-left checkbox */}
                                <Checkbox
                                  size="small"
                                  checked={!!selectedIds[String(job.id)]}
                                  onChange={() => toggleSelect(String(job.id))}
                                  sx={{
                                    position: "absolute",
                                    top: 8,
                                    left: 8,
                                    zIndex: 2,
                                    p: 0,
                                    transform: "scale(0.95)",
                                  }}
                                />

                                {/* three-dots: open details (top-right) */}
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedJobId(String(job.id));
                                    setOpen(true);
                                  }}
                                  sx={{
                                    position: "absolute",
                                    top: 8,
                                    right: 8,
                                    zIndex: 2,
                                    p: 0,
                                    transform: "scale(0.95)",
                                  }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 7a2 2 0 100-4 2 2 0 000 4zm0 4a2 2 0 100-4 2 2 0 000 4zm0 4a2 2 0 100-4 2 2 0 000 4z" fill="currentColor" />
                                  </svg>
                                </IconButton>

                                {/* main content */}
                                <Box sx={{ pl: 6, pr: 6 }}>
                                  <Typography
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: "0.95rem",
                                      lineHeight: 1.15,
                                      // clamp to two lines with ellipsis for long titles
                                      display: "-webkit-box",
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "normal",
                                      // prefer breaking at word boundaries, allow breaking long words if needed
                                      overflowWrap: "anywhere",
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {String(job.job_title ?? job.title ?? "Untitled")}
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
                                    {String(job.company_name ?? job.company ?? "Unknown")}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontSize: "0.7rem", mt: 0.5 }}
                                  >
                                    {daysInStage(job)}
                                  </Typography>
                                </Box>

                                {/* top-left deadline indicator for Interested stage */}
                                {stage === "Interested" && (() => {
                                  const d = daysUntilDeadline(job);
                                  if (d === null) return null;
                                  const token = deadlineColor(d);
                                  const display = Math.max(0, d);
                                  const label = d < 0 ? `Overdue` : display === 0 ? `Due: Today` : `Due: ${display}d`;
                                  return (
                                    <Chip
                                      label={label}
                                      size="small"
                                      sx={{
                                        position: "absolute",
                                        right: 4,
                                        bottom: 8,
                                        bgcolor: (theme) => {
                                          const p = theme.palette as any;
                                          switch (token) {
                                            case "error":
                                              return p.error.main;
                                            case "warning":
                                              return p.warning.main;
                                            case "success":
                                              return p.success.main;
                                            default:
                                              return p.grey?.[300] ?? p.divider;
                                          }
                                        },
                                        color: (theme) => {
                                          const p = theme.palette as any;
                                          const bg =
                                            token === "error"
                                              ? p.error.main
                                              : token === "warning"
                                              ? p.warning.main
                                              : token === "success"
                                              ? p.success.main
                                              : p.grey?.[300];
                                          try {
                                            return theme.palette.getContrastText(bg);
                                          } catch {
                                            return "#000";
                                          }
                                        },
                                        fontWeight: 600,
                                        fontSize: "0.65rem",
                                      }}
                                    />
                                  );
                                })()}

                                {/* removed duplicate three-dots button (we show only the top-right control) */}
                              </Box>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </CardContent>
                    </Card>
                  )}
                </Droppable>
              );
            })}
          </Box>
        </DragDropContext>

        <ConfirmDialog
          open={confirmBulkOpen}
          title="Archive selected jobs?"
          description="This will move the selected jobs to the archive. You can unarchive them later. Continue?"
          confirmText="Archive"
          cancelText="Cancel"
          onClose={() => setConfirmBulkOpen(false)}
          onConfirm={() => {
            // perform the bulk archive
            bulkMove(bulkTarget ?? "archive");
            setConfirmBulkOpen(false);
            setBulkTarget(null);
          }}
        />

        <RightDrawer
          title="Details"
          open={open}
          onClose={() => {
            setOpen(false);
            setSelectedJobId(null);
          }}
        >
          <JobDetails jobId={selectedJobId} />
        </RightDrawer>

        <ErrorSnackbar
          notification={notification}
          onClose={closeNotification}
        />
      </Box>
    </Box>
  );
}
