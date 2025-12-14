import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { getAppQueryClient } from "@shared/cache";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import { fetchCoreContacts } from "@shared/cache/coreFetchers";
import { useAuth } from "@shared/context/AuthContext";

type ContactRow = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  industry?: string | null;
  company?: string | null;
  role?: string | null;
  email?: string | null;
  [key: string]: unknown;
};

export default function InformationInterviewContactPicker({
  onSelect,
  initialQuery,
}: {
  onSelect: (row: ContactRow) => void;
  initialQuery?: string;
}) {
  const { user, loading } = useAuth();
  const [q, setQ] = useState(initialQuery ?? "");
  const [industry, setIndustry] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [company, setCompany] = useState<string | null>(null);
  const [results, setResults] = useState<ContactRow[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      (async () => {
        if (loading) return;
        if (!user) {
          setResults([]);
          return;
        }
        setLoadingData(true);
        try {
          const qc = getAppQueryClient();
          const contacts = await qc.ensureQueryData({
            queryKey: coreKeys.contacts(user.id),
            queryFn: () => fetchCoreContacts<ContactRow>(user.id),
            staleTime: 60 * 60 * 1000,
          });

          const all = Array.isArray(contacts) ? (contacts as ContactRow[]) : [];
          const qLower = q ? q.toLowerCase() : "";

          const filtered = all.filter((c) => {
            try {
              if (industry && String(c.industry ?? "") !== String(industry))
                return false;
              if (company && String(c.company ?? "") !== String(company))
                return false;
              if (role && String(c.role ?? "") !== String(role)) return false;

              if (qLower) {
                // Preserve old behavior: search was `ilike` on first_name.
                const first = String(c.first_name ?? "").toLowerCase();
                return first.includes(qLower);
              }
              return true;
            } catch {
              return false;
            }
          });

          setResults(filtered);
        } catch (err) {
          console.error("Contact search failed", err);
          setResults([]);
        } finally {
          setLoadingData(false);
        }
      })();
    }, 300);

    return () => clearTimeout(t);
  }, [q, industry, role, company, user, loading]);

  return (
    <Stack spacing={1}>
      <TextField
        fullWidth
        placeholder="Search by name"
        size="small"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <Box>
        <Typography variant="caption" color="text.secondary">
          Filter by industry / company / role (optional)
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <TextField
            size="small"
            placeholder="Industry"
            value={industry ?? ""}
            onChange={(e) => setIndustry(e.target.value || null)}
          />
          <TextField
            size="small"
            placeholder="Company"
            value={company ?? ""}
            onChange={(e) => setCompany(e.target.value || null)}
          />
          <TextField
            size="small"
            placeholder="Role"
            value={role ?? ""}
            onChange={(e) => setRole(e.target.value || null)}
          />
        </Stack>
      </Box>

      <Box>
        <List dense>
          {results.length === 0 ? (
            <ListItemButton disabled>
              <ListItemText
                primary={loadingData ? "Searching..." : "No contacts found"}
              />
            </ListItemButton>
          ) : (
            results.map((r) => (
              <ListItemButton key={String(r.id)} onClick={() => onSelect(r)}>
                <ListItemText
                  primary={
                    `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() ||
                    (r.full_name ?? "Unnamed")
                  }
                  secondary={`${r.role ?? ""}${
                    r.company ? ` — ${r.company}` : ""
                  }`}
                />
              </ListItemButton>
            ))
          )}
        </List>
      </Box>
    </Stack>
  );
}
