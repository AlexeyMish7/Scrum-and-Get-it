import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  List,
  ListItem,
  Menu,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Tooltip,
  Divider,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PreviewIcon from "@mui/icons-material/Preview";
import ShareIcon from "@mui/icons-material/Share";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import StarIcon from "@mui/icons-material/Star";

import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import useResumeDrafts from "@workspaces/ai/hooks/useResumeDrafts"; // UC-046: usage count, draft rename, promote to template, style application
import { useAuth } from "@shared/context/AuthContext";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

type TemplateType = "chronological" | "functional" | "hybrid" | "custom";

type ResumeTemplate = {
  id: string;
  name: string;
  type: TemplateType;
  colors: {
    primary: string;
    accent: string;
    bg: string;
  };
  font: string;
  layout: "single" | "two-column" | "modern";
  createdAt: string;
  sharedWith?: string[];
  /** Marks a master template (preferred default besides defaultId). */
  master?: boolean; // UC-046: master flag for quick identification
};

/** Local resume record persisted in localStorage (lightweight – not the full artifact). */
interface StoredResume {
  id: string;
  name: string;
  templateId?: string | null;
  createdAt: string;
  owner: string | null;
  content: Record<string, unknown>;
}

const STORAGE_KEY = "sgt:resume_templates";
const DEFAULT_TEMPLATE_KEY = "sgt:resume_templates_default";

const defaultTemplates = (): ResumeTemplate[] => [
  {
    id: "tmpl-chron",
    name: "Chronological",
    type: "chronological",
    colors: { primary: "#0d6efd", accent: "#6c757d", bg: "#ffffff" },
    font: "Inter",
    layout: "single",
    createdAt: new Date().toISOString(),
  },
  {
    id: "tmpl-func",
    name: "Functional",
    type: "functional",
    colors: { primary: "#198754", accent: "#6c757d", bg: "#ffffff" },
    font: "Roboto",
    layout: "modern",
    createdAt: new Date().toISOString(),
  },
  {
    id: "tmpl-hybrid",
    name: "Hybrid",
    type: "hybrid",
    colors: { primary: "#ff6b6b", accent: "#6c757d", bg: "#ffffff" },
    font: "Georgia",
    layout: "two-column",
    createdAt: new Date().toISOString(),
  },
];

function uid(prefix = "t") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

// Renders a fuller resume preview using the chosen template styles.
function ResumePreview({ template }: { template: ResumeTemplate }) {
  const sample = {
    name: "Alex Johnson",
    title: "Senior Software Engineer",
    summary:
      "Experienced software engineer with a focus on full-stack TypeScript applications, building robust web apps and APIs.",
    experience: [
      {
        role: "Senior Engineer",
        company: "Acme Corp",
        dates: "2021 - Present",
        desc: "Led frontend team building React + TypeScript apps and improved performance by 30%.",
      },
      {
        role: "Software Engineer",
        company: "Beta LLC",
        dates: "2018 - 2021",
        desc: "Built customer-facing dashboards and internal tooling.",
      },
    ],
    education: [
      {
        degree: "B.S. Computer Science",
        school: "State University",
        dates: "2014 - 2018",
      },
    ],
    skills: ["TypeScript", "React", "Node.js", "SQL", "Testing"],
  };

  const baseStyles = {
    fontFamily: template.font,
    color: template.colors.primary,
  } as const;

  // two-column: small sidebar + main content
  if (template.layout === "two-column") {
    return (
      <Box sx={{ display: "flex", gap: 2 }}>
        <Box
          sx={{
            width: 140,
            bgcolor: template.colors.bg,
            p: 1,
            borderRadius: 1,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ color: template.colors.primary, fontWeight: 700, mb: 1 }}
          >
            {sample.name.split(" ")[0]}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {sample.title}
          </Typography>
          <Box mt={1}>
            <Typography variant="caption" color="text.secondary">
              Skills
            </Typography>
            {sample.skills.map((s) => (
              <Typography key={s} variant="body2" sx={{ mt: 0.5 }}>
                {s}
              </Typography>
            ))}
          </Box>
        </Box>
        <Box sx={{ flex: 1, p: 1, borderRadius: 1 }}>
          <Typography variant="h6" sx={{ ...baseStyles }}>
            {sample.name}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {sample.title}
          </Typography>
          <Box mt={1}>
            <Typography variant="body2">{sample.summary}</Typography>
          </Box>
          <Box mt={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Experience
            </Typography>
            {sample.experience.map((e) => (
              <Box key={e.role} sx={{ mt: 1 }}>
                <Typography sx={{ fontWeight: 700 }}>
                  {e.role} — {e.company}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {e.dates}
                </Typography>
                <Typography variant="body2">{e.desc}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  // modern layout: header band + content
  if (template.layout === "modern") {
    return (
      <Box
        sx={{
          bgcolor: template.colors.bg,
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <Box sx={{ bgcolor: template.colors.primary, color: "#fff", p: 2 }}>
          <Typography variant="h6" sx={{ fontFamily: template.font }}>
            {sample.name}
          </Typography>
          <Typography variant="body2">{sample.title}</Typography>
        </Box>
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {sample.summary}
          </Typography>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Experience
            </Typography>
            {sample.experience.map((e) => (
              <Box key={e.role} sx={{ mt: 1 }}>
                <Typography sx={{ fontWeight: 700 }}>{e.role}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {e.company} • {e.dates}
                </Typography>
                <Typography variant="body2">{e.desc}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  // single column by default
  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h6" sx={{ ...baseStyles }}>
        {sample.name}
      </Typography>
      <Typography variant="subtitle2" color="text.secondary">
        {sample.title}
      </Typography>
      <Box mt={1}>
        <Typography variant="body2">{sample.summary}</Typography>
      </Box>
      <Box mt={2}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Experience
        </Typography>
        {sample.experience.map((e) => (
          <Box key={e.role} sx={{ mt: 1 }}>
            <Typography sx={{ fontWeight: 700 }}>
              {e.role} — {e.company}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {e.dates}
            </Typography>
            <Typography variant="body2">{e.desc}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function TemplateManager() {
  const { showSuccess, handleError } = useErrorHandler();
  const { user } = useAuth();
  const { active, resumes } = useResumeDrafts(); // Removed unused updateContent

  const [templates, setTemplates] = useState<ResumeTemplate[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultTemplates();
      return JSON.parse(raw) as ResumeTemplate[];
    } catch {
      return defaultTemplates();
    }
  });

  const [defaultId, setDefaultId] = useState<string | null>(() => {
    return localStorage.getItem(DEFAULT_TEMPLATE_KEY);
  });

  const [editing, setEditing] = useState<ResumeTemplate | null>(null);
  const [preview, setPreview] = useState<ResumeTemplate | null>(null);
  const [shareTarget, setShareTarget] = useState<string>("");
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch {
      console.warn("Failed to persist templates");
    }
  }, [templates]);

  useEffect(() => {
    if (defaultId) localStorage.setItem(DEFAULT_TEMPLATE_KEY, defaultId);
    else localStorage.removeItem(DEFAULT_TEMPLATE_KEY);
  }, [defaultId]);

  const createFrom = (base?: ResumeTemplate) => {
    const t: ResumeTemplate = {
      id: uid("tmpl"),
      name: base ? `${base.name} (copy)` : "New Template",
      type: (base?.type as TemplateType) ?? "custom",
      colors: base?.colors ?? {
        primary: "#0d6efd",
        accent: "#6c757d",
        bg: "#ffffff",
      },
      font: base?.font ?? "Inter",
      layout: base?.layout ?? "single",
      createdAt: new Date().toISOString(),
    };
    setTemplates((s) => [t, ...s]);
    showSuccess("Template created");
    setEditing(t);
  };

  const updateTemplate = (t: ResumeTemplate) => {
    setTemplates((s) => s.map((x) => (x.id === t.id ? t : x)));
    showSuccess("Template saved");
    setEditing(null);
  };

  const removeTemplate = (id: string) => {
    setTemplates((s) => s.filter((t) => t.id !== id));
    if (defaultId === id) setDefaultId(null);
    showSuccess("Template removed");
  };

  const importTemplateFile = async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<ResumeTemplate>;
      // basic validation
      const next: ResumeTemplate = {
        id: parsed.id || uid("tmpl"),
        name: parsed.name || "Imported Template",
        type: (parsed.type as TemplateType) || "custom",
        colors: parsed.colors || {
          primary: "#0d6efd",
          accent: "#6c757d",
          bg: "#ffffff",
        },
        font: parsed.font || "Inter",
        layout: (parsed.layout as ResumeTemplate["layout"]) || "single",
        createdAt: new Date().toISOString(),
        sharedWith: parsed.sharedWith || [],
        master: parsed.master || false,
      };
      setTemplates((s) => [next, ...s]);
      showSuccess("Template imported");
      setImportError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to import";
      setImportError(msg);
      handleError?.(e as Error);
    }
  };

  const exportTemplate = (t: ResumeTemplate) => {
    const blob = new Blob([JSON.stringify(t, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${t.name.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess("Template exported");
  };

  const shareTemplate = (t: ResumeTemplate, target: string) => {
    // No backend in this task: we record in-memory and pretend to share.
    setTemplates((s) =>
      s.map((tpl) =>
        tpl.id === t.id
          ? { ...tpl, sharedWith: [...(tpl.sharedWith ?? []), target] }
          : tpl
      )
    );
    showSuccess(`Shared with ${target}`);
    setShareTarget("");
  };

  // Create resume support
  const [createFromTemplate, setCreateFrom] = useState<ResumeTemplate | null>(
    null
  );
  const [newResumeName, setNewResumeName] = useState<string>("");

  const applyTemplateToNewResume = (t: ResumeTemplate) => {
    // Open create dialog for a new resume based on the chosen template.
    setCreateFrom(t);
  };

  const createResume = () => {
    if (!createFromTemplate) return;
    const resumesRaw = localStorage.getItem("sgt:resumes");
    let list: StoredResume[] = [];
    try {
      list = resumesRaw ? (JSON.parse(resumesRaw) as StoredResume[]) : [];
    } catch {
      list = [];
    }
    const newResume = {
      id: uid("resume"),
      name: newResumeName || `${createFromTemplate.name} Resume`,
      templateId: createFromTemplate.id,
      createdAt: new Date().toISOString(),
      owner: user?.id ?? null,
      content: {}, // initial empty content; real editing occurs elsewhere
    };
    list.unshift(newResume as StoredResume);
    localStorage.setItem("sgt:resumes", JSON.stringify(list));
    showSuccess("Resume created from template");
    setCreateFrom(null);
    setNewResumeName("");
  };

  const templateList = useMemo(() => templates, [templates]);

  /** Compute usage count (how many drafts reference each template). */
  const usageCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of resumes) {
      if (r.templateId) map.set(r.templateId, (map.get(r.templateId) || 0) + 1);
    }
    return map;
  }, [resumes]);

  /** Apply template styling to active draft preview (stored in per-draft style key). */
  function applyTemplateStyle(t: ResumeTemplate) {
    if (!active) return handleError?.(new Error("Select a draft first"));
    try {
      const styleKey = `sgt:resume_style_${active.id}`;
      const stylePayload = {
        templateId: t.id,
        colors: t.colors,
        font: t.font,
        layout: t.layout,
        appliedAt: new Date().toISOString(),
      };
      localStorage.setItem(styleKey, JSON.stringify(stylePayload));
      showSuccess("Template style applied to draft preview");
    } catch (e: unknown) {
      handleError?.(e as Error);
    }
  }

  /** Promote the active draft to a new template. */
  function promoteActiveDraft() {
    if (!active) return handleError?.(new Error("No active draft to promote"));
    const t: ResumeTemplate = {
      id: uid("tmpl"),
      name: `${active.name} Template`,
      type: "custom",
      colors: { primary: "#0044cc", accent: "#666", bg: "#ffffff" }, // default colors; can refine later
      font: "Inter",
      layout: "single",
      createdAt: new Date().toISOString(),
    };
    setTemplates((prev) => [t, ...prev]);
    showSuccess("Promoted draft to template");
  }

  /** Rename the active draft (updates localStorage via updateContent since name is not inside content; patch list). */
  const [renameValue, setRenameValue] = useState<string>("");
  useEffect(() => {
    setRenameValue(active?.name || "");
  }, [active?.id, active?.name]);
  function renameActiveDraft() {
    if (!active) return handleError?.(new Error("Select a draft first"));
    if (!renameValue.trim())
      return handleError?.(new Error("Name cannot be empty"));
    // Update name within resumes array directly
    try {
      const raw = localStorage.getItem("sgt:resumes");
      const existing: StoredResume[] = raw
        ? (JSON.parse(raw) as StoredResume[])
        : [];
      const next = existing.map((r) =>
        r.id === active.id ? { ...r, name: renameValue.trim() } : r
      );
      localStorage.setItem("sgt:resumes", JSON.stringify(next));
      showSuccess("Draft renamed");
    } catch (e: unknown) {
      handleError?.(e as Error);
    }
  }

  // Export UI state
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [exportTargetTemplate, setExportTargetTemplate] =
    useState<ResumeTemplate | null>(null);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfWatermark, setPdfWatermark] = useState("");
  const [pdfFilename, setPdfFilename] = useState("");

  const openExportMenu = (
    e: React.MouseEvent<HTMLElement>,
    t: ResumeTemplate
  ) => {
    setExportAnchorEl(e.currentTarget);
    setExportTargetTemplate(t);
  };

  const closeExportMenu = () => {
    setExportAnchorEl(null);
    setExportTargetTemplate(null);
  };

  /* ---------- Export helpers ---------- */
  function renderResumeHTML(
    template: ResumeTemplate,
    resumeName = "My Resume"
  ) {
    // Simple resume HTML using the template's colors, font and layout.
    const { colors, font } = template;
    const primary = colors.primary;
    const accent = colors.accent;
    const bg = colors.bg;
    return `
				<html>
					<head>
						<meta charset="utf-8" />
						<meta name="viewport" content="width=device-width,initial-scale=1" />
						<title>${resumeName}</title>
						<style>
							body { font-family: ${font}, Arial, sans-serif; background: ${bg}; color: #222; padding: 24px; }
							.resume { max-width: 800px; margin: 0 auto; background: #fff; padding: 28px; box-shadow: 0 0 0 1px rgba(0,0,0,0.02); }
							.header { display: flex; justify-content: space-between; align-items: center; }
							.name { font-size: 28px; color: ${primary}; font-weight: 700; }
							.contact { text-align: right; color: ${accent}; }
							.section { margin-top: 18px; }
							.section h3 { margin: 0 0 8px 0; color: ${primary}; font-size: 16px; }
							.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
							.bullet { margin: 6px 0; }
							@media print { body { padding: 0; } .resume { box-shadow: none; } }
						</style>
					</head>
					<body>
						<div class="resume">
							<div class="header">
								<div>
									<div class="name">${resumeName}</div>
									<div class="subtitle">${template.type} • ${template.layout}</div>
								</div>
								<div class="contact">
									<div>you@example.com</div>
									<div>City, State</div>
								</div>
							</div>

							<div class="section">
								<h3>Summary</h3>
								<div class="bullet">Experienced professional with background relevant to the selected template. Use the editor to replace this text with real content.</div>
							</div>

							<div class="section two-col">
								<div>
									<h3>Experience</h3>
									<div class="bullet"><strong>Company ABC</strong> — Role (Dates)</div>
									<div class="bullet">• Achievement or responsibility 1</div>
									<div class="bullet">• Achievement or responsibility 2</div>
								</div>
								<div>
									<h3>Education</h3>
									<div class="bullet"><strong>University</strong> — Degree (Year)</div>
									<h3>Skills</h3>
									<div class="bullet">Skill 1, Skill 2, Skill 3</div>
								</div>
							</div>
						</div>
					</body>
				</html>
			`;
  }

  async function exportAsHTML(html: string, filename: string) {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".html") ? filename : `${filename}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportAsText(html: string, filename: string) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const text = tmp.innerText || tmp.textContent || "";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".txt") ? filename : `${filename}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportAsDoc(html: string, filename: string) {
    // Create an HTML-based Word document (.doc) which Word can open.
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".doc") ? filename : `${filename}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportAsPDF(
    html: string,
    filename: string,
    watermark?: string
  ) {
    // render to hidden node
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-10000px";
    container.style.top = "0";
    container.style.width = "800px";
    container.innerHTML = html;
    if (watermark) {
      const wm = document.createElement("div");
      wm.style.position = "absolute";
      wm.style.left = "50%";
      wm.style.top = "40%";
      wm.style.transform = "translate(-50%,-50%) rotate(-30deg)";
      wm.style.opacity = "0.08";
      wm.style.fontSize = "48px";
      wm.style.color = "#000";
      wm.innerText = watermark;
      container.appendChild(wm);
    }

    // Export menu and PDF dialog UI

    document.body.appendChild(container);
    // use html2canvas
    const canvas = await html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF("p", "pt", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    // calculate image dimensions
    // jsPDF type defs don't expose getImageProperties return shape cleanly; cast is safe here.
    const imgProps = (
      pdf as unknown as {
        getImageProperties: (data: string) => { width: number; height: number };
      }
    ).getImageProperties(imgData);
    const imgWidth = pageWidth;
    const imgHeight = (imgProps.height * pageWidth) / imgProps.width;
    pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
    pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
    document.body.removeChild(container);
  }

  // ----- Export menu + PDF dialog -----

  // menu is rendered near the root to keep markup simple

  function ExportMenuAndDialog() {
    return (
      <>
        <Menu
          anchorEl={exportAnchorEl}
          open={Boolean(exportAnchorEl)}
          onClose={closeExportMenu}
        >
          <MenuItem
            onClick={() => {
              if (exportTargetTemplate) {
                const html = renderResumeHTML(
                  exportTargetTemplate,
                  exportTargetTemplate.name
                );
                exportAsHTML(html, exportTargetTemplate.name);
                showSuccess("Exported HTML");
              }
              closeExportMenu();
            }}
          >
            Export as HTML
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (exportTargetTemplate) {
                const html = renderResumeHTML(
                  exportTargetTemplate,
                  exportTargetTemplate.name
                );
                exportAsText(html, exportTargetTemplate.name);
                showSuccess("Exported text");
              }
              closeExportMenu();
            }}
          >
            Export as Text
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (exportTargetTemplate) {
                const html = renderResumeHTML(
                  exportTargetTemplate,
                  exportTargetTemplate.name
                );
                exportAsDoc(html, exportTargetTemplate.name);
                showSuccess("Exported .doc");
              }
              closeExportMenu();
            }}
          >
            Export as .doc
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (exportTargetTemplate) {
                exportTemplate(exportTargetTemplate);
                showSuccess("Exported template JSON");
              }
              closeExportMenu();
            }}
          >
            Export template JSON
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (exportTargetTemplate) {
                setPdfFilename(`${exportTargetTemplate.name}.pdf`);
                setPdfWatermark("");
                setPdfDialogOpen(true);
              }
              closeExportMenu();
            }}
          >
            Export as PDF
          </MenuItem>
        </Menu>

        <Dialog
          open={pdfDialogOpen}
          onClose={() => setPdfDialogOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Export PDF</DialogTitle>
          <DialogContent>
            <Stack spacing={2} mt={1}>
              <TextField
                label="Filename"
                value={pdfFilename}
                onChange={(e) => setPdfFilename(e.target.value)}
                fullWidth
              />
              <TextField
                label="Watermark (optional)"
                value={pdfWatermark}
                onChange={(e) => setPdfWatermark(e.target.value)}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPdfDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={async () => {
                if (!exportTargetTemplate) return;
                try {
                  const html = renderResumeHTML(
                    exportTargetTemplate,
                    exportTargetTemplate.name
                  );
                  await exportAsPDF(
                    html,
                    pdfFilename || `${exportTargetTemplate.name}.pdf`,
                    pdfWatermark || undefined
                  );
                  showSuccess("Exported PDF");
                } catch (e: unknown) {
                  handleError?.(e as Error);
                }
                setPdfDialogOpen(false);
              }}
            >
              Export PDF
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <Box p={3}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
      >
        <Box>
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            Your Custom Templates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {templateList.length === 0
              ? "No custom templates yet. Create your first template to get started!"
              : `${templateList.length} custom template${
                  templateList.length !== 1 ? "s" : ""
                } • Click "New Template" to add more`}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Create a new custom template">
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={() => createFrom()}
            >
              New Template
            </Button>
          </Tooltip>
          <Tooltip title="Import template from JSON file">
            <Button
              startIcon={<UploadFileIcon />}
              variant="outlined"
              component="label"
            >
              Import
              <input
                hidden
                type="file"
                accept="application/json"
                onChange={(e) => importTemplateFile(e.target.files?.[0])}
              />
            </Button>
          </Tooltip>
          {active && (
            <Tooltip title="Convert current resume draft to template">
              <Button
                startIcon={<UploadFileIcon />}
                variant="outlined"
                onClick={promoteActiveDraft}
              >
                Promote Draft
              </Button>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      {active && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ sm: "center" }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">Active Draft Name</Typography>
                <TextField
                  size="small"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  sx={{ mt: 1, maxWidth: 320 }}
                />
              </Box>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={renameActiveDraft}
                >
                  Rename
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      <List sx={{ display: "flex", gap: 2, flexWrap: "wrap", p: 0 }}>
        {templateList.length === 0 && (
          <Box sx={{ width: "100%", textAlign: "center", py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Custom Templates Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create your first custom template to personalize your resumes with
              unique colors, fonts, and layouts.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => createFrom()}
              size="large"
            >
              Create Your First Template
            </Button>
          </Box>
        )}
        {templateList.map((t) => (
          <ListItem key={t.id} sx={{ width: { xs: "100%", sm: 360 }, p: 0 }}>
            <Card
              sx={{
                width: "100%",
                "&:hover": { boxShadow: 3 },
                transition: "box-shadow 0.2s",
              }}
            >
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  sx={{ mb: 2 }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 0.5 }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold">
                        {t.name}
                      </Typography>
                      {defaultId === t.id && (
                        <Chip
                          icon={<StarIcon />}
                          label="Default"
                          size="small"
                          color="warning"
                        />
                      )}
                      {t.master && (
                        <Chip
                          icon={<StarIcon />}
                          label="Master"
                          size="small"
                          color="info"
                        />
                      )}
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label={t.type}
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: "capitalize" }}
                      />
                      <Chip
                        label={t.layout}
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: "capitalize" }}
                      />
                      <Chip label={t.font} size="small" variant="outlined" />
                    </Stack>
                    {usageCounts.get(t.id) && usageCounts.get(t.id)! > 0 && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1, display: "block" }}
                      >
                        Used in {usageCounts.get(t.id)} resume
                        {usageCounts.get(t.id)! > 1 ? "s" : ""}
                      </Typography>
                    )}
                  </Box>
                </Stack>

                {/* Color preview */}
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 0.5 }}
                  >
                    Colors:
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Primary">
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: t.colors.primary,
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      />
                    </Tooltip>
                    <Tooltip title="Accent">
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: t.colors.accent,
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      />
                    </Tooltip>
                    <Tooltip title="Background">
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: t.colors.bg,
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      />
                    </Tooltip>
                  </Stack>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Tooltip title="Preview this template">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PreviewIcon />}
                      onClick={() => setPreview(t)}
                    >
                      Preview
                    </Button>
                  </Tooltip>
                  <Tooltip title="Use this template for new resume">
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => applyTemplateToNewResume(t)}
                    >
                      Use
                    </Button>
                  </Tooltip>
                  {active && (
                    <Tooltip title="Apply template styling to active draft">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => applyTemplateStyle(t)}
                      >
                        Apply Style
                      </Button>
                    </Tooltip>
                  )}
                </Stack>
              </CardContent>

              <Divider />
              <CardActions sx={{ flexWrap: "wrap", gap: 1 }}>
                <Button
                  startIcon={<EditIcon />}
                  size="small"
                  onClick={() => setEditing(t)}
                >
                  Edit
                </Button>
                <Button
                  startIcon={<ShareIcon />}
                  size="small"
                  onClick={() => setEditing(t)}
                >
                  Share
                </Button>
                <Button
                  startIcon={<DeleteIcon />}
                  size="small"
                  color="error"
                  onClick={() => removeTemplate(t.id)}
                >
                  Delete
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setTemplates((prev) =>
                      prev.map((pt) =>
                        pt.id === t.id ? { ...pt, master: !pt.master } : pt
                      )
                    );
                    showSuccess(t.master ? "Master unset" : "Marked as master");
                  }}
                >
                  {t.master ? "Unset Master" : "Set Master"}
                </Button>
                <Box sx={{ flex: 1 }} />
                <Button size="small" onClick={(e) => openExportMenu(e, t)}>
                  Export
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setDefaultId(t.id === defaultId ? null : t.id);
                    showSuccess(
                      t.id === defaultId ? "Unset default" : "Default set"
                    );
                  }}
                >
                  {defaultId === t.id ? "Unset Default" : "Set Default"}
                </Button>
              </CardActions>
            </Card>
          </ListItem>
        ))}
      </List>

      {/* Preview dialog */}
      <Dialog
        open={!!preview}
        onClose={() => setPreview(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Template Preview</DialogTitle>
        <DialogContent>
          {preview && (
            <Box sx={{ p: 2 }}>
              <ResumePreview template={preview} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreview(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit dialog (rename / customize / share) */}
      <Dialog
        open={!!editing}
        onClose={() => setEditing(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editing ? `Edit: ${editing.name}` : "Edit template"}
        </DialogTitle>
        {editing && (
          <DialogContent>
            <Stack spacing={2} mt={1}>
              <TextField
                label="Name"
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={editing.type}
                  label="Type"
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      type: e.target.value as TemplateType,
                    })
                  }
                >
                  <MenuItem value="chronological">Chronological</MenuItem>
                  <MenuItem value="functional">Functional</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Layout</InputLabel>
                <Select
                  value={editing.layout}
                  label="Layout"
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      layout: e.target.value as ResumeTemplate["layout"],
                    })
                  }
                >
                  <MenuItem value="single">Single column</MenuItem>
                  <MenuItem value="two-column">Two column</MenuItem>
                  <MenuItem value="modern">Modern</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Primary color"
                value={editing.colors.primary}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    colors: { ...editing.colors, primary: e.target.value },
                  })
                }
                fullWidth
              />
              <TextField
                label="Accent color"
                value={editing.colors.accent}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    colors: { ...editing.colors, accent: e.target.value },
                  })
                }
                fullWidth
              />
              <TextField
                label="Background color"
                value={editing.colors.bg}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    colors: { ...editing.colors, bg: e.target.value },
                  })
                }
                fullWidth
              />
              <TextField
                label="Font"
                value={editing.font}
                onChange={(e) =>
                  setEditing({ ...editing, font: e.target.value })
                }
                fullWidth
              />

              <Divider />
              <Typography variant="subtitle2">Share</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  label="Email or username"
                  value={shareTarget}
                  onChange={(e) => setShareTarget(e.target.value)}
                />
                <Button
                  startIcon={<ShareIcon />}
                  onClick={() => {
                    if (!shareTarget)
                      return handleError?.(
                        new Error("Please provide an email or username")
                      );
                    shareTemplate(editing, shareTarget);
                  }}
                >
                  Share
                </Button>
              </Stack>
            </Stack>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          {editing && (
            <>
              <Button
                color="error"
                onClick={() => {
                  removeTemplate(editing.id);
                  setEditing(null);
                }}
              >
                Delete
              </Button>
              <Button
                onClick={() => {
                  updateTemplate(editing);
                }}
              >
                Save
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {importError && (
        <Box mt={2}>
          <Typography color="error">Import error: {importError}</Typography>
        </Box>
      )}

      {/* Create resume dialog */}
      <Dialog
        open={!!createFromTemplate}
        onClose={() => setCreateFrom(null)}
        fullWidth
      >
        <DialogTitle>Create Resume from Template</DialogTitle>
        <DialogContent>
          {createFromTemplate && (
            <Box sx={{ p: 1 }}>
              <Typography variant="subtitle1">
                Using template: {createFromTemplate.name}
              </Typography>
              <TextField
                label="Resume name"
                fullWidth
                value={newResumeName}
                onChange={(e) => setNewResumeName(e.target.value)}
                sx={{ mt: 2 }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
              >
                This creates a local resume record (stored in localStorage)
                using the selected template.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateFrom(null)}>Cancel</Button>
          <Button variant="contained" onClick={createResume}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Render export menu and dialog */}
      <ExportMenuAndDialog />
    </Box>
  );
}
