// src/components/ProfileDashboard/SummaryCards.tsx
import React, { useState } from "react";
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    // Narrow the value and update state using functional update to avoid stale closures
    const nextValue = type === "checkbox" ? checked : (value as string);
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleSubmit = async (card: (typeof cardsData)[0]) => {
    try {
      setSubmitting(true);
      // Allow the parent handler to perform async work (DB insert). If it fails,
      // bubble the error so we don't close the dialog prematurely.
      await Promise.resolve(card.onAdd(formData));
      setFormData({});
      setOpenDialog(null);
    } catch (e) {
      console.error("Add handler failed", e);
      // Simple user feedback for now; parent handler may also surface errors
      alert("Failed to add item. See console for details.");
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
        { type: "text", name: "company", label: "Company", required: true },
        { type: "text", name: "position", label: "Position", required: true },
        { type: "text", name: "location", label: "Location" },
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
          label: "Currently working here",
        },
        { type: "textarea", name: "description", label: "Description" },
      ] as FieldBase[],
    },
    {
      title: "Skills",
      count: counts.skillsCount,
      icon: <FaLightbulb size={24} color="#fff" />,
      color: theme.palette.success.main,
      onAdd: onAddSkill,
      fields: [
        { type: "text", name: "name", label: "Skill Name", required: true },
        {
          type: "select",
          name: "category",
          label: "Category",
          options: ["Technical", "Soft Skills", "Language", "Other"],
          required: true,
        },
        {
          type: "range",
          name: "proficiency_level",
          label: "Proficiency Level",
          min: 1,
          max: 5,
          default: 1,
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
          type: "select",
          name: "degree",
          label: "Degree Type",
          options: degreeOptions,
          required: true,
        },
        {
          type: "text",
          name: "institution",
          label: "Institution",
          required: true,
        },
        {
          type: "text",
          name: "field_of_study",
          label: "Field of Study",
          required: true,
        },
        {
          type: "text",
          name: "start_date",
          label: "Start Date (YYYY-MM)",
          required: true,
        },
        { type: "checkbox", name: "is_current", label: "Currently Enrolled" },
        { type: "text", name: "end_date", label: "End Date (YYYY-MM)" }, // hide in renderField if is_current
        { type: "number", name: "gpa", label: "GPA (optional)" },
        { type: "checkbox", name: "private_gpa", label: "Hide GPA" },
        { type: "text", name: "awards", label: "Achievements / Honors" },
      ] as FieldBase[],
    },
    {
      title: "Projects",
      count: counts.projectsCount,
      icon: <FaProjectDiagram size={24} color="#fff" />,
      color: theme.palette.info.main,
      onAdd: onAddProject,
      fields: [
        { type: "text", name: "title", label: "Project Title", required: true },
        {
          type: "text",
          name: "technologies_input",
          label: "Technologies (comma-separated)",
        },
        {
          type: "date",
          name: "start_date",
          label: "Start Date",
          required: true,
        },
        { type: "date", name: "end_date", label: "End Date" },
        { type: "checkbox", name: "is_ongoing", label: "Ongoing project" },
        { type: "text", name: "url", label: "Project URL (optional)" },
      ] as FieldBase[],
    },
  ];

  const handleOpenDialog = (title: string) => {
    setOpenDialog(title);
    setFormData({});
  };

  const handleCloseDialog = () => {
    setOpenDialog(null);
    setFormData({});
  };

  const renderField = (field: FieldBase) => {
    const isEndDate = field.name === "end_date" && formData["is_current"]; // hide End Date if Currently Enrolled

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
                // <React.Fragment key={field.name}>
                //   {renderField(field)}
                // </React.Fragment>
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
    </Box>
  );
};

export default SummaryCards;
