/**
 * DraftPreviewPanel Component
 *
 * WHAT: Live preview of resume draft with state indicators and inline editing
 * WHY: Users need to see what their final resume looks like as they build it
 *
 * Features:
 * - Live preview matching export formatting
 * - State indicators: [Empty], ✓ Applied from AI, ↳ From profile, ✏️ Manually edited
 * - Inline editing per section
 * - Section controls: show/hide, reorder
 * - Export actions: PDF, DOCX (auto-saves as version)
 * - Version indicator showing current version
 *
 * Inputs: draft (current resume draft), template info
 * Output: Emits edit events, export actions
 * States: empty, applied, from-profile, edited
 */

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DownloadIcon from "@mui/icons-material/Download";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import {
  validateResume,
  getHealthScoreColor,
  getHealthScoreLabel,
  type ValidationResult,
} from "@workspaces/ai/utils/resumeValidation";
import { useAuth } from "@shared/context/AuthContext";
import { getTemplate } from "@workspaces/ai/config/resumeTemplates";
import FeedbackDialog from "@workspaces/ai/components/resume-v2/FeedbackDialog";

interface DraftSection {
  type: "summary" | "skills" | "experience" | "education" | "projects";
  visible: boolean;
  state: "empty" | "applied" | "from-profile" | "edited";
  lastUpdated?: Date;
}

interface ResumeDraft {
  id: string;
  name: string;
  templateId?: string;
  content: {
    summary?: string;
    skills?: string[];
    experience?: Array<{
      employment_id?: string;
      role?: string;
      company?: string;
      dates?: string;
      bullets: string[];
    }>;
    education?: Array<{
      degree: string;
      institution: string;
      graduation_date?: string;
      details?: string[];
    }>;
    projects?: Array<{
      name: string;
      role?: string;
      bullets?: string[];
    }>;
  };
  metadata: {
    sections: DraftSection[];
    lastModified: Date;
    createdAt: Date;
    jobId?: number;
    jobTitle?: string;
    jobCompany?: string;
  };
}

interface DraftPreviewPanelProps {
  draft: ResumeDraft | null;
  onEditSection: (section: string, content: unknown) => void;
  onToggleSection: (section: string, visible: boolean) => void;
  onReorderSections: (newOrder: string[]) => void;
  onExport: (format: "pdf" | "docx") => void;
}

export default function DraftPreviewPanel({
  draft,
  onEditSection,
  onToggleSection,
  onReorderSections,
  onExport,
}: DraftPreviewPanelProps) {
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [showValidation, setShowValidation] = useState(false);

  // Calculate validation when draft changes
  const { user } = useAuth();
  const userProfileForValidation = user
    ? {
        full_name: `${user.user_metadata?.first_name || ""} ${
          user.user_metadata?.last_name || ""
        }`.trim(),
        email: user.email,
        phone: user.user_metadata?.phone,
      }
    : undefined;

  const validation: ValidationResult | null = draft
    ? validateResume(draft, userProfileForValidation)
    : null;

  // Move section up in the order
  const handleMoveSectionUp = (sectionType: string) => {
    if (!draft) return;

    const visibleSections = draft.metadata.sections.filter((s) => s.visible);
    const currentIndex = visibleSections.findIndex(
      (s) => s.type === sectionType
    );

    console.log("🔼 Move Up:", {
      sectionType,
      currentIndex,
      visibleCount: visibleSections.length,
    });

    if (currentIndex <= 0) return; // Already at top or not found

    // Swap with previous section
    const newVisibleOrder = [...visibleSections];
    [newVisibleOrder[currentIndex - 1], newVisibleOrder[currentIndex]] = [
      newVisibleOrder[currentIndex],
      newVisibleOrder[currentIndex - 1],
    ];

    // Reconstruct full order with hidden sections at the end
    const hiddenSections = draft.metadata.sections.filter((s) => !s.visible);
    const newOrder = [...newVisibleOrder, ...hiddenSections];

    console.log(
      "🔼 New order:",
      newOrder.map((s) => s.type)
    );
    onReorderSections(newOrder.map((s) => s.type));
  };

  // Move section down in the order
  const handleMoveSectionDown = (sectionType: string) => {
    if (!draft) return;

    const visibleSections = draft.metadata.sections.filter((s) => s.visible);
    const currentIndex = visibleSections.findIndex(
      (s) => s.type === sectionType
    );

    console.log("🔽 Move Down:", {
      sectionType,
      currentIndex,
      visibleCount: visibleSections.length,
    });

    if (currentIndex === -1 || currentIndex >= visibleSections.length - 1)
      return; // Already at bottom or not found

    // Swap with next section
    const newVisibleOrder = [...visibleSections];
    [newVisibleOrder[currentIndex], newVisibleOrder[currentIndex + 1]] = [
      newVisibleOrder[currentIndex + 1],
      newVisibleOrder[currentIndex],
    ];

    // Reconstruct full order with hidden sections at the end
    const hiddenSections = draft.metadata.sections.filter((s) => !s.visible);
    const newOrder = [...newVisibleOrder, ...hiddenSections];

    console.log(
      "🔽 New order:",
      newOrder.map((s) => s.type)
    );
    onReorderSections(newOrder.map((s) => s.type));
  };

  // Check if section can move up
  const canMoveUp = (sectionType: string): boolean => {
    if (!draft) return false;
    const visibleSections = draft.metadata.sections.filter((s) => s.visible);
    const index = visibleSections.findIndex((s) => s.type === sectionType);
    return index > 0;
  };

  // Check if section can move down
  const canMoveDown = (sectionType: string): boolean => {
    if (!draft) return false;
    const visibleSections = draft.metadata.sections.filter((s) => s.visible);
    const index = visibleSections.findIndex((s) => s.type === sectionType);
    return index !== -1 && index < visibleSections.length - 1;
  };

  // Render section based on type
  const renderSection = (
    section: NonNullable<typeof draft>["metadata"]["sections"][0]
  ) => {
    if (!draft) return null;

    const sectionType = section.type;

    switch (sectionType) {
      case "summary":
        return renderSummarySection();
      case "skills":
        return renderSkillsSection();
      case "experience":
        return renderExperienceSection();
      case "education":
        return renderEducationSection();
      case "projects":
        return renderProjectsSection();
      default:
        return null;
    }
  };

  // Individual section render functions
  const renderSummarySection = () => {
    if (!draft || !summarySection?.visible) return null;

    return (
      <Box key="summary" sx={{ mb: 3 }}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="flex-start"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Box sx={{ flex: "1 1 auto", minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                fontSize: "0.95rem",
                mb: 0.5,
                color: "text.primary",
              }}
            >
              Professional Summary
            </Typography>
            {summarySection && getStateIndicator(summarySection)}
          </Box>
          <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0, ml: 1 }}>
            <Tooltip title="Move up">
              <span>
                <IconButton
                  size="small"
                  onClick={() => handleMoveSectionUp("summary")}
                  disabled={!canMoveUp("summary")}
                  sx={{ p: 0.5 }}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move down">
              <span>
                <IconButton
                  size="small"
                  onClick={() => handleMoveSectionDown("summary")}
                  disabled={!canMoveDown("summary")}
                  sx={{ p: 0.5 }}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Hide section">
              <IconButton
                size="small"
                onClick={() => onToggleSection("summary", false)}
                sx={{ p: 0.5 }}
              >
                <VisibilityOffIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {summarySection && summarySection.state !== "empty" && (
              <Tooltip title="Edit summary">
                <IconButton
                  size="small"
                  onClick={() =>
                    handleStartEdit("summary", draft.content.summary || "")
                  }
                  sx={{ p: 0.5 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>
        <Divider sx={{ mb: 1.5 }} />
        {summarySection && summarySection.state === "empty" ? (
          <Typography variant="body2" color="text.disabled" fontStyle="italic">
            [Empty - Apply from AI or add manually]
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
            {draft.content.summary}
          </Typography>
        )}
      </Box>
    );
  };

  const renderSkillsSection = () => {
    if (!draft || !skillsSection?.visible) return null;

    return (
      <Box key="skills" sx={{ mb: 3 }}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="flex-start"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Box sx={{ flex: "1 1 auto", minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                fontSize: "0.95rem",
                mb: 0.5,
                color: "text.primary",
              }}
            >
              Technical Skills
            </Typography>
            {skillsSection && getStateIndicator(skillsSection)}
          </Box>
          <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0, ml: 1 }}>
            <Tooltip title="Move up">
              <span>
                <IconButton
                  size="small"
                  onClick={() => handleMoveSectionUp("skills")}
                  disabled={!canMoveUp("skills")}
                  sx={{ p: 0.5 }}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move down">
              <span>
                <IconButton
                  size="small"
                  onClick={() => handleMoveSectionDown("skills")}
                  disabled={!canMoveDown("skills")}
                  sx={{ p: 0.5 }}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Hide section">
              <IconButton
                size="small"
                onClick={() => onToggleSection("skills", false)}
                sx={{ p: 0.5 }}
              >
                <VisibilityOffIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {skillsSection && skillsSection.state !== "empty" && (
              <Tooltip title="Edit skills">
                <IconButton
                  size="small"
                  onClick={() =>
                    handleStartEdit(
                      "skills",
                      draft.content.skills?.join(", ") || ""
                    )
                  }
                  sx={{ p: 0.5 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>
        <Divider sx={{ mb: 1.5 }} />
        {skillsSection.state === "empty" ? (
          <Typography variant="body2" color="text.disabled" fontStyle="italic">
            [Empty - Apply from AI or add manually]
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
            {draft.content.skills?.join(" • ")}
          </Typography>
        )}
      </Box>
    );
  };

  const renderExperienceSection = () => {
    if (!draft || !experienceSection?.visible) return null;

    return (
      <Box key="experience" sx={{ mb: 3 }}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="flex-start"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Box sx={{ flex: "1 1 auto", minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                fontSize: "0.95rem",
                mb: 0.5,
                color: "text.primary",
              }}
            >
              Professional Experience
            </Typography>
            {experienceSection && getStateIndicator(experienceSection)}
          </Box>
          <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0, ml: 1 }}>
            <Tooltip title="Move up">
              <span>
                <IconButton
                  size="small"
                  onClick={() => handleMoveSectionUp("experience")}
                  disabled={!canMoveUp("experience")}
                  sx={{ p: 0.5 }}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move down">
              <span>
                <IconButton
                  size="small"
                  onClick={() => handleMoveSectionDown("experience")}
                  disabled={!canMoveDown("experience")}
                  sx={{ p: 0.5 }}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Hide section">
              <IconButton
                size="small"
                onClick={() => onToggleSection("experience", false)}
                sx={{ p: 0.5 }}
              >
                <VisibilityOffIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {experienceSection && experienceSection.state !== "empty" && (
              <Tooltip title="Edit experience">
                <IconButton
                  size="small"
                  onClick={() =>
                    handleStartEdit(
                      "experience",
                      JSON.stringify(draft.content.experience, null, 2)
                    )
                  }
                  sx={{ p: 0.5 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>
        <Divider sx={{ mb: 1.5 }} />
        {experienceSection.state === "empty" ? (
          <Typography variant="body2" color="text.disabled" fontStyle="italic">
            [Empty - Apply from AI or add manually]
          </Typography>
        ) : (
          <Stack spacing={2.5}>
            {draft.content.experience?.map((exp, idx) => (
              <Box key={idx}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="baseline"
                  sx={{ mb: 0.5 }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {exp.role}
                  </Typography>
                  {exp.dates && (
                    <Typography variant="caption" color="text.secondary">
                      {exp.dates}
                    </Typography>
                  )}
                </Stack>
                {exp.company && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {exp.company}
                  </Typography>
                )}
                <Stack component="ul" sx={{ pl: 3, m: 0 }} spacing={0.3}>
                  {exp.bullets.map((bullet, bidx) => (
                    <Typography
                      component="li"
                      key={bidx}
                      variant="body2"
                      sx={{ lineHeight: 1.5 }}
                    >
                      {bullet}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    );
  };

  const renderEducationSection = () => {
    if (!draft || !educationSection?.visible) return null;

    return (
      <Box key="education" sx={{ mb: 3 }}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="flex-start"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Box sx={{ flex: "1 1 auto", minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                fontSize: "0.95rem",
                mb: 0.5,
                color: "text.primary",
              }}
            >
              Education
            </Typography>
            {educationSection && getStateIndicator(educationSection)}
          </Box>
          <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0, ml: 1 }}>
            <Tooltip title="Move up">
              <span>
                <IconButton
                  size="small"
                  onClick={() => handleMoveSectionUp("education")}
                  disabled={!canMoveUp("education")}
                  sx={{ p: 0.5 }}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move down">
              <span>
                <IconButton
                  size="small"
                  onClick={() => handleMoveSectionDown("education")}
                  disabled={!canMoveDown("education")}
                  sx={{ p: 0.5 }}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Hide section">
              <IconButton
                size="small"
                onClick={() => onToggleSection("education", false)}
                sx={{ p: 0.5 }}
              >
                <VisibilityOffIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {educationSection && educationSection.state !== "empty" && (
              <Tooltip title="Edit education">
                <IconButton
                  size="small"
                  onClick={() =>
                    handleStartEdit(
                      "education",
                      JSON.stringify(draft.content.education, null, 2)
                    )
                  }
                  sx={{ p: 0.5 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>
        <Divider sx={{ mb: 1.5 }} />
        {educationSection.state === "empty" ? (
          <Typography variant="body2" color="text.disabled" fontStyle="italic">
            [Empty - Apply from AI Results or your profile]
          </Typography>
        ) : (
          <Stack spacing={2}>
            {draft.content.education?.map((edu, idx) => (
              <Box key={idx}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="baseline"
                >
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {edu.degree}
                  </Typography>
                  {edu.graduation_date && (
                    <Typography variant="caption" color="text.secondary">
                      {edu.graduation_date}
                    </Typography>
                  )}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {edu.institution}
                </Typography>
                {edu.details && edu.details.length > 0 && (
                  <Stack component="ul" sx={{ pl: 3, m: 0, mt: 0.5 }}>
                    {edu.details.map((detail, didx) => (
                      <Typography component="li" key={didx} variant="caption">
                        {detail}
                      </Typography>
                    ))}
                  </Stack>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    );
  };

  const renderProjectsSection = () => {
    if (
      !draft ||
      !projectsSection?.visible ||
      !draft.content.projects ||
      draft.content.projects.length === 0
    ) {
      return null;
    }

    return (
      <Box key="projects">
        <Stack
          direction="row"
          spacing={2}
          alignItems="flex-start"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Box sx={{ flex: "1 1 auto", minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                fontSize: "0.95rem",
                mb: 0.5,
                color: "text.primary",
              }}
            >
              Projects
            </Typography>
            {projectsSection && getStateIndicator(projectsSection)}
          </Box>
          <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0, ml: 1 }}>
            <Tooltip title="Move up">
              <span>
                <IconButton
                  size="small"
                  onClick={() => handleMoveSectionUp("projects")}
                  disabled={!canMoveUp("projects")}
                  sx={{ p: 0.5 }}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move down">
              <span>
                <IconButton
                  size="small"
                  onClick={() => handleMoveSectionDown("projects")}
                  disabled={!canMoveDown("projects")}
                  sx={{ p: 0.5 }}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Hide section">
              <IconButton
                size="small"
                onClick={() => onToggleSection("projects", false)}
                sx={{ p: 0.5 }}
              >
                <VisibilityOffIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {projectsSection && (
              <Tooltip title="Edit projects">
                <IconButton
                  size="small"
                  onClick={() =>
                    handleStartEdit(
                      "projects",
                      JSON.stringify(draft.content.projects, null, 2)
                    )
                  }
                  sx={{ p: 0.5 }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>
        <Divider sx={{ mb: 1.5 }} />
        <Stack spacing={2}>
          {draft.content.projects?.map((proj, idx) => (
            <Box key={idx}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {proj.name}
              </Typography>
              {proj.role && (
                <Typography variant="caption" color="text.secondary">
                  {proj.role}
                </Typography>
              )}
              {proj.bullets && proj.bullets.length > 0 && (
                <Stack component="ul" sx={{ pl: 3, m: 0, mt: 0.5 }}>
                  {proj.bullets.map((bullet, bidx) => (
                    <Typography component="li" key={bidx} variant="body2">
                      {bullet}
                    </Typography>
                  ))}
                </Stack>
              )}
            </Box>
          ))}
        </Stack>
      </Box>
    );
  };

  if (!draft) {
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
              📄 Resume Draft Preview
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              Your resume draft will appear here.
              <br />
              Generate content or start from a template to begin.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  const getSectionState = (type: string): DraftSection | undefined => {
    return draft.metadata.sections.find((s) => s.type === type);
  };

  const getStateIndicator = (section: DraftSection) => {
    switch (section.state) {
      case "applied":
        return (
          <Chip
            icon={<AutoAwesomeIcon sx={{ fontSize: "0.65rem" }} />}
            label="Applied from AI"
            size="small"
            color="success"
            variant="outlined"
            sx={{ fontSize: "0.65rem", height: 18, "& .MuiChip-label": { px: 0.75, py: 0 } }}
          />
        );
      case "from-profile":
        return (
          <Chip
            icon={<AccountTreeIcon sx={{ fontSize: "0.65rem" }} />}
            label="From profile"
            size="small"
            color="info"
            variant="outlined"
            sx={{ fontSize: "0.65rem", height: 18, "& .MuiChip-label": { px: 0.75, py: 0 } }}
          />
        );
      case "edited":
        return (
          <Chip
            icon={<EditIcon sx={{ fontSize: "0.65rem" }} />}
            label="Manually edited"
            size="small"
            color="warning"
            variant="outlined"
            sx={{ fontSize: "0.65rem", height: 18, "& .MuiChip-label": { px: 0.75, py: 0 } }}
          />
        );
      case "empty":
        return (
          <Chip
            label="Empty"
            size="small"
            color="default"
            variant="outlined"
            sx={{ fontSize: "0.65rem", height: 18, "& .MuiChip-label": { px: 0.75, py: 0 } }}
          />
        );
      default:
        return null;
    }
  };

  const handleStartEdit = (section: string, currentContent: string) => {
    setEditingSection(section);
    setEditContent(currentContent);
  };

  const handleSaveEdit = () => {
    if (!editingSection) return;

    // Validate JSON for structured sections
    if (["experience", "education", "projects"].includes(editingSection)) {
      try {
        const parsed = JSON.parse(editContent);

        // Ensure it's an array for these sections
        if (!Array.isArray(parsed)) {
          alert(
            "Invalid format: Content must be a JSON array (wrapped in [ ])"
          );
          return;
        }

        // Success - content is valid JSON array
        onEditSection(editingSection, editContent);
        setEditingSection(null);
        setEditContent("");
      } catch (error) {
        alert(
          `Invalid JSON format. Please check your syntax:\n\n${
            error instanceof Error ? error.message : "Unknown error"
          }\n\nMake sure arrays are wrapped in [ ], objects in { }, and strings in quotes.`
        );
        return;
      }
    } else {
      // Simple sections (summary, skills) - no validation needed
      onEditSection(editingSection, editContent);
      setEditingSection(null);
      setEditContent("");
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditContent("");
  };

  const summarySection = getSectionState("summary");
  const skillsSection = getSectionState("skills");
  const experienceSection = getSectionState("experience");
  const educationSection = getSectionState("education");
  const projectsSection = getSectionState("projects");

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
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box sx={{ px: { xs: 1.5, sm: 2 }, pt: { xs: 1.5, sm: 2 }, pb: 1 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
              <Typography
                variant="h6"
                sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
              >
                📄 {draft.name}
              </Typography>
              {draft.metadata.jobTitle && draft.metadata.jobCompany && (
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{
                    fontWeight: 500,
                    mt: 0.5,
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  }}
                >
                  🎯 For: {draft.metadata.jobTitle} @{" "}
                  {draft.metadata.jobCompany}
                </Typography>
              )}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={{ xs: 0, sm: 1 }}
                alignItems={{ xs: "flex-start", sm: "center" }}
                sx={{ mt: 0.5 }}
              >
                <Tooltip
                  title={`Template controls AI generation style. ${
                    getTemplate(draft.templateId).description
                  }`}
                  arrow
                  placement="bottom-start"
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ cursor: "help" }}
                  >
                    🤖 Template: {getTemplate(draft.templateId).name}
                  </Typography>
                </Tooltip>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: { xs: "none", sm: "block" } }}
                >
                  •
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Last modified:{" "}
                  {new Date(draft.metadata.lastModified).toLocaleString()}
                </Typography>
              </Stack>
            </Box>
            <Stack
              direction="row"
              spacing={1}
              flexWrap="nowrap"
              alignItems="center"
              sx={{
                width: { xs: "100%", sm: "auto" },
                justifyContent: { xs: "flex-start", sm: "flex-end" },
              }}
            >
              <Tooltip title="Export options">
                <IconButton
                  size="small"
                  onClick={(e) => setMenuAnchor(e.currentTarget)}
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setFeedbackDialogOpen(true)}
                sx={{
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  whiteSpace: "nowrap",
                }}
              >
                Feedback
              </Button>
              <Chip
                icon={<CheckCircleIcon />}
                label="Auto-saved"
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              />
            </Stack>
          </Stack>

          {/* Validation Status */}
          {validation && (
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={`Health: ${getHealthScoreLabel(
                    validation.healthScore
                  )} (${validation.healthScore}%)`}
                  color={
                    getHealthScoreColor(validation.healthScore) as
                      | "success"
                      | "warning"
                      | "error"
                  }
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  label={`${validation.stats.estimatedPages} page${
                    validation.stats.estimatedPages !== 1 ? "s" : ""
                  }`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`${validation.stats.totalWords} words`}
                  size="small"
                  variant="outlined"
                />
                {validation.issues.length > 0 && (
                  <Tooltip
                    title={`${validation.issues.length} issue${
                      validation.issues.length !== 1 ? "s" : ""
                    } found`}
                  >
                    <Chip
                      icon={
                        validation.issues.some(
                          (i) => i.severity === "error"
                        ) ? (
                          <ErrorIcon />
                        ) : validation.issues.some(
                            (i) => i.severity === "warning"
                          ) ? (
                          <WarningIcon />
                        ) : (
                          <InfoIcon />
                        )
                      }
                      label={validation.issues.length}
                      size="small"
                      color={
                        validation.issues.some((i) => i.severity === "error")
                          ? "error"
                          : validation.issues.some(
                              (i) => i.severity === "warning"
                            )
                          ? "warning"
                          : "info"
                      }
                      onClick={() => setShowValidation(!showValidation)}
                      sx={{ cursor: "pointer" }}
                    />
                  </Tooltip>
                )}
                <IconButton
                  size="small"
                  onClick={() => setShowValidation(!showValidation)}
                >
                  {showValidation ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Stack>

              {/* Expandable Validation Details */}
              {showValidation && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: "grey.100",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  {/* Issues Section */}
                  {validation.issues.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, fontWeight: 600 }}
                      >
                        Issues ({validation.issues.length})
                      </Typography>
                      <Stack spacing={1}>
                        {validation.issues.map((issue, idx) => (
                          <Stack
                            key={idx}
                            direction="row"
                            spacing={1}
                            alignItems="flex-start"
                          >
                            {issue.severity === "error" && (
                              <ErrorIcon
                                fontSize="small"
                                color="error"
                                sx={{ mt: 0.25 }}
                              />
                            )}
                            {issue.severity === "warning" && (
                              <WarningIcon
                                fontSize="small"
                                color="warning"
                                sx={{ mt: 0.25 }}
                              />
                            )}
                            {issue.severity === "info" && (
                              <InfoIcon
                                fontSize="small"
                                color="info"
                                sx={{ mt: 0.25 }}
                              />
                            )}
                            <Box>
                              <Typography variant="caption">
                                {issue.message}
                              </Typography>
                              {issue.section && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: "block", fontSize: "0.7rem" }}
                                >
                                  Section: {issue.section}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Recommendations Section */}
                  {validation.recommendations.length > 0 && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, fontWeight: 600 }}
                      >
                        💡 Recommendations
                      </Typography>
                      <Stack spacing={0.5}>
                        {validation.recommendations.map((rec, idx) => (
                          <Typography
                            key={idx}
                            variant="caption"
                            color="text.secondary"
                            sx={{ pl: 2, position: "relative" }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                              }}
                            >
                              •
                            </span>
                            {rec}
                          </Typography>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Stats Summary */}
                  <Box
                    sx={{
                      mt: 2,
                      pt: 2,
                      borderTop: "1px dashed",
                      borderColor: "divider",
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block" }}
                    >
                      {validation.stats.sectionsCount} sections •{" "}
                      {validation.stats.totalCharacters.toLocaleString()}{" "}
                      characters •{" "}
                      {validation.stats.missingSections.length > 0 &&
                        `Missing: ${validation.stats.missingSections.join(
                          ", "
                        )}`}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>

        <Divider />

        {/* Preview Content */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: { xs: 1.5, sm: 2, md: 3 },
            bgcolor: "grey.50",
          }}
        >
          <Box
            sx={{
              maxWidth: 800,
              mx: "auto",
              bgcolor: "white",
              p: { xs: 2, sm: 3, md: 4 },
              boxShadow: 1,
              borderRadius: 1,
            }}
          >
            {/* Render sections in the order specified by metadata */}
            {draft.metadata.sections.map((section) => {
              console.log(
                "🎨 Rendering section:",
                section.type,
                "visible:",
                section.visible
              );
              return renderSection(section);
            })}

            {/* Hidden sections indicators - also follow metadata order */}
            {draft.metadata.sections
              .filter((s) => !s.visible)
              .map((section) => (
                <Box
                  key={section.type}
                  sx={{ mb: 2, p: 1, bgcolor: "grey.100", borderRadius: 1 }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography variant="caption" color="text.disabled">
                      {section.type.charAt(0).toUpperCase() +
                        section.type.slice(1)}{" "}
                      (hidden)
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => onToggleSection(section.type, true)}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
              ))}
          </Box>
        </Box>

        {/* Footer */}
        <Divider />
        <Box sx={{ p: 2, bgcolor: "grey.50" }}>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="caption" color="text.secondary">
              {draft.content.summary ||
              draft.content.skills?.length ||
              draft.content.experience?.length
                ? "✓ Draft has content"
                : "Empty draft - generate or apply content to start"}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => onExport("pdf")}
              >
                Export PDF
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => onExport("docx")}
              >
                Export DOCX
              </Button>
            </Stack>
          </Stack>
        </Box>
      </CardContent>

      {/* Export Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            onExport("pdf");
            setMenuAnchor(null);
          }}
        >
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} /> Export as PDF
        </MenuItem>
        <MenuItem
          onClick={() => {
            onExport("docx");
            setMenuAnchor(null);
          }}
        >
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} /> Export as Word
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog
        open={editingSection !== null}
        onClose={handleCancelEdit}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit {editingSection?.charAt(0).toUpperCase()}
          {editingSection?.slice(1)}
          {editingSection &&
            ["experience", "education", "projects"].includes(
              editingSection
            ) && (
              <Typography
                variant="caption"
                display="block"
                color="warning.main"
                sx={{ mt: 1, fontWeight: 600 }}
              >
                ⚠️ JSON Format Required - Keep array structure [ ] and proper
                quotes
              </Typography>
            )}
        </DialogTitle>
        <DialogContent>
          {editingSection === "skills" && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              💡 Tip: Enter skills separated by commas. Example: JavaScript,
              React, TypeScript, Node.js
            </Typography>
          )}
          {editingSection === "summary" && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              💡 Tip: Write 2-4 sentences highlighting your key qualifications
              and career goals
            </Typography>
          )}
          {editingSection &&
            ["experience", "education", "projects"].includes(
              editingSection
            ) && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                💡 Tip: Modify the JSON below. Don't remove brackets [ ] or
                change field names. Use proper JSON syntax.
              </Typography>
            )}
          <TextField
            autoFocus
            multiline
            rows={
              editingSection &&
              ["experience", "education", "projects"].includes(editingSection)
                ? 15
                : 8
            }
            fullWidth
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            sx={{
              mt: 1,
              fontFamily:
                editingSection &&
                ["experience", "education", "projects"].includes(editingSection)
                  ? "monospace"
                  : "inherit",
              fontSize:
                editingSection &&
                ["experience", "education", "projects"].includes(editingSection)
                  ? "0.875rem"
                  : "inherit",
            }}
            placeholder={
              editingSection === "skills"
                ? "JavaScript, React, TypeScript, Node.js, Python..."
                : editingSection === "summary"
                ? "Experienced software engineer with 5+ years building scalable web applications..."
                : "Edit content below"
            }
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancelEdit} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveEdit}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog (author-facing) */}
      <FeedbackDialog
        open={feedbackDialogOpen}
        onClose={() => setFeedbackDialogOpen(false)}
        draftId={draft?.id || ""}
      />
    </Card>
  );
}
