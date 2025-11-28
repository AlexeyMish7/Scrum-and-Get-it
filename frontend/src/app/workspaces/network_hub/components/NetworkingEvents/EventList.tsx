import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddEvent from "./AddEvent";
import EventCard from "./EventCard";
import { useAuth } from "@shared/context/AuthContext";
import {
  listNetworkingEvents,
} from "@shared/services/dbMappers";

export default function EventList() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Record<string, any>[]>([]);
  const [query, setQuery] = useState("");
  const [filterAttended, setFilterAttended] = useState<string>("all");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  async function fetchEvents() {
    if (!user) return;
    setLoading(true);
    try {
      const res = await listNetworkingEvents(user.id, { order: { column: "start_time", ascending: true } });
      if (!res.error && Array.isArray(res.data)) setEvents(res.data as Record<string, any>[]);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = events.slice();
    if (q) {
      list = list.filter((ev) =>
        String(ev.name ?? "").toLowerCase().includes(q) ||
        String(ev.location ?? "").toLowerCase().includes(q) ||
        String(ev.industry ?? "").toLowerCase().includes(q)
      );
    }
    if (filterAttended === "attended") list = list.filter((ev) => ev.attended === true);
    if (filterAttended === "not_attended") list = list.filter((ev) => ev.attended !== true);

    list.sort((a, b) => {
      const ta = a.start_time ? new Date(String(a.start_time)).getTime() : 0;
      const tb = b.start_time ? new Date(String(b.start_time)).getTime() : 0;
      return sortDir === "asc" ? ta - tb : tb - ta;
    });
    return list;
  }, [events, query, filterAttended, sortDir]);

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by name, location, or industry"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon /> }}
          />

          <FormControl size="small">
            <InputLabel>Attended</InputLabel>
            <Select value={filterAttended} label="Attended" onChange={(e) => setFilterAttended(String(e.target.value))}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="attended">Attended</MenuItem>
              <MenuItem value="not_attended">Not attended</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel>Sort</InputLabel>
            <Select value={sortDir} label="Sort" onChange={(e) => setSortDir((e.target.value as any) ?? "asc")}>
              <MenuItem value="asc">Upcoming first</MenuItem>
              <MenuItem value="desc">Past first</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <AddEvent onSaved={fetchEvents} />
        </Stack>
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Typography color="text.secondary">No events found. Create one using Add Event.</Typography>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {filtered.map((ev) => (
            <Box
              key={ev.id}
              sx={{
                flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 8px)", md: "1 1 calc(33.333% - 16px)" },
                minWidth: 260,
              }}
            >
              <EventCard event={ev} onChanged={fetchEvents} />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
//This list will hold event cards for each networking event the user has created
//It should fetch the list of events from the network_events table in the database and display them using the EventCard component
//It should also have a search bar at the top to search by event name, date range, location, or industry 
//The search bar should also be able to filter by attended or not attended events
//It should also be able to sort the events by date (upcoming first or past first)