import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useAuth } from "@shared/context/AuthContext";
import * as db from "@shared/services/dbMappers";
import { aiClient } from "@shared/services/ai/client";
import ContactsListItem from "@workspaces/network_hub/components/ContactsList/ContactsListItem";
import ContactDetailsDialog from "@workspaces/network_hub/components/ContactDetails/ContactDetailsDialog";

type Suggestion = {
  name: string;
  title?: string;
  reason?: string;
  searchQuery?: string | null;
  raw?: any;
};

type Leader = {
  name: string;
  role?: string;
  company?: string;
  reason?: string;
  referenceUrl?: string | null;
  searchQuery?: string | null;
  raw?: any;
};

export default function SuggestContacts({
  open,
  onClose,
  jobTitle,
  companyName,
  alumniSchool,
  job,
}: {
  open: boolean;
  onClose: () => void;
  jobTitle?: string | null;
  companyName?: string | null;
  alumniSchool?: string | null;
  job?: Record<string, any> | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Suggestion[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [realPeople, setRealPeople] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const savedResultsRef = useRef<Suggestion[] | null>(null);
  useEffect(() => {
    if (!open) return;
    if (!jobTitle && !companyName) return;
    if (authLoading) return;

    let cancelled = false;

    // helpers
    const normalize = (v: unknown) => String(v ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");

    function levenshtein(a: string, b: string) {
      if (a === b) return 0;
      const al = a.length;
      const bl = b.length;
      if (al === 0) return bl;
      if (bl === 0) return al;
      const matrix: number[][] = Array.from({ length: al + 1 }, () => Array(bl + 1).fill(0));
      for (let i = 0; i <= al; i++) matrix[i][0] = i;
      for (let j = 0; j <= bl; j++) matrix[0][j] = j;
      for (let i = 1; i <= al; i++) {
        for (let j = 1; j <= bl; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + cost
          );
        }
      }
      return matrix[al][bl];
    }

    const fuzzyMatch = (a: string, b: string) => {
      const na = normalize(a);
      const nb = normalize(b);
      if (!na || !nb) return false;
      if (na.includes(nb) || nb.includes(na)) return true;
      try {
        return levenshtein(na, nb) <= 2;
      } catch {
        return false;
      }
    };

    async function loadLocalContacts() {
      setLoading(true);
      setError(null);
      // preserve AI results while dialog remains open
      if (!savedResultsRef.current) setResults([]);
      setRealPeople([]);

      try {
        if (!user) throw new Error("Not signed in");

        const res = await db.listContacts(user.id);
        if (res.error) throw new Error(res.error?.message ?? "Failed to load contacts");

        const contacts = Array.isArray(res.data) ? (res.data as any[]) : [];

        const filtered = contacts.filter((c) => {
          try {
            // support multiple possible company/title keys
            const companyFields = [c.company, c.employer, c.organization, c.company_name];
            const roleFields = [c.role, c.title, c.job_title];

            const matchesCompany = companyName
              ? companyFields.some((f) => f && fuzzyMatch(String(f), String(companyName)))
              : false;

            const matchesRole = jobTitle
              ? roleFields.some((f) => f && fuzzyMatch(String(f), String(jobTitle)))
              : false;

            return matchesCompany || matchesRole;
          } catch (e) {
            return false;
          }
        });

        // Sort by relationship_strength descending (treat missing as 0)
        filtered.sort((a, b) => (Number(b.relationship_strength) || 0) - (Number(a.relationship_strength) || 0));

        if (!cancelled) {
          setRealPeople(filtered);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLocalContacts();

    return () => {
      cancelled = true;
    };
  }, [open, jobTitle, companyName, user, authLoading, refreshKey]);

  const openContact = (c: any) => {
    setSelectedContact(c);
    setContactDialogOpen(true);
  };

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function loadAiSuggestions() {
    if (!user) return;
    setError(null);
    setGenerating(true);
    try {
      const payload = { job_title: jobTitle ?? null, job_company: companyName ?? null, alumni_school: alumniSchool ?? null };
      const rawResp = await aiClient
        .postJson<unknown>("/api/generate/suggest-contacts", payload)
        .catch((e) => {
          console.error("AI suggest contacts error", e);
          return null;
        });

      if (!mountedRef.current) return;
      const resp = rawResp as any;
      // role-based suggestions
      if (resp?.roleSuggestions && Array.isArray(resp.roleSuggestions)) {
        const mapped: Suggestion[] = resp.roleSuggestions.map((s: any) => ({
          name: String(s.name ?? "").trim() || "",
          title: s.title ?? undefined,
          reason: s.reason ?? s.searchQuery ?? "",
          searchQuery: s.searchQuery ?? null,
          raw: s,
        }));
        savedResultsRef.current = mapped;
        setResults(mapped);
      } else {
        setResults([]);
      }

      // public leaders
      if (resp?.publicLeaders && Array.isArray(resp.publicLeaders)) {
        const mappedLeaders: Leader[] = resp.publicLeaders.map((l: any) => ({
          name: String(l.name ?? "").trim() || "",
          role: l.role ?? l.title ?? undefined,
          company: l.company ?? undefined,
          reason: l.reason ?? undefined,
          referenceUrl: l.referenceUrl ?? l.searchQuery ?? null,
          searchQuery: l.searchQuery ?? null,
          raw: l,
        }));
        setLeaders(mappedLeaders);
      } else {
        setLeaders([]);
      }
    } catch (e: any) {
      if (mountedRef.current) setError(e?.message ?? String(e));
    } finally {
      if (mountedRef.current) setGenerating(false);
    }
  }

  async function createContactFromLeader(l: Leader) {
    if (!user) {
      setError("Please sign in to create contacts");
      return;
    }
    const full = String(l.name ?? "").trim();
    const parts = full.split(/\s+/);
    const first = parts.shift() ?? "";
    const last = parts.join(" ") ?? "";
    const payload: Record<string, unknown> = {
      first_name: first || null,
      last_name: last || null,
      role: l.role ?? null,
      company: l.company ?? companyName ?? null,
      notes: [l.reason, l.referenceUrl].filter(Boolean).join("\n") || null,
    };
    try {
      setLoading(true);
      const res = await db.createContact(user.id, payload);
      if (res?.error) {
        setError(res.error?.message ?? "Failed to create contact");
        return;
      }
      setSelectedContact(res.data);
      setContactDialogOpen(true);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  async function createNewContact() {
    if (!user) {
      setError("Please sign in to create contacts");
      return;
    }
    const full = window.prompt("Enter full name for new contact (First Last):");
    if (!full) return;
    const parts = String(full).trim().split(/\s+/);
    const first = parts.shift() ?? "";
    const last = parts.join(" ") ?? "";
    const payload: Record<string, unknown> = {
      first_name: first || null,
      last_name: last || null,
      company: companyName ?? null,
      role: jobTitle ?? null,
    };
    try {
      setLoading(true);
      const res = await db.createContact(user.id, payload);
      if (res?.error) {
        setError(res.error?.message ?? "Failed to create contact");
        return;
      }
      const created = res.data;
      setSelectedContact(created);
      setContactDialogOpen(true);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  // Clear saved results when the dialog fully closes
  useEffect(() => {
    if (!open) {
      savedResultsRef.current = null;
      setResults([]);
    }
  }, [open]);

  const closeContact = () => {
    setContactDialogOpen(false);
    setSelectedContact(null);
  };

  async function handleUpdateContact(payload: Record<string, unknown>) {
    if (!user || !selectedContact?.id) return;
    try {
      await db.updateContact(user.id, String(selectedContact.id), payload);
      setRefreshKey((k) => k + 1);
      // keep dialog open and refresh data in parent
    } catch (err) {
      console.error("Failed to update contact", err);
    }
  }

  async function handleDeleteContact(id?: string) {
    if (!user || !id) return;
    try {
      await db.deleteContact(user.id, id);
      setRefreshKey((k) => k + 1);
      closeContact();
    } catch (err) {
      console.error("Failed to delete contact", err);
    }
  }

  function copyText(text: string) {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(text);
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <PersonIcon />
        Suggested Contacts
        <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
  
          <Button
            size="small"
            variant="contained"
            onClick={() => loadAiSuggestions()}
            disabled={generating}
          >
            {generating ? <CircularProgress size={16} color="inherit" /> : "Generate Recommended Contacts"}
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Suggested contacts based off of job and company, sorted by relationship strength. 
          </Typography>
          <Typography sx={{ mt: 1 }}>
            <strong>Job:</strong> {jobTitle ?? "—"}
          </Typography>
          <Typography>
            <strong>Company:</strong> {companyName ?? "—"}
          </Typography>
        </Box>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Typography color="error" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}

        {!loading && realPeople.length === 0 && results.length === 0 && !error && (
          <Typography color="text.secondary">No suggestions yet.</Typography>
        )}

        {realPeople.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Found People
            </Typography>
            <Box>
              {realPeople.map((p, i) => (
                <Box key={`person-${i}`}>
                  <ContactsListItem contact={p} onEdit={(c) => openContact(c)} />
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {leaders.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Company Leaders
            </Typography>
            <List>
              {leaders.map((l: Leader, i) => (
                <ListItem key={`leader-${i}`} divider>
                  <ListItemText
                    primary={`${l.name}${l.role ? ` — ${l.role}` : ""}`}
                    secondary={l.company || l.reason}
                    sx={{ mr: 12, overflowWrap: 'anywhere' }}
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: 0.5 }}>
                      {l.referenceUrl ? (
                        <Tooltip key="ref" title="Open reference">
                          <IconButton size="small" onClick={() => window.open(String(l.referenceUrl), "_blank")}>
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null}

                      {l.searchQuery ? (
                        <Tooltip key="search" title="Open search">
                          <IconButton size="small" onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(l.searchQuery ?? "")}`, "_blank")}>
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null}

                      <Tooltip key="copy" title="Copy">
                        <IconButton size="small" onClick={() => copyText(`${l.name}${l.role ? ` — ${l.role}` : ""}${l.referenceUrl ? ` \n${l.referenceUrl}` : ""}`)}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip key="add" title="Add to contacts">
                        <IconButton size="small" onClick={() => createContactFromLeader(l)}>
                          <PersonIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {results.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              AI Recommendations
            </Typography>
            <List>
              {results.map((r: Suggestion, i) => (
                <ListItem key={`rec-${i}`} divider>
                  <ListItemText
                    primary={`${r.name}${r.title ? ` — ${r.title}` : ""}`}
                    secondary={r.reason}
                    sx={{ mr: 12, overflowWrap: 'anywhere' }}
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: 0.5 }}>
                      {r.searchQuery ? (
                        <Tooltip key="search" title="Open search">
                          <IconButton size="small" onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(r.searchQuery ?? "")}`, "_blank")}>
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null}

                      <Tooltip key="copy" title="Copy">
                        <IconButton size="small" onClick={() => copyText(`${r.name}${r.title ? ` — ${r.title}` : ""}`)}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" size="small">
          Close
        </Button>
      </DialogActions>
      {selectedContact && (
        <ContactDetailsDialog
          open={contactDialogOpen}
          contact={selectedContact}
          onClose={() => closeContact()}
          onUpdate={async (payload: Record<string, unknown>) => await handleUpdateContact(payload)}
          onDelete={async (id?: string) => await handleDeleteContact(id)}
          onRefresh={() => setRefreshKey((k) => k + 1)}
          initialSelectedJob={job ?? undefined}
          initialTabKey={job ? "request" : undefined}
        />
      )}
    </Dialog>
  );
}
