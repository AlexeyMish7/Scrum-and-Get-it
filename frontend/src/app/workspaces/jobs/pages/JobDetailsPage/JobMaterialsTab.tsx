/**
 * JOB MATERIALS TAB
 * Manage resumes and cover letters linked to this job.
 */

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  CardActions,
  Chip,
} from "@mui/material";
import {
  Description,
  Add,
  OpenInNew,
  Edit,
  AttachFile,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@shared/context/AuthContext";
import { EmptyState, LoadingSpinner } from "@shared/components/feedback";

interface JobMaterialsTabProps {
  jobId: number;
}

export default function JobMaterialsTab({ jobId }: JobMaterialsTabProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [materials, setMaterials] = useState<
    Array<{ id: string; name: string; type: string; created_at: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Load job_materials for this job
    // For now, show empty state
    setLoading(false);
    setMaterials([]);
  }, [jobId, user?.id]);

  const handleGenerateResume = () => {
    navigate(`/ai/resume?jobId=${jobId}`);
  };

  const handleGenerateCoverLetter = () => {
    navigate(`/ai/cover-letter?jobId=${jobId}`);
  };

  if (loading) {
    return <LoadingSpinner message="Loading materials..." />;
  }

  if (materials.length === 0) {
    return (
      <EmptyState
        icon={<AttachFile />}
        title="No Materials Linked"
        description="Generate or upload resumes and cover letters tailored for this job. AI-powered tools can help you create professional materials quickly."
        action={
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleGenerateResume}
            >
              Generate Resume
            </Button>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={handleGenerateCoverLetter}
            >
              Generate Cover Letter
            </Button>
          </Stack>
        }
      />
    );
  }

  return (
    <Stack spacing={2}>
      {/* Quick Actions */}
      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          size="small"
          startIcon={<Add />}
          onClick={handleGenerateResume}
        >
          Generate Resume
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          onClick={handleGenerateCoverLetter}
        >
          Generate Cover Letter
        </Button>
      </Stack>

      {/* Materials List */}
      {materials.map((material) => (
        <Card key={material.id}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Description color="action" />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">{material.name}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Chip label={material.type} size="small" />
                  <Typography variant="caption" color="text.secondary">
                    Created {new Date(material.created_at).toLocaleDateString()}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
          <CardActions>
            <Button size="small" startIcon={<OpenInNew />}>
              View
            </Button>
            <Button size="small" startIcon={<Edit />}>
              Edit
            </Button>
          </CardActions>
        </Card>
      ))}
    </Stack>
  );
}
