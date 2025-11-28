import React, { useEffect, useState } from "react";
import { Box, TextField, List, ListItemButton, ListItemText, Stack, Typography } from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import * as db from "@shared/services/dbMappers";
import type { Result } from "@shared/services/types";

type ContactRow = Record<string, any>;

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
          const opts: any = {};
          // free text search (name only)
          if (q) opts.ilike = { first_name: `%${q}%` };
          // simple equality filters (industry / company / role)
          if (industry || role || company) opts.eq = {};
          if (industry) (opts.eq = opts.eq ?? {}).industry = industry;
          if (company) (opts.eq = opts.eq ?? {}).company = company;
          if (role) (opts.eq = opts.eq ?? {}).role = role;

          const res: Result<unknown[]> = await db.listContacts(user.id, opts);
          if (!res.error && res.data) setResults(Array.isArray(res.data) ? res.data as ContactRow[] : [res.data as ContactRow]);
          else setResults([]);
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
          <TextField size="small" placeholder="Role" value={role ?? ""} onChange={(e) => setRole(e.target.value || null)} />
        </Stack>
      </Box>

      <Box>
        <List dense>
          {results.length === 0 ? (
            <ListItemButton disabled>
              <ListItemText primary={loadingData ? "Searching..." : "No contacts found"} />
            </ListItemButton>
          ) : (
            results.map((r) => (
              <ListItemButton
                key={String(r.id)}
                onClick={() => onSelect(r)}
              >
                <ListItemText
                  primary={`${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || (r.full_name ?? "Unnamed")}
                  secondary={`${r.role ?? ""}${r.company ? ` — ${r.company}` : ""}`}
                />
              </ListItemButton>
            ))
          )}
        </List>
      </Box>
    </Stack>
  );
}
