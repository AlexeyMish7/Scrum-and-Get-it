/**
 * tooltipMap
 * Centralized help/ARIA descriptions for generation controls to keep copy consistent.
 * Each key maps to short and long variants where helpful.
 */
export const tooltipMap = {
  job: {
    title: "Target job",
    desc: "Select the job whose requirements should guide tailoring.",
  },
  tone: {
    title: "Tone",
    desc: "Professional (default), Concise (shorter wording), Impactful (energetic verbs).",
  },
  focus: {
    title: "Optional focus",
    desc: "Highlight a theme (leadership, cloud, frontend, backend) across bullets.",
  },
  includeSkills: {
    title: "Skills Optimization",
    desc: "Ranks existing skills and suggests additions from the posting keywords.",
  },
  includeExperience: {
    title: "Experience Tailoring",
    desc: "Rewrites bullets emphasizing impact aligned with job requirements.",
  },
  model: {
    title: "Model",
    desc: "Choose an allowed AI model (blank uses server default).",
  },
  preset: {
    title: "Prompt preset",
    desc: "Baseline instructions structure. You can append custom details.",
  },
  customPrompt: {
    title: "Custom prompt additions",
    desc: "Add achievements, technologies, or formatting wishes appended to preset.",
  },
  // Export & versions
  openVersionManager: {
    title: "Open Version Manager",
    desc: "Review and manage all generated versions for this job.",
  },
  exportPDF: {
    title: "Export PDF",
    desc: "Download the formatted preview as a PDF and link it to the job.",
  },
  exportDOCX: {
    title: "Export DOCX",
    desc: "Download the formatted preview as a Word document and link it to the job.",
  },
  attachToJob: {
    title: "Attach to Job",
    desc: "Link the selected version to the current job’s materials.",
  },
};

export type TooltipKey = keyof typeof tooltipMap;
