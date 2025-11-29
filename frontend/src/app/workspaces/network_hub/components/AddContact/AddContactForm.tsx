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
	Checkbox,
	FormControlLabel,
} from "@mui/material";

type Props = {
	open: boolean;
	initialData?: Record<string, unknown>;
	onClose: () => void;
	onCreate?: (payload: Record<string, unknown>) => Promise<void> | void;
	onUpdate?: (payload: Record<string, unknown>) => Promise<void> | void;
    includeFollowUp?: boolean;
};

const AddContactForm: React.FC<Props> = ({ open, initialData, onClose, onCreate, onUpdate, includeFollowUp }) => {
	const [form, setForm] = useState<Record<string, unknown>>({});
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setForm(
			initialData
				? { ...initialData, is_professional_reference: (initialData.is_professional_reference as boolean) ?? false, follow_up_required: (initialData.follow_up_required as boolean) ?? false, follow_up_notes: (initialData.follow_up_notes as string) ?? "" }
				: { is_professional_reference: false, follow_up_required: false, follow_up_notes: "" }
		);
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

					<Box>
						<FormControlLabel
							control={<Checkbox checked={Boolean(form.is_professional_reference)} onChange={(e) => setField("is_professional_reference", e.target.checked)} />}
							label="Professional Reference"
						/>
					</Box>

					<TextField fullWidth label="Personal notes" value={String(form.personal_notes ?? "")} multiline rows={3} onChange={(e) => setField("personal_notes", e.target.value)} />

					<TextField fullWidth label="Professional notes" value={String(form.professional_notes ?? "")} multiline rows={3} onChange={(e) => setField("professional_notes", e.target.value)} />



					<Box display="flex" gap={2} flexWrap="wrap">
						<TextField sx={{ flex: "1 1 240px" }} label="LinkedIn URL" value={String(form.linkedin_url ?? "")} onChange={(e) => setField("linkedin_url", e.target.value)} />
						<TextField sx={{ flex: "1 1 160px" }} label="Relationship strength (1-10)" type="number" value={form.relationship_strength ?? ""} onChange={(e) => setField("relationship_strength", e.target.value ? Number(e.target.value) : null)} />
					</Box>

					{includeFollowUp && (
						<Box>
							<FormControlLabel
								control={
									<Checkbox checked={Boolean(form.follow_up_required)} onChange={(e) => setField("follow_up_required", e.target.checked)} />
								}
								label="Require follow-up"
							/>
							{Boolean(form.follow_up_required) && (
								<TextField fullWidth multiline rows={3} label="Follow up notes" value={String(form.follow_up_notes ?? "")} onChange={(e) => setField("follow_up_notes", e.target.value)} sx={{ mt: 1 }} />
							)}
						</Box>
					)}

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