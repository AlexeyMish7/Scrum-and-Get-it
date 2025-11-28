import { Box, Typography } from "@mui/material";
import { Breadcrumbs } from "@shared/components/navigation";
import EventList from "@workspaces/network_hub/components/NetworkingEvents/EventList";

export default function Events() {
	return (
		<Box sx={{ width: "100%", p: 3 }}>
			<Box sx={{ p: 3, pb: 0 }}>
				<Breadcrumbs items={[{ label: "Network" }, { label: "Events" }]} />
			</Box>

			<Box sx={{ maxWidth: 1200, mx: "auto", mt: 2 }}>
				<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
					<Typography variant="h4">Networking Events</Typography>
				</Box>

				<EventList />
			</Box>
		</Box>
	);
}

