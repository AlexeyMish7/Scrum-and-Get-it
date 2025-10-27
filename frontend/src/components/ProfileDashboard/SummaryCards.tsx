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
  Slider,
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
  onAddEmployment: (data: any) => void;
  onAddSkill: (data: any) => void;
  onAddEducation: (data: any) => void;
  onAddProject: (data: any) => void;
}

interface FieldBase {
  type: string;
  name: string;
  label: string;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  default?: any;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({
  counts,
  onAddEmployment,
  onAddSkill,
  onAddEducation,
  onAddProject,
}) => {
  const theme = useTheme();
  const [openDialog, setOpenDialog] = useState<null | string>(null);
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSliderChange = (name: string, value: number | number[]) => {
    setFormData({ ...formData, [name]: value });
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
          type: "text",
          name: "institution",
          label: "Institution",
          required: true,
        },
        { type: "text", name: "degree", label: "Degree", required: true },
        {
          type: "text",
          name: "field_of_study",
          label: "Field of Study",
          required: true,
        },
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
          label: "Currently studying here",
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
        { type: "text", name: "title", label: "Project Title", required: true },
        { type: "textarea", name: "description", label: "Description" },
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
    const isEndDate =
      field.name === "end_date" &&
      (formData["is_current"] || formData["is_ongoing"]);

    const commonProps = {
      key: field.name,
      name: field.name,
      fullWidth: true,
      value: formData[field.name] || "",
      onChange: handleInputChange,
      InputLabelProps: { shrink: true }, // always shrink label
      disabled: isEndDate,
      required: field.required || false,
    };

    const fieldWrapperStyle = { mt: 2 }; // add top margin to prevent cut-off

    switch (field.type) {
      case "text":
      case "date":
      case "url":
        return (
          <Box sx={fieldWrapperStyle}>
            <TextField {...commonProps} label={field.label} type={field.type} />
          </Box>
        );
      case "textarea":
        return (
          <Box sx={fieldWrapperStyle}>
            <TextField
              {...commonProps}
              label={field.label}
              multiline
              rows={3}
            />
          </Box>
        );
      case "select":
        return (
          <Box sx={fieldWrapperStyle}>
            <TextField {...commonProps} select label={field.label}>
              {field.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        );
      case "range":
        return (
          <Box key={field.name} sx={{ mt: 2, width: "100%" }}>
            <Typography gutterBottom>
              {field.label}:{" "}
              {formData[field.name] ?? field.default ?? field.min}
            </Typography>
            <Box sx={{ px: 1 }}>
              {" "}
              {/* Add horizontal padding to align with TextFields */}
              <Slider
                value={formData[field.name] ?? field.default ?? field.min}
                min={field.min}
                max={field.max}
                step={1}
                onChange={(_, val) => handleSliderChange(field.name, val)}
                marks={[
                  { value: field.min!, label: "Beginner" },
                  { value: field.max!, label: "Expert" },
                ]}
              />
            </Box>
          </Box>
        );
      case "checkbox":
        return (
          <Box sx={fieldWrapperStyle}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData[field.name] || false}
                  onChange={handleInputChange}
                  name={field.name}
                />
              }
              label={field.label}
            />
          </Box>
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
                mb: 2, // bottom padding
              }}
            >
              {card.fields.map((field) => renderField(field))}
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
