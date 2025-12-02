import { useState, useEffect } from "react";
import {
	ListItem,
	ListItemText,
	Stack,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Typography,
	Divider,
	Chip,
	Tabs,
	Tab,
	Box,
} from "@mui/material";
import * as db from "@shared/services/dbMappers";
import { useAuth } from "@shared/context/AuthContext";
import IconButton from '@mui/material/IconButton';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AddReminders from "../RelationshipMaintenance/Reminders/AddReminders";
import AddInteractionsTab from "../ContactDetails/ContactInteractions/AddInteractionsTab";

type Props = {
	row: any;
	onUpdated?: () => void;
};

export default function InformationInterviewListItem({ row, onUpdated }: Props) {
	const { user } = useAuth();
	const [open, setOpen] = useState(false);
	const [status, setStatus] = useState<string | null>(row?.status ?? null);

	useEffect(() => {
		setStatus(row?.status ?? null);
	}, [row?.status]);

	const id = row?.id;
	const [fetchedContact, setFetchedContact] = useState<any | null>(row?.contact ?? null);
	const request = (row?.request_template as any) ?? {};
	const subject = request?.subject ?? "Informational interview";
	// Prefer the explicit interview_date column; do not fall back to created_at
	const interviewDate = row?.interview_date ?? null;
	const contactName =
		fetchedContact?.full_name ||
		`${fetchedContact?.first_name ?? ""} ${fetchedContact?.last_name ?? ""}`.trim() ||
		row?.contact_name ||
		"Contact";

	useEffect(() => {
		let mounted = true;
		async function loadContact() {
			if (!user) return;
			const cid = row?.contact_id ?? row?.contact?.id ?? null;
			if (!cid) return;
			try {
				const res = await db.getContact(user.id, String(cid));
				if (!res.error && res.data && mounted) {
					setFetchedContact(res.data as any);
				}
			} catch (err) {
				console.error("Failed to load contact for informational interview", err);
			}
		}

		// Load when row.contact_id or user changes
		loadContact();
		return () => {
			mounted = false;
		};
	}, [user, row?.contact_id, row?.contact?.id]);

	const [tab, setTab] = useState(0);

	function handleTabChange(_: any, newValue: number) {
		setTab(newValue);
	}

	return (
		<>
			<ListItem divider>
				<ListItemText
					primary={
						<span>
							{subject} {status ? <Chip label={String(status).toUpperCase()} size="small" color={(status === "confirmed" || status === "completed") ? "success" : "default"} sx={{ ml: 1 }} /> : null}
						</span>
					}
					secondary={<Typography component="span" variant="body2">{contactName} — {interviewDate ? new Date(interviewDate).toLocaleString() : "No date"}</Typography>}
				/>

				<Stack direction="row" spacing={1} alignItems="center">
					<Button size="small" onClick={() => { setOpen(true); setTab(0); }}>View</Button>
					{status === 'completed' ? (
						<CheckCircleOutlineIcon color="success" sx={{ ml: 1 }} />
					) : (
						<IconButton size="small" aria-label="mark-completed" onClick={async () => {
							// mark completed in DB, then open the dialog on the Completed tab with interactions prefilled
							try {
								if (user && id) {
									await db.updateInformationalInterview(user.id, id, { status: 'completed', completed_at: (interviewDate ?? new Date().toISOString()) });
								}
							} catch (err) {
								console.error('Failed to mark interview completed', err);
							}
							setStatus('completed');
							// open dialog and show interactions tab
							setOpen(true);
							setTab(2);
							if (onUpdated) onUpdated();
						}}>
							<CheckCircleOutlineIcon />
						</IconButton>
					)}
				</Stack>
			</ListItem>

			<Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
				<DialogTitle>{`Request From ${contactName}`}</DialogTitle>
				<DialogContent dividers>
					<Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
						<Tab label="Info" />
						<Tab label="Interview Confirmed" />
						<Tab label="Interview Completed" />
					</Tabs>

					{/* Info tab */}
					{tab === 0 && (
						<Box>
							<Typography variant="subtitle1" sx={{ mb: 1 }}>{subject}</Typography>
							<Typography variant="caption" color="text.secondary">Requested: {interviewDate ? new Date(interviewDate).toLocaleString() : "—"}</Typography>

							<Divider sx={{ my: 2 }} />

							<Typography variant="h6">Generated Email</Typography>
							<Typography component="pre" sx={{ whiteSpace: "pre-wrap", fontFamily: 'inherit', mt: 1 }}>{request?.email ?? "(no email)"}</Typography>

							<Divider sx={{ my: 2 }} />

							<Typography variant="h6">Preparation Notes</Typography>
							{Array.isArray(request?.prep) && request.prep.length ? (
								<ul>
									{request.prep.map((p: string, i: number) => (
										<li key={i}><Typography variant="body2">{p}</Typography></li>
									))}
								</ul>
							) : (
								<Typography variant="body2">No prep notes available</Typography>
							)}
						</Box>
					)}

					{/* Confirmed tab */}
					{tab === 1 && (
						<Box>
								{/* Add reminder UI */}
								<AddReminders
									contactId={row?.contact_id ?? row?.contact?.id}
									confirmInterviewId={id}
									initialType={"Informational Interview"}
									initialRemindAt={interviewDate ? new Date(interviewDate).toISOString() : null}
									onSaved={() => {
										setStatus("confirmed");
										if (onUpdated) onUpdated();
									}}
								/>
						</Box>
					)}

					{/* Completed tab: allow adding an interaction tied to this contact/interview */}
					{tab === 2 && (
						<Box>
							<AddInteractionsTab
								contactId={row?.contact_id ?? row?.contact?.id}
								initialType={"Informational Interview"}
								initialOccurredAt={interviewDate}
								onAdded={async () => {
									// mark as completed in the DB (if possible), then update UI and notify parent
									try {
										if (user && id) {
											const upd = await db.updateInformationalInterview(user.id, id, { status: "completed", completed_at: new Date().toISOString() });
											if (upd && !upd.error) {
												setStatus("completed");
											} else {
												// fallback: still set locally
												setStatus("completed");
											}
										} else {
											setStatus("completed");
										}
									} catch (err) {
										console.error("Failed to update informational interview status", err);
										setStatus("completed");
									}
									if (onUpdated) onUpdated();
								}}
							/>
						</Box>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpen(false)}>Close</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}