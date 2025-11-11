/**
 * CoverLetterGenerationPanel
 *
 * WHAT: Left panel for job selection and AI generation options
 * WHY: User selects target job and customizes cover letter generation
 *
 * Features:
 * - Job selector dropdown
 * - Tone selector (formal, casual, enthusiastic, analytical)
 * - Length selector (brief, standard, detailed)
 * - Company culture matcher (corporate, startup, creative)
 * - Generate button with loading state
 * - Company research preview
 */

import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BusinessIcon from "@mui/icons-material/Business";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type {
  Tone,
  Length,
  CompanyCulture,
} from "@workspaces/ai/hooks/useCoverLetterDrafts";
import {
  TONE_DESCRIPTIONS,
  LENGTH_DESCRIPTIONS,
  CULTURE_DESCRIPTIONS,
} from "@workspaces/ai/config/coverLetterTemplates";

/**
 * Job interface matching database schema
 */
interface Job {
  id: number;
  job_title: string | null;
  company_name: string | null;
  job_description?: string | null;
  job_status?: string | null;
  industry?: string | null;
  job_link?: string | null;
}

export interface IndustryLanguageOptions {
  useTechnicalJargon: boolean;
  emphasizeKeywords: boolean;
  includeRoleSpecific: boolean;
}

interface GenerationPanelProps {
  jobs: Job[];
  selectedJobId: number | null;
  onJobSelect: (jobId: number | null) => void;
  tone: Tone;
  onToneChange: (tone: Tone) => void;
  length: Length;
  onLengthChange: (length: Length) => void;
  culture: CompanyCulture;
  onCultureChange: (culture: CompanyCulture) => void;
  industryLanguage: IndustryLanguageOptions;
  onIndustryLanguageChange: (options: IndustryLanguageOptions) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  loadingJobs?: boolean;
  companyResearch?: {
    companyName: string;
    industry?: string;
    size?: string;
    mission?: string;
  };
}

export default function CoverLetterGenerationPanel({
  jobs,
  selectedJobId,
  onJobSelect,
  tone,
  onToneChange,
  length,
  onLengthChange,
  culture,
  onCultureChange,
  industryLanguage,
  onIndustryLanguageChange,
  onGenerate,
  isGenerating,
  loadingJobs = false,
  companyResearch,
}: GenerationPanelProps) {
  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  return (
    <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Generate Cover Letter
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select a job and customize your cover letter with AI
          </Typography>
        </Box>

        <Divider />

        {/* AI Generation Info */}
        <Alert severity="info" icon={<AutoAwesomeIcon />}>
          <Typography
            variant="caption"
            fontWeight={500}
            display="block"
            gutterBottom
          >
            🎯 AI Personalization
          </Typography>
          <Typography variant="caption">
            Your locked template controls the AI writing style. When you link a
            job, we automatically use company research, recent news, and mission
            statements to create a highly personalized letter that demonstrates
            genuine interest.
          </Typography>
        </Alert>

        {/* Job Selection */}
        <FormControl fullWidth>
          <InputLabel>Target Job</InputLabel>
          <Select
            value={selectedJobId ?? ""}
            label="Target Job"
            onChange={(e) =>
              onJobSelect(e.target.value ? Number(e.target.value) : null)
            }
            disabled={loadingJobs}
          >
            <MenuItem value="">
              <em>{loadingJobs ? "Loading jobs..." : "None"}</em>
            </MenuItem>
            {jobs.map((job) => (
              <MenuItem key={job.id} value={job.id}>
                <Stack>
                  <Typography variant="body2" fontWeight={500}>
                    {job.job_title || "Untitled Position"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {job.company_name || "Unknown Company"}
                  </Typography>
                </Stack>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Loading State */}
        {loadingJobs && (
          <Alert severity="info" icon={<CircularProgress size={20} />}>
            Loading your jobs...
          </Alert>
        )}

        {/* No Jobs Alert */}
        {!loadingJobs && jobs.length === 0 && (
          <Alert severity="info">
            No jobs found. Add jobs in the Jobs workspace first.
          </Alert>
        )}

        {/* Selected Job Info */}
        {selectedJob && (
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2">
                {selectedJob.job_title || "Untitled Position"}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <BusinessIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {selectedJob.company_name}
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        )}

        <Divider />

        {/* Tone Selection */}
        <FormControl fullWidth>
          <InputLabel>Tone</InputLabel>
          <Select
            value={tone}
            label="Tone"
            onChange={(e) => onToneChange(e.target.value as Tone)}
          >
            <MenuItem value="formal">Formal</MenuItem>
            <MenuItem value="casual">Casual</MenuItem>
            <MenuItem value="enthusiastic">Enthusiastic</MenuItem>
            <MenuItem value="analytical">Analytical</MenuItem>
          </Select>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, ml: 1 }}
          >
            {TONE_DESCRIPTIONS[tone]}
          </Typography>
        </FormControl>

        {/* Length Selection */}
        <FormControl fullWidth>
          <InputLabel>Length</InputLabel>
          <Select
            value={length}
            label="Length"
            onChange={(e) => onLengthChange(e.target.value as Length)}
          >
            <MenuItem value="brief">Brief (200-300 words)</MenuItem>
            <MenuItem value="standard">Standard (300-400 words)</MenuItem>
            <MenuItem value="detailed">Detailed (400-500 words)</MenuItem>
          </Select>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, ml: 1 }}
          >
            {LENGTH_DESCRIPTIONS[length]}
          </Typography>
        </FormControl>

        {/* Company Culture Selection */}
        <FormControl fullWidth>
          <InputLabel>Company Culture</InputLabel>
          <Select
            value={culture}
            label="Company Culture"
            onChange={(e) => onCultureChange(e.target.value as CompanyCulture)}
          >
            <MenuItem value="corporate">Corporate</MenuItem>
            <MenuItem value="startup">Startup</MenuItem>
            <MenuItem value="creative">Creative</MenuItem>
          </Select>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, ml: 1 }}
          >
            {CULTURE_DESCRIPTIONS[culture]}
          </Typography>
        </FormControl>

        {/* Advanced Options */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Advanced Options</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={industryLanguage.useTechnicalJargon}
                    onChange={(e) =>
                      onIndustryLanguageChange({
                        ...industryLanguage,
                        useTechnicalJargon: e.target.checked,
                      })
                    }
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2">Use technical jargon</Typography>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={industryLanguage.emphasizeKeywords}
                    onChange={(e) =>
                      onIndustryLanguageChange({
                        ...industryLanguage,
                        emphasizeKeywords: e.target.checked,
                      })
                    }
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2">
                    Emphasize industry keywords
                  </Typography>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={industryLanguage.includeRoleSpecific}
                    onChange={(e) =>
                      onIndustryLanguageChange({
                        ...industryLanguage,
                        includeRoleSpecific: e.target.checked,
                      })
                    }
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2">
                    Include role-specific terminology
                  </Typography>
                }
              />
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        {/* Company Research Preview */}
        {companyResearch && (
          <>
            <Divider />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Company Research
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "info.50" }}>
                <Stack spacing={1}>
                  <Typography variant="body2" fontWeight={500}>
                    {companyResearch.companyName}
                  </Typography>
                  {companyResearch.industry && (
                    <Chip label={companyResearch.industry} size="small" />
                  )}
                  {companyResearch.size && (
                    <Typography variant="caption" color="text.secondary">
                      {companyResearch.size}
                    </Typography>
                  )}
                  {companyResearch.mission && (
                    <Typography variant="caption" color="text.secondary">
                      {companyResearch.mission}
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Box>
          </>
        )}

        {/* Generate Button */}
        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={
            isGenerating ? <CircularProgress size={20} /> : <AutoAwesomeIcon />
          }
          onClick={onGenerate}
          disabled={!selectedJobId || isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate Cover Letter"}
        </Button>

        {!selectedJobId && (
          <Alert severity="info">
            Select a job to generate a tailored cover letter
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
