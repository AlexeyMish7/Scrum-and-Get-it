import { useEffect, useState } from "react";
import { Box, Stack, Typography, Button, List, CircularProgress } from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import * as db from "@shared/services/dbMappers";
import InformationInterviewListItem from "./InformationInterviewListItem";

export default function InformationInterviewList() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<any[]>([]);

    async function load() {
        if (!user) return;
        setLoading(true);
        try {
            const res = await db.listInformationalInterviews(user.id, {
                order: { column: "created_at", ascending: false },
            });
            if (!res.error && res.data) setRows(Array.isArray(res.data) ? res.data : [res.data]);
            else setRows([]);
        } catch (err) {
            console.error("Failed to load interviews", err);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, [user]);

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Informational Interviews</Typography>
                <Button onClick={load} size="small">Refresh</Button>
            </Stack>

            {loading ? (
                <CircularProgress />
            ) : (
                <List>
                    {rows.length === 0 ? (
                        <Typography variant="body2">No informational interviews found.</Typography>
                    ) : (
                        rows.map((r) => (
                            <InformationInterviewListItem key={r.id} row={r} onUpdated={load} />
                        ))
                    )}
                </List>
            )}
        </Box>
    );
}