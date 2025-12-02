import React, { useState } from "react";
import { Box, TextField, MenuItem, Button, Checkbox, FormControlLabel } from "@mui/material";

type Filters = {
	q?: string;
	industry?: string | null;
	company?: string | null;
	role?: string | null;
	relationship_type?: string | null;
	is_professional_reference?: boolean | undefined;
};

type Props = {
	onChange?: (filters: Filters) => void;
	onClear?: () => void;
};

const relationshipOptions = ["alumni", "mentor", "colleague", "friend", "client", "other"];
const industryOptions = [
	"Technology",
	"Finance",
	"Healthcare",
	"Education",
	"Manufacturing",
	"Retail",
	"Government",
	"Non-profit",
	"Energy",
	"Transportation",
	"Real Estate",
	"Media & Entertainment",
	"Telecommunications",
	"Legal",
	"Pharmaceuticals",
	"Hospitality",
	"Consulting",
	"Automotive",
	"Insurance",
	"Biotechnology",
	"Agriculture",
	"Construction",
	"Other",
];

const ContactFilters: React.FC<Props> = ({ onChange, onClear }) => {
	const [q, setQ] = useState("");
	const [industry, setIndustry] = useState<string | null>(null);
	const [company, setCompany] = useState<string | null>(null);
	const [role, setRole] = useState<string | null>(null);
	const [relationship_type, setRelationshipType] = useState<string | null>(null);
	const [isProfessional, setIsProfessional] = useState<boolean>(false);

	const emit = () => {
		const prof = isProfessional ? true : undefined;
		onChange?.({ q: q || undefined, industry, company, role, relationship_type, is_professional_reference: prof });
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
				select
				label="Industry"
				value={industry ?? ""}
				onChange={(e) => setIndustry(e.target.value || null)}
				size="small"
				sx={{ minWidth: 160 }}
			>
				<MenuItem value="">Any</MenuItem>
				{industryOptions.map((i) => (
					<MenuItem key={i} value={i}>
						{i}
					</MenuItem>
				))}
			</TextField>

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
						{r.charAt(0).toUpperCase() + r.slice(1)}
					</MenuItem>
				))}
			</TextField>


			<FormControlLabel
				control={<Checkbox checked={isProfessional} onChange={(e) => setIsProfessional(e.target.checked)} />}
				label="Only References"
			/>

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