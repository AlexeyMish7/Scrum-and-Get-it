/**
 * SectionControlsPanel
 * UC-048: Provides visibility toggles, drag-and-drop ordering, and preset application
 * for resume sections, persisting state into the active draft via useResumeDrafts.
 *
 * Sections managed: summary, skills, experience, education, projects.
 * Persistence: localStorage through useResumeDrafts updateContent helper.
 * Error Modes: If no active draft selected, controls are disabled and a hint rendered.
 */
import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  Stack,
  Button,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import useResumeDrafts from "@workspaces/ai/hooks/useResumeDrafts";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";

// Canonical section keys + display labels
const SECTION_LABELS: Record<string, string> = {
  summary: "Summary",
  skills: "Skills",
  experience: "Experience",
  education: "Education",
  projects: "Projects",
};

// Preset names for user selection mapping to applyPreset variants
const PRESET_MAP: Record<string, "chronological" | "functional" | "hybrid"> = {
  Chronological: "chronological",
  Functional: "functional",
  Hybrid: "hybrid",
};

export default function SectionControlsPanel() {
  const { active, setVisibleSections, setSectionOrder, applyPreset } =
    useResumeDrafts();
  const { handleError } = useErrorHandler();
  const [presetName, setPresetName] = React.useState<string>("Custom");

  // Local derived state from draft (falls back to canonical default ordering)
  const order = React.useMemo(() => {
    return active?.content.sectionOrder?.length
      ? active.content.sectionOrder
      : Object.keys(SECTION_LABELS);
  }, [active]);

  const visible = React.useMemo(() => {
    return active?.content.visibleSections?.length
      ? active.content.visibleSections
      : Object.keys(SECTION_LABELS);
  }, [active]);

  const [dragOrder, setDragOrder] = React.useState<string[]>(order);

  React.useEffect(() => {
    setDragOrder(order);
  }, [order]);

  function toggleVisibility(key: string) {
    if (!active)
      return handleError?.(new Error("Select an active draft first"));
    const next = visible.includes(key)
      ? visible.filter((s) => s !== key)
      : [...visible, key];
    setVisibleSections(next);
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const items = Array.from(dragOrder);
    const [removed] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, removed);
    setDragOrder(items);
    if (!active) return;
    setSectionOrder(items);
  }

  function applyPresetSelection(name: string) {
    setPresetName(name);
    const mapped = PRESET_MAP[name];
    if (!mapped) return; // Custom chosen
    applyPreset(mapped);
  }

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Section Customization</Typography>
          {!active && (
            <Typography color="warning.main" variant="body2">
              Select or create a draft to customize sections.
            </Typography>
          )}

          <FormControl size="small" sx={{ maxWidth: 220 }}>
            <InputLabel>Preset</InputLabel>
            <Select
              label="Preset"
              value={presetName}
              onChange={(e) => applyPresetSelection(e.target.value)}
              disabled={!active}
            >
              <MenuItem value="Custom">Custom</MenuItem>
              {Object.keys(PRESET_MAP).map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider />

          <Typography variant="subtitle2" color="text.secondary">
            Visibility & Order
          </Typography>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="resumeSections">
              {(provided) => (
                <Box ref={provided.innerRef} {...provided.droppableProps}>
                  {dragOrder.map((key, idx) => {
                    const label = SECTION_LABELS[key] || key;
                    const isVisible = visible.includes(key);
                    return (
                      <Draggable key={key} draggableId={key} index={idx}>
                        {(p) => (
                          <Box
                            ref={p.innerRef}
                            {...p.draggableProps}
                            {...p.dragHandleProps}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              border: "1px solid",
                              borderColor: "divider",
                              px: 1.5,
                              py: 1,
                              mb: 1,
                              borderRadius: 1,
                              bgcolor: isVisible
                                ? "background.paper"
                                : "action.hover",
                              opacity: isVisible ? 1 : 0.6,
                              transition: "background-color 0.15s",
                            }}
                          >
                            <Typography variant="body2">{label}</Typography>
                            <Switch
                              size="small"
                              checked={isVisible}
                              onChange={() => toggleVisibility(key)}
                              disabled={!active}
                            />
                          </Box>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>

          <Divider />
          <Typography variant="subtitle2" color="text.secondary">
            Preview (Draft Data)
          </Typography>
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              p: 1,
            }}
          >
            {dragOrder
              .filter((k) => visible.includes(k))
              .map((k) => (
                <Box key={k} sx={{ mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {SECTION_LABELS[k] || k}
                  </Typography>
                  <Box sx={{ ml: 1 }}>
                    {k === "summary" && active?.content.summary && (
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {active.content.summary}
                      </Typography>
                    )}
                    {k === "skills" && active?.content.skills && (
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {active.content.skills.join(", ")}
                      </Typography>
                    )}
                    {k === "experience" && active?.content.experience && (
                      <Stack spacing={0.5}>
                        {active.content.experience.map((e, i) => (
                          <Typography key={i} variant="body2">
                            • {e.role}
                            {e.company ? ` @ ${e.company}` : ""}
                          </Typography>
                        ))}
                      </Stack>
                    )}
                    {k === "education" && (
                      <Typography variant="body2" color="text.disabled">
                        (Education data not yet linked)
                      </Typography>
                    )}
                    {k === "projects" && (
                      <Typography variant="body2" color="text.disabled">
                        (Projects data not yet linked)
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            {dragOrder.filter((k) => visible.includes(k)).length === 0 && (
              <Typography variant="caption" color="text.disabled">
                No sections selected.
              </Typography>
            )}
          </Box>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              if (!active)
                return handleError?.(new Error("Select a draft first"));
              // Reset to default hybrid arrangement
              applyPreset("hybrid");
              setPresetName("Hybrid");
            }}
            disabled={!active}
            sx={{ mt: 1, alignSelf: "flex-start" }}
          >
            Reset to Default
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
