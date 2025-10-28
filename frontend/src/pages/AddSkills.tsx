import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import crud from "../services/crud";
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
} from "@mui/material";

type SkillItem = {
  id?: string;
  name: string;
  category: string;
  level: string;
};

const skillLevelOptions = ["Beginner", "Intermediate", "Advanced", "Expert"];

const suggestedSkillList = [
  "React",
  "TypeScript",
  "Python",
  "Communication",
  "Teamwork",
  "SQL",
  "Java",
  "Public Speaking",
];

const skillCategoryOptions = [
  "Technical",
  "Soft Skills",
  "Languages",
  "Industry-Specific",
];

const AddSkills = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [userSkills, setUserSkills] = useState<SkillItem[]>([]);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

  const [selectedSkillIndex, setSelectedSkillIndex] = useState<number | null>(
    null
  );
  const [tempEditLevel, setTempEditLevel] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAddSkill = () => {
    (async () => {
      if (!selectedSkill || !selectedCategory || !selectedLevel) {
        alert("Please fill out all fields before adding a skill.");
        return;
      }
      if (isAdding) return; // prevent double submit
      setIsAdding(true);
      const exists = userSkills.some(
        (skill) => skill.name.toLowerCase() === selectedSkill.toLowerCase()
      );
      if (exists) {
        alert("You already added this skill!");
        setIsAdding(false);
        return;
      }

      if (user) {
        try {
          const userCrud = crud.withUser(user.id);
          const payload: {
            skill_name: string;
            proficiency_level: string;
            skill_category: string;
          } = {
            skill_name: selectedSkill,
            proficiency_level: selectedLevel.toLowerCase(),
            skill_category: selectedCategory,
          };
          const res = await userCrud.insertRow("skills", payload, "*");
          if (res.error) {
            alert("Error adding skill: " + res.error.message);
            setIsAdding(false);
            return;
          }
          const inserted = Array.isArray(res.data) ? res.data[0] : res.data;
          const newSkill: SkillItem = {
            id: inserted?.id,
            name: inserted?.skill_name ?? selectedSkill,
            category: inserted?.skill_category ?? selectedCategory,
            level: (inserted?.proficiency_level ?? selectedLevel).replace(
              /^./,
              (c: string) => c.toUpperCase()
            ),
          };
          setUserSkills((s) => [...s, newSkill]);
          try {
            window.dispatchEvent(new CustomEvent("skills:changed"));
          } catch {
            /* noop */
          }
        } catch (err) {
          console.error(err);
          console.error(err);
          alert("Failed to add skill");
          setIsAdding(false);
          return;
        }
      } else {
        const newSkill: SkillItem = {
          name: selectedSkill,
          category: selectedCategory,
          level: selectedLevel,
        };
        setUserSkills((s) => [...s, newSkill]);
        try {
          window.dispatchEvent(new CustomEvent("skills:changed"));
        } catch {
          /* noop */
        }
      }

      setSelectedSkill("");
      setSelectedCategory("");
      setSelectedLevel("");
      setIsAdding(false);
    })();
  };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setUserSkills([]);
      return;
    }

    let mounted = true;

    // Reusable loader so we can refresh from the server after mutations
    const loadSkills = async () => {
      try {
        const userCrud = crud.withUser(user.id);
        const res = await userCrud.listRows(
          "skills",
          "id,skill_name,proficiency_level,skill_category",
          { order: { column: "skill_name", ascending: true } }
        );
        if (res.error) {
          console.error("Failed to fetch skills", res.error);
          return;
        }
        const rows = Array.isArray(res.data)
          ? res.data
          : res.data
          ? [res.data]
          : [];
        type DbRow = {
          id?: string;
          skill_name?: string;
          proficiency_level?: string;
          skill_category?: string;
        };
        const mapped = (rows as DbRow[]).map(
          (r) =>
            ({
              id: r.id,
              name: r.skill_name ?? "",
              category: r.skill_category ?? "Technical",
              level: (r.proficiency_level ?? "beginner").replace(
                /^./,
                (c: string) => c.toUpperCase()
              ),
            } as SkillItem)
        );
        if (mounted) setUserSkills(mapped);
      } catch (err) {
        console.error("Error loading skills", err);
      }
    };

    loadSkills();

    return () => {
      mounted = false;
    };
  }, [user, loading]);

  const openEditDialog = (index: number) => {
    setSelectedSkillIndex(index);
    setTempEditLevel(userSkills[index].level);
  };

  const closeEditDialog = () => {
    setSelectedSkillIndex(null);
    setTempEditLevel("");
  };

  const handleUpdateLevel = () => {
    (async () => {
      if (selectedSkillIndex === null) return;
      const skill = userSkills[selectedSkillIndex];
      if (isUpdating) return;
      setIsUpdating(true);
      if (skill?.id && user) {
        try {
          const userCrud = crud.withUser(user.id);
          const res = await userCrud.updateRow(
            "skills",
            { proficiency_level: tempEditLevel.toLowerCase() },
            { eq: { id: skill.id } },
            "*"
          );
          if (res.error) {
            alert("Error updating skill: " + res.error.message);
            setIsUpdating(false);
            return;
          }
          const updatedRow = Array.isArray(res.data) ? res.data[0] : res.data;
          const updatedSkills = [...userSkills];
          updatedSkills[selectedSkillIndex] = {
            id: updatedRow?.id ?? skill.id,
            name: updatedRow?.skill_name ?? skill.name,
            category: updatedRow?.skill_category ?? skill.category,
            level: (updatedRow?.proficiency_level ?? tempEditLevel).replace(
              /^./,
              (c: string) => c.toUpperCase()
            ),
          };
          setUserSkills(updatedSkills);
          window.dispatchEvent(new CustomEvent("skills:changed"));
        } catch (err) {
          console.error(err);
          alert("Failed to update skill");
          setIsUpdating(false);
        }
      } else {
        const updatedSkills = [...userSkills];
        updatedSkills[selectedSkillIndex].level = tempEditLevel;
        setUserSkills(updatedSkills);
      }
      setIsUpdating(false);
      closeEditDialog();
    })();
  };

  const handleDeleteSkill = () => {
    (async () => {
      if (selectedSkillIndex === null) return;

      // Capture the index at the start of the operation so we don't
      // accidentally remove the wrong item if the local array changes
      // while awaiting the network operation.
      const indexToDelete = selectedSkillIndex;
      const skill = userSkills[indexToDelete];

      // Confirmation before deleting
      const confirmDelete = window.confirm(
        `Are you sure you want to delete "${skill.name}"?`
      );
      if (!confirmDelete) return;

      if (skill?.id && user) {
        try {
          if (isUpdating) return;
          setIsUpdating(true);
          const userCrud = crud.withUser(user.id);
          const res = await userCrud.deleteRow("skills", {
            eq: { id: skill.id },
          });
          console.debug("deleteRow response:", res);
          if (res.error) {
            alert("Error deleting skill: " + res.error.message);
            setIsUpdating(false);
            return;
          }
        } catch (err) {
          console.error(err);
          alert("Failed to delete skill");
          setIsUpdating(false);
          return;
        }
      }
      // Refresh from server when we have a logged-in user so the UI reflects
      // the authoritative database state (and surfaces any RLS-related failures).
      if (user) {
        try {
          const userCrud = crud.withUser(user.id);
          const refetch = await userCrud.listRows(
            "skills",
            "id,skill_name,proficiency_level,skill_category",
            { order: { column: "skill_name", ascending: true } }
          );
          console.debug("refetch after delete:", refetch);
          if (!refetch.error) {
            const rows = Array.isArray(refetch.data)
              ? refetch.data
              : refetch.data
              ? [refetch.data]
              : [];
            type DbRow = {
              id?: string;
              skill_name?: string;
              proficiency_level?: string;
              skill_category?: string;
            };
            const mapped = (rows as DbRow[]).map(
              (r) =>
                ({
                  id: r.id,
                  name: r.skill_name ?? "",
                  category: r.skill_category ?? "Technical",
                  level: (r.proficiency_level ?? "beginner").replace(
                    /^./,
                    (c: string) => c.toUpperCase()
                  ),
                } as SkillItem)
            );
            setUserSkills(mapped);
          }
        } catch (err) {
          console.error("Failed to refetch skills after delete", err);
        }
      } else {
        // For unauthenticated/local mode just update client state
        setUserSkills((prev) => prev.filter((_, i) => i !== indexToDelete));
      }
      try {
        window.dispatchEvent(new CustomEvent("skills:changed"));
      } catch {
        /* noop */
      }
      setIsUpdating(false);
      closeEditDialog();
    })();
  };

  // ✅ Enhanced visual layout using theme
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        bgcolor: (theme) => theme.palette.background.default,
        color: (theme) => theme.palette.text.primary,
        p: 4,
      }}
    >
      <Box
        sx={{
          backgroundColor: (theme) => theme.palette.background.paper,
          boxShadow: 3,
          borderRadius: 3,
          width: "95%",
          maxWidth: 900,
          p: 4,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Typography
            variant="h4"
            textAlign="left"
            sx={{
              fontWeight: 700,
              color: (theme) => theme.palette.primary.main,
            }}
          >
            Add Skills
          </Typography>

          <Button
            variant="outlined"
            onClick={() => navigate("/skillsOverview")}
            aria-label="Back to skills overview"
          >
            Back
          </Button>
        </Stack>

        <Typography
          variant="body2"
          mb={3}
          textAlign="center"
          color="text.secondary"
        >
          Click a skill to edit or remove it. You can also use keyboard
          (Enter/Space) when focused.
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          justifyContent="center"
          alignItems="center"
          mb={4}
        >
          {/* ✅ Replaced select with Autocomplete */}
          <Autocomplete
            freeSolo
            options={suggestedSkillList}
            value={selectedSkill}
            onChange={(_, newValue) => setSelectedSkill(newValue || "")}
            onInputChange={(_, newInputValue) =>
              setSelectedSkill(newInputValue)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Skill"
                size="small"
                sx={{ minWidth: 200 }}
              />
            )}
          />

          <TextField
            label="Category"
            select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          >
            {skillCategoryOptions.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Proficiency"
            select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          >
            {skillLevelOptions.map((lvl) => (
              <MenuItem key={lvl} value={lvl}>
                {lvl}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            onClick={handleAddSkill}
            sx={{
              px: 4,
              py: 1.3,
              fontWeight: 600,
              backgroundColor: (theme) => theme.palette.primary.main,
              ":hover": {
                backgroundColor: (theme) => theme.palette.primary.dark,
              },
            }}
          >
            Add Skill
          </Button>
        </Stack>

        <Stack
          direction="row"
          spacing={1.5}
          flexWrap="wrap"
          justifyContent="center"
          mt={2}
        >
          {userSkills.map((skill, index) => (
            <Chip
              key={skill.id ?? `${skill.name}-${index}`}
              label={`${skill.name} — ${skill.level}`}
              color="primary"
              variant="outlined"
              onClick={() => openEditDialog(index)}
              role="button"
              tabIndex={0}
              aria-label={`Edit ${skill.name} skill`}
              title={`Click to edit or remove ${skill.name}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openEditDialog(index);
                }
              }}
              sx={{
                mb: 1.5,
                fontSize: "0.95rem",
                borderRadius: "12px",
                cursor: "pointer",
              }}
            />
          ))}
        </Stack>

        <Dialog
          open={selectedSkillIndex !== null}
          onClose={closeEditDialog}
          aria-labelledby="edit-skill-title"
        >
          <DialogTitle id="edit-skill-title">Edit Skill</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2, fontWeight: 500 }}>
              {selectedSkillIndex !== null &&
                userSkills[selectedSkillIndex].name}
            </Typography>

            <FormControl fullWidth>
              <InputLabel>Proficiency</InputLabel>
              <Select
                value={tempEditLevel}
                label="Proficiency"
                onChange={(e) => setTempEditLevel(e.target.value as string)}
              >
                {skillLevelOptions.map((lvl) => (
                  <MenuItem key={lvl} value={lvl}>
                    {lvl}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>

          <DialogActions>
            <Button onClick={closeEditDialog}>Cancel</Button>
            <Button
              color="error"
              onClick={handleDeleteSkill}
              disabled={isUpdating}
            >
              Remove
            </Button>
            <Button
              variant="contained"
              onClick={handleUpdateLevel}
              disabled={isUpdating}
              sx={{
                backgroundColor: (theme) => theme.palette.primary.main,
                ":hover": {
                  backgroundColor: (theme) => theme.palette.primary.dark,
                },
              }}
            >
              {isUpdating ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AddSkills;
