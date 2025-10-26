import { useState } from "react";
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
  name: string;
  category: string;
  level: string;
};

const skillLevelOptions = [
  "Beginner", "Intermediate", "Advanced", "Expert",
];

const suggestedSkillList = [
  "React", "TypeScript", "Python", "Communication",
  "Teamwork", "SQL", "Java", "Public Speaking",
];
const skillCategoryOptions = [
  "Technical", "Soft Skills", "Languages", "Industry-Specific",
];

const AddSkills = () => {
  const [userSkills, setUserSkills] = useState<SkillItem[]>([]);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

  const [selectedSkillIndex, setSelectedSkillIndex] = useState<number | null>(null);
  const [tempEditLevel, setTempEditLevel] = useState<string>("");

  const handleAddSkill = () => {
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
    const newSkill: SkillItem = {
      name: selectedSkill,
      category: selectedCategory,
      level: selectedLevel,
    };

    setUserSkills([...userSkills, newSkill]);

    setSelectedSkill("");
    setSelectedCategory("");
    setSelectedLevel("");
  };

  const openEditDialog = (index: number) => {
    setSelectedSkillIndex(index);
    setTempEditLevel(userSkills[index].level);
  };

  const closeEditDialog = () => {
    setSelectedSkillIndex(null);
    setTempEditLevel("");
  };

  // Update skill proficiency
  const handleUpdateLevel = () => {
    if (selectedSkillIndex === null) return;
    const updatedSkills = [...userSkills];
    
    updatedSkills[selectedSkillIndex].level = tempEditLevel;
    setUserSkills(updatedSkills);
    closeEditDialog();
  };

  // Remove skill entirely
  const handleDeleteSkill = () => {
    if (selectedSkillIndex === null) return;
    setUserSkills(userSkills.filter((_, i) => i !== selectedSkillIndex));
    closeEditDialog();
  };

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
          <Button color="error" onClick={handleDeleteSkill}>Remove</Button>
          <Button variant="contained" onClick={handleUpdateLevel}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddSkills;
