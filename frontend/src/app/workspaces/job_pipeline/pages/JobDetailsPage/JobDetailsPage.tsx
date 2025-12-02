/**
 * JOB DETAILS PAGE
 * Comprehensive view of a single job opportunity with tabbed sections.
 *
 * FEATURES:
 * - Job overview (title, company, status, salary, location, description)
 * - Materials management (resumes, cover letters)
 * - Notes and contacts (recruiter, hiring manager, personal notes)
 * - Application history timeline
 *
 * TABS:
 * - Overview: Job details, description, quick actions
 * - Materials: Linked resumes/cover letters, generate new
 * - Notes: Personal notes, interview feedback, contacts
 * - History: Status changes, activity log
 *
 * NAVIGATION:
 * - Back to pipeline/jobs list
 * - Edit job button
 * - Status change dropdown
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Button,
  Stack,
  Divider,
  Alert,
} from "@mui/material";
import {
  ArrowBack,
  Edit,
  Delete,
  Archive,
  OpenInNew,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { useConfirmDialog } from "@shared/hooks/useConfirmDialog";
import { ErrorSnackbar } from "@shared/components/feedback/ErrorSnackbar";
import { DetailViewSkeleton } from "@shared/components/feedback/Skeletons";
import { Breadcrumbs } from "@shared/components/navigation";
import type { BreadcrumbItem } from "@shared/components/navigation";
import { jobsService } from "@job_pipeline/services";
import type { JobRow } from "@shared/types/database";

// Tab components (will create these)
import JobOverviewTab from "./JobOverviewTab";
import JobMaterialsTab from "./JobMaterialsTab";
import JobNotesTab from "./JobNotesTab";
import JobHistoryTab from "./JobHistoryTab";

type TabValue = "overview" | "materials" | gt"notes" | "history";

export default function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { notification, closeNotification, handleError, showSuccess } =
    useErrorHandler();
  const { confirm } = useConfirmDialog();

  const [job, setJob] = useState<JobRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>("overview");

  // Parse tab from URL hash (e.g., #materials)
  useEffect(() => {
    const hash = location.hash.replace("#", "") as TabValue;
    if (hash && ["overview", "materials", "notes", "history"].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location.hash]);

  // Load job data
  useEffect(() => {
    if (!user?.id || !id) return;

    const loadJob = async () => {
      setLoading(true);
      const result = await jobsService.getJob(user.id, Number(id));

      if (result.error) {
        handleError(result.error);
        setLoading(false);
        return;
      }

      if (!result.data) {
        handleError({ code: "NOT_FOUND", message: "Job not found" });
        setLoading(false);
        return;
      }

      setJob(result.data);
      setLoading(false);
    };

    loadJob();
  }, [user?.id, id, handleError]);

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: TabValue
  ) => {
    setActiveTab(newValue);
    // Update URL hash without navigation
    window.history.replaceState(null, "", `#${newValue}`);
  };

  const handleBack = () => {
    navigate("/jobs/pipeline");
  };

  const handleEdit = () => {
    navigate(`/jobs/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!user?.id || !id) return;

    const confirmed = await confirm({
      title: "Delete Job",
      description: "Delete this job? This cannot be undone.",
      confirmText: "Delete",
      confirmColor: "error",
    });

    if (!confirmed) return;

    const result = await jobsService.deleteJob(user.id, Number(id));
    if (result.error) {
      handleError(result.error);
      return;
    }

    showSuccess("Job deleted");
    navigate("/jobs/pipeline");
  };

  const handleArchive = async () => {
    if (!user?.id || !id) return;

    const result = await jobsService.archiveJob(user.id, Number(id));
    if (result.error) {
      handleError(result.error);
      return;
    }

    showSuccess("Job archived");
    navigate("/jobs/pipeline");
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <DetailViewSkeleton />
      </Container>
    );
  }

  if (!job) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Job not found</Alert>
        <Button onClick={handleBack} sx={{ mt: 2 }}>
          Back to Jobs
        </Button>
      </Container>
    );
  }

  const getStatusColor = (
    status: string | null
  ): "default" | "primary" | "success" | "error" | "warning" => {
    switch (status) {
      case "Interested":
        return "default";
      case "Applied":
        return "primary";
      case "Phone Screen":
      case "Interview":
        return "warning";
      case "Offer":
        return "success";
      case "Rejected":
        return "error";
      default:
        return "default";
    }
  };

  // Breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Jobs", path: "/jobs" },
    { label: "Pipeline", path: "/jobs/pipeline" },
    { label: job?.job_title || "Job Details" },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <IconButton onClick={handleBack} aria-label="back to jobs">
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" component="h1">
            {job.job_title || "Untitled Job"}
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
            <Typography variant="h6" color="text.secondary">
              {job.company_name || "Unknown Company"}
            </Typography>
            {job.job_status && (
              <Chip
                label={job.job_status}
                color={getStatusColor(job.job_status)}
                size="small"
              />
            )}
          </Stack>
        </Box>
        <Stack direction="row" spacing={1}>
          {job.job_link && (
            <IconButton
              component="a"
              href={job.job_link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="open job posting"
            >
              <OpenInNew />
            </IconButton>
          )}
          <IconButton onClick={handleEdit} aria-label="edit job">
            <Edit />
          </IconButton>
          <IconButton onClick={handleArchive} aria-label="archive job">
            <Archive />
          </IconButton>
          <IconButton
            onClick={handleDelete}
            color="error"
            aria-label="delete job"
          >
            <Delete />
          </IconButton>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="job details tabs"
        >
          <Tab label="Overview" value="overview" />
          <Tab label="Materials" value="materials" />
          <Tab label="Notes" value="notes" />
          <Tab label="History" value="history" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box role="tabpanel">
        {activeTab === "overview" && (
          <JobOverviewTab job={job} onUpdate={setJob} />
        )}
        {activeTab === "materials" && <JobMaterialsTab jobId={Number(id)} />}
        {activeTab === "notes" && <JobNotesTab jobId={Number(id)} />}
        {activeTab === "history" && <JobHistoryTab jobId={Number(id)} />}
      </Box>

      <ErrorSnackbar notification={notification} onClose={closeNotification} />
    </Container>
  );
}
