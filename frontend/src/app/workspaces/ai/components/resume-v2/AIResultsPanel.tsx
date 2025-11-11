/**
 * AIResultsPanel Component
 *
 * WHAT: Tabbed display of AI-generated resume content with apply actions
 * WHY: Clear presentation of AI output with granular control over what gets applied
 *
 * Features:
 * - Tabbed interface: Summary, Skills, Experience, Education, Projects
 * - Individual apply buttons per section
 * - "Apply All" master action
 * - Visual state indicators (generated, applied, empty)
 * - Copy to clipboard helpers
 *
 * Inputs: content (ResumeArtifactContent from AI generation)
 * Output: Emits apply events to parent container
 * States: empty, generated, applied
 */

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";
import type { ResumeArtifactContent } from "@workspaces/ai/types/ai";

interface AIResultsPanelProps {
  content: ResumeArtifactContent | null;
  appliedSections: Set<string>;
  onApplySection: (
    section: "summary" | "skills" | "experience" | "education"
  ) => void;
  onApplyAll: () => void;
  onCopyText?: (text: string) => void;
}

export default function AIResultsPanel({
  content,
  appliedSections,
  onApplySection,
  onApplyAll,
  onCopyText,
}: AIResultsPanelProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (!content) {
    return (
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardContent>
          <Stack
            spacing={2}
            alignItems="center"
            justifyContent="center"
            sx={{ minHeight: 400 }}
          >
            <Typography variant="h6" color="text.secondary">
              📊 AI Generated Content
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              Click "Generate Resume" to create tailored content for your
              selected job.
              <br />
              Results will appear here with options to apply to your draft.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  const hasSummary = Boolean(content.summary);
  const hasSkills = Boolean(content.ordered_skills?.length);
  const hasExperience = Boolean(content.sections?.experience?.length);
  const hasEducation = Boolean(content.sections?.education?.length);
  const hasProjects = Boolean(content.sections?.projects?.length);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    if (onCopyText) {
      onCopyText(text);
    }
  };

  const canApplyAll = hasSummary || hasSkills || hasExperience || hasEducation;
  const allApplied =
    (!hasSummary || appliedSections.has("summary")) &&
    (!hasSkills || appliedSections.has("skills")) &&
    (!hasExperience || appliedSections.has("experience")) &&
    (!hasEducation || appliedSections.has("education"));

  return (
    <Card
      variant="outlined"
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <CardContent
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          p: 0,
          overflow: "hidden", // Constrain children to enable scrolling
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6">📊 AI Generated Content</Typography>
              <Typography variant="caption" color="text.secondary">
                Generated: {new Date().toLocaleTimeString()} • Ready to apply
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              {hasSummary && (
                <Chip
                  size="small"
                  label="Summary"
                  color="success"
                  variant="outlined"
                />
              )}
              {hasSkills && (
                <Chip
                  size="small"
                  label={`${content.ordered_skills?.length} Skills`}
                  color="success"
                  variant="outlined"
                />
              )}
              {hasExperience && (
                <Chip
                  size="small"
                  label={`${content.sections?.experience?.length} Roles`}
                  color="success"
                  variant="outlined"
                />
              )}
            </Stack>
          </Stack>
        </Box>

        <Divider />

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
          >
            <Tab label="Summary" />
            <Tab label="Skills" />
            <Tab label="Experience" />
            <Tab label="Education" />
            <Tab label="Projects" />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
          {/* Summary Tab */}
          {activeTab === 0 && (
            <Stack spacing={2}>
              {hasSummary ? (
                <>
                  <Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <CheckCircleIcon color="success" fontSize="small" />
                      <Typography variant="subtitle2">
                        Professional Summary
                      </Typography>
                    </Stack>
                    <Typography
                      variant="body1"
                      sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}
                    >
                      {content.summary}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    {appliedSections.has("summary") ? (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Applied to draft"
                        color="primary"
                        size="small"
                      />
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => onApplySection("summary")}
                      >
                        ✓ Apply Summary
                      </Button>
                    )}
                    <Tooltip title="Copy to clipboard">
                      <IconButton
                        size="small"
                        onClick={() => handleCopy(content.summary || "")}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </>
              ) : (
                <Alert severity="info">
                  No summary generated. This usually happens when there isn't
                  enough profile data.
                </Alert>
              )}
            </Stack>
          )}

          {/* Skills Tab */}
          {activeTab === 1 && (
            <Stack spacing={2}>
              {hasSkills ? (
                <>
                  {/* Skills Match Score */}
                  {content.score !== undefined && (
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "primary.50",
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "primary.200",
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Skills Match Score
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            How well your skills align with the job requirements
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography
                            variant="h3"
                            color={
                              content.score >= 80
                                ? "success.main"
                                : content.score >= 60
                                ? "warning.main"
                                : "error.main"
                            }
                          >
                            {content.score}%
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  )}

                  {/* Optimized Skills List */}
                  <Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 1.5 }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CheckCircleIcon color="success" fontSize="small" />
                        <Typography variant="subtitle2">
                          Optimized Skills (
                          {content.ordered_skills?.length || 0})
                        </Typography>
                      </Box>
                      <Tooltip title="Copy all skills to clipboard">
                        <IconButton
                          size="small"
                          onClick={() => {
                            if (onCopyText && content.ordered_skills) {
                              onCopyText(content.ordered_skills.join(", "));
                            }
                          }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 1, display: "block" }}
                    >
                      Ranked by relevance to the job posting
                    </Typography>

                    {/* Skills with Relevance Scoring */}
                    <Box sx={{ mt: 2 }}>
                      {content.ordered_skills?.map((skill, idx) => {
                        // Calculate relevance score (100% for first, decreasing)
                        const totalSkills = content.ordered_skills?.length || 1;
                        const relevanceScore = Math.round(
                          100 - (idx / totalSkills) * 60
                        ); // Top skills get 100%, bottom get 40%
                        const isTopSkill = idx < 5;

                        return (
                          <Box
                            key={idx}
                            sx={{
                              mb: 1.5,
                              p: 1.5,
                              bgcolor: isTopSkill ? "primary.50" : "grey.50",
                              borderRadius: 1,
                              border: "1px solid",
                              borderColor: isTopSkill
                                ? "primary.200"
                                : "grey.200",
                              transition: "all 0.2s",
                              "&:hover": {
                                boxShadow: 1,
                                borderColor: "primary.main",
                              },
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={2}
                              alignItems="center"
                            >
                              <Chip
                                label={idx + 1}
                                size="small"
                                color={isTopSkill ? "primary" : "default"}
                                sx={{ minWidth: 32, fontWeight: 600 }}
                              />
                              <Typography
                                flex={1}
                                variant="body2"
                                sx={{ fontWeight: isTopSkill ? 600 : 400 }}
                              >
                                {skill}
                              </Typography>
                              <Box sx={{ width: 120 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={relevanceScore}
                                  sx={{
                                    height: 8,
                                    borderRadius: 1,
                                    bgcolor: "grey.200",
                                    "& .MuiLinearProgress-bar": {
                                      bgcolor:
                                        relevanceScore >= 80
                                          ? "success.main"
                                          : relevanceScore >= 60
                                          ? "primary.main"
                                          : "warning.main",
                                    },
                                  }}
                                />
                              </Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  minWidth: 45,
                                  fontWeight: 600,
                                  color:
                                    relevanceScore >= 80
                                      ? "success.main"
                                      : relevanceScore >= 60
                                      ? "primary.main"
                                      : "text.secondary",
                                }}
                              >
                                {relevanceScore}%
                              </Typography>
                            </Stack>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>

                  {/* Skills to Emphasize */}
                  {content.emphasize_skills &&
                    content.emphasize_skills.length > 0 && (
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: "warning.50",
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "warning.200",
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          sx={{ mb: 1 }}
                        >
                          <Typography variant="subtitle2">
                            ⭐ Skills to Emphasize
                          </Typography>
                          <Chip
                            label={content.emphasize_skills.length}
                            size="small"
                            color="warning"
                          />
                        </Stack>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 1.5, display: "block" }}
                        >
                          These skills match the job requirements and should be
                          highlighted
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={0.75}>
                          {content.emphasize_skills.map((skill, idx) => (
                            <Chip
                              key={idx}
                              label={skill}
                              size="small"
                              color="warning"
                              sx={{ fontWeight: 600 }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}

                  {/* Skills to Add */}
                  {content.add_skills && content.add_skills.length > 0 && (
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "info.50",
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "info.200",
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ mb: 1 }}
                      >
                        <Typography variant="subtitle2">
                          ➕ Recommended Skills to Add
                        </Typography>
                        <Chip
                          label={content.add_skills.length}
                          size="small"
                          color="info"
                        />
                      </Stack>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mb: 1.5, display: "block" }}
                      >
                        Skills from the job posting that you may want to acquire
                        or add to your profile
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={0.75}>
                        {content.add_skills.map((skill, idx) => (
                          <Chip
                            key={idx}
                            label={skill}
                            size="small"
                            color="info"
                            variant="outlined"
                            sx={{
                              cursor: "pointer",
                              "&:hover": { bgcolor: "info.100" },
                            }}
                            onClick={() => {
                              // Future: Add to profile skills
                              console.log("Add skill to profile:", skill);
                            }}
                          />
                        ))}
                      </Stack>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1.5, display: "block", fontStyle: "italic" }}
                      >
                        💡 Tip: Click on a skill to add it to your profile
                        (coming soon)
                      </Typography>
                    </Box>
                  )}

                  {/* Apply Button */}
                  <Stack direction="row" spacing={1}>
                    {appliedSections.has("skills") ? (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Applied to draft"
                        color="primary"
                        size="small"
                      />
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => onApplySection("skills")}
                      >
                        ✓ Apply Skills
                      </Button>
                    )}
                    <Tooltip title="Copy skills list">
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleCopy((content.ordered_skills || []).join(", "))
                        }
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </>
              ) : (
                <Alert severity="info">
                  No skills generated. Add skills to your profile first.
                </Alert>
              )}
            </Stack>
          )}

          {/* Experience Tab */}
          {activeTab === 2 && (
            <Stack spacing={2}>
              {hasExperience ? (
                <>
                  <Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <CheckCircleIcon color="success" fontSize="small" />
                      <Typography variant="subtitle2">
                        Tailored Experience (
                        {content.sections?.experience?.length} roles)
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      AI-optimized descriptions with relevance scores and action
                      verbs
                    </Typography>
                  </Box>

                  <Stack spacing={3}>
                    {content.sections?.experience?.map((exp, idx) => {
                      const score = exp.relevance_score ?? 0;
                      const scoreColor =
                        score >= 80
                          ? "success.main"
                          : score >= 60
                          ? "warning.main"
                          : "error.main";
                      const hasComparison =
                        exp.original_bullets && exp.original_bullets.length > 0;

                      return (
                        <Box
                          key={idx}
                          sx={{
                            p: 2,
                            bgcolor: score >= 80 ? "success.50" : "grey.50",
                            borderRadius: 1,
                            border: "1px solid",
                            borderColor:
                              score >= 80
                                ? "success.200"
                                : score >= 60
                                ? "warning.200"
                                : "grey.300",
                          }}
                        >
                          {/* Header with Role, Company, and Relevance Score */}
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            sx={{ mb: 1 }}
                          >
                            <Box sx={{ flex: 1 }}>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="baseline"
                              >
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600 }}
                                >
                                  📍 {exp.role}
                                </Typography>
                                {exp.company && (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    — {exp.company}
                                  </Typography>
                                )}
                              </Stack>
                              {exp.dates && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: "block", mt: 0.5 }}
                                >
                                  {exp.dates}
                                </Typography>
                              )}
                            </Box>

                            {/* Relevance Score Badge */}
                            {exp.relevance_score !== undefined && (
                              <Tooltip title="How relevant this role is to the target job">
                                <Chip
                                  label={`${score}% Match`}
                                  size="small"
                                  sx={{
                                    bgcolor:
                                      score >= 80
                                        ? "success.100"
                                        : score >= 60
                                        ? "warning.100"
                                        : "error.100",
                                    color: scoreColor,
                                    fontWeight: 600,
                                  }}
                                />
                              </Tooltip>
                            )}
                          </Stack>

                          {/* AI Tailoring Notes */}
                          {exp.notes && exp.notes.length > 0 && (
                            <Alert
                              severity="info"
                              icon={<InfoIcon fontSize="small" />}
                              sx={{ mb: 2, py: 0.5 }}
                            >
                              <Typography variant="caption">
                                {exp.notes.join(" • ")}
                              </Typography>
                            </Alert>
                          )}

                          {/* Tailored Bullets */}
                          <Box sx={{ mb: hasComparison ? 1 : 0 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                mb: 1,
                                fontWeight: 600,
                                color: "success.dark",
                              }}
                            >
                              ✨ AI-Tailored Bullets
                            </Typography>
                            <Stack
                              component="ul"
                              sx={{ pl: 3, m: 0 }}
                              spacing={0.5}
                            >
                              {exp.bullets.map((bullet, bidx) => (
                                <Typography
                                  component="li"
                                  key={bidx}
                                  variant="body2"
                                  sx={{ mb: 0.5 }}
                                >
                                  {bullet}
                                </Typography>
                              ))}
                            </Stack>
                          </Box>

                          {/* Comparison View: Original vs Tailored */}
                          {hasComparison && (
                            <Box
                              sx={{
                                mt: 2,
                                pt: 2,
                                borderTop: "1px dashed",
                                borderColor: "divider",
                              }}
                            >
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                                sx={{ mb: 1 }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 600,
                                    color: "text.secondary",
                                  }}
                                >
                                  📋 Original Bullets (from your profile)
                                </Typography>
                                <Chip
                                  label={`${
                                    exp.original_bullets!.length
                                  } bullets`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 18, fontSize: "0.7rem" }}
                                />
                              </Stack>
                              <Stack
                                component="ul"
                                sx={{
                                  pl: 3,
                                  m: 0,
                                  bgcolor: "grey.100",
                                  p: 1.5,
                                  borderRadius: 1,
                                }}
                                spacing={0.5}
                              >
                                {exp.original_bullets!.map((bullet, bidx) => (
                                  <Typography
                                    component="li"
                                    key={bidx}
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ mb: 0.25 }}
                                  >
                                    {bullet}
                                  </Typography>
                                ))}
                              </Stack>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: "block",
                                  mt: 1,
                                  fontStyle: "italic",
                                  color: "text.secondary",
                                }}
                              >
                                💡 Tip: Compare to see how AI emphasized
                                relevant achievements and action verbs
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    {appliedSections.has("experience") ? (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Applied to draft"
                        color="primary"
                        size="small"
                      />
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => onApplySection("experience")}
                      >
                        ✓ Apply All Experience
                      </Button>
                    )}
                  </Stack>
                </>
              ) : (
                <Alert severity="info">
                  No experience generated. Add work experience to your profile
                  first.
                </Alert>
              )}
            </Stack>
          )}

          {/* Education Tab */}
          {activeTab === 3 && (
            <Stack spacing={2}>
              {hasEducation ? (
                <>
                  <Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <CheckCircleIcon color="success" fontSize="small" />
                      <Typography variant="subtitle2">
                        Education History ({content.sections?.education?.length}
                        )
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Education entries from your profile - click Apply to add
                      to draft
                    </Typography>
                  </Box>

                  <Stack spacing={2}>
                    {content.sections?.education?.map((edu, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "grey.300",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          🎓 {edu.degree}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {edu.institution}
                          {edu.graduation_date && ` • ${edu.graduation_date}`}
                        </Typography>
                        {edu.details && edu.details.length > 0 && (
                          <Stack component="ul" sx={{ pl: 3, m: 0, mt: 1 }}>
                            {edu.details.map((detail, didx) => (
                              <Typography
                                component="li"
                                key={didx}
                                variant="body2"
                              >
                                {detail}
                              </Typography>
                            ))}
                          </Stack>
                        )}
                      </Box>
                    ))}
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    {appliedSections.has("education") ? (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Applied to draft"
                        color="primary"
                        size="small"
                      />
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => onApplySection("education")}
                      >
                        ✓ Apply Education
                      </Button>
                    )}
                  </Stack>
                </>
              ) : (
                <Alert severity="info">
                  No education data in your profile. Add education history in
                  your profile settings.
                </Alert>
              )}
            </Stack>
          )}

          {/* Projects Tab */}
          {activeTab === 4 && (
            <Stack spacing={2}>
              {hasProjects ? (
                <>
                  <Typography variant="caption" color="text.secondary">
                    Projects are pulled directly from your profile (read-only
                    preview)
                  </Typography>
                  <Stack spacing={2}>
                    {content.sections?.projects?.map((proj, idx) => (
                      <Box key={idx}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          {proj.name}
                        </Typography>
                        {proj.role && (
                          <Typography variant="caption" color="text.secondary">
                            Role: {proj.role}
                          </Typography>
                        )}
                        {proj.bullets && proj.bullets.length > 0 && (
                          <Stack component="ul" sx={{ pl: 3, m: 0, mt: 0.5 }}>
                            {proj.bullets.map((bullet, bidx) => (
                              <Typography
                                component="li"
                                key={bidx}
                                variant="body2"
                              >
                                {bullet}
                              </Typography>
                            ))}
                          </Stack>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </>
              ) : (
                <Alert severity="info">
                  No projects in your profile. Add projects in your profile
                  settings.
                </Alert>
              )}
            </Stack>
          )}
        </Box>

        {/* Footer Actions */}
        <Divider />
        <Box sx={{ p: 2 }}>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="caption" color="text.secondary">
              {allApplied
                ? "✓ All sections applied"
                : "Apply sections to add them to your draft"}
            </Typography>
            <Button
              variant="contained"
              onClick={onApplyAll}
              disabled={!canApplyAll || allApplied}
              sx={{ minWidth: 140 }}
            >
              {allApplied ? "All Applied ✓" : "Apply All Sections"}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
