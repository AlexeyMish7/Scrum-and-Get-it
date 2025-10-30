import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useAuth } from "../../context/AuthContext";
import crud from "../../services/crud";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import type { Project } from "../../services/types";

const ProjectPortfolio: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [filterTech, setFilterTech] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Load projects
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (loading) {
        setIsLoading(true);
        return;
      }

      if (!user) {
        if (!mounted) return;
        setProjects([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const userCrud = crud.withUser(user.id);
        const res = await userCrud.listRows(
          "projects",
          "id,proj_name,proj_description,role,start_date,end_date,tech_and_skills,project_url,team_size,proj_outcomes,industry_proj_type,status,media_path",
          { order: { column: "start_date", ascending: false } }
        );
        if (!mounted) return;
        if (res.error) {
          console.error("Failed to load projects:", res.error);
          setProjects([]);
          return;
        }

        const rows = Array.isArray(res.data)
          ? res.data
          : res.data
          ? [res.data]
          : [];
        const mapped = rows.map((r: Record<string, unknown>) => {
          const getString = (k: string) => {
            const v = r[k];
            if (typeof v === "string") return v;
            if (Array.isArray(v)) return v.join(", ");
            return String(v ?? "");
          };
          return {
            id: getString("id"),
            projectName: getString("proj_name"),
            description: getString("proj_description"),
            role: getString("role"),
            startDate: getString("start_date"),
            endDate: getString("end_date"),
            technologies: getString("tech_and_skills"),
            projectUrl:
              typeof r["project_url"] === "string"
                ? (r["project_url"] as string)
                : undefined,
            teamSize: getString("team_size"),
            outcomes: getString("proj_outcomes"),
            industry: getString("industry_proj_type"),
            status:
              typeof r["status"] === "string"
                ? (r["status"] as "Completed" | "Ongoing" | "Planned")
                : "Planned",
          } as Project;
        });
        setProjects(mapped);
      } catch (err) {
        console.error("Error loading projects:", err);
        setProjects([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    const handler = () => void load();
    window.addEventListener("projects:changed", handler);

    return () => {
      mounted = false;
      window.removeEventListener("projects:changed", handler);
    };
  }, [user, loading]);

  // Filtering + sorting
  useEffect(() => {
    let temp = [...projects];

    if (search)
      temp = temp.filter((p) =>
        p.projectName.toLowerCase().includes(search.toLowerCase())
      );
    if (filterTech)
      temp = temp.filter((p) => p.technologies.includes(filterTech));
    if (filterIndustry)
      temp = temp.filter((p) => p.industry === filterIndustry);

    temp.sort((a, b) =>
      sortOrder === "newest"
        ? new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        : new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    setFilteredProjects(temp);
  }, [projects, search, filterTech, filterIndustry, sortOrder]);

  if (loading || isLoading) return <LoadingSpinner />;

  const handlePrint = () => window.print();
  const handleCopyLink = (projectId: string) => {
    const url = `${window.location.origin}/projects/${projectId}`;
    navigator.clipboard.writeText(url);
    alert("Project link copied to clipboard!");
  };
  const handleAddProject = () => navigate("/add-projects");

  return (
    <Box sx={{ p: 4 }}>
      <style>
        {`
        @media print {
  .no-print {
    display: none !important;
  }

  body {
    background: white;
    color: black;
  }

  .MuiCard-root {
    page-break-inside: avoid;
    border: 1px solid #000;
    margin-bottom: 10px;
  }

  a {
    color: black;
    text-decoration: none;
  }
}
      `}
      </style>
      <Typography variant="h2" textAlign="center" mb={2}>
        My Projects Portfolio
      </Typography>

      {/* Add Project Button */}
      <Box textAlign="center" mb={4} className="no-print">
        <Button variant="contained" color="primary" onClick={handleAddProject}>
          Add Project
        </Button>
      </Box>

      <Typography
        variant="body2"
        color="text.secondary"
        textAlign="center"
        mb={4}
        className="no-print"
      >
        Click on any project to view details and copy its shareable link.
      </Typography>

      {/* Filters, search, and print */}
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
            <Select
              value={filterTech}
              label="Technology"
              onChange={(e) => setFilterTech(e.target.value)}
            >
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
            <Select
              value={filterIndustry}
              label="Industry"
              onChange={(e) => setFilterIndustry(e.target.value)}
            >
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
              onChange={(e) =>
                setSortOrder(e.target.value as "newest" | "oldest")
              }
            >
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="oldest">Oldest</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handlePrint}
            fullWidth
          >
            Print All Projects
          </Button>
        </Grid>
      </Grid>

      {/* Project Cards */}
      <Grid container spacing={3}>
        {filteredProjects.map((project) => (
          <Grid size={12} key={project.id} className="project-card">
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
      <Dialog
        open={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{selectedProject?.projectName}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1">
            Role: {selectedProject?.role}
          </Typography>
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
            <Button
              href={selectedProject.projectUrl}
              target="_blank"
              sx={{ mt: 2 }}
              variant="outlined"
            >
              View Project
            </Button>
          )}

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
