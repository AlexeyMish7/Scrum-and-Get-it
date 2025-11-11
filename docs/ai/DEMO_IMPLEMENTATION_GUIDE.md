# Demo Implementation Guide - AI Resume & Cover Letter Features

**Purpose**: Comprehensive guide for implementing all AI features needed for the Sprint 2 demo
**Date**: November 11, 2025
**Status**: Implementation roadmap with code samples

---

## ✅ COMPLETED: Act 2.1 - Template Showcase

**File**: `frontend/src/app/workspaces/ai/components/resume-v2/TemplateShowcaseDialog.tsx`

**Integration**:
- Added "Browse Templates" button to ResumeEditorV2 top bar
- Dialog opens with full template gallery
- Features: Category filtering, live preview, sample content rendering
- Applies template to active draft on selection

**Demo Actions Covered**:
- ✅ Browse available resume templates
- ✅ Select professional template and create new resume
- ✅ Verify template application and customization

---

## 🔨 TODO: Act 2.2 - Skills Optimization Display

### Enhancement: AIResultsPanel Skills Tab

**File**: `frontend/src/app/workspaces/ai/components/resume-v2/AIResultsPanel.tsx`

**Changes Needed**:

```typescript
// Add to Skills tab display:
<Box>
  {/* Skills Header with Match Score */}
  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
    <Typography variant="h6">Skills Optimization</Typography>
    <Chip
      label={`${skillsMatchScore}% Match`}
      color={skillsMatchScore > 80 ? "success" : "warning"}
      icon={<TrendingUpIcon />}
    />
  </Stack>

  {/* Recommended Skills (from AI) */}
  <Typography variant="subtitle2" gutterBottom>
    Recommended for this role:
  </Typography>
  <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
    {recommendedSkills.map((skill, i) => (
      <Chip
        key={i}
        label={skill.name}
        color="primary"
        variant={skill.inProfile ? "filled" : "outlined"}
        icon={
          skill.priority === "high" ? (
            <StarIcon />
          ) : skill.gap ? (
            <WarningIcon />
          ) : (
            <CheckCircleIcon />
          )
        }
        sx={{
          animation: skill.shouldHighlight ? "pulse 2s infinite" : "none",
        }}
      />
    ))}
  </Stack>

  {/* Skills Gap Analysis */}
  {skillsGap.length > 0 && (
    <Alert severity="info" sx={{ mb: 2 }}>
      <AlertTitle>Skills Gap Detected</AlertTitle>
      {skillsGap.map((gap) => (
        <Typography key={gap} variant="caption" display="block">
          • {gap}
        </Typography>
      ))}
    </Alert>
  )}

  {/* Reorder Suggestion */}
  <Typography variant="subtitle2" gutterBottom>
    Suggested order (by relevance):
  </Typography>
  <List dense>
    {reorderedSkills.map((skill, index) => (
      <ListItem key={skill.name}>
        <Stack direction="row" spacing={2} width="100%">
          <Chip label={index + 1} size="small" color="primary" />
          <Typography flex={1}>{skill.name}</Typography>
          <LinearProgress
            variant="determinate"
            value={skill.relevanceScore}
            sx={{ width: 100 }}
          />
          <Typography variant="caption">{skill.relevanceScore}%</Typography>
        </Stack>
      </ListItem>
    ))}
  </List>
</Box>
```

**Demo Actions Covered**:
- Show skills reordering based on job requirements
- Display relevance scoring
- Highlight gap skills

---

## 🔨 TODO: Act 2.3 - Section Reordering with Drag-Drop

### Enhancement: DraftPreviewPanel

**File**: `frontend/src/app/workspaces/ai/components/resume-v2/DraftPreviewPanel.tsx`

**Dependencies**: Install `react-beautiful-dnd` or use native HTML5 drag-drop

**Implementation**:

```tsx
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Add to DraftPreviewPanel component:
const [sections, setSections] = useState(draft.metadata.sections);

const handleDragEnd = (result) => {
  if (!result.destination) return;
  
  const items = Array.from(sections);
  const [reorderedItem] = items.splice(result.source.index, 1);
  items.splice(result.destination.index, 0, reorderedItem);
  
  setSections(items);
  onReorderSections(items.map(s => s.name));
};

// In render:
<DragDropContext onDragEnd={handleDragEnd}>
  <Droppable droppableId="resume-sections">
    {(provided) => (
      <Box {...provided.droppableProps} ref={provided.innerRef}>
        {sections.map((section, index) => (
          <Draggable
            key={section.name}
            draggableId={section.name}
            index={index}
          >
            {(provided, snapshot) => (
              <Box
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                sx={{
                  mb: 2,
                  p: 2,
                  bgcolor: snapshot.isDragging ? "primary.light" : "white",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: snapshot.isDragging ? "primary.main" : "divider",
                  transition: "all 0.2s",
                  "&:hover": {
                    boxShadow: 2,
                    borderColor: "primary.main",
                  }
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <DragIndicatorIcon color="action" />
                  <Switch
                    checked={section.visible}
                    onChange={() => onToggleSection(section.name)}
                  />
                  <Typography flex={1}>{section.displayName}</Typography>
                </Stack>
                {/* Section content here */}
              </Box>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </Box>
    )}
  </Droppable>
</DragDropContext>
```

**Demo Actions Covered**:
- Toggle resume sections on/off
- Reorder via drag-drop
- Verify real-time preview updates

---

## 🔨 TODO: Act 2.4 - Version Comparison Dialog

### New Component: `VersionComparisonDialog.tsx`

**File**: `frontend/src/app/workspaces/ai/components/resume-v2/VersionComparisonDialog.tsx`

**Implementation**:

```tsx
import {Dialog, DialogTitle, DialogContent, Box, Typography, Stack, Chip, Divider} from '@mui/material';
import { useResumeVersions } from '@workspaces/ai/hooks/useResumeVersions';

interface VersionComparisonDialogProps {
  open: boolean;
  onClose: () => void;
  leftVersionId: string;
  rightVersionId: string;
}

export default function VersionComparisonDialog({
  open,
  onClose,
  leftVersionId,
  rightVersionId
}: VersionComparisonDialogProps) {
  const { getVersion } = useResumeVersions();
  
  const leftVersion = getVersion(leftVersionId);
  const rightVersion = getVersion(rightVersionId);
  
  const sections = ["summary", "skills", "experience", "education"];
  
  const getDiff = (section: string) => {
    const left = leftVersion?.content[section];
    const right = rightVersion?.content[section];
    
    if (JSON.stringify(left) === JSON.stringify(right)) {
      return "identical";
    }
    return "different";
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        Compare Versions
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
          {/* Left Version */}
          <Box>
            <Stack direction="row" spacing={1} mb={2}>
              <Chip label={leftVersion?.name} color="primary" />
              <Typography variant="caption" color="text.secondary">
                {new Date(leftVersion?.createdAt).toLocaleDateString()}
              </Typography>
            </Stack>
            
            {sections.map(section => (
              <Box key={section} mb={2} p={2} bgcolor="grey.50" borderRadius={1}>
                <Typography variant="subtitle2" gutterBottom>
                  {section.toUpperCase()}
                </Typography>
                <Typography variant="body2">
                  {JSON.stringify(leftVersion?.content[section], null, 2)}
                </Typography>
              </Box>
            ))}
          </Box>
          
          {/* Right Version */}
          <Box>
            <Stack direction="row" spacing={1} mb={2}>
              <Chip label={rightVersion?.name} color="secondary" />
              <Typography variant="caption" color="text.secondary">
                {new Date(rightVersion?.createdAt).toLocaleDateString()}
              </Typography>
            </Stack>
            
            {sections.map(section => {
              const diff = getDiff(section);
              return (
                <Box
                  key={section}
                  mb={2}
                  p={2}
                  bgcolor={diff === "identical" ? "success.light" : "warning.light"}
                  borderRadius={1}
                >
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography variant="subtitle2">
                      {section.toUpperCase()}
                    </Typography>
                    <Chip
                      label={diff === "identical" ? "Same" : "Different"}
                      size="small"
                      color={diff === "identical" ? "success" : "warning"}
                    />
                  </Stack>
                  <Typography variant="body2">
                    {JSON.stringify(rightVersion?.content[section], null, 2)}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
```

**Integration**: Add button to ResumeVersionsPanel:
```tsx
<Button onClick={() => setCompareOpen(true)}>
  Compare Versions
</Button>
```

**Demo Actions Covered**:
- Create resume versions
- Compare side-by-side
- Verify version management features

---

## 🔨 TODO: Act 3.1 - Cover Letter Template Showcase

### New Component: `CoverLetterTemplateShowcase.tsx`

**File**: `frontend/src/app/workspaces/ai/components/cover-letter/CoverLetterTemplateShowcase.tsx`

**Similar to Resume Template Showcase but with cover letter templates**:

```typescript
const COVER_LETTER_TEMPLATE_CATEGORIES = {
  formal: [
    { id: "traditional", name: "Traditional", industry: "Finance, Law, Healthcare" },
    { id: "executive", name: "Executive", industry: "Management, Consulting" },
  ],
  creative: [
    { id: "modern", name: "Modern Creative", industry: "Marketing, Design, Media" },
    { id: "startup", name: "Startup Style", industry: "Tech Startups, Innovation" },
  ],
  technical: [
    { id: "engineering", name: "Engineering Focus", industry: "Software, Hardware, IT" },
    { id: "research", name: "Research Oriented", industry: "Academia, R&D" },
  ],
};

// Implementation similar to TemplateShowcaseDialog but with:
// - Cover letter sample content
// - Industry-specific language examples
// - Tone preview cards
// - Company culture matching indicators
```

**Demo Actions Covered**:
- Browse cover letter templates for different industries
- Preview and select template
- Verify customization options

---

## 🔨 TODO: Act 3.2 - Company Research Display Enhancement

### Enhancement: CoverLetterAIResultsPanel

**File**: `frontend/src/app/workspaces/ai/components/cover-letter/CoverLetterAIResultsPanel.tsx`

**Add Company Research Tab**:

```tsx
<Tab label="Company Research" value="research" />

{/* In tab panel: */}
{selectedTab === "research" && (
  <Box>
    {/* Company Overview */}
    <Paper sx={{ p: 2, mb: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <BusinessIcon color="primary" />
        <Typography variant="h6">{companyName}</Typography>
        <Chip label={industry} size="small" />
        <Chip label={`${companySize} employees`} size="small" variant="outlined" />
      </Stack>
      
      {/* Mission & Values */}
      <Typography variant="subtitle2" gutterBottom>Mission Statement</Typography>
      <Typography variant="body2" paragraph>{mission}</Typography>
      
      <Typography variant="subtitle2" gutterBottom>Core Values</Typography>
      <Stack direction="row" spacing={1} mb={2}>
        {values.map(v => <Chip key={v} label={v} size="small" />)}
      </Stack>
    </Paper>
    
    {/* Recent News */}
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Recent News & Updates
      </Typography>
      <List dense>
        {news.map((item, i) => (
          <ListItem key={i}>
            <ListItemIcon>
              <FiberManualRecordIcon sx={{ fontSize: 8 }} />
            </ListItemIcon>
            <ListItemText
              primary={item.headline}
              secondary={`${item.date} - ${item.source}`}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
    
    {/* How It's Used in Cover Letter */}
    <Alert severity="success">
      <AlertTitle>Integrated into Your Cover Letter</AlertTitle>
      <Typography variant="caption">
        ✓ Referenced recent {news[0]?.headline}
        <br />
        ✓ Aligned with company value: {values[0]}
        <br />
        ✓ Mentioned industry positioning
      </Typography>
    </Alert>
  </Box>
)}
```

**Demo Actions Covered**:
- Show cover letter with embedded company details
- Point out recent news, mission alignment, and industry context

---

## 🔨 TODO: Act 3.3 - Tone Customization UI

### Enhancement: CoverLetterPreviewPanel

**File**: `frontend/src/app/workspaces/ai/components/cover-letter/CoverLetterPreviewPanel.tsx`

**Add Tone Comparison Feature**:

```tsx
const [showToneComparison, setShowToneComparison] = useState(false);
const [selectedTone, setSelectedTone] = useState(draft.metadata.tone);

// In component:
<Stack direction="row" spacing={2} mb={2}>
  <FormControl size="small" sx={{ minWidth: 150 }}>
    <InputLabel>Tone</InputLabel>
    <Select
      value={selectedTone}
      label="Tone"
      onChange={(e) => {
        setSelectedTone(e.target.value);
        onChangeTone(e.target.value);
      }}
    >
      <MenuItem value="formal">Formal</MenuItem>
      <MenuItem value="casual">Casual</MenuItem>
      <MenuItem value="enthusiastic">Enthusiastic</MenuItem>
      <MenuItem value="analytical">Analytical</MenuItem>
    </Select>
  </FormControl>
  
  <Button
    size="small"
    variant="outlined"
    onClick={() => setShowToneComparison(!showToneComparison)}
  >
    {showToneComparison ? "Hide" : "Show"} Tone Comparison
  </Button>
</Stack>

{/* Tone Comparison Panel */}
{showToneComparison && (
  <Paper sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}>
    <Typography variant="subtitle2" gutterBottom>
      Before (Previous Tone):
    </Typography>
    <Typography variant="body2" paragraph sx={{ fontStyle: "italic", color: "text.secondary" }}>
      {previousToneContent}
    </Typography>
    
    <Divider sx={{ my: 2 }} />
    
    <Typography variant="subtitle2" gutterBottom>
      After ({selectedTone} Tone):
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 500 }}>
      {currentToneContent}
    </Typography>
    
    {/* Tone Indicators */}
    <Stack direction="row" spacing={2} mt={2}>
      <Chip label={`Formality: ${formalityScore}/10`} size="small" />
      <Chip label={`Energy: ${energyScore}/10`} size="small" />
      <Chip label={`Technical: ${technicalScore}/10`} size="small" />
    </Stack>
  </Paper>
)}
```

**Demo Actions Covered**:
- Adjust from formal to creative tone
- Show content changes in real-time
- Use editing tools with spell check and suggestions

---

## 🔨 TODO: Act 3.4 - Materials Linking UI

### New Component: `JobMaterialsDialog.tsx`

**File**: `frontend/src/app/workspaces/ai/components/JobMaterialsDialog.tsx`

**Purpose**: Show which resume/cover letter versions are linked to specific job applications

```tsx
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Chip,
  Card,
  CardContent,
  IconButton,
  Divider,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import EmailIcon from '@mui/icons-material/Email';
import DownloadIcon from '@mui/icons-material/Download';
import LinkIcon from '@mui/icons-material/Link';

interface JobMaterialsDialogProps {
  open: boolean;
  onClose: () => void;
  jobId: number;
  jobTitle: string;
  companyName: string;
}

export default function JobMaterialsDialog({
  open,
  onClose,
  jobId,
  jobTitle,
  companyName
}: JobMaterialsDialogProps) {
  const [materials, setMaterials] = useState(null);
  
  useEffect(() => {
    if (open && jobId) {
      // Fetch job materials from job_materials table
      // const data = await getJobMaterials(jobId);
      // setMaterials(data);
    }
  }, [open, jobId]);
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack spacing={1}>
          <Typography variant="h6">Application Materials</Typography>
          <Typography variant="body2" color="text.secondary">
            {jobTitle} at {companyName}
          </Typography>
        </Stack>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3}>
          {/* Resume Card */}
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <DescriptionIcon color="primary" fontSize="large" />
                <Box flex={1}>
                  <Typography variant="subtitle2" gutterBottom>
                    Resume
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {materials?.resumeName || "No resume linked"}
                  </Typography>
                  {materials?.resumeVersion && (
                    <Chip
                      label={`Version ${materials.resumeVersion}`}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
                <Stack direction="row" spacing={1}>
                  <IconButton size="small">
                    <DownloadIcon />
                  </IconButton>
                  <IconButton size="small">
                    <LinkIcon />
                  </IconButton>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
          
          {/* Cover Letter Card */}
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <EmailIcon color="secondary" fontSize="large" />
                <Box flex={1}>
                  <Typography variant="subtitle2" gutterBottom>
                    Cover Letter
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {materials?.coverLetterName || "No cover letter linked"}
                  </Typography>
                  {materials?.coverLetterTone && (
                    <Chip
                      label={`Tone: ${materials.coverLetterTone}`}
                      size="small"
                      color="secondary"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
                <Stack direction="row" spacing={1}>
                  <IconButton size="small">
                    <DownloadIcon />
                  </IconButton>
                  <IconButton size="small">
                    <LinkIcon />
                  </IconButton>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
          
          {/* Materials History */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Materials History
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Track which versions were used for this application
            </Typography>
            {/* Timeline of material changes */}
          </Box>
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained">Update Materials</Button>
      </DialogActions>
    </Dialog>
  );
}
```

**Integration**: Add button to job cards in Pipeline:

```tsx
<IconButton onClick={() => setShowMaterials(true)}>
  <AttachFileIcon />
</IconButton>

<JobMaterialsDialog
  open={showMaterials}
  onClose={() => setShowMaterials(false)}
  jobId={job.id}
  jobTitle={job.job_title}
  companyName={job.company_name}
/>
```

**Demo Actions Covered**:
- Link resume and cover letter to specific job application
- Track which materials were used for each application

---

## 🔨 TODO: Export Format Preview

### Enhancement: Add preview before export

**File**: `frontend/src/app/workspaces/ai/pages/ResumeEditorV2/index.tsx`

**Add to Export Dialog**:

```tsx
const [showExportPreview, setShowExportPreview] = useState(false);

// In export dialog:
<Button
  variant="outlined"
  onClick={() => setShowExportPreview(true)}
>
  Preview Export
</Button>

{/* Export Preview Dialog */}
<Dialog open={showExportPreview} onClose={() => setShowExportPreview(false)} maxWidth="md" fullWidth>
  <DialogTitle>Export Preview - {exportFormat.toUpperCase()}</DialogTitle>
  <DialogContent>
    <Box sx={{ p: 2, bgcolor: "grey.100", border: "1px solid", borderColor: "divider" }}>
      {/* Render preview based on format */}
      {exportFormat === "pdf" && (
        <Typography>PDF Preview (showing page 1 of 2)</Typography>
      )}
      {exportFormat === "docx" && (
        <Typography>Word Document Preview</Typography>
      )}
      
      {/* Format-specific warnings */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <AlertTitle>Format Notes</AlertTitle>
        • Page count: 2 pages
        <br />
        • Formatting: Professional
        <br />
        • File size: ~85KB
      </Alert>
    </Box>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setShowExportPreview(false)}>Back</Button>
    <Button variant="contained" onClick={performExport}>
      Confirm & Export
    </Button>
  </DialogActions>
</Dialog>
```

---

## Summary of Demo-Ready Features

### Act 2: AI-Powered Resume Generation ✅
1. **Template Selection** ✅ - TemplateShowcaseDialog implemented
2. **AI Content Generation** ✅ - Existing GenerationPanel working
3. **Resume Customization** 🔨 - Needs drag-drop implementation
4. **Export & Versioning** 🔨 - Needs comparison dialog

### Act 3: AI-Powered Cover Letter Generation 🔨
1. **Cover Letter Templates** 🔨 - Needs template showcase
2. **Company Research** 🔨 - Needs enhanced display
3. **Tone Customization** 🔨 - Needs comparison feature
4. **Export & Linking** 🔨 - Needs materials dialog

---

## Quick Implementation Priority (for demo)

**HIGH PRIORITY** (Must have for demo):
1. ✅ Template Showcase Dialog (Resume) - DONE
2. Skills optimization display with relevance scores
3. Version comparison side-by-side
4. Cover letter template showcase
5. Company research visualization

**MEDIUM PRIORITY** (Nice to have):
6. Drag-drop section reordering
7. Tone comparison feature
8. Materials linking UI

**LOW PRIORITY** (Can demo without):
9. Export format preview
10. Advanced customization controls

---

## Testing Checklist

Before demo, verify:
- [ ] Templates browse and apply correctly
- [ ] AI generation shows all sections
- [ ] Apply buttons work for all sections
- [ ] Skills show relevance scores
- [ ] Versions can be compared
- [ ] Cover letter templates display
- [ ] Company research appears in cover letter
- [ ] Tone changes update preview
- [ ] Export generates valid files
- [ ] Materials link to jobs

---

## Next Steps

1. Implement skills optimization display (30 min)
2. Create version comparison dialog (45 min)
3. Build cover letter template showcase (1 hour)
4. Enhance company research display (30 min)
5. Add tone comparison (30 min)
6. Create materials linking UI (45 min)

**Total estimated time**: ~4 hours of focused development

This guide provides all code samples and patterns needed to complete the demo features efficiently.
