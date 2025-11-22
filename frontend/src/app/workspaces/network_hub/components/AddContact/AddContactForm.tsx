import React, { useEffect, useState } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Button,
	Box,
	Stack,
} from "@mui/material";

type Props = {
	open: boolean;
	initialData?: Record<string, unknown>;
	onClose: () => void;
	onCreate?: (payload: Record<string, unknown>) => Promise<void> | void;
	onUpdate?: (payload: Record<string, unknown>) => Promise<void> | void;
};

const AddContactForm: React.FC<Props> = ({ open, initialData, onClose, onCreate, onUpdate }) => {
	const [form, setForm] = useState<Record<string, unknown>>({});
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setForm(initialData ? { ...initialData } : {});
		setError(null);
	}, [initialData, open]);

	const setField = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

	const submit = async () => {
		setError(null);
		// simple validation: require name or email
		const first = String(form.first_name ?? "").trim();
		const last = String(form.last_name ?? "").trim();
		const email = String(form.email ?? "").trim();
		if (!first && !last && !email) {
			setError("Provide at least a first/last name or an email address.");
			return;
		}

		setSaving(true);
		try {
			if (initialData && initialData.id) {
				if (onUpdate) await onUpdate(form);
			} else {
				if (onCreate) await onCreate(form);
			}
			onClose();
		} catch (err: any) {
			console.error("Save contact failed", err);
			setError(err?.message ?? "Failed to save contact");
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
			<DialogTitle>{initialData?.id ? "Edit Contact" : "Add Contact"}</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ pt: 1 }}>
					<Box display="flex" gap={2} flexWrap="wrap">
						<TextField sx={{ flex: "1 1 200px" }} label="First name" value={String(form.first_name ?? "")} onChange={(e) => setField("first_name", e.target.value)} />
						<TextField sx={{ flex: "1 1 200px" }} label="Last name" value={String(form.last_name ?? "")} onChange={(e) => setField("last_name", e.target.value)} />
					</Box>

					<Box display="flex" gap={2} flexWrap="wrap">
						<TextField sx={{ flex: "1 1 240px" }} label="Email" value={String(form.email ?? "")} onChange={(e) => setField("email", e.target.value)} />
						<TextField sx={{ flex: "1 1 200px" }} label="Phone" value={String(form.phone ?? "")} onChange={(e) => setField("phone", e.target.value)} />
					</Box>

					<Box display="flex" gap={2} flexWrap="wrap">
						<TextField sx={{ flex: "1 1 240px" }} label="Company" value={String(form.company ?? "")} onChange={(e) => setField("company", e.target.value)} />
						<TextField sx={{ flex: "1 1 200px" }} label="Role" value={String(form.role ?? "")} onChange={(e) => setField("role", e.target.value)} />
					</Box>

					<Box display="flex" gap={2} flexWrap="wrap">
						<TextField sx={{ flex: "1 1 240px" }} label="Industry" value={String(form.industry ?? "")} onChange={(e) => setField("industry", e.target.value)} />
						<TextField sx={{ flex: "1 1 200px" }} label="Relationship Type" value={String(form.relationship_type ?? "")} onChange={(e) => setField("relationship_type", e.target.value)} />
					</Box>

					<TextField fullWidth label="Personal notes" value={String(form.personal_notes ?? "")} multiline rows={3} onChange={(e) => setField("personal_notes", e.target.value)} />

					<TextField fullWidth label="Professional notes" value={String(form.professional_notes ?? "")} multiline rows={3} onChange={(e) => setField("professional_notes", e.target.value)} />

					<Box display="flex" gap={2} flexWrap="wrap">
						<TextField sx={{ flex: "1 1 240px" }} label="LinkedIn URL" value={String(form.linkedin_url ?? "")} onChange={(e) => setField("linkedin_url", e.target.value)} />
						<TextField sx={{ flex: "1 1 160px" }} label="Relationship strength (1-10)" type="number" value={form.relationship_strength ?? ""} onChange={(e) => setField("relationship_strength", e.target.value ? Number(e.target.value) : null)} />
					</Box>

					{error ? (
						<Box>
							<div style={{ color: "#d32f2f" }}>{error}</div>
						</Box>
					) : null}
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={saving}>Cancel</Button>
				<Button onClick={submit} variant="contained" disabled={saving}>{initialData?.id ? "Save" : "Create"}</Button>
			</DialogActions>
		</Dialog>
	);
};

export default AddContactForm;