import React from "react";
import { Box, Typography, IconButton, Avatar, Tooltip } from "@mui/material";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import DeleteIcon from "@mui/icons-material/Delete";

type ContactRow = {
	id?: string;
	first_name?: string | null;
	last_name?: string | null;
	role?: string | null;
	company?: string | null;
	industry?: string | null;
	relationship_strength?: number | null;
	email?: string | null;
};

type Props = {
	contact: ContactRow;
	onEdit?: (c: ContactRow) => void;
	onDelete?: (id?: string) => void;
};

const ContactsListItem: React.FC<Props> = ({ contact, onEdit, onDelete }) => {
	const name = `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim() || contact.email || "Unnamed";

	return (
		<Box display="flex" alignItems="center" justifyContent="space-between" sx={{ py: 1, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
			<Box display="flex" alignItems="center" gap={2}>
				<Avatar>{(contact.first_name ?? "").charAt(0).toUpperCase() || "C"}</Avatar>
				<Box>
					<Typography variant="subtitle1">{name}</Typography>
					<Typography variant="body2" color="text.secondary">
						{contact.role ?? ""}{contact.role && contact.company ? " • " : ""}{contact.company ?? ""}
					</Typography>
					<Typography variant="caption" color="text.secondary">
						{contact.industry ?? ""} {contact.relationship_strength ? `Relationship Strength: ${contact.relationship_strength}` : ""}
					</Typography>
				</Box>
			</Box>

			<Box>
				<Tooltip title="Open">
					<IconButton size="small" onClick={() => onEdit?.(contact)}>
						<OpenInFullIcon fontSize="small" />
					</IconButton>
				</Tooltip>
				<Tooltip title="Delete">
					<IconButton size="small" onClick={() => onDelete?.(contact.id)}>
						<DeleteIcon fontSize="small" />
					</IconButton>
				</Tooltip>
			</Box>
		</Box>
	);
};

export default ContactsListItem;