import React from "react";
import { Box, Paper, Typography, Stack, Button } from "@mui/material";
import RelationshipTemplatesList from "@workspaces/network_hub/components/RelationshipMaintenance/Actions/RelationshipTemplatesList";
import { useNavigate } from "react-router-dom";

export default function TemplatesPage() {
    const navigate = useNavigate();

    return (
        <Box sx={{ p: 3 }}>
            <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5">Relationship Message Templates</Typography>
                    <Button onClick={() => navigate(-1)}>Back</Button>
                </Stack>

                <Paper sx={{ p: 2 }}>
                    <Typography variant="body1">Use these short templates for birthday wishes, congratulations, and quick updates. Click the copy icon beside any template to copy it to your clipboard, then personalize as needed.</Typography>
                </Paper>

                <RelationshipTemplatesList />
            </Stack>
        </Box>
    );
}
