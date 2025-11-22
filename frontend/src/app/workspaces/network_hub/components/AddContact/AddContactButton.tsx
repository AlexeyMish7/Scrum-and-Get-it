import React from "react";
import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

type Props = {
	onClick?: () => void;
};

const AddContactButton: React.FC<Props> = ({ onClick }) => {
	return (
		<Button variant="contained" startIcon={<AddIcon />} onClick={onClick}>
			Add Contact
		</Button>
	);
};

export default AddContactButton;