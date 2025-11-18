// src/components/ProfileDashboard/SummaryCards.tsx
import React, { useState } from "react";
import {
  useErrorHandler,
  validateRequired,
} from "@shared/hooks/useErrorHandler";
import { SKILL_LEVEL_OPTIONS, SKILL_CATEGORY_OPTIONS } from "@shared/constants";
import { AddSkillDialog } from "../../components/dialogs/AddSkillDialog";
import { AddEducationDialog } from "../../components/dialogs/AddEducationDialog";
import { AddEmploymentDialog } from "../../components/dialogs/AddEmploymentDialog";
import { AddProjectDialog } from "../../components/dialogs/AddProjectDialog";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  FaBriefcase,
  FaLightbulb,
  FaGraduationCap,
  FaProjectDiagram,
} from "react-icons/fa";

interface SummaryCardsProps {
  counts: {
    employmentCount: number;
    skillsCount: number;
    educationCount: number;
    projectsCount: number;
  };
  // Handlers receive the form payload (string/number/boolean values).
  onAddEmployment: (
    data: Record<string, string | number | boolean | undefined>
  ) => Promise<void> | void;
  onAddSkill: (
    data: Record<string, string | number | boolean | undefined>
  ) => Promise<void> | void;
  onAddEducation: (
    data: Record<string, string | number | boolean | undefined>
  ) => Promise<void> | void;
  onAddProject: (
    data: Record<string, string | number | boolean | undefined>
  ) => Promise<void> | void;
}

interface FieldBase {
  type: string;
  name: string;
  label: string;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  default?: string | number | boolean;
}

const degreeOptions = [
  "High School",
  "Associate",
  "Bachelor's",
  "Master's",
  "PhD",
  "Certificate",
];

const SummaryCards: React.FC<SummaryCardsProps> = ({
  counts,
  onAddEmployment,
  onAddSkill,
  onAddEducation,
  onAddProject,
}) => {
  const theme = useTheme();
  const [openDialog, setOpenDialog] = useState<null | string>(null);
  const [formData, setFormData] = useState<
    Record<string, string | number | boolean | undefined>
  >({});
  const [submitting, setSubmitting] = useState(false);

  // Skills dialog state
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);

  // Education dialog state
  const [educationDialogOpen, setEducationDialogOpen] = useState(false);

  // Employment dialog state
  const [employmentDialogOpen, setEmploymentDialogOpen] = useState(false);

  // Project dialog state
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);

  // centralized error handler hook for snackbars
  const { notification, closeNotification, showNotification, handleError } =
    useErrorHandler();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    // Narrow the value and update state using functional update to avoid stale closures
    const nextValue = type === "checkbox" ? checked : (value as string);
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleSubmit = async (card: (typeof cardsData)[0]) => {
    // Client-side validation for required fields and simple numeric ranges
    try {
      // Special-case Skills, Education, Employment, and Projects: use the dedicated dialogs
      if (
        card.title === "Skills" ||
        card.title === "Education" ||
        card.title === "Employment" ||
        card.title === "Projects"
      ) {
        return; // Handled by dedicated dialogs
      }

      // Build requiredFields map for validateRequired
      const requiredFields: Record<string, unknown> = {};
      for (const f of card.fields) {
        if (f.required) requiredFields[f.name] = formData[f.name];
      }

      // Validate numeric ranges (e.g., proficiency)
      for (const f of card.fields) {
        if (f.required && f.type === "number") {
          const raw = formData[f.name];
          const n = raw === undefined || raw === null ? NaN : Number(raw);
          if (Number.isNaN(n)) {
            showNotification(
              `Please provide a valid value for ${f.label}`,
              "error"
            );
            return;
          }
          if (typeof f.min === "number" && n < f.min) {
            showNotification(`${f.label} must be at least ${f.min}`, "error");
            return;
          }
          if (typeof f.max === "number" && n > f.max) {
            showNotification(`${f.label} must be at most ${f.max}`, "error");
            return;
          }
        }
      }

      const validationMsg = validateRequired(requiredFields);
      if (validationMsg) {
        showNotification(validationMsg, "error");
        return;
      }

      setSubmitting(true);
      // Allow the parent handler to perform async work (DB insert). If it fails,
      // bubble the error so we don't close the dialog prematurely.
      await Promise.resolve(card.onAdd(formData));
      setFormData({});
      setOpenDialog(null);
    } catch (e) {
      // Log and surface errors using the shared error handler so messages are
      // consistent across the app and map DB/Supabase errors to friendly text.
      console.error("Add handler failed", e);
      handleError(e);
    } finally {
      setSubmitting(false);
    }
  };
  const cardsData = [
    {
      title: "Employment",
      count: counts.employmentCount,
      icon: <FaBriefcase size={24} color="#fff" />,
      color: theme.palette.primary.main,
      onAdd: onAddEmployment,
      fields: [
        { type: "text", name: "position", label: "Job title", required: true },
        { type: "text", name: "company", label: "Company", required: true },
        {
          type: "date",
          name: "start_date",
          label: "Start Date",
          required: true,
        },
        { type: "date", name: "end_date", label: "End Date" },
        {
          type: "checkbox",
          name: "is_current",
          label: "Current position",
        },
      ] as FieldBase[],
    },
    {
      title: "Skills",
      count: counts.skillsCount,
      icon: <FaLightbulb size={24} color="#fff" />,
      color: theme.palette.success.main,
      onAdd: onAddSkill,
      fields: [
        { type: "text", name: "name", label: "Skill name", required: true },
        {
          type: "number",
          name: "proficiency_level",
          label: "Proficiency (1-5)",
          min: 1,
          max: 5,
          default: 1,
          required: true,
        },
        {
          type: "select",
          name: "category",
          label: "Skill category",
          options: ["Technical", "Soft Skills", "Language", "Other"],
          required: true,
        },
      ] as FieldBase[],
    },
    {
      title: "Education",
      count: counts.educationCount,
      icon: <FaGraduationCap size={24} color="#fff" />,
      color: theme.palette.warning.main,
      onAdd: onAddEducation,
      fields: [
        {
          type: "text",
          name: "institution",
          label: "Institution",
          required: true,
        },
        {
          type: "select",
          name: "degree",
          label: "Degree type (optional)",
          options: degreeOptions,
        },
        {
          type: "text",
          name: "field_of_study",
          label: "Field of study (optional)",
        },
        {
          type: "date",
          name: "start_date",
          label: "Start date",
          required: true,
        },
      ] as FieldBase[],
    },
    {
      title: "Projects",
      count: counts.projectsCount,
      icon: <FaProjectDiagram size={24} color="#fff" />,
      color: theme.palette.info.main,
      onAdd: onAddProject,
      fields: [
        { type: "text", name: "title", label: "Project name", required: true },
        {
          type: "date",
          name: "start_date",
          label: "Start date",
          required: true,
        },
        { type: "date", name: "end_date", label: "End date" },
        { type: "checkbox", name: "is_ongoing", label: "Current project" },
      ] as FieldBase[],
    },
  ];

  const handleOpenDialog = (title: string) => {
    if (title === "Skills") {
      setSkillDialogOpen(true);
    } else if (title === "Education") {
      setEducationDialogOpen(true);
    } else if (title === "Employment") {
      setEmploymentDialogOpen(true);
    } else if (title === "Projects") {
      setProjectDialogOpen(true);
    } else {
      setOpenDialog(title);
      setFormData({});
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(null);
    setFormData({});
  };

  const handleSkillDialogSuccess = async () => {
    // Trigger the onAddSkill handler to refresh dashboard counts
    // The AddSkillDialog already handles the actual skill creation
    window.dispatchEvent(new CustomEvent("skills:changed"));
  };

  const handleEducationDialogSuccess = async () => {
    // The AddEducationDialog already handles the actual education creation
    window.dispatchEvent(new CustomEvent("education:changed"));
  };

  const handleEmploymentDialogSuccess = async () => {
    // The AddEmploymentDialog already handles the actual employment creation
    window.dispatchEvent(new CustomEvent("employment:changed"));
  };

  const handleProjectDialogSuccess = async () => {
    // The AddProjectDialog already handles the actual project creation
    window.dispatchEvent(new CustomEvent("projects:changed"));
  };

  const renderField = (field: FieldBase) => {
    // If the user marked the entry as current, hide/disable the end date field
    const isEndDate = field.name === "end_date" && formData["is_current"];

    const commonProps = {
      name: field.name,
      fullWidth: true,
      value: String(formData[field.name] ?? ""),
      onChange: handleInputChange,
      InputLabelProps: { shrink: true },
      disabled: Boolean(isEndDate),
      required: field.required || false,
    };

    switch (field.type) {
      case "text":
      case "date":
      case "number":
        return (
          <TextField {...commonProps} label={field.label} type={field.type} />
        );
      case "select":
        return (
          <TextField {...commonProps} select label={field.label}>
            {field.options?.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </TextField>
        );
      case "checkbox":
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(formData[field.name])}
                onChange={handleInputChange}
                name={field.name}
              />
            }
            label={field.label}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        justifyContent: "space-between",
        mt: 3,
        mb: 3,
      }}
    >
      {cardsData.map((card) => (
        <React.Fragment key={card.title}>
          <Card
            sx={{
              flex: "1 1 240px",
              minWidth: 220,
              borderRadius: 2,
              boxShadow: 2,
              transition: "0.2s",
              "&:hover": { boxShadow: 4 },
            }}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      backgroundColor: card.color,
                      borderRadius: 2,
                      p: 1.2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      {card.title}
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {card.count}
                    </Typography>
                  </Box>
                </Box>

                <Button
                  onClick={() => handleOpenDialog(card.title)}
                  size="small"
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    color: theme.palette.primary.main,
                    "&:hover": { color: theme.palette.primary.dark },
                  }}
                >
                  + Add
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Dialog
            open={openDialog === card.title}
            onClose={handleCloseDialog}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>{`Add ${card.title}`}</DialogTitle>
            <DialogContent
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                mt: 2, // extra top padding to prevent label cutoff
                mb: 2,
              }}
            >
              {card.fields.map((field) => (
                <Box key={field.name} sx={{ mt: 2 }}>
                  {renderField(field)}
                </Box>
              ))}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} disabled={submitting}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleSubmit(card)}
                variant="contained"
                disabled={submitting}
              >
                {submitting ? "Adding..." : "Add"}
              </Button>
            </DialogActions>
          </Dialog>
        </React.Fragment>
      ))}

      {/* Skills Dialog */}
      <AddSkillDialog
        open={skillDialogOpen}
        onClose={() => setSkillDialogOpen(false)}
        onSuccess={handleSkillDialogSuccess}
        mode="add"
      />

      {/* Education Dialog */}
      <AddEducationDialog
        open={educationDialogOpen}
        onClose={() => setEducationDialogOpen(false)}
        onSuccess={handleEducationDialogSuccess}
        mode="add"
      />

      {/* Employment Dialog */}
      <AddEmploymentDialog
        open={employmentDialogOpen}
        onClose={() => setEmploymentDialogOpen(false)}
        onSuccess={handleEmploymentDialogSuccess}
        mode="add"
      />

      {/* Project Dialog */}
      <AddProjectDialog
        open={projectDialogOpen}
        onClose={() => setProjectDialogOpen(false)}
        onSuccess={handleProjectDialogSuccess}
        mode="add"
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={notification.autoHideDuration}
        onClose={closeNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeNotification}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SummaryCards;
