import React, { useState } from "react";
import { Box, TextField, MenuItem, Button } from "@mui/material";

type Filters = {
	q?: string;
	industry?: string | null;
	company?: string | null;
	role?: string | null;
	relationship_type?: string | null;
};

type Props = {
	onChange?: (filters: Filters) => void;
	onClear?: () => void;
};

const relationshipOptions = ["colleague", "friend", "mentor", "client", "other"];

const ContactFilters: React.FC<Props> = ({ onChange, onClear }) => {
	const [q, setQ] = useState("");
	const [industry, setIndustry] = useState<string | null>(null);
	const [company, setCompany] = useState<string | null>(null);
	const [role, setRole] = useState<string | null>(null);
	const [relationship_type, setRelationshipType] = useState<string | null>(null);

	const emit = () => {
		onChange?.({ q: q || undefined, industry, company, role, relationship_type });
	};

	const clear = () => {
		setQ("");
		setIndustry(null);
		setCompany(null);
		setRole(null);
		setRelationshipType(null);
		onClear?.();
		onChange?.({});
	};

	return (
		<Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
			<TextField
				label="Search"
				value={q}
				onChange={(e) => setQ(e.target.value)}
				size="small"
				placeholder="Name, email or notes"
				sx={{ minWidth: 220 }}
				onBlur={emit}
				onKeyDown={(e) => e.key === "Enter" && emit()}
			/>

			<TextField
				label="Industry"
				value={industry ?? ""}
				onChange={(e) => setIndustry(e.target.value || null)}
				size="small"
				sx={{ minWidth: 160 }}
			/>

			<TextField
				label="Company"
				value={company ?? ""}
				onChange={(e) => setCompany(e.target.value || null)}
				size="small"
				sx={{ minWidth: 160 }}
			/>

			<TextField
				label="Role"
				value={role ?? ""}
				onChange={(e) => setRole(e.target.value || null)}
				size="small"
				sx={{ minWidth: 160 }}
			/>

			<TextField
				select
				label="Relationship"
				value={relationship_type ?? ""}
				onChange={(e) => setRelationshipType(e.target.value || null)}
				size="small"
				sx={{ minWidth: 160 }}
			>
				<MenuItem value="">Any</MenuItem>
				{relationshipOptions.map((r) => (
					<MenuItem key={r} value={r}>
						{r}
					</MenuItem>
				))}
			</TextField>

			<Button variant="contained" onClick={emit} size="small">
				Apply
			</Button>

			<Button variant="text" onClick={clear} size="small">
				Clear
			</Button>
		</Box>
	);
};

export default ContactFilters;