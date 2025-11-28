import { useState } from "react";
import InformationInterviewDialog from "./InformationInterviewDialog";
import QuickActionButton from "../../../../shared/components/common/QuickActionButton";

export default function InformationInterviewButton() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<QuickActionButton
				label="Request Informational Interview"
				onClick={() => setOpen(true)}
				size="small"
			/>

			<InformationInterviewDialog open={open} onClose={() => setOpen(false)} />
		</>
	);
}