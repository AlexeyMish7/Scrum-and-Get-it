import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  levelLabels,
  skillCategoryOptions,
} from "../../../../constants/skills";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../shared/context/AuthContext";
import skillsService from "../../services/skills";
import type {
  SkillItem,
  DropResult,
  DroppableProvided,
  DraggableProvided,
  Skill,
  Category,
} from "../../types/skill.ts";
import { useErrorHandler } from "../../../../shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "../../../../shared/components/common/ErrorSnackbar";
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
} from "@mui/material";
import LoadingSpinner from "../../../../shared/components/common/LoadingSpinner";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import "./SkillsOverview.css";

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
  const { user, loading } = useAuth();
  const { handleError, notification, closeNotification, showSuccess } =
    useErrorHandler();
  const navigate = useNavigate();
  // Local UI state (simple and user-facing):
  // - `categories` holds the visible columns and their skills
  // - `isLoading`/`search` control small bits of UI
  // Put handleError into a ref so the fetch effect can call a stable
  // reference without re-running when the hook returns a new function
  // identity on every render. This prevents an effect loop that made
  // the page flash/loading spinner repeatedly.
  const handleErrorRef = useRef(handleError);
  useEffect(() => {
    handleErrorRef.current = handleError;
  }, [handleError]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

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

        // Log payload in case devs need to inspect network requests.
        console.debug("skills:update-payload", updatesPayload);
        const batchRes = await skillsService.batchUpdateSkills(
          user.id,
          updatesPayload
        );
        console.debug("skills:update-response", batchRes);
        if (batchRes.error) {
          // Surface a friendly message and make the `catch` block restore UI
          handleErrorRef.current?.(
            batchRes.error || "Failed to save skill order"
          );
          throw batchRes.error;
        }

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
            skillCategoryOptions.forEach((c) => (byCategory[c] = []));

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
        } catch (e) {
          console.debug("skills:merge-error", e);
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

  useEffect(() => {
    if (loading) {
      setIsLoading(true);
      return;
    }
    if (!user) {
      setCategories([]);
      setIsLoading(false);
      return;
    }

    let mounted = true;
    // Fetch skills for the current user and map them into simple
    // category columns. We normalize a few field names so the UI can
    // handle different shapes returned by the service.
    const fetchSkills = async () => {
      setIsLoading(true);
      try {
        const res = await skillsService.listSkills(user.id);
        if (res.error) {
          console.error("Failed to load skills for overview", res.error);
          handleErrorRef.current?.(res.error);
          if (mounted) setCategories([]);
          return;
        }
        const rows = (res.data ?? []) as SkillItem[];
        const byCategory: Record<string, Skill[]> = {};
        // Ensure common categories exist even when empty so users can drop into them.
        // Use shared category options so the overview and add pages stay consistent.
        skillCategoryOptions.forEach(
          (c) => (byCategory[c] = byCategory[c] || [])
        );
        const enumToNum: Record<string, number> = {
          beginner: 1,
          intermediate: 2,
          advanced: 3,
          expert: 4,
        };
        rows.forEach((r) => {
          // support multiple possible field names coming from the service
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
          // level can be stored as enum string or a number; normalize safely
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
        // Prefer a stored position for ordering when present so reorders
        // survive page reloads. Otherwise fall back to name order.
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
        if (!mounted) return;
        setCategories(mappedCats);
      } catch (err) {
        console.error("Error fetching skills overview", err);
        handleErrorRef.current?.(err);
        if (mounted) setCategories([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchSkills();

    return () => {
      mounted = false;
    };
  }, [user, loading]);

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

  if (isLoading || loading) return <LoadingSpinner />;

  return (
    <Box className="skills-overview">
      {/* ✅ Button moved ABOVE the title */}
      <Button
        variant="primary"
        className="glossy-btn"
        onClick={() => navigate("/skills/manage")}
      >
        Manage skills
      </Button>

      <div className="skills-header">
        <Typography variant="h2" className="glossy-title">
          Skills Overview
        </Typography>
        <Typography className="glossy-subtitle">
          Organize and reorder your skills.
        </Typography>
      </div>

      <Stack direction="row" spacing={2} mb={3} className="skills-actions">
        <TextField
          aria-label="Search skills"
          label="Search skills..."
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button variant="secondary" onClick={handleExport}>
          Export Skills
        </Button>
      </Stack>

      <DragDropContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragUpdate={handleDragUpdate}
      >
        <div className="skills-columns">
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
                    className="glossy-card skills-column"
                  >
                    <CardHeader
                      title={`${category.name} (${category.skills.length})`}
                      subheader={`Avg Level: ${avgLevel}`}
                    />
                    <Divider />
                    <CardContent className="skills-column-content" role="list">
                      {category.skills.length === 0 && (
                        <Typography color="text.secondary" fontStyle="italic">
                          No skills found.
                        </Typography>
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
                              className="skill-item"
                              role="listitem"
                              tabIndex={0}
                            >
                              <Typography>{skill.name}</Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Level: {levelLabels[skill.level] || "Unknown"}
                              </Typography>
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
        </div>
      </DragDropContext>
      {/* Global error/success snackbar (centralized) */}
      <ErrorSnackbar notification={notification} onClose={closeNotification} />
    </Box>
  );
};

export default SkillsOverview;
