import { useState, useEffect } from "react";
import { useAuth } from "@shared/context/AuthContext";
import { useProfileChange } from "@shared/context";
import skillsService from "../../services/skills";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { useConfirmDialog } from "@shared/hooks/useConfirmDialog";
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  TextField,
  Button,
  MenuItem,
  Autocomplete,
  Stack,
} from "@mui/material";
import type { DbSkillRow } from "../../types/skill.ts";
import { SKILL_LEVEL_OPTIONS, SKILL_CATEGORY_OPTIONS } from "@shared/constants";
import { useUnifiedCacheUtils } from "@profile/cache";

const suggestedSkillList = [
  // Frontend
  "JavaScript",
  "TypeScript",
  "React",
  "React Native",
  "Next.js",
  "Gatsby",
  "Vue",
  "Angular",
  "Svelte",
  "HTML",
  "CSS",
  "Sass",
  "Less",
  "Tailwind CSS",
  "Bootstrap",

  // Backend / Languages
  "Node.js",
  "Express",
  "Deno",
  "Python",
  "Django",
  "Flask",
  "Java",
  "Spring",
  "Kotlin",
  "Go",
  "C#",
  ".NET",
  "C++",
  "C",
  "Rust",
  "Swift",
  "Objective-C",
  "PHP",
  "Laravel",

  // Databases
  "SQL",
  "PostgreSQL",
  "MySQL",
  "SQLite",
  "MongoDB",
  "Redis",
  "Cassandra",
  "DynamoDB",
  "Elasticsearch",

  // APIs / Protocols
  "REST",
  "GraphQL",
  "gRPC",
  "WebSockets",

  // DevOps / Infra
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "Google Cloud",
  "Terraform",
  "CI/CD",
  "Jenkins",
  "GitLab CI",
  "GitHub Actions",
  "Ansible",

  // Testing / QA
  "Jest",
  "Mocha",
  "Chai",
  "Cypress",
  "Selenium",
  "Testing",

  // Data / ML
  "Pandas",
  "NumPy",
  "TensorFlow",
  "PyTorch",
  "Machine Learning",
  "Data Analysis",
  "Data Engineering",
  "Spark",
  "Hadoop",

  // Messaging / Streaming
  "Kafka",
  "RabbitMQ",
  "Redis Streams",

  // Observability
  "Prometheus",
  "Grafana",
  "ELK",

  // Security / Auth
  "OAuth",
  "JWT",
  "SSO",
  "Encryption",

  // Mobile / Cross-platform
  "Flutter",
  "Dart",
  "iOS",
  "Android",

  // Blockchain / Crypto
  "Solidity",
  "Smart Contracts",

  // Tools / Workflow
  "Git",
  "GitHub",
  "GitLab",
  "Bitbucket",
  "Figma",
  "Sketch",
  "Photoshop",

  // Analytics / BI
  "Tableau",
  "Power BI",
  "Excel",

  // Soft skills / General
  "Communication",
  "Leadership",
  "Teamwork",
  "Problem Solving",
  "Time Management",
  "Project Management",
  "Product Management",
  "Customer Success",
  "Sales",
  "Marketing",
  "Public Speaking",
  "Copywriting",

  // Misc / niche
  "Accessibility",
  "Performance Optimization",
  "Web Security",
  "SEO",
  "AR/VR",
  "Embedded Systems",
  "IoT",
  "Computer Vision",
  "NLP",
  "ETL",
];

export interface AddSkillDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: "add" | "edit";
  existingSkill?: {
    id: string;
    name: string;
    category: string;
    level: string;
  };
  existingSkills?: Array<{ name: string }>;
}

export const AddSkillDialog = ({
  open,
  onClose,
  onSuccess,
  mode = "add",
  existingSkill,
  existingSkills = [],
}: AddSkillDialogProps) => {
  const { user } = useAuth();
  const { invalidateAll } = useUnifiedCacheUtils();
  const { handleError, showSuccess, showWarning } = useErrorHandler();
  const { confirm } = useConfirmDialog();
  const { markProfileChanged } = useProfileChange();

  const [selectedSkill, setSelectedSkill] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Initialize form when editing
  useEffect(() => {
    if (mode === "edit" && existingSkill) {
      setSelectedSkill(existingSkill.name);
      setInputValue(existingSkill.name);
      setSelectedCategory(existingSkill.category);
      setSelectedLevel(existingSkill.level);
    } else {
      setSelectedSkill("");
      setInputValue("");
      setSelectedCategory("");
      setSelectedLevel("");
    }
  }, [mode, existingSkill, open]);

  const handleClose = () => {
    setSelectedSkill("");
    setInputValue("");
    setSelectedCategory("");
    setSelectedLevel("");
    setShowErrors(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setShowErrors(true);

    const trimmedSkill = selectedSkill.trim();
    const trimmedCategory = selectedCategory.trim();
    const trimmedLevel = selectedLevel.trim();

    if (!trimmedSkill || !trimmedCategory || !trimmedLevel) {
      showWarning("Please fill out all fields before saving.");
      return;
    }

    if (!user) {
      showWarning("Please sign in to manage skills");
      return;
    }

    if (mode === "add") {
      // Prevent duplicate skill names (case-insensitive)
      const exists = existingSkills.some(
        (skill) => skill.name.toLowerCase() === trimmedSkill.toLowerCase()
      );
      if (exists) {
        showWarning("You already added this skill!");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === "add") {
        const payload: DbSkillRow = {
          skill_name: trimmedSkill,
          proficiency_level: trimmedLevel.toLowerCase(),
          skill_category: trimmedCategory,
        };

        const res = await skillsService.createSkill(user.id, payload);

        if (res.error) {
          handleError(res.error);
          return;
        }

        showSuccess("Skill added");
      } else {
        // Edit mode
        if (!existingSkill?.id) {
          handleError("Skill ID not found");
          return;
        }

        const res = await skillsService.updateSkill(user.id, existingSkill.id, {
          proficiency_level: trimmedLevel.toLowerCase(),
          skill_category: trimmedCategory,
        });

        if (res.error) {
          handleError(res.error);
          return;
        }

        showSuccess("Skill updated");
      }

      // Invalidate unified cache so all components get fresh data
      await invalidateAll();

      window.dispatchEvent(new CustomEvent("skills:changed"));
      markProfileChanged();
      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error("AddSkillDialog: Error in handleSubmit", err);
      handleError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (isSubmitting) return;
    if (!existingSkill?.id || !user) return;

    const confirmed = await confirm({
      title: "Confirm delete",
      message: `Are you sure you want to delete "${existingSkill.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      confirmColor: "error",
    });

    if (!confirmed) return;

    setIsSubmitting(true);

    try {
      const res = await skillsService.deleteSkill(user.id, existingSkill.id);
      if (res.error) {
        handleError(res.error);
        setIsSubmitting(false);
        return;
      }

      showSuccess("Skill deleted");

      // Invalidate unified cache so all components get fresh data
      await invalidateAll();

      window.dispatchEvent(new CustomEvent("skills:changed"));
      markProfileChanged();
      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error(err);
      handleError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const skillError = showErrors && !selectedSkill.trim();
  const categoryError = showErrors && !selectedCategory.trim();
  const levelError = showErrors && !selectedLevel.trim();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="skill-dialog-title"
    >
      <DialogTitle id="skill-dialog-title">
        {mode === "add" ? "Add Skill" : "Edit Skill"}
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 3 }}>
        <Stack spacing={2.5}>
          <Autocomplete
            freeSolo
            options={suggestedSkillList}
            inputValue={inputValue}
            disabled={mode === "edit"} // Can't change skill name when editing
            onInputChange={(_, newInputValue) => {
              setInputValue(newInputValue);
              setSelectedSkill(newInputValue);
            }}
            onChange={(_, newValue) => {
              const v =
                typeof newValue === "string" ? newValue : newValue || "";
              setSelectedSkill(v);
              setInputValue(v);
            }}
            filterOptions={(options, state) =>
              options.filter((o) =>
                o.toLowerCase().includes((state.inputValue || "").toLowerCase())
              )
            }
            getOptionLabel={(option) => option}
            noOptionsText="No matching skill"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Skill Name"
                fullWidth
                required
                error={skillError}
                helperText={
                  skillError ? "Skill name is required" : "Type or pick a skill"
                }
              />
            )}
          />

          <TextField
            label="Category"
            select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            fullWidth
            required
            error={categoryError}
            helperText={
              categoryError
                ? "Select a category"
                : "Group this skill for clarity"
            }
          >
            {SKILL_CATEGORY_OPTIONS.map((cat: string) => (
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
            fullWidth
            required
            error={levelError}
            helperText={
              levelError
                ? "Select your proficiency"
                : "Beginner, Intermediate, Advanced, or Expert"
            }
          >
            {SKILL_LEVEL_OPTIONS.map((lvl: string) => (
              <MenuItem key={lvl} value={lvl}>
                {lvl}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        {mode === "edit" && (
          <Button onClick={handleDelete} disabled={isSubmitting} color="error">
            Delete
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : mode === "add" ? "Add" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
