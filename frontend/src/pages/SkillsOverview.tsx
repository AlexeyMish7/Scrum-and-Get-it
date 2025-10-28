import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import crud from "../services/crud";
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
import LoadingSpinner from "../components/LoadingSpinner";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

type DropResult = {
  source: { droppableId: string; index: number };
  destination?: { droppableId: string; index: number } | null;
};

type DroppableProvided = {
  innerRef: (el: HTMLElement | null) => void;
  droppableProps: Record<string, unknown>;
  placeholder?: React.ReactNode;
};

type DraggableProvided = {
  innerRef: (el: HTMLElement | null) => void;
  draggableProps: Record<string, unknown>;
  dragHandleProps?: Record<string, unknown>;
};

type Skill = {
  id: string;
  name: string;
  level: number; // 1–5
};

type Category = {
  id: string;
  name: string;
  skills: Skill[];
};

const SkillsOverview: React.FC = () => {
  const { user, loading } = useAuth();
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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceCatIndex = categories.findIndex(
      (c) => c.id === source.droppableId
    );
    const destCatIndex = categories.findIndex(
      (c) => c.id === destination.droppableId
    );

    const sourceCat = { ...categories[sourceCatIndex] };
    const destCat = { ...categories[destCatIndex] };
    const [movedSkill] = sourceCat.skills.splice(source.index, 1);

    destCat.skills.splice(destination.index, 0, movedSkill);

    const newCats = [...categories];
    newCats[sourceCatIndex] = sourceCat;
    newCats[destCatIndex] = destCat;
    setCategories(newCats);
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
    const fetchSkills = async () => {
      setIsLoading(true);
      try {
        const userCrud = crud.withUser(user.id);
        const res = await userCrud.listRows(
          "skills",
          "id,skill_name,proficiency_level,skill_category"
        );
        if (res.error) {
          console.error("Failed to load skills for overview", res.error);
          if (mounted) setCategories([]);
          return;
        }
        const rows = Array.isArray(res.data)
          ? res.data
          : res.data
          ? [res.data]
          : [];
        type DbSkill = {
          id?: string;
          skill_name?: string;
          proficiency_level?: string;
          skill_category?: string;
        };
        const byCategory: Record<string, Skill[]> = {};
        const enumToNum: Record<string, number> = {
          beginner: 1,
          intermediate: 2,
          advanced: 3,
          expert: 4,
        };
        (rows as DbSkill[]).forEach((r) => {
          const cat = r.skill_category ?? "Technical";
          const skill: Skill = {
            id:
              r.id ??
              `${r.skill_name ?? "s"}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,
            name: r.skill_name ?? "Unnamed",
            level: enumToNum[r.proficiency_level ?? "beginner"] ?? 1,
          };
          byCategory[cat] = byCategory[cat] || [];
          byCategory[cat].push(skill);
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
    <Box p={3}>
      {/* ✅ Button moved ABOVE the title */}
      <Button
        variant="contained"
        sx={{ mb: 2 }}
        onClick={() => (window.location.href = "/skills/manage")}
      >
        Add Skill
      </Button>

      <Typography variant="h2" mb={2}>
        Skills Overview
      </Typography>

      <Stack direction="row" spacing={2} mb={3}>
        <TextField
          label="Search skills..."
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button variant="contained" color="primary" onClick={handleExport}>
          Export Skills
        </Button>
      </Stack>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ alignItems: "flex-start", flexWrap: "wrap" }}
        >
          {filteredCategories.map((category) => {
            const avgLevel =
              category.skills.length > 0
                ? (
                    category.skills.reduce((sum, s) => sum + s.level, 0) /
                    category.skills.length
                  ).toFixed(1)
                : "N/A";

            return (
              <Droppable key={category.id} droppableId={category.id}>
                {(provided: DroppableProvided) => (
                  <Card
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                      flex: 1,
                      minWidth: 250,
                      border: "2px solid",
                      borderColor: "divider",
                      bgcolor: "background.paper",
                    }}
                  >
                    <CardHeader
                      title={`${category.name} (${category.skills.length})`}
                      subheader={`Avg Level: ${avgLevel}`}
                    />
                    <Divider />
                    <CardContent>
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
                              sx={{
                                p: 1,
                                mb: 1,
                                bgcolor: "action.hover",
                                borderRadius: 1,
                                cursor: "grab",
                                "&:hover": { bgcolor: "action.selected" },
                              }}
                            >
                              <Typography>{skill.name}</Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Level: {skill.level}
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
        </Stack>
      </DragDropContext>
    </Box>
  );
};

export default SkillsOverview;
