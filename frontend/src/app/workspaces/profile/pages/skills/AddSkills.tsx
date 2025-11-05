import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../shared/context/AuthContext";
import skillsService from "../../services/skills";
import { useErrorHandler } from "../../../../shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "../../../../shared/components/common/ErrorSnackbar";
import "./AddSkills.css";

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
import type { SkillItem, DbSkillRow } from "../../types/skill.ts";
import {
  skillLevelOptions,
  skillCategoryOptions,
  levelLabels,
} from "../../../../constants/skills";

/*
  AddSkills page — high level overview (non-technical)

  Purpose
  - Let a user add, edit, and remove skills for their profile.
  - Provide helpful suggestions while typing so users can pick common
    skills instead of typing everything from scratch.

  Tools used (shared helpers in the app)
  - `skillsService`: centralized place that talks to the backend for
    listing, creating, updating, and deleting skills.
  - `useErrorHandler`: app-wide way to show errors and success messages
    as small pop-up snackbars. We use this instead of alert boxes so the
    experience is consistent across the app.
  - `ErrorSnackbar`: the visual component that shows those messages.

  Notes for readers
  - The file keeps UI behavior separate from data calls: handlers call
    the service, update local lists, and then trigger a small event so
    other parts of the app can refresh if needed.
  - The confirmation dialog replaces `window.confirm()` for better
    accessibility and consistency.
*/

// Using centralized SkillItem type from frontend/src/types/skill.ts

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

// Keep category options aligned with the SkillsOverview defaults so
// drag/drop and bucket names match exactly.

const AddSkills = () => {
  // Local UI state (what the user sees and interacts with)
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { handleError, showSuccess, notification, closeNotification } =
    useErrorHandler();
  // The list of skills shown on this page. Initially empty until we
  // load them from the server (or local state for unauthenticated mode).
  const [userSkills, setUserSkills] = useState<SkillItem[]>([]);

  // Controlled values for the add-skill form
  const [selectedSkill, setSelectedSkill] = useState("");
  // `inputValue` is the raw text in the autocomplete box while typing.
  // We keep it separate so suggestions update as the user types.
  const [inputValue, setInputValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

  // Which skill (by index) is currently being edited; null when none.
  const [selectedSkillIndex, setSelectedSkillIndex] = useState<number | null>(
    null
  );
  // Temporary value for the edit dialog's level selector.
  const [tempEditLevel, setTempEditLevel] = useState<string>("");
  // Loading flags to prevent double-submits and show busy state in UI.
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  // When the user clicks Remove we open a confirmation dialog. This
  // holds the index of the skill pending deletion (or null).
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(
    null
  );

  const handleAddSkill = () => {
    (async () => {
      // Basic client-side checks before calling the service. We show
      // friendly messages via the shared error handler instead of
      // blocking the UI with alerts.
      if (!selectedSkill || !selectedCategory || !selectedLevel) {
        handleError("Please fill out all fields before adding a skill.");
        return;
      }
      if (isAdding) return; // prevent double submit
      setIsAdding(true);
      const exists = userSkills.some(
        (skill) => skill.name.toLowerCase() === selectedSkill.toLowerCase()
      );
      if (exists) {
        handleError("You already added this skill!");
        setIsAdding(false);
        return;
      }

      // If the user is signed in, call the backend service so the
      // change is persisted. Otherwise keep it local so the page still
      // works in demo/unauthenticated mode.
      if (user) {
        try {
          const payload: DbSkillRow = {
            skill_name: selectedSkill,
            proficiency_level: selectedLevel.toLowerCase(),
            skill_category: selectedCategory,
          };
          const res = await skillsService.createSkill(user.id, payload);
          if (res.error) {
            handleError(res.error);
            setIsAdding(false);
            return;
          }
          const newSkill = res.data as SkillItem;
          setUserSkills((s) => [...s, newSkill]);
          try {
            window.dispatchEvent(new CustomEvent("skills:changed"));
          } catch {
            /* noop */
          }
          showSuccess("Skill added");
        } catch (err) {
          console.error(err);
          handleError(err);
          setIsAdding(false);
          return;
        }
      } else {
        // For unauthenticated/demo mode create a temporary id and normalize
        // the selected proficiency into the numeric shape (1..4) used by
        // the overview UI so averages and ordering behave consistently.
        const newSkill: SkillItem = {
          id: ((): string => {
            const maybeRand = (
              globalThis.crypto as unknown as {
                randomUUID?: () => string;
              }
            ).randomUUID;
            return typeof maybeRand === "function"
              ? maybeRand()
              : `local-${Math.random().toString(36).slice(2, 8)}`;
          })(),
          name: selectedSkill,
          category: selectedCategory,
          level: ((): number => {
            const map: Record<string, number> = {
              beginner: 1,
              intermediate: 2,
              advanced: 3,
              expert: 4,
            };
            return map[(selectedLevel || "").toLowerCase()] ?? 1;
          })(),
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
      // Clear the controlled input value as well and reset adding flag
      setInputValue("");
      setIsAdding(false);

      navigate("/skillsOverview");
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
        const res = await skillsService.listSkills(user.id);
        if (res.error) {
          console.error("Failed to fetch skills", res.error);
          handleError(res.error);
          return;
        }
        // Put the returned rows into local UI state. We use a safety
        // check (res.data ?? []) so the UI never receives null.
        if (mounted && res.data) setUserSkills(res.data ?? []);
      } catch (err) {
        console.error("Error loading skills", err);
      }
    };

    loadSkills();

    return () => {
      mounted = false;
    };
  }, [user, loading, handleError]);

  const openEditDialog = (index: number) => {
    setSelectedSkillIndex(index);
    const lvl = userSkills[index].level;
    // Normalize to a label string for the edit dialog select
    const label =
      typeof lvl === "number"
        ? levelLabels[lvl] ?? String(lvl)
        : String(lvl || "");
    setTempEditLevel(label);
  };

  const closeEditDialog = () => {
    setSelectedSkillIndex(null);
    setTempEditLevel("");
  };

  const handleUpdateLevel = () => {
    (async () => {
      if (selectedSkillIndex === null) return;
      const skill = userSkills[selectedSkillIndex];
      // Prevent double submits while the network request is in-flight.
      if (isUpdating) return;
      setIsUpdating(true);
      if (skill?.id && user) {
        try {
          const res = await skillsService.updateSkill(user.id, skill.id, {
            proficiency_level: tempEditLevel.toLowerCase(),
          });
          if (res.error) {
            // Use the shared error handler to surface problems to the user.
            handleError(res.error);
            setIsUpdating(false);
            return;
          }
          const updated = res.data as SkillItem;
          const updatedSkills = [...userSkills];
          updatedSkills[selectedSkillIndex] = {
            id: updated.id ?? skill.id,
            name: updated.name ?? skill.name,
            category: updated.category ?? skill.category,
            level: updated.level,
          };
          setUserSkills(updatedSkills);
          window.dispatchEvent(new CustomEvent("skills:changed"));
        } catch (err) {
          console.error(err);
          handleError(err || "Failed to update skill");
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

      // Open a confirmation dialog instead of using window.confirm
      setConfirmDeleteIndex(indexToDelete);
      return;
    })();
  };

  // Perform the deletion after user confirms in the dialog
  // This function handles both signed-in (server) deletes and
  // local deletes for demo/offline mode. It uses the shared service
  // when possible and then refreshes the local list.
  const performDelete = async (indexToDelete: number) => {
    const skill = userSkills[indexToDelete];
    if (!skill) return;

    const userId = user?.id;

    try {
      if (skill?.id && userId) {
        setIsUpdating(true);
        const res = await skillsService.deleteSkill(userId, skill.id);
        if (res.error) {
          handleError(res.error);
          setIsUpdating(false);
          setConfirmDeleteIndex(null);
          return;
        }
      }

      // Refresh from server when we have a logged-in user
      if (userId) {
        const refetch = await skillsService.listSkills(userId);
        if (refetch.error) {
          handleError(refetch.error);
        } else if (refetch.data) {
          setUserSkills(refetch.data ?? []);
        }
      } else {
        setUserSkills((prev) => prev.filter((_, i) => i !== indexToDelete));
      }

      try {
        window.dispatchEvent(new CustomEvent("skills:changed"));
      } catch {
        /* noop */
      }
    } catch (err) {
      console.error(err);
      handleError(err || "Failed to delete skill");
    } finally {
      setIsUpdating(false);
      setConfirmDeleteIndex(null);
      closeEditDialog();
    }
  };

  // -----------------------------
  // Render: the page layout and interactive pieces
  // -----------------------------
  // The page is split into:
  //  - Add form (Autocomplete + category + level + Add button)
  //  - A set of chips representing existing skills (click to edit)
  //  - Edit dialog (change level or remove)
  //  - Centralized snackbars and confirmation dialog
  // All actions use the shared services/hooks above for consistency.
  return (
    <Box className="skills-page-container">
      <Box className="skills-card glossy-card">
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          className="header-row"
        >
          <div className="title-block">
            <Typography variant="h3" className="glossy-title header-title">
              Add Skills
            </Typography>
            <Typography variant="body2" className="header-note">
              Click a skill to edit or remove it. You can also use keyboard
              (Enter/Space) when focused.
            </Typography>
          </div>

          <Button
            variant="secondary"
            className="glossy-btn back-btn"
            onClick={() => navigate("/skillsOverview")}
            aria-label="Back to skills overview"
          >
            Back
          </Button>
        </Stack>

        <Stack
          className="form-row"
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          justifyContent="center"
          alignItems="center"
        >
          {/* Replaced select with Autocomplete */}
          <div className="input-wide">
            <Autocomplete
              freeSolo
              options={suggestedSkillList}
              // Keep the displayed text and the selected value in sync but
              // control the raw input separately so typing shows suggestions.
              inputValue={inputValue}
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
                  o
                    .toLowerCase()
                    .includes((state.inputValue || "").toLowerCase())
                )
              }
              getOptionLabel={(option) => option}
              noOptionsText="No matching skill"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Skill"
                  size="small"
                  className="input-field"
                />
              )}
            />
          </div>

          <TextField
            label="Category"
            select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            size="small"
            className="input-field"
          >
            {skillCategoryOptions.map((cat: string) => (
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
            className="input-field"
          >
            {skillLevelOptions.map((lvl: string) => (
              <MenuItem key={lvl} value={lvl}>
                {lvl}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="primary"
            onClick={handleAddSkill}
            className="add-btn"
          >
            Add Skill
          </Button>
        </Stack>
        <Stack className="chips-row">
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
              className="skill-chip"
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
                {skillLevelOptions.map((lvl: string) => (
                  <MenuItem key={lvl} value={lvl}>
                    {lvl}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>

          <DialogActions>
            <Button variant="tertiary" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSkill}
              disabled={isUpdating}
            >
              Remove
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateLevel}
              disabled={isUpdating}
              className="save-btn"
            >
              {isUpdating ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Dialog>
        {/* Global error/success snackbar from centralized handler */}
        <ErrorSnackbar
          notification={notification}
          onClose={closeNotification}
        />

        {/* Confirm delete dialog to avoid window.confirm */}
        <Dialog
          open={confirmDeleteIndex !== null}
          onClose={() => setConfirmDeleteIndex(null)}
          aria-labelledby="confirm-delete-skill"
        >
          <DialogTitle id="confirm-delete-skill">Confirm delete</DialogTitle>
          <DialogContent>
            <Typography>
              {`Are you sure you want to delete "${
                confirmDeleteIndex !== null
                  ? userSkills[confirmDeleteIndex]?.name
                  : ""
              }"? This action cannot be undone.`}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteIndex(null)}>Cancel</Button>
            <Button
              color="error"
              onClick={() => {
                if (confirmDeleteIndex !== null)
                  performDelete(confirmDeleteIndex);
              }}
              disabled={isUpdating}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AddSkills;
