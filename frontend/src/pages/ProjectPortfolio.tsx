import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from "@mui/material";
import { supabase } from "../supabaseClient";

export interface Project {
  id: string;
  projectName: string;
  description: string;
  role: string;
  startDate: string;
  endDate: string;
  technologies: string;
  projectUrl?: string;
  teamSize: string;
  outcomes: string;
  industry: string;
  status: "Completed" | "Ongoing" | "Planned";
}

export const dummyProjects: Project[] = [
  {
    id: "1",
    projectName: "Portfolio Website",
    description: "A personal website to showcase projects and skills.",
    role: "Frontend Developer",
    startDate: "2024-01-10",
    endDate: "2024-02-15",
    technologies: "React, TypeScript, MUI",
    projectUrl: "https://example.com/portfolio",
    teamSize: "1",
    outcomes: "Learned React and TypeScript deeply",
    industry: "Education",
    status: "Completed",
  },
  {
    id: "2",
    projectName: "Task Manager App",
    description: "A simple app to track daily tasks with CRUD functionality.",
    role: "Full Stack Developer",
    startDate: "2024-03-01",
    endDate: "2024-03-30",
    technologies: "React, Node.js, Express, MongoDB",
    teamSize: "3",
    outcomes: "Built full CRUD operations and REST API",
    industry: "Productivity",
    status: "Completed",
  },
  {
    id: "3",
    projectName: "AI Chatbot",
    description: "An AI-powered chatbot for customer service.",
    role: "Backend Developer",
    startDate: "2024-04-05",
    endDate: "2024-05-10",
    technologies: "Python, Flask, OpenAI API",
    teamSize: "2",
    outcomes: "Implemented AI integration and response handling",
    industry: "Finance",
    status: "Ongoing",
  },
];

const ProjectPortfolio: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [filterTech, setFilterTech] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const navigate = useNavigate(); // added navigation

  useEffect(() => {
    setProjects(dummyProjects);
  }, []);

  useEffect(() => {
    let temp = [...projects];

    if (search) temp = temp.filter((p) => p.projectName.toLowerCase().includes(search.toLowerCase()));
    if (filterTech) temp = temp.filter((p) => p.technologies.includes(filterTech));
    if (filterIndustry) temp = temp.filter((p) => p.industry === filterIndustry);

    temp.sort((a, b) =>
      sortOrder === "newest"
        ? new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        : new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    setFilteredProjects(temp);
  }, [projects, search, filterTech, filterIndustry, sortOrder]);

  const handlePrint = () => window.print();

  const handleCopyLink = (projectId: string) => {
    const url = `${window.location.origin}/projects/${projectId}`;
    navigator.clipboard.writeText(url);
    alert("Project link copied to clipboard!");
  };

  // navigate to add project page
  const handleAddProject = () => {
    navigate("/add-projects");
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" textAlign="center" mb={2}>
        My Projects Portfolio
      </Typography>

      {/*Add Project Button */}
      <Box textAlign="center" mb={4}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddProject}
        >
          Add Project
        </Button>
      </Box>

      {/* Info Note */}
      <Typography variant="body2" color="text.secondary" textAlign="center" mb={4}>
        Click on any project to view details and copy its shareable link.
      </Typography>

      {/* Filters, search, and print button */}
      <Grid container spacing={2} mb={4} className="no-print">
        <Grid size={12}>
          <TextField
            label="Search Projects"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid size={12}>
          <FormControl fullWidth>
            <InputLabel>Technology</InputLabel>
            <Select value={filterTech} label="Technology" onChange={(e) => setFilterTech(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="React">React</MenuItem>
              <MenuItem value="TypeScript">TypeScript</MenuItem>
              <MenuItem value="Python">Python</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={12}>
          <FormControl fullWidth>
            <InputLabel>Industry</InputLabel>
            <Select value={filterIndustry} label="Industry" onChange={(e) => setFilterIndustry(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Finance">Finance</MenuItem>
              <MenuItem value="Healthcare">Healthcare</MenuItem>
              <MenuItem value="Education">Education</MenuItem>
              <MenuItem value="Productivity">Productivity</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={12}>
          <FormControl fullWidth>
            <InputLabel>Sort</InputLabel>
            <Select
              value={sortOrder}
              label="Sort"
              onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
            >
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="oldest">Oldest</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={12}>
          <Button variant="contained" color="primary" onClick={handlePrint} fullWidth>
            Print All Projects
          </Button>
        </Grid>
      </Grid>

      {/* Project Cards */}
      <Grid container spacing={3}>
        {filteredProjects.map((project) => (
          <Grid size={12} key={project.id}>
            <Card
              onClick={() => setSelectedProject(project)}
              sx={{ cursor: "pointer", "&:hover": { boxShadow: 6 } }}
            >
              <CardContent>
                <Typography variant="h6">{project.projectName}</Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {project.role} | {project.technologies}
                </Typography>
                <Typography variant="body2" mb={1}>
                  {project.description.slice(0, 100)}...
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Project Details Dialog */}
      <Dialog open={!!selectedProject} onClose={() => setSelectedProject(null)} maxWidth="sm" fullWidth className="no-print">
        <DialogTitle>{selectedProject?.projectName}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1">Role: {selectedProject?.role}</Typography>
          <Typography variant="subtitle2" mb={1}>
            Dates: {selectedProject?.startDate} - {selectedProject?.endDate}
          </Typography>
          <Typography variant="body2" mb={1}>
            Technologies: {selectedProject?.technologies}
          </Typography>
          <Typography variant="body2" mb={1}>
            Description: {selectedProject?.description}
          </Typography>
          <Typography variant="body2" mb={1}>
            Team Size: {selectedProject?.teamSize}
          </Typography>
          <Typography variant="body2" mb={1}>
            Outcomes: {selectedProject?.outcomes}
          </Typography>
          <Typography variant="body2" mb={1}>
            Industry: {selectedProject?.industry}
          </Typography>
          <Typography variant="body2" mb={1}>
            Status: {selectedProject?.status}
          </Typography>

          {selectedProject?.projectUrl && (
            <Button href={selectedProject.projectUrl} target="_blank" sx={{ mt: 2 }} variant="outlined">
              View Project
            </Button>
          )}

          {/* Copy Shareable Link */}
          <Tooltip title="Copy unique shareable URL for this project">
            <Button
              onClick={() => handleCopyLink(selectedProject!.id)}
              sx={{ mt: 2, ml: 2 }}
              variant="outlined"
            >
              Copy Shareable Link
            </Button>
          </Tooltip>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedProject(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectPortfolio;