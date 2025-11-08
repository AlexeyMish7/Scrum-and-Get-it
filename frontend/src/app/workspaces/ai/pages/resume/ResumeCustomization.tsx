// ResumeCustomization.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Switch,
  Card,
  CardContent,
  Button,
  Grid,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

interface ResumeSection {
  id: string;
  name: string;
  visible: boolean;
  completed: boolean;
}

interface ResumeData {
  [key: string]: string[];
}

const defaultSections: ResumeSection[] = [
  { id: "education", name: "Education", visible: true, completed: false },
  { id: "skills", name: "Skills", visible: true, completed: false },
  { id: "projects", name: "Projects", visible: true, completed: false },
  { id: "experience", name: "Experience", visible: true, completed: false },
  { id: "certifications", name: "Certifications", visible: false, completed: false },
];

const templates = {
  "Tech Resume": ["Experience", "Projects", "Skills", "Education"],
  "Research Resume": ["Education", "Projects", "Publications", "Skills"],
  "General Resume": ["Experience", "Education", "Skills"],
};

const dummyResume: ResumeData = {
  Education: [
    "B.S. in Computer Science, NJIT, 2024",
    "High School Diploma, Example High School, 2020",
  ],
  Skills: ["React", "Node.js", "TypeScript", "SQL", "Git"],
  Projects: [
    "Portfolio Website — Built with React and Material-UI",
    "Machine Learning Model for Anomaly Detection",
  ],
  Experience: [
    "Software Engineer Intern, Example Company, Summer 2024",
    "Lead Research Assistant, NJIT, 2023-2024",
   ],
   Certifications: ["AWS Certified Developer", "Certified Scrum Master"],
};

const ResumeCustomization: React.FC = () => {
  const [sections, setSections] = useState<ResumeSection[]>(defaultSections);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("Custom");
  const [jobType, setJobType] = useState<string>("software");

  // Automatically compute completed status based on dummyResume
  useEffect(() => {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        completed: dummyResume[s.name]?.length > 0,
      }))
    );
  }, []);

  const handleToggle = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(sections);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setSections(items);
  };

  const handleApplyTemplate = (templateName: string) => {
    const key = templateName as keyof typeof templates;
    const order = templates[key];
    const ordered = order
      .map((name) => sections.find((s) => s.name === name))
      .filter(Boolean) as ResumeSection[];
    const remaining = sections.filter((s) => !order.includes(s.name));
    setSections([...ordered, ...remaining]);
    setSelectedTemplate(templateName);
  };

  const handleSavePreset = () => {
    localStorage.setItem("resumePreset", JSON.stringify(sections));
    alert("Preset saved!");
  };

  const filteredSections = sections.filter((s) =>
    jobType === "software" ? true : s.id !== "certifications"
  );

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Resume Customization
      </Typography>

      <Grid container spacing={2}>
        {/* Left Column - Controls */}
        <Grid size={12}>
          <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6">Templates</Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Select Template</InputLabel>
              <Select
                value={selectedTemplate}
                label="Select Template"
                onChange={(e) => handleApplyTemplate(e.target.value)}
              >
                <MenuItem value="Custom">Custom</MenuItem>
                {Object.keys(templates).map((key) => (
                  <MenuItem key={key} value={key}>
                    {key}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6">Job Type</Typography>
            <Select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
            >
              <MenuItem value="software">Software</MenuItem>
              <MenuItem value="research">Research</MenuItem>
              <MenuItem value="design">Design</MenuItem>
            </Select>

            <Divider sx={{ my: 2 }} />

            <Button variant="contained" color="primary" fullWidth onClick={handleSavePreset}>
              Save as Preset
            </Button>
          </Card>
        </Grid>

        {/* Right Column - Drag + Preview */}
        <Grid size={12} >
          <Typography variant="h6">Arrange Sections</Typography>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections">
              {(provided) => (
                <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ mt: 2 }}>
                  {filteredSections.map((section, index) => (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{
                            mb: 2,
                            opacity: section.visible ? 1 : 0.5,
                            transition: "0.2s",
                          }}
                        >
                          <CardContent
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Box display="flex" alignItems="center" gap={1}>
                              {section.completed ? (
                                <FaCheckCircle color="green" />
                              ) : (
                                <FaExclamationTriangle color="orange" />
                              )}
                              <Typography>{section.name}</Typography>
                            </Box>
                            <Switch
                              checked={section.visible}
                              onChange={() => handleToggle(section.id)}
                            />
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6">Preview</Typography>
          <Box sx={{ mt: 2, p: 2, border: "1px solid #ccc", borderRadius: 1 }}>
            {filteredSections
              .filter((s) => s.visible)
              .map((s, idx) => (
                <Box key={idx} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {s.name}
                  </Typography>
                  {dummyResume[s.name]?.map((line, i) => (
                    <Typography key={i} sx={{ ml: 2 }}>
                      • {line}
                    </Typography>
                  ))}
                </Box>
              ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ResumeCustomization;
