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
	IconButton,
	InputLabel,
	List,
	ListItem,
	MenuItem,
	Select,
	Stack,
	TextField,
	Typography,
	Tooltip,
	Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PreviewIcon from "@mui/icons-material/Preview";
import ShareIcon from "@mui/icons-material/Share";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import StarIcon from "@mui/icons-material/Star";

import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { useAuth } from "@shared/context/AuthContext";

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
};

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
		education: [{ degree: "B.S. Computer Science", school: "State University", dates: "2014 - 2018" }],
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
				<Box sx={{ width: 140, bgcolor: template.colors.bg, p: 1, borderRadius: 1 }}>
					<Typography variant="subtitle2" sx={{ color: template.colors.primary, fontWeight: 700, mb: 1 }}>
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
					<Typography variant="h6" sx={{ ...baseStyles }}>{sample.name}</Typography>
					<Typography variant="subtitle2" color="text.secondary">
						{sample.title}
					</Typography>
					<Box mt={1}>
						<Typography variant="body2">{sample.summary}</Typography>
					</Box>
					<Box mt={2}>
						<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Experience</Typography>
						{sample.experience.map((e) => (
							<Box key={e.role} sx={{ mt: 1 }}>
								<Typography sx={{ fontWeight: 700 }}>{e.role} — {e.company}</Typography>
								<Typography variant="caption" color="text.secondary">{e.dates}</Typography>
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
			<Box sx={{ bgcolor: template.colors.bg, borderRadius: 1, overflow: "hidden" }}>
				<Box sx={{ bgcolor: template.colors.primary, color: "#fff", p: 2 }}>
					<Typography variant="h6" sx={{ fontFamily: template.font }}>{sample.name}</Typography>
					<Typography variant="body2">{sample.title}</Typography>
				</Box>
				<Box sx={{ p: 2 }}>
					<Typography variant="body2" sx={{ mb: 1 }}>{sample.summary}</Typography>
					<Box>
						<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Experience</Typography>
						{sample.experience.map((e) => (
							<Box key={e.role} sx={{ mt: 1 }}>
								<Typography sx={{ fontWeight: 700 }}>{e.role}</Typography>
								<Typography variant="caption" color="text.secondary">{e.company} • {e.dates}</Typography>
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
			<Typography variant="h6" sx={{ ...baseStyles }}>{sample.name}</Typography>
			<Typography variant="subtitle2" color="text.secondary">{sample.title}</Typography>
			<Box mt={1}>
				<Typography variant="body2">{sample.summary}</Typography>
			</Box>
			<Box mt={2}>
				<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Experience</Typography>
				{sample.experience.map((e) => (
					<Box key={e.role} sx={{ mt: 1 }}>
						<Typography sx={{ fontWeight: 700 }}>{e.role} — {e.company}</Typography>
						<Typography variant="caption" color="text.secondary">{e.dates}</Typography>
						<Typography variant="body2">{e.desc}</Typography>
					</Box>
				))}
			</Box>
		</Box>
	);
}

export default function TemplateManager() {
	const { notification, showSuccess, handleError } = useErrorHandler();
	const { user } = useAuth();

	const [templates, setTemplates] = useState<ResumeTemplate[]>(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return defaultTemplates();
			return JSON.parse(raw) as ResumeTemplate[];
		} catch (e) {
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
		} catch (e) {
			console.warn("Failed to persist templates", e);
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
			colors: base?.colors ?? { primary: "#0d6efd", accent: "#6c757d", bg: "#ffffff" },
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
			const parsed = JSON.parse(text) as ResumeTemplate;
			// basic validation
			if (!parsed?.id) parsed.id = uid("tmpl");
			parsed.createdAt = new Date().toISOString();
			setTemplates((s) => [parsed, ...s]);
			showSuccess("Template imported");
			setImportError(null);
		} catch (e: any) {
			setImportError(e?.message ?? "Failed to import");
			handleError?.(e);
		}
	};

	const exportTemplate = (t: ResumeTemplate) => {
		const blob = new Blob([JSON.stringify(t, null, 2)], { type: "application/json" });
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
				tpl.id === t.id ? { ...tpl, sharedWith: [...(tpl.sharedWith ?? []), target] } : tpl
			)
		);
		showSuccess(`Shared with ${target}`);
		setShareTarget("");
	};

	// Create resume support
	const [createFromTemplate, setCreateFrom] = useState<ResumeTemplate | null>(null);
	const [newResumeName, setNewResumeName] = useState<string>("");

	const applyTemplateToNewResume = (t: ResumeTemplate) => {
		// Open create dialog for a new resume based on the chosen template.
		setCreateFrom(t);
	};

	const createResume = () => {
		if (!createFromTemplate) return;
		const resumesRaw = localStorage.getItem("sgt:resumes");
		let resumes: any[] = [];
		try {
			resumes = resumesRaw ? JSON.parse(resumesRaw) : [];
		} catch (e) {
			resumes = [];
		}
		const newResume = {
			id: uid("resume"),
			name: newResumeName || `${createFromTemplate.name} Resume`,
			templateId: createFromTemplate.id,
			createdAt: new Date().toISOString(),
			owner: user?.id ?? null,
			content: {},
		};
		resumes.unshift(newResume);
		localStorage.setItem("sgt:resumes", JSON.stringify(resumes));
		showSuccess("Resume created from template");
		setCreateFrom(null);
		setNewResumeName("");
	};

	const templateList = useMemo(() => templates, [templates]);

	return (
		<Box p={3}>
			<Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
				<Typography variant="h5">Resume Templates</Typography>
				<Stack direction="row" spacing={1}>
					<Button startIcon={<AddIcon />} variant="contained" onClick={() => createFrom()}>
						New Template
					</Button>
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
				</Stack>
			</Stack>

			<List sx={{ display: "flex", gap: 2, flexWrap: "wrap", p: 0 }}>
						{templateList.map((t) => (
							<ListItem key={t.id} sx={{ width: { xs: '100%', sm: 360 }, p: 0 }}>
								<Card sx={{ width: "100%" }}>
							<CardContent>
								<Stack direction="row" justifyContent="space-between" alignItems="center">
									<Box>
										<Typography variant="subtitle1">{t.name}</Typography>
										<Typography variant="caption" color="text.secondary">
											{t.type} • {t.layout}
										</Typography>
									</Box>
									<Stack direction="row" spacing={1} alignItems="center">
										{defaultId === t.id && (
											<Tooltip title="Default template">
												<StarIcon color="warning" />
											</Tooltip>
										)}
										<Tooltip title="Preview">
											<IconButton onClick={() => setPreview(t)}>
												<PreviewIcon />
											</IconButton>
										</Tooltip>
										<Tooltip title="Use to create new resume">
											<Button size="small" variant="contained" onClick={() => applyTemplateToNewResume(t)}>
												Use
											</Button>
										</Tooltip>
									</Stack>
								</Stack>

								<Box mt={2} sx={{ border: `1px solid ${t.colors.accent}`, p: 1, borderRadius: 1 }}>
									<Typography sx={{ fontFamily: t.font, color: t.colors.primary }}>
										{t.name} — preview
									</Typography>
									<Box mt={1} sx={{ height: 48, bgcolor: t.colors.bg, borderRadius: 1 }} />
								</Box>
							</CardContent>
							<Divider />
											<CardActions sx={{ flexWrap: 'wrap', gap: 1 }}>
								<Button startIcon={<EditIcon />} size="small" onClick={() => setEditing(t)}>
									Edit
								</Button>
								<Button startIcon={<ShareIcon />} size="small" onClick={() => setEditing(t)}>
									Share
								</Button>
								<Button startIcon={<DeleteIcon />} size="small" color="error" onClick={() => removeTemplate(t.id)}>
									Delete
								</Button>
								<Box sx={{ flex: 1 }} />
								<Button size="small" onClick={() => exportTemplate(t)}>
									Export
								</Button>
								<Button
									size="small"
									onClick={() => {
										setDefaultId(t.id === defaultId ? null : t.id);
										showSuccess(t.id === defaultId ? "Unset default" : "Default set");
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
			<Dialog open={!!preview} onClose={() => setPreview(null)} fullWidth maxWidth="sm">
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
			<Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="sm">
				<DialogTitle>{editing ? `Edit: ${editing.name}` : "Edit template"}</DialogTitle>
				{editing && (
					<DialogContent>
						<Stack spacing={2} mt={1}>
							<TextField
								label="Name"
								value={editing.name}
								onChange={(e) => setEditing({ ...editing, name: e.target.value })}
								fullWidth
							/>
							<FormControl fullWidth>
								<InputLabel>Type</InputLabel>
								<Select
									value={editing.type}
									label="Type"
									onChange={(e) => setEditing({ ...editing, type: e.target.value as TemplateType })}
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
									onChange={(e) => setEditing({ ...editing, layout: e.target.value as any })}
								>
									<MenuItem value="single">Single column</MenuItem>
									<MenuItem value="two-column">Two column</MenuItem>
									<MenuItem value="modern">Modern</MenuItem>
								</Select>
							</FormControl>

							<TextField
								label="Primary color"
								value={editing.colors.primary}
								onChange={(e) => setEditing({ ...editing, colors: { ...editing.colors, primary: e.target.value } })}
								fullWidth
							/>
							<TextField
								label="Accent color"
								value={editing.colors.accent}
								onChange={(e) => setEditing({ ...editing, colors: { ...editing.colors, accent: e.target.value } })}
								fullWidth
							/>
							<TextField
								label="Background color"
								value={editing.colors.bg}
								onChange={(e) => setEditing({ ...editing, colors: { ...editing.colors, bg: e.target.value } })}
								fullWidth
							/>
							<TextField
								label="Font"
								value={editing.font}
								onChange={(e) => setEditing({ ...editing, font: e.target.value })}
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
										if (!shareTarget) return handleError?.(new Error("Please provide an email or username"));
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
			<Dialog open={!!createFromTemplate} onClose={() => setCreateFrom(null)} fullWidth>
				<DialogTitle>Create Resume from Template</DialogTitle>
				<DialogContent>
					{createFromTemplate && (
						<Box sx={{ p: 1 }}>
							<Typography variant="subtitle1">Using template: {createFromTemplate.name}</Typography>
							<TextField
								label="Resume name"
								fullWidth
								value={newResumeName}
								onChange={(e) => setNewResumeName(e.target.value)}
								sx={{ mt: 2 }}
							/>
							<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
								This creates a local resume record (stored in localStorage) using the selected template.
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
		</Box>
	);
}

