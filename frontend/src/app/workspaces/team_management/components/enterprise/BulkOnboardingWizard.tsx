/**
 * BulkOnboardingWizard.tsx
 *
 * Multi-step wizard for bulk user onboarding in enterprise career services.
 * Allows administrators to import users via CSV, configure accounts, and track progress.
 */

import { useState, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  FormControlLabel,
  Alert,
  LinearProgress,
  Chip,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckIcon from "@mui/icons-material/Check";
import ErrorIcon from "@mui/icons-material/Error";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useEnterprise } from "../../hooks/useEnterprise";

const steps = ["Upload CSV", "Review Users", "Configure Options", "Process"];

interface ImportedUser {
  email: string;
  firstName: string;
  lastName: string;
  cohortId?: string;
  role?: string;
  isValid: boolean;
  error?: string;
}

interface BulkOnboardingWizardProps {
  teamId: string;
  cohortId?: string;
  onComplete?: (jobId: string) => void;
  onCancel?: () => void;
}

export const BulkOnboardingWizard = ({
  teamId,
  cohortId: defaultCohortId,
  onComplete,
  onCancel,
}: BulkOnboardingWizardProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [importedUsers, setImportedUsers] = useState<ImportedUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState({
    sendWelcomeEmail: true,
    assignToCohort: !!defaultCohortId,
    cohortId: defaultCohortId || "",
    defaultRole: "member",
  });

  const { startBulkOnboarding, bulkOnboardingProgress } = useEnterprise(teamId);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split("\n").filter((line) => line.trim());
          const users: ImportedUser[] = lines.slice(1).map((line) => {
            const [email, firstName, lastName, cohortId, role] = line
              .split(",")
              .map((s) => s.trim());
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const isValid = emailRegex.test(email) && !!firstName && !!lastName;
            return {
              email,
              firstName,
              lastName,
              cohortId: cohortId || undefined,
              role: role || "member",
              isValid,
              error: !isValid
                ? "Invalid email or missing required fields"
                : undefined,
            };
          });
          setImportedUsers(users);
          setSelectedUsers(
            new Set(users.filter((u) => u.isValid).map((u) => u.email))
          );
          setActiveStep(1);
        } catch {
          setError("Failed to parse CSV file. Please check the format.");
        }
      };
      reader.readAsText(file);
    },
    []
  );

  const handleToggleUser = (email: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedUsers(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedUsers.size === importedUsers.filter((u) => u.isValid).length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(
        new Set(importedUsers.filter((u) => u.isValid).map((u) => u.email))
      );
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    setError(null);
    try {
      const usersToOnboard = importedUsers
        .filter((u) => selectedUsers.has(u.email))
        .map((u) => ({
          email: u.email,
          first_name: u.firstName,
          last_name: u.lastName,
          cohort_id: options.assignToCohort ? options.cohortId : undefined,
          role: options.defaultRole,
        }));
      const result = await startBulkOnboarding(usersToOnboard, {
        send_welcome_email: options.sendWelcomeEmail,
      });
      if (result) {
        setJobId(result.id);
        setActiveStep(3);
        onComplete?.(result.id);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start bulk onboarding"
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template =
      "email,firstName,lastName,cohortId,role\njohn.doe@example.com,John,Doe,cohort-123,member";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_onboarding_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" gutterBottom>
              Upload User CSV File
            </Typography>
            <Typography color="text.secondary" paragraph>
              Upload a CSV file with user information to onboard multiple users
              at once.
            </Typography>
            <Box mb={3}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadTemplate}
                sx={{ mr: 2 }}
              >
                Download Template
              </Button>
            </Box>
            <Button
              variant="contained"
              component="label"
              startIcon={<CloudUploadIcon />}
              size="large"
            >
              Upload CSV
              <input
                type="file"
                hidden
                accept=".csv"
                onChange={handleFileUpload}
              />
            </Button>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">
                Review Imported Users ({selectedUsers.size} selected)
              </Typography>
            </Box>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={
                          selectedUsers.size ===
                          importedUsers.filter((u) => u.isValid).length
                        }
                        onChange={handleToggleAll}
                      />
                    </TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>First Name</TableCell>
                    <TableCell>Last Name</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importedUsers.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedUsers.has(user.email)}
                          onChange={() => handleToggleUser(user.email)}
                          disabled={!user.isValid}
                        />
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.firstName}</TableCell>
                      <TableCell>{user.lastName}</TableCell>
                      <TableCell>
                        {user.isValid ? (
                          <Chip
                            icon={<CheckIcon />}
                            label="Valid"
                            color="success"
                            size="small"
                          />
                        ) : (
                          <Chip
                            icon={<ErrorIcon />}
                            label="Invalid"
                            color="error"
                            size="small"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configure Onboarding Options
            </Typography>
            <Box display="flex" flexDirection="column" gap={2} mt={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.sendWelcomeEmail}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        sendWelcomeEmail: e.target.checked,
                      })
                    }
                  />
                }
                label="Send welcome email to new users"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.assignToCohort}
                    onChange={(e) =>
                      setOptions({
                        ...options,
                        assignToCohort: e.target.checked,
                      })
                    }
                  />
                }
                label="Assign users to a cohort"
              />
              {options.assignToCohort && (
                <TextField
                  label="Cohort ID"
                  value={options.cohortId}
                  onChange={(e) =>
                    setOptions({ ...options, cohortId: e.target.value })
                  }
                  fullWidth
                />
              )}
            </Box>
            <Alert severity="info" sx={{ mt: 3 }}>
              <strong>{selectedUsers.size}</strong> users will be onboarded with
              these settings.
            </Alert>
          </Box>
        );
      case 3:
        return (
          <Box textAlign="center" py={4}>
            {processing ? (
              <>
                <Typography variant="h6" gutterBottom>
                  Processing Onboarding...
                </Typography>
                <LinearProgress sx={{ my: 3 }} />
              </>
            ) : jobId ? (
              <>
                <CheckIcon
                  sx={{ fontSize: 64, color: "success.main", mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  Onboarding Started Successfully
                </Typography>
                <Typography color="text.secondary">Job ID: {jobId}</Typography>
                {bulkOnboardingProgress && (
                  <Box mt={2}>
                    <LinearProgress
                      variant="determinate"
                      value={
                        (bulkOnboardingProgress.processed_records /
                          bulkOnboardingProgress.total_records) *
                        100
                      }
                    />
                  </Box>
                )}
              </>
            ) : (
              <>
                <ErrorIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
                <Typography variant="h6">Onboarding Failed</Typography>
                <Typography color="error">{error}</Typography>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleProcess}
                  sx={{ mt: 2 }}
                >
                  Retry
                </Button>
              </>
            )}
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {error && activeStep !== 3 && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Paper sx={{ p: 3, mb: 3 }}>{renderStepContent()}</Paper>
      <Box display="flex" justifyContent="space-between">
        <Button onClick={onCancel} disabled={processing}>
          Cancel
        </Button>
        <Box>
          {activeStep > 0 && activeStep < 3 && (
            <Button onClick={handleBack} sx={{ mr: 1 }} disabled={processing}>
              Back
            </Button>
          )}
          {activeStep === 1 && (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={selectedUsers.size === 0}
            >
              Next
            </Button>
          )}
          {activeStep === 2 && (
            <Button
              variant="contained"
              onClick={handleProcess}
              disabled={processing}
            >
              Start Onboarding
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default BulkOnboardingWizard;
