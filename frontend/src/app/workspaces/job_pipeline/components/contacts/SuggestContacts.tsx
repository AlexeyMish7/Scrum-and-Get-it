import React, { useEffect, useState } from "react";
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
  Link,
  Tooltip,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useAuth } from "@shared/context/AuthContext";
import * as db from "@shared/services/dbMappers";
import ContactsListItem from "@workspaces/network_hub/components/ContactsList/ContactsListItem";
import ContactDetailsDialog from "@workspaces/network_hub/components/ContactDetails/ContactDetailsDialog";

type Suggestion = {
  name: string;
  title?: string;
  reason?: string;
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
  const [realPeople, setRealPeople] = useState<any[]>([]);
  const { user, loading: authLoading } = useAuth();
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
      setResults([]);
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
        <PersonAddIcon />
        Suggest Contacts
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

        {results.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              AI Recommendations
            </Typography>
            <List>
              {results.map((r: any, i) => (
                <ListItem key={`rec-${i}`} divider>
                  <ListItemText primary={r.label} secondary={r.secondary} />
                  <ListItemSecondaryAction>
                    {r.searchQuery ? (
                      <Tooltip title="Open search">
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() =>
                            window.open(
                              `https://www.google.com/search?q=${encodeURIComponent(
                                r.searchQuery
                              )}`,
                              "_blank"
                            )
                          }
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                    <Tooltip title="Copy">
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => copyText(`${r.label}`)}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
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
