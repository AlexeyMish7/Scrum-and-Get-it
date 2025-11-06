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
} from "@mui/material";
import RightDrawer from "@shared/components/common/RightDrawer";
import { alpha } from "@mui/material/styles";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import ErrorSnackbar from "@shared/components/common/ErrorSnackbar";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import type { ListOptions } from "@shared/services/types";
import { listJobs, updateJob } from "@shared/services/dbMappers";

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
  const [jobsByStage, setJobsByStage] = useState<Record<Stage, JobRow[]>>(() =>
    STAGES.reduce<Record<Stage, JobRow[]>>((acc, s) => {
      acc[s] = [];
      return acc;
    }, {} as Record<Stage, JobRow[]>)
  );

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
  function formatStatusDate(row: JobRow) {
    const d = row.status_changed_at ?? row.updated_at ?? row.created_at;
    if (!d) return "-";
    try {
      const dt = new Date(String(d));
      return dt.toLocaleDateString();
    } catch {
      return String(d);
    }
  }

  // Days since creation (today - created_at). Returns like "3d" or "-" if unknown
  function daysSinceCreated(row: JobRow) {
    const d = row.created_at;
    if (!d) return "-";
    try {
      const then = new Date(String(d));
      const diff = Math.floor((Date.now() - then.getTime()) / (1000 * 60 * 60 * 24));
      return `${diff}d`;
    } catch {
      return "-";
    }
  }

  useEffect(() => {
    let mounted = true;
    if (!user) return;
    const opts: ListOptions = { order: { column: "created_at", ascending: false } };
    (async () => {
      try {
        const res = await listJobs(user.id, opts);
        if (res.error) return handleError(res.error);
        const rows = (res.data ?? []) as JobRow[];
        const grouped = STAGES.reduce<Record<Stage, JobRow[]>>((acc, s) => {
          acc[s] = [];
          return acc;
        }, {} as Record<Stage, JobRow[]>);
        rows.forEach((r) => {
          const status = (r.job_status as Stage) ?? "Interested";
          if (STAGES.includes(status)) grouped[status].push(r);
          else grouped["Interested"].push(r);
        });
        if (!mounted) return;
        setJobsByStage(grouped);
      } catch (err) {
        handleError(err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user, handleError]);

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
  const payload: Record<string, unknown> = { job_status: to, created_at: new Date().toISOString() };
  const jobId = String((moved && (moved.id as string | number)) ?? draggableId);
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

  const bulkMove = async (to: Stage) => {
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
    copy[to].unshift(...movedRows);
    setJobsByStage(copy);

    try {
      if (!user) throw new Error("Not signed in");
      // update each selected job (could be batched server-side later)
      await Promise.all(
        ids.map((id) => updateJob(user.id, id, { job_status: to, created_at: new Date().toISOString() }))
      );
      showSuccess(`Moved ${ids.length} job(s) to ${to}`);
      setSelectedIds({});
    } catch (err) {
      handleError(err);
      // simple rollback by refetching
      if (user) {
        const res = await listJobs(user.id);
        if (!res.error) {
          const rows = (res.data ?? []) as JobRow[];
          const grouped = STAGES.reduce<Record<Stage, JobRow[]>>((acc, s) => {
            acc[s] = [];
            return acc;
          }, {} as Record<Stage, JobRow[]>);
          rows.forEach((r) => {
            const status = (r.job_status as Stage) ?? "Interested";
            if (STAGES.includes(status)) grouped[status].push(r);
            else grouped["Interested"].push(r);
          });
          setJobsByStage(grouped);
        }
      }
    }
  };

  // derive counts
  const counts = STAGES.reduce((acc, s) => ({ ...acc, [s]: jobsByStage[s]?.length ?? 0 }), {} as Record<string, number>);

  // stages to render based on filter: when a specific stage is selected, only show that column
  const stagesToRender: readonly Stage[] =
    filter === "All" || filter === "Selected" ? STAGES : [filter as Stage];

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h4">Jobs Pipeline</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
              <TextField
              select
              label="Filter"
              size="medium"
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'All' | Stage | 'Selected')}
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
              onChange={(e) => bulkMove(e.target.value as Stage)}
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

        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Drag cards between columns to update status. Use the checkboxes to select jobs for bulk actions.
        </Typography>

        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(6, 1fr)",
              },
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
                    <Card ref={provided.innerRef} {...provided.droppableProps} variant="outlined">
                      <CardHeader
                        title={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography>{stage}</Typography>
                            <Chip label={counts[stage]} size="small" />
                          </Box>
                        }
                        subheader={`${visible.length} shown`}
                      />
                      <Divider />
                      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1, minHeight: 120 }}>
                        {visible.length === 0 && (
                          <Typography color="text.secondary" fontStyle="italic">
                            No jobs
                          </Typography>
                        )}
                        {visible.map((job: JobRow, idx: number) => (
                          <Draggable key={String(job.id)} draggableId={String(job.id)} index={idx}>
                            {(prov) => (
                              <Box
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                sx={{
                                  border: "1px solid",
                                  borderColor: "divider",
                                  borderRadius: 1,
                                  p: 1,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 1,
                                  bgcolor: (theme) => {
                                    // Use semantic palette tokens and apply a subtle alpha so the
                                    // background adapts to light/dark themes per THEME guide.
                                    const pal = theme.palette as Record<string, any>;
                                    const pick = (key: string) => pal[key]?.main ?? pal[key];
                                    const col = (() => {
                                      switch (stage) {
                                        case "Interested":
                                          return pick("info");
                                        case "Applied":
                                          return pick("primary");
                                        case "Phone Screen":
                                          return pick("warning");
                                        case "Interview":
                                          // prefer tertiary if present, fallback to secondary
                                          return pick("tertiary") ?? pick("secondary");
                                        case "Offer":
                                          return pick("success");
                                        case "Rejected":
                                          return pick("error");
                                        default:
                                          return null;
                                      }
                                    })();
                                    return col ? alpha(col, 0.40) : "transparent";
                                  },
                                }}
                              >
                                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                  <Checkbox checked={!!selectedIds[String(job.id)]} onChange={() => toggleSelect(String(job.id))} />
                                  <Box>
                                    <Typography sx={{ fontWeight: 600 }}>{String(job.job_title ?? job.title ?? "Untitled")}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {String(job.company_name ?? job.company ?? "Unknown")}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                                      {formatStatusDate(job)} · {daysSinceCreated(job)}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                  <IconButton size="small" onClick={() => { setOpen(true); /* could set selected job into a details drawer */ }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 7a2 2 0 100-4 2 2 0 000 4zm0 4a2 2 0 100-4 2 2 0 000 4zm0 4a2 2 0 100-4 2 2 0 000 4z" fill="currentColor"/></svg>
                                  </IconButton>
                                </Box>
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
        
        <RightDrawer title="Details" open={open} onClose={() => setOpen(false)}>
          <Typography>Job details and editors will appear here.</Typography>
        </RightDrawer>

        <ErrorSnackbar notification={notification} onClose={closeNotification} />
      </Box>
    </Box>
  );
}
