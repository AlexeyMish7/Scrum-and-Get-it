import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, CircularProgress, Stack } from "@mui/material";
import { useConfirmDialog } from "@shared/hooks/useConfirmDialog";
import ContactFilters from "../ContactFilters";
import ContactsListItem from "./ContactsListItem";
import AddContactButton from "../AddContact/AddContactButton";
import AddContactForm from "../AddContact/AddContactForm";
import ContactDetailsDialog from "../ContactDetails/ContactDetailsDialog";
import { useAuth } from "@shared/context/AuthContext";
import * as db from "@shared/services/dbMappers";
import type { Result } from "@shared/services/types";

const ContactsList: React.FC = () => {
	const { user, loading } = useAuth();
	const { confirm } = useConfirmDialog();
	const [contacts, setContacts] = useState<any[]>([]);
	const [loadingData, setLoadingData] = useState(false);
	const [filters, setFilters] = useState<Record<string, unknown> | null>(null);
	const [openForm, setOpenForm] = useState(false);
	const [editing, setEditing] = useState<Record<string, unknown> | null>(null);

	const load = async () => {
		if (loading) return;
		if (!user) {
			setContacts([]);
			return;
		}
		setLoadingData(true);
		try {
			// Build simple eq/ilike filters from `filters` state
			const opts: any = {};
			if (filters) {
				const { q, industry, company, role, relationship_type } = filters as any;
				opts.eq = {};
				if (industry) opts.eq.industry = industry;
				if (company) opts.eq.company = company;
				if (role) opts.eq.role = role;
				if (relationship_type) opts.eq.relationship_type = relationship_type;
				// Free text search using ilike on name/email/company/notes
				if (q) opts.ilike = { first_name: `%${q}%` };
			}

			const res: Result<unknown[]> = await db.listContacts(user.id, opts);
			if (!res.error && res.data) setContacts(Array.isArray(res.data) ? res.data : [res.data]);
			else setContacts([]);
		} catch (err) {
			console.error("Failed to load contacts", err);
			setContacts([]);
		} finally {
			setLoadingData(false);
		}
	};

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user, loading, filters]);

	const handleCreate = async (payload: Record<string, unknown>) => {
		if (!user) throw new Error("Not signed in");
		const res = await db.createContact(user.id, payload);
		if (res.error) throw new Error(res.error.message || "Create failed");
		// reload list
		await load();
		setOpenForm(false);
	};

	const handleUpdate = async (id: string, payload: Record<string, unknown>) => {
		if (!user) throw new Error("Not signed in");
		const res = await db.updateContact(user.id, id, payload);
		if (res.error) throw new Error(res.error.message || "Update failed");
		await load();
		setEditing(null);
		setOpenForm(false);
	};

	const handleDelete = async (id?: string) => {
		if (!user || !id) return;
		const ok = await confirm({ title: 'Delete contact?', message: 'This will permanently delete the contact and its interactions. Continue?', confirmText: 'Delete', confirmColor: 'error' });
		if (!ok) return;
		try {
			await db.deleteContact(user.id, id);
		} catch (err) {
			console.error("Delete contact failed", err);
		}
		await load();
	};

	return (
		<Box>
			<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
				<Typography variant="h5">Contacts</Typography>
				<AddContactButton onClick={() => { setEditing(null); setOpenForm(true); }} />
			</Box>

			<Paper sx={{ p: 2, mb: 2 }}>
				<ContactFilters onChange={(f) => setFilters(f ?? null)} onClear={() => setFilters(null)} />
			</Paper>

			<Paper sx={{ p: 2 }}>
				{loadingData ? (
					<Stack alignItems="center" py={4}>
						<CircularProgress />
					</Stack>
				) : contacts.length === 0 ? (
					<Typography color="text.secondary">No contacts yet. Add one with the button above.</Typography>
				) : (
					contacts.map((c) => (
						<ContactsListItem
							key={c.id}
							contact={c}
							onEdit={(row) => { setEditing(row); setOpenForm(true); }}
							onDelete={(id) => handleDelete(id)}
						/>
					))
				)}
			</Paper>

			{openForm && !editing && (
				<AddContactForm
					open={openForm}
					initialData={undefined}
					onClose={() => { setOpenForm(false); setEditing(null); }}
					onCreate={handleCreate}
				/>
			)}

			{openForm && editing && (
				<ContactDetailsDialog
					open={Boolean(openForm && editing)}
					contact={editing as any}
					onClose={() => { setOpenForm(false); setEditing(null); }}
					onUpdate={async (payload: Record<string, unknown>) => {
						if (!editing?.id) return;
						await handleUpdate(String(editing.id), payload);
					}}
					onDelete={async (id?: string) => {
						await handleDelete(id);
						setOpenForm(false);
						setEditing(null);
					}}
					onRefresh={load}
				/>
			)}
		</Box>
	);
};

export default ContactsList;


