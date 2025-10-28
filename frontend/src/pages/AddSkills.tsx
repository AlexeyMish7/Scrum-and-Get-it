import { useEffect, useState } from "react";
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
  const { user, loading } = useAuth();
  const [userSkills, setUserSkills] = useState<SkillItem[]>([]);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

  const [selectedSkillIndex, setSelectedSkillIndex] = useState<number | null>(
    null
  );
  const [tempEditLevel, setTempEditLevel] = useState<string>("");

  const handleAddSkill = () => {
    (async () => {
      if (!selectedSkill || !selectedCategory || !selectedLevel) {
        alert("Please fill out all fields before adding a skill.");
        return;
      }
      const exists = userSkills.some(
        (skill) => skill.name.toLowerCase() === selectedSkill.toLowerCase()
      );
      if (exists) {
        alert("You already added this skill!");
        return;
      }

<<<<<<< HEAD
      // Persist to DB if user is available
=======
>>>>>>> c06f4c3430e8687faf6a51fd713d56dba2e982ea
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
<<<<<<< HEAD
          // notify other parts of the app to refresh skills
=======
>>>>>>> c06f4c3430e8687faf6a51fd713d56dba2e982ea
          try {
            window.dispatchEvent(new CustomEvent("skills:changed"));
          } catch {
            /* noop */
          }
        } catch (err) {
          console.error(err);
          alert("Failed to add skill");
          return;
        }
      } else {
<<<<<<< HEAD
        // fallback to local-only addition
=======
>>>>>>> c06f4c3430e8687faf6a51fd713d56dba2e982ea
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
    })();
  };

<<<<<<< HEAD
  // load persisted skills when user becomes available
=======
>>>>>>> c06f4c3430e8687faf6a51fd713d56dba2e982ea
  useEffect(() => {
    if (loading) return;
    if (!user) {
      setUserSkills([]);
      return;
    }

    const fetchSkills = async () => {
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
        const rows = Array.isArray(res.data) ? res.data : [res.data];
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
      } catch (err) {
        console.error("Error loading skills", err);
      }
    };

    fetchSkills();
  }, [user, loading]);

  const openEditDialog = (index: number) => {
    setSelectedSkillIndex(index);
    setTempEditLevel(userSkills[index].level);
  };

  const closeEditDialog = () => {
    setSelectedSkillIndex(null);
    setTempEditLevel("");
  };

<<<<<<< HEAD
  // Update skill proficiency
=======
>>>>>>> c06f4c3430e8687faf6a51fd713d56dba2e982ea
  const handleUpdateLevel = () => {
    (async () => {
      if (selectedSkillIndex === null) return;
      const skill = userSkills[selectedSkillIndex];
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
<<<<<<< HEAD
          try {
            window.dispatchEvent(new CustomEvent("skills:changed"));
          } catch (e) {
            void e;
          }
=======
          window.dispatchEvent(new CustomEvent("skills:changed"));
>>>>>>> c06f4c3430e8687faf6a51fd713d56dba2e982ea
        } catch (err) {
          console.error(err);
          alert("Failed to update skill");
        }
      } else {
        const updatedSkills = [...userSkills];
        updatedSkills[selectedSkillIndex].level = tempEditLevel;
        setUserSkills(updatedSkills);
      }
      closeEditDialog();
    })();
  };

<<<<<<< HEAD
  // Remove skill entirely
=======
>>>>>>> c06f4c3430e8687faf6a51fd713d56dba2e982ea
  const handleDeleteSkill = () => {
    (async () => {
      if (selectedSkillIndex === null) return;
      const skill = userSkills[selectedSkillIndex];
      if (skill?.id && user) {
        try {
          const userCrud = crud.withUser(user.id);
          const res = await userCrud.deleteRow("skills", {
            eq: { id: skill.id },
          });
          if (res.error) {
            alert("Error deleting skill: " + res.error.message);
            return;
          }
        } catch (err) {
          console.error(err);
          alert("Failed to delete skill");
          return;
        }
      }
      setUserSkills(userSkills.filter((_, i) => i !== selectedSkillIndex));
<<<<<<< HEAD
      try {
        window.dispatchEvent(new CustomEvent("skills:changed"));
      } catch (e) {
        void e;
      }
=======
      window.dispatchEvent(new CustomEvent("skills:changed"));
>>>>>>> c06f4c3430e8687faf6a51fd713d56dba2e982ea
      closeEditDialog();
    })();
  };

<<<<<<< HEAD
  return (
    <Box p={4}>
      <Typography variant="h3" mb={3} textAlign="center">
        Add Skills
      </Typography>

      {/* ADD SKILLS FORM */}
      <Stack direction="row" spacing={2} mb={3}>
        <TextField
          label="Skill"
          select
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value)}
          size="small"
          sx={{ minWidth: 180 }}
        >
          {suggestedSkillList.map((skill) => (
            <MenuItem key={skill} value={skill}>
              {skill}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Category"
          select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          size="small"
          sx={{ minWidth: 150 }}
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
          sx={{ minWidth: 140 }}
        >
          {skillLevelOptions.map((lvl) => (
            <MenuItem key={lvl} value={lvl}>
              {lvl}
            </MenuItem>
          ))}
        </TextField>

        <Button variant="contained" onClick={handleAddSkill}>
          Add Skill
        </Button>
      </Stack>

      {/* SKILL TAGS */}
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {userSkills.map((skill, index) => (
          <Chip
            key={index}
            label={`${skill.name} — ${skill.level}`}
            color="primary"
            variant="outlined"
            onClick={() => openEditDialog(index)}
            sx={{ mb: 1, cursor: "pointer" }}
          />
        ))}
      </Stack>

      <Dialog open={selectedSkillIndex !== null} onClose={closeEditDialog}>
        <DialogTitle>Edit Skill</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, fontWeight: 500 }}>
            {selectedSkillIndex !== null && userSkills[selectedSkillIndex].name}
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
          <Button color="error" onClick={handleDeleteSkill}>
            Remove
          </Button>
          <Button variant="contained" onClick={handleUpdateLevel}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
=======
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
        <Typography
          variant="h4"
          mb={4}
          textAlign="center"
          sx={{
            fontWeight: 700,
            color: (theme) => theme.palette.primary.main,
          }}
        >
          Add Skills
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          justifyContent="center"
          alignItems="center"
          mb={4}
        >
          <TextField
            label="Skill"
            select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          >
            {suggestedSkillList.map((skill) => (
              <MenuItem key={skill} value={skill}>
                {skill}
              </MenuItem>
            ))}
          </TextField>

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
              key={index}
              label={`${skill.name} — ${skill.level}`}
              color="primary"
              variant="outlined"
              onClick={() => openEditDialog(index)}
              sx={{
                mb: 1.5,
                fontSize: "0.95rem",
                borderRadius: "12px",
                cursor: "pointer",
              }}
            />
          ))}
        </Stack>

        <Dialog open={selectedSkillIndex !== null} onClose={closeEditDialog}>
          <DialogTitle>Edit Skill</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2, fontWeight: 500 }}>
              {selectedSkillIndex !== null && userSkills[selectedSkillIndex].name}
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
            <Button color="error" onClick={handleDeleteSkill}>
              Remove
            </Button>
            <Button
              variant="contained"
              onClick={handleUpdateLevel}
              sx={{
                backgroundColor: (theme) => theme.palette.primary.main,
                ":hover": {
                  backgroundColor: (theme) => theme.palette.primary.dark,
                },
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
>>>>>>> c06f4c3430e8687faf6a51fd713d56dba2e982ea
    </Box>
  );
};

export default AddSkills;
