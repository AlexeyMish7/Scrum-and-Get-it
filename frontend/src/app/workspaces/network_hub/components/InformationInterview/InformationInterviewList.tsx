import { useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  List,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import {
  useCoreContacts,
  useInformationalInterviews,
} from "@shared/cache/coreHooks";
import InformationInterviewListItem from "./InformationInterviewListItem";

type ContactRow = {
  id: string | number;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

type InformationalInterviewRow = {
  id: string | number;
  contact_id?: string | number | null;
  contact_name?: string | null;
  status?: string | null;
  interview_date?: string | null;
  request_template?: unknown;
  contact?: unknown;
};

export default function InformationInterviewList() {
  const { user } = useAuth();
  const interviewsQuery = useInformationalInterviews<InformationalInterviewRow>(
    user?.id
  );
  const contactsQuery = useCoreContacts<ContactRow>(user?.id);

  const contactsById = useMemo(() => {
    const map = new Map<string, ContactRow>();
    for (const c of contactsQuery.data ?? []) {
      map.set(String(c.id), c);
    }
    return map;
  }, [contactsQuery.data]);

  const rows = interviewsQuery.data ?? [];
  const loading = interviewsQuery.isLoading;

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">Informational Interviews</Typography>
        <Button onClick={() => interviewsQuery.refetch()} size="small">
          Refresh
        </Button>
      </Stack>

      {loading ? (
        <CircularProgress />
      ) : (
        <List>
          {rows.length === 0 ? (
            <Typography variant="body2">
              No informational interviews found.
            </Typography>
          ) : (
            rows.map((r) => (
              <InformationInterviewListItem
                key={r.id}
                row={r}
                contact={
                  r.contact_id != null
                    ? contactsById.get(String(r.contact_id)) ?? null
                    : null
                }
                onUpdated={() => interviewsQuery.refetch()}
              />
            ))
          )}
        </List>
      )}
    </Box>
  );
}
