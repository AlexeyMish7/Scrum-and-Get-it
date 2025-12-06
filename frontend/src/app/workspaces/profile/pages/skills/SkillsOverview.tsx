import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatNumericLevel, SKILL_CATEGORY_OPTIONS } from "@shared/constants";
import { useAuth } from "@shared/context/AuthContext";
import { profileKeys } from "@profile/cache";
import skillsService from "../../services/skills";
import { Breadcrumbs } from "@shared/components/navigation";
import type {
  SkillItem,
  DropResult,
  DroppableProvided,
  DraggableProvided,
  Skill,
  Category,
} from "../../types/skill.ts";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "@shared/components/feedback/ErrorSnackbar";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Divider,
  IconButton,
} from "@mui/material";
import Icon from "@shared/components/common/Icon";
import LoadingSpinner from "@shared/components/feedback/LoadingSpinner";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { AddSkillDialog } from "../../components/dialogs/AddSkillDialog";
import { useSkillsList } from "@profile/cache";

/*
  SkillsOverview — plain-language notes

  What this component does (short):
  - Shows the user's skills grouped into simple columns (categories).
  - Lets the user reorder skills inside a category by dragging items.
  - Prevents moving a skill into a different category; if attempted,
    the UI snaps back and shows a small error message.
  - When a reorder is made, the new ordering is saved to the backend
    (using a compact batch update) and a short success snackbar appears.

  Why some choices were made:
  - We keep a small in-memory `position` for each skill so ordering
    survives page refresh without changing the DB schema.
  - We snapshot the list at drag-start so we can always restore the
    previous layout if the save fails or the user tries an invalid move.
*/

// No fake/default categories — start empty and show a loading spinner while
// the real user-scoped skills are being fetched. This prevents a flash of
// placeholder data when switching pages.

// Friendly labels shown to users for numeric skill levels are centralized
// in src/constants/skills.ts so other components reuse the same labels.

const SkillsOverview: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { handleError, notification, closeNotification, showSuccess } =
    useErrorHandler();

  // Use React Query hook for cached skills data
  const { data: skillsData, isLoading: queryLoading } = useSkillsList();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [selectedSkillForEdit, setSelectedSkillForEdit] = useState<
    | {
        id: string;
        name: string;
        category: string;
        level: string;
      }
    | undefined
  >(undefined);

  // Local UI state (simple and user-facing):
  // - `categories` holds the visible columns and their skills
  // - `search` controls filtering
  // Put handleError into a ref so the fetch effect can call a stable
  // reference without re-running when the hook returns a new function
  // identity on every render.
  const handleErrorRef = useRef(handleError);
  useEffect(() => {
    handleErrorRef.current = handleError;
  }, [handleError]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");

  // Transform raw skills data into category columns
  const transformSkillsToCategories = useCallback(
    (rows: SkillItem[]): Category[] => {
      const byCategory: Record<string, Skill[]> = {};
      // Ensure common categories exist even when empty
      SKILL_CATEGORY_OPTIONS.forEach(
        (c) => (byCategory[c] = byCategory[c] || [])
      );
      const enumToNum: Record<string, number> = {
        beginner: 1,
        intermediate: 2,
        advanced: 3,
        expert: 4,
      };
      rows.forEach((r) => {
        const alt = r as unknown as Record<string, unknown>;
        const cat =
          r.category ??
          (typeof alt.skill_category === "string"
            ? (alt.skill_category as string)
            : undefined) ??
          "Technical";
        const name =
          r.name ??
          (typeof alt.skill_name === "string"
            ? (alt.skill_name as string)
            : undefined) ??
          "Unnamed";
        const rawLevel = r.level ?? "beginner";
        const lvlStr =
          typeof rawLevel === "string" ? rawLevel : String(rawLevel);
        const levelNum = enumToNum[lvlStr.toLowerCase()] ?? 1;

        const skill: Skill = {
          id:
            r.id ??
            ((): string => {
              const maybeRand = (
                globalThis.crypto as unknown as {
                  randomUUID?: () => string;
                }
              ).randomUUID;
              return typeof maybeRand === "function"
                ? maybeRand()
                : `${name}-${Math.random().toString(36).slice(2, 8)}`;
            })(),
          name,
          level: levelNum,
          position: r.position,
        };
        byCategory[cat] = byCategory[cat] || [];
        byCategory[cat].push(skill);
      });

      // Sort by position then name
      Object.keys(byCategory).forEach((k) => {
        byCategory[k].sort((a, b) => {
          const pa =
            typeof a.position === "number"
              ? a.position
              : Number.POSITIVE_INFINITY;
          const pb =
            typeof b.position === "number"
              ? b.position
              : Number.POSITIVE_INFINITY;
          if (pa !== pb) return pa - pb;
          return a.name.localeCompare(b.name);
        });
      });

      return Object.entries(byCategory).map(([k, v]) => ({
        id: k.toLowerCase().replace(/\s+/g, "-"),
        name: k,
        skills: v,
      }));
    },
    []
  );

  // Update categories when skills data changes
  useEffect(() => {
    if (skillsData) {
      setCategories(transformSkillsToCategories(skillsData));
    }
  }, [skillsData, transformSkillsToCategories]);

  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    return categories.map((cat) => ({
      ...cat,
      skills: cat.skills.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
      ),
    }));
  }, [categories, search]);

  const dragSourceRef = useRef<DropResult["source"] | null>(null);
  const preDragRef = useRef<Category[] | null>(null);

  const handleDragStart = (start: {
    source: { droppableId: string; index: number };
  }) => {
    // Take a stable snapshot at the start of drag so we can always roll back
    // to the previous layout if the user tries an invalid move or the save
    // to the server fails. This keeps the UI feeling safe and predictable.
    preDragRef.current = categories.map((c) => ({
      ...c,
      skills: [...c.skills],
    }));
    dragSourceRef.current = start.source ?? null;
  };

  const handleDragUpdate = (update: {
    destination?: { droppableId: string; index: number } | null;
    source?: { droppableId: string; index: number };
  }) => {
    // While the user is dragging, update the visible columns so the item
    // follows the pointer. We work against the filtered view (so search
    // doesn't confuse the positions) and then map back to the full
    // categories list by id before committing the temporary visual change.
    const { destination, source } = update;
    if (!destination || !source) return;

    const srcFilteredIdx = filteredCategories.findIndex(
      (c) => c.id === source.droppableId
    );
    const dstFilteredIdx = filteredCategories.findIndex(
      (c) => c.id === destination.droppableId
    );
    if (srcFilteredIdx < 0 || dstFilteredIdx < 0) return;

    // Save a copy of current categories for rollback if needed
    const prev = categories.map((c) => ({ ...c, skills: [...c.skills] }));
    if (!preDragRef.current) preDragRef.current = prev;
    // Do NOT allow moving between categories — if destination differs,
    // revert any visual change. This prevents cross-category moves.
    if (source.droppableId !== destination.droppableId) {
      setCategories(prev);
      return;
    }

    // If nothing changed, skip
    if (srcFilteredIdx === dstFilteredIdx && source.index === destination.index)
      return;

    const movedSkill = filteredCategories[srcFilteredIdx].skills[source.index];
    if (!movedSkill) return;

    // Clone full categories state so we can safely mutate for the preview
    const full = categories.map((c) => ({ ...c, skills: [...c.skills] }));

    const srcFullIdx = full.findIndex(
      (c) => c.id === filteredCategories[srcFilteredIdx].id
    );
    const dstFullIdx = full.findIndex(
      (c) => c.id === filteredCategories[dstFilteredIdx].id
    );
    if (srcFullIdx < 0 || dstFullIdx < 0) return;

    // Remove the dragged item by id from the source so insertion is clean
    full[srcFullIdx].skills = full[srcFullIdx].skills.filter(
      (s) => s.id !== movedSkill.id
    );

    // Compute insertion index in destination full list. We map the filtered destination
    // index to an anchor skill id (if any) and find its index in the full list.
    const filteredDest = filteredCategories[dstFilteredIdx];
    let insertIndex = full[dstFullIdx].skills.length; // default append
    if (destination.index < filteredDest.skills.length) {
      const anchor = filteredDest.skills[destination.index];
      const anchorIdx = full[dstFullIdx].skills.findIndex(
        (s) => s.id === anchor.id
      );
      insertIndex = anchorIdx >= 0 ? anchorIdx : full[dstFullIdx].skills.length;
    }

    // Insert the moved skill object (preserve its data) into destination
    full[dstFullIdx].skills.splice(insertIndex, 0, movedSkill);

    // Apply the temporary visual state while dragging
    setCategories(full);
    dragSourceRef.current = source ?? null;
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    // Use draggableId (safer than relying on filtered lists) to find the moved item
    const { source, destination } = result;
    const movedId = result.draggableId;

    // Disallow moving between categories. If the user dropped into a
    // different column, restore the layout we snapped at drag-start and
    // show a short error message explaining the rule.
    if (source.droppableId !== destination.droppableId) {
      setCategories(
        preDragRef.current ??
          categories.map((c) => ({ ...c, skills: [...c.skills] }))
      );
      handleErrorRef.current?.(
        "You can't move skills between categories — only the position within the same category matters."
      );
      preDragRef.current = null;
      return;
    }

    // Clone the current categories so we can compute the final ordering
    // and also keep a `prev` to restore if saving fails.
    const prev = categories.map((c) => ({ ...c, skills: [...c.skills] }));
    const full = prev.map((c) => ({ ...c, skills: [...c.skills] }));

    const srcFullIdx = full.findIndex((c) => c.id === source.droppableId);
    const dstFullIdx = full.findIndex((c) => c.id === destination.droppableId);
    if (srcFullIdx < 0 || dstFullIdx < 0) return;

    // Find the moved skill object in the source full list by id
    const movedSkill = full[srcFullIdx].skills.find((s) => s.id === movedId);
    if (!movedSkill) return;

    // To compute a stable insertion index we capture the destination's
    // visible IDs BEFORE removing the moved item. This avoids off-by-one
    // issues when the item is moved within the same list and elements
    // shift during removal.
    const destIdsBefore = full[dstFullIdx].skills.map((s) => s.id);

    // Remove the moved skill from the source list (by id) before inserting
    full[srcFullIdx].skills = full[srcFullIdx].skills.filter(
      (s) => s.id !== movedSkill.id
    );

    // Compute insertion index in destination full list robustly.
    // If the destination index is beyond visible items, append. Otherwise
    // map the anchor id from the visible list to its index in the full list
    // after removal.
    let insertIndex = full[dstFullIdx].skills.length;
    if (destination.index < destIdsBefore.length) {
      const anchorId = destIdsBefore[destination.index];
      const anchorIdx = full[dstFullIdx].skills.findIndex(
        (s) => s.id === anchorId
      );
      insertIndex = anchorIdx >= 0 ? anchorIdx : full[dstFullIdx].skills.length;
    }

    // Insert into the final position and update the UI optimistically
    full[dstFullIdx].skills.splice(insertIndex, 0, movedSkill);
    setCategories(full);

    // Persist the new ordering and category to the backend (optimistic update).
    // We update `meta.position` for every affected skill in the source and
    // destination categories so the ordering is deterministic after reload.
    (async () => {
      try {
        if (!user || !movedSkill?.id) return;
        // Build a compact updates array for batch persistence. We only need to
        // update skills in the two affected categories (source and dest).
        const updatesPayload: Array<{
          id: string;
          skill_category?: string;
          meta?: Record<string, unknown>;
        }> = [];

        const dst = full[dstFullIdx];
        dst.skills.forEach((s, idx) => {
          const u: {
            id: string;
            skill_category?: string;
            meta?: Record<string, unknown>;
          } = {
            id: s.id,
            meta: { position: idx },
          };
          if (s.id === movedSkill.id) u.skill_category = dst.name;
          updatesPayload.push(u);
        });

        if (srcFullIdx !== dstFullIdx) {
          const src = full[srcFullIdx];
          src.skills.forEach((s, idx) => {
            updatesPayload.push({ id: s.id, meta: { position: idx } });
          });
        }

        const batchRes = await skillsService.batchUpdateSkills(
          user.id,
          updatesPayload
        );
        if (batchRes.error) {
          // Surface a friendly message and make the `catch` block restore UI
          handleErrorRef.current?.(
            batchRes.error || "Failed to save skill order"
          );
          throw batchRes.error;
        }

        // Invalidate React Query cache so all components get fresh data
        await queryClient.invalidateQueries({
          queryKey: profileKeys.skills(user.id),
        });

        // On success show a brief confirmation and notify other pages
        showSuccess("Skill order saved");
        window.dispatchEvent(new CustomEvent("skills:changed"));

        // If the batch update returned authoritative updated rows, merge
        // them into the local categories state to avoid an extra refetch.
        try {
          const updatedRows = (batchRes.data as SkillItem[]) ?? [];
          if (updatedRows.length > 0) {
            // Build a map of category buckets using the shared category list
            const byCategory: Record<string, Skill[]> = {};
            SKILL_CATEGORY_OPTIONS.forEach((c) => (byCategory[c] = []));

            const enumToNum: Record<string, number> = {
              beginner: 1,
              intermediate: 2,
              advanced: 3,
              expert: 4,
            };

            // Start with a fresh population: include existing skills that
            // were NOT part of the update, and then place updated rows at
            // their new positions. This avoids duplicates or stale entries.
            const updatedIds = new Set(updatedRows.map((r) => r.id));

            // Add existing non-updated skills into their current buckets
            categories.forEach((cat) => {
              cat.skills.forEach((s) => {
                if (!updatedIds.has(s.id)) {
                  byCategory[cat.name] = byCategory[cat.name] || [];
                  byCategory[cat.name].push(s);
                }
              });
            });

            // Insert updated rows into their declared category/position
            updatedRows.forEach((r) => {
              const alt = r as unknown as Record<string, unknown>;
              const cat =
                r.category ??
                (typeof alt.skill_category === "string"
                  ? (alt.skill_category as string)
                  : undefined) ??
                "Technical";
              const name =
                r.name ??
                (typeof alt.skill_name === "string"
                  ? (alt.skill_name as string)
                  : undefined) ??
                "Unnamed";
              const rawLevel = r.level ?? "beginner";
              const lvlStr =
                typeof rawLevel === "string" ? rawLevel : String(rawLevel);
              const levelNum = enumToNum[lvlStr.toLowerCase()] ?? 1;
              const skill: Skill = {
                id: r.id ?? `${name}-${Math.random().toString(36).slice(2, 8)}`,
                name,
                level: levelNum,
                position: r.position,
              };
              byCategory[cat] = byCategory[cat] || [];
              byCategory[cat].push(skill);
            });

            // Sort buckets by position (fallback to name)
            Object.keys(byCategory).forEach((k) => {
              byCategory[k].sort((a, b) => {
                const pa =
                  typeof a.position === "number"
                    ? a.position
                    : Number.POSITIVE_INFINITY;
                const pb =
                  typeof b.position === "number"
                    ? b.position
                    : Number.POSITIVE_INFINITY;
                if (pa !== pb) return pa - pb;
                return a.name.localeCompare(b.name);
              });
            });

            const mappedCats: Category[] = Object.entries(byCategory).map(
              ([k, v]) => ({
                id: k.toLowerCase().replace(/\s+/g, "-"),
                name: k,
                skills: v,
              })
            );
            setCategories(mappedCats);
          }
        } catch {
          // Non-critical: merge failed, user can refresh to see updated data
        }
      } catch (err) {
        // rollback UI and surface error
        handleErrorRef.current?.(err);
        setCategories(prev);
      } finally {
        dragSourceRef.current = null;
        preDragRef.current = null;
      }
    })();
  };

  const handleExport = () => {
    const exportData = categories.map((cat) => ({
      category: cat.name,
      skills: cat.skills.map((s) => ({
        name: s.name,
        level: s.level,
      })),
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "skills_by_category.json";
    link.click();
  };

  const handleOpenAddDialog = () => {
    setDialogMode("add");
    setSelectedSkillForEdit(undefined);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (skill: Skill, categoryName: string) => {
    setDialogMode("edit");
    setSelectedSkillForEdit({
      id: skill.id,
      name: skill.name,
      category: categoryName,
      level: formatNumericLevel(skill.level),
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedSkillForEdit(undefined);
  };

  const handleDialogSuccess = () => {
    // Use React Query refetch to update cached skills data
    refetchSkills();
  };

  if (queryLoading || authLoading) return <LoadingSpinner />;

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Breadcrumbs
          items={[{ label: "Profile", path: "/profile" }, { label: "Skills" }]}
        />
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Button variant="contained" onClick={handleOpenAddDialog}>
            Add skill
          </Button>
          <Stack direction="row" spacing={2}>
            <TextField
              aria-label="Search skills"
              label="Search skills..."
              variant="outlined"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button variant="outlined" onClick={handleExport}>
              Export Skills
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ mb: 2 }}>
          <Typography variant="h3">Skills Overview</Typography>
          <Typography variant="body2" color="text.secondary">
            Organize and reorder your skills.
          </Typography>
        </Box>

        <DragDropContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragUpdate={handleDragUpdate}
        >
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "1fr 1fr 1fr",
                lg: "1fr 1fr 1fr 1fr",
              },
            }}
          >
            {filteredCategories.map((category) => {
              const avgLevel =
                category.skills.length > 0
                  ? (
                      category.skills.reduce(
                        (sum, s) => sum + (s?.level ?? 0),
                        0
                      ) / category.skills.length
                    ).toFixed(1)
                  : "N/A";

              return (
                <Droppable key={category.id} droppableId={category.id}>
                  {(provided: DroppableProvided) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      variant="outlined"
                    >
                      <CardHeader
                        title={`${category.name} (${category.skills.length})`}
                        subheader={`Avg Level: ${avgLevel}`}
                      />
                      <Divider />
                      <CardContent
                        role="list"
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        {category.skills.length === 0 && (
                          <Box sx={{ py: 4, textAlign: "center" }}>
                            <Typography color="text.secondary">
                              No skills in this category
                            </Typography>
                          </Box>
                        )}
                        {category.skills.map((skill, index) => (
                          <Draggable
                            key={skill.id}
                            draggableId={skill.id}
                            index={index}
                          >
                            {(provided: DraggableProvided) => (
                              <Box
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                role="listitem"
                                tabIndex={0}
                                sx={{
                                  border: "1px solid",
                                  borderColor: "divider",
                                  borderRadius: 1,
                                  p: 1,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 1,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    flex: 1,
                                  }}
                                >
                                  <Typography>{skill.name}</Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Level: {formatNumericLevel(skill.level)}
                                  </Typography>
                                </Box>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditDialog(skill, category.name);
                                  }}
                                  aria-label={`Edit ${skill.name}`}
                                >
                                  <Icon name="Edit" size={16} />
                                </IconButton>
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

        {/* Add/Edit Skill Dialog */}
        <AddSkillDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          onSuccess={handleDialogSuccess}
          mode={dialogMode}
          existingSkill={selectedSkillForEdit}
          existingSkills={categories.flatMap((cat) =>
            cat.skills.map((s) => ({ name: s.name }))
          )}
        />

        {/* Global error/success snackbar (centralized) */}
        <ErrorSnackbar
          notification={notification}
          onClose={closeNotification}
        />
      </Box>
    </Box>
  );
};

export default SkillsOverview;
