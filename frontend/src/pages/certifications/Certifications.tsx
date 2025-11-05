import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Chip,
  Divider,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VerifiedIcon from "@mui/icons-material/Verified";
import PendingIcon from "@mui/icons-material/HourglassEmpty";
import SearchIcon from "@mui/icons-material/Search";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import dayjs from "dayjs";
import "./Certifications.css";
import { useAuth } from "../../app/shared/context/AuthContext";
import certificationsService from "../../app/workspaces/profile/services/certifications";
import type {
  Certification as CertificationType,
  CertificationRow,
  NewCert,
} from "../../types/certification";
import { useErrorHandler } from "../../app/shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "../../app/shared/components/common/ErrorSnackbar";
import LoadingSpinner from "../../app/shared/components/common/LoadingSpinner";
import ConfirmDialog from "../../app/shared/components/common/ConfirmDialog";

/* NewCert type moved to `src/types/certification.ts` for reuse and clarity */

const categories = [
  "Cloud & DevOps",
  "Cybersecurity",
  "Software Engineering",
  "Data & AI",
  "Project Management",
];

const organizations = [
  "AWS",
  "Google Cloud",
  "Microsoft",
  "CompTIA",
  "PMI",
  "Coursera",
  "edX",
  "LinkedIn Learning",
];

// Certifications page — list, add, edit and delete user certifications.
// Uses the centralized `certificationsService` for DB and storage operations
// and `useErrorHandler` for consistent error/success messaging.
const Certifications: React.FC = () => {
  // Local state for the certifications list and UI flags
  const [certifications, setCertifications] = useState<CertificationType[]>([]);
  const [isLoading, setIsLoading] = useState(true); // loading while fetching data
  const [search, setSearch] = useState(""); // simple organization search filter
  const [newCert, setNewCert] = useState<NewCert>({
    name: "",
    organization: "",
    category: "",
    dateEarned: "",
    expirationDate: undefined,
    doesNotExpire: false,
    certId: "",
    file: null,
  });

  const { handleError, notification, closeNotification, showSuccess } =
    useErrorHandler();

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<NewCert>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Filtered by organization search
  const filteredCerts = useMemo(() => {
    if (!search) return certifications;
    return certifications.filter((c) =>
      c.organization.toLowerCase().includes(search.toLowerCase())
    );
  }, [certifications, search]);

  const { user, loading } = useAuth();

  // Load certifications for the signed-in user. Resolves signed URLs for attached files.
  useEffect(() => {
    let mounted = true;
    if (loading) {
      setIsLoading(true);
      return;
    }
    if (!user) {
      setCertifications([]);
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      try {
        const res = await certificationsService.listCertifications(user.id);
        if (!mounted) return;
        if (res.error) {
          throw res.error;
        }
        const rows = Array.isArray(res.data)
          ? res.data
          : res.data
          ? [res.data]
          : [];
        // Convert DB rows to the UI-friendly Certification type then
        // attempt to resolve any stored file paths into signed URLs.
        const mapped = rows.map(certificationsService.mapRowToCertification);
        // Resolve media URLs in parallel (fastest practical approach)
        await Promise.all(
          mapped.map(async (m) => {
            if (m.media_path)
              m.mediaUrl = await certificationsService.resolveMediaUrl(
                m.media_path
              );
          })
        );
        setCertifications(mapped);
      } catch (err) {
        handleError(err, "Failed to load certifications");
        setCertifications([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [user, loading, handleError]);

  if (loading || isLoading) return <LoadingSpinner />;

  // Handler for saving a new certification. Validates required fields,
  // uploads an attached file (if provided) and inserts the DB row.
  const handleAddCert = async () => {
    if (loading) return;
    if (!user)
      return handleError(new Error("Please sign in to add a certification"));
    if (!newCert.name || !newCert.organization || !newCert.dateEarned)
      return handleError(
        new Error(
          "Please fill required fields (name, organization, date earned)"
        )
      );

    try {
      const payload: Record<string, unknown> = {
        name: newCert.name,
        issuing_org: newCert.organization,
        category: newCert.category || null,
        date_earned: newCert.dateEarned,
        expiration_date: newCert.doesNotExpire
          ? null
          : newCert.expirationDate || null,
        does_not_expire: Boolean(newCert.doesNotExpire),
        cert_id: newCert.certId || null,
        verification_status: "unverified",
      };

      // Service returns the created row and (optionally) created document metadata
      const res = await certificationsService.insertCertification(
        user.id,
        payload,
        newCert.file ?? null
      );
      if (res.error) throw res.error;

      const createdRow = res.data as CertificationRow;
      // Map the created DB row to the UI model and resolve the media URL
      const created = certificationsService.mapRowToCertification(createdRow);
      if (created.media_path)
        created.mediaUrl = await certificationsService.resolveMediaUrl(
          created.media_path
        );

      setCertifications((prev) => [created, ...prev]);
      setNewCert({
        name: "",
        organization: "",
        category: "",
        dateEarned: "",
        doesNotExpire: false,
        certId: "",
        file: null,
      });
      window.dispatchEvent(new Event("certifications:changed"));
      const typedRes = res as {
        data: CertificationRow | null;
        error: unknown | null;
        document?: Record<string, unknown> | null;
      };
      const createdDoc = typedRes.document;
      // Give the user a helpful success message based on what was persisted
      if (createdDoc) {
        showSuccess("Certification added and file saved");
      } else if (created.media_path) {
        // file uploaded but documents row not created
        showSuccess("Certification added (file uploaded)");
      } else {
        showSuccess("Certification added");
      }
    } catch (err) {
      handleError(err, "Failed to add certification");
    }
  };

  // Simple file picker handler for the Add dialog
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setNewCert({ ...newCert, file });
  };

  const closeAdd = () => {
    setAddOpen(false);
    setNewCert({
      name: "",
      organization: "",
      category: "",
      dateEarned: "",
      expirationDate: undefined,
      doesNotExpire: false,
      certId: "",
      file: null,
    });
  };

  // Populate the Edit dialog with the certification's current values
  const startEdit = (c: CertificationType) => {
    setEditingCertId(c.id);
    setEditForm({
      name: c.name,
      organization: c.organization,
      category: c.category,
      dateEarned: c.dateEarned,
      expirationDate: c.expirationDate ?? undefined,
      doesNotExpire: c.doesNotExpire ?? false,
      certId: c.certId ?? "",
    });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditForm({});
    setEditingCertId(null);
  };

  // Save changes made in the Edit dialog (metadata only).
  // File replacement is intentionally not supported here yet.
  const handleSaveEdit = async () => {
    if (loading) return;
    if (!user)
      return handleError(new Error("Please sign in to edit a certification"));
    if (!editingCertId) return;
    if (!editForm.name || !editForm.organization || !editForm.dateEarned)
      return handleError(
        new Error(
          "Please fill required fields (name, organization, date earned)"
        )
      );

    try {
      const payload: Record<string, unknown> = {
        name: editForm.name,
        issuing_org: editForm.organization,
        category: editForm.category || null,
        date_earned: editForm.dateEarned,
        expiration_date: editForm.doesNotExpire
          ? null
          : editForm.expirationDate || null,
        does_not_expire: Boolean(editForm.doesNotExpire),
        cert_id: editForm.certId || null,
      };

      // Send updated fields to the service and optimistically update UI on success
      const res = await certificationsService.updateCertification(
        user.id,
        editingCertId,
        payload
      );
      if (res.error) throw res.error;

      // optimistic update local list so the UI reflects changes immediately
      setCertifications((prev) =>
        prev.map((c) =>
          c.id === editingCertId
            ? {
                ...c,
                ...({
                  name: String(payload.name),
                  organization: String(payload.issuing_org),
                  category: (payload.category as string | null) ?? c.category,
                  dateEarned: (payload.date_earned as string) ?? c.dateEarned,
                  expirationDate:
                    (payload.expiration_date as string | null) ??
                    c.expirationDate,
                  doesNotExpire: Boolean(payload.does_not_expire),
                  certId: (payload.cert_id as string | null) ?? c.certId,
                } as Partial<CertificationType>),
              }
            : c
        )
      );

      // Close dialog and notify other parts of the app if needed
      closeEdit();
      window.dispatchEvent(new Event("certifications:changed"));
      showSuccess("Certification updated");
    } catch (err) {
      handleError(err, "Failed to update certification");
    }
  };

  // Delete the certification and any associated storage/documents.
  // Uses the service which attempts to clean up storage objects.
  const handleDeleteCertification = async () => {
    if (loading) return;
    if (!user)
      return handleError(new Error("Please sign in to delete a certification"));
    if (!editingCertId) return;

    try {
      const res = await certificationsService.deleteCertification(
        user.id,
        editingCertId
      );
      if (res.error) throw res.error;
      // remove from local state so the list updates immediately
      setCertifications((prev) => prev.filter((c) => c.id !== editingCertId));
      closeEdit();
      setConfirmDeleteOpen(false);
      window.dispatchEvent(new Event("certifications:changed"));
      showSuccess("Certification deleted");
    } catch (err) {
      handleError(err, "Failed to delete certification");
    }
  };

  // Mark a certification as verified
  const handleVerify = async (id: string) => {
    if (loading) return;
    if (!user) return handleError(new Error("Please sign in to verify"));
    try {
      const res = await certificationsService.updateCertification(user.id, id, {
        verification_status: "verified",
      });
      if (res.error) throw res.error;
      // optimistic local update — keep UI snappy
      setCertifications((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, verification_status: "verified" } : c
        )
      );
      window.dispatchEvent(new Event("certifications:changed"));
      showSuccess("Certification marked verified");
    } catch (err) {
      handleError(err, "Failed to verify certification");
    }
  };

  // No inline preview. Users can open the file in a new tab.

  const today = dayjs();

  const isExpiringSoon = (date?: string) =>
    date ? dayjs(date).diff(today, "day") <= 30 : false;

  return (
    <Box className="cert-page">
      <Typography variant="h2" className="page-title">
        Manage Your Certifications
      </Typography>

      {/* Add New Certification (opens dialog) */}
      <Card className="add-card">
        <CardHeader title="Add Certification" />
        <Divider />
        <CardContent className="add-card-content">
          <Button
            className="glossy-btn primary-btn"
            onClick={() => setAddOpen(true)}
            startIcon={<CloudUploadIcon />}
          >
            Add Certification
          </Button>
        </CardContent>
      </Card>

      {/* Add dialog */}
      <Dialog open={addOpen} onClose={closeAdd} fullWidth maxWidth="sm">
        <DialogTitle>Add Certification</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              required
              label="Certification Name"
              fullWidth
              value={newCert.name}
              onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
            />

            <TextField
              required
              label="Issuing Organization"
              fullWidth
              select
              value={newCert.organization}
              onChange={(e) =>
                setNewCert({ ...newCert, organization: e.target.value })
              }
            >
              {organizations.map((org) => (
                <MenuItem key={org} value={org}>
                  {org}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Category"
              select
              fullWidth
              value={newCert.category}
              onChange={(e) =>
                setNewCert({ ...newCert, category: e.target.value })
              }
            >
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                required
                label="Date Earned"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newCert.dateEarned}
                onChange={(e) =>
                  setNewCert({ ...newCert, dateEarned: e.target.value })
                }
              />
              {!newCert.doesNotExpire && (
                <TextField
                  label="Expiration Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={newCert.expirationDate}
                  onChange={(e) =>
                    setNewCert({ ...newCert, expirationDate: e.target.value })
                  }
                />
              )}
            </Stack>

            <FormControlLabel
              control={
                <Checkbox
                  checked={newCert.doesNotExpire}
                  onChange={(e) =>
                    setNewCert({
                      ...newCert,
                      doesNotExpire: e.target.checked,
                      expirationDate: e.target.checked
                        ? ""
                        : newCert.expirationDate,
                    })
                  }
                />
              }
              label="Does not expire"
            />

            <TextField
              label="Certification Number / ID"
              fullWidth
              value={newCert.certId}
              onChange={(e) =>
                setNewCert({ ...newCert, certId: e.target.value })
              }
            />

            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
            >
              Upload Certification
              <input type="file" hidden onChange={handleFileUpload} />
            </Button>
            {newCert.file && (
              <Typography variant="body2" color="text.secondary">
                Uploaded: {newCert.file.name}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAdd}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              await handleAddCert();
              closeAdd();
            }}
            disabled={
              !newCert.name || !newCert.organization || !newCert.dateEarned
            }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="sm">
        <DialogTitle>Edit Certification</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              required
              label="Certification Name"
              fullWidth
              value={editForm.name ?? ""}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
            />

            <TextField
              required
              label="Issuing Organization"
              fullWidth
              select
              value={editForm.organization ?? ""}
              onChange={(e) =>
                setEditForm({ ...editForm, organization: e.target.value })
              }
            >
              {organizations.map((org) => (
                <MenuItem key={org} value={org}>
                  {org}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Category"
              select
              fullWidth
              value={editForm.category ?? ""}
              onChange={(e) =>
                setEditForm({ ...editForm, category: e.target.value })
              }
            >
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                required
                label="Date Earned"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={editForm.dateEarned ?? ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, dateEarned: e.target.value })
                }
              />
              {!editForm.doesNotExpire && (
                <TextField
                  label="Expiration Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={editForm.expirationDate ?? ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, expirationDate: e.target.value })
                  }
                />
              )}
            </Stack>

            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(editForm.doesNotExpire)}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      doesNotExpire: e.target.checked,
                      expirationDate: e.target.checked
                        ? ""
                        : editForm.expirationDate,
                    })
                  }
                />
              }
              label="Does not expire"
            />

            <TextField
              label="Certification Number / ID"
              fullWidth
              value={editForm.certId ?? ""}
              onChange={(e) =>
                setEditForm({ ...editForm, certId: e.target.value })
              }
            />

            {/* File replacement is currently not supported in edit — keep as informational */}
            {editingCertId &&
              certifications.find((c) => c.id === editingCertId)
                ?.media_path && (
                <Typography variant="caption">
                  Existing file attached
                </Typography>
              )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            color="error"
            variant="outlined"
            onClick={() => setConfirmDeleteOpen(true)}
          >
            Delete
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={closeEdit}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              await handleSaveEdit();
            }}
            disabled={
              !editForm.name || !editForm.organization || !editForm.dateEarned
            }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete certification"
        description="Delete this certification and its files? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => void handleDeleteCertification()}
      />

      {/* Search bar */}
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        className="search-row"
      >
        <TextField
          placeholder="Search certifications by organization..."
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Stack>

      {/* Certification list */}
      <Stack spacing={2}>
        {filteredCerts.map((cert) => {
          const expiringSoon = isExpiringSoon(cert.expirationDate);
          return (
            <Card
              key={cert.id}
              className={`cert-card ${
                cert.verification_status === "verified"
                  ? "verified"
                  : expiringSoon
                  ? "expiring"
                  : "default"
              }`}
            >
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  {/* no thumbnail preview here - users can open the file from actions */}
                  <Box sx={{ flex: 1 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="h6">{cert.name}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {cert.verification_status === "verified" ? (
                          <Chip
                            label="Verified"
                            color="success"
                            size="small"
                            icon={<VerifiedIcon />}
                          />
                        ) : (
                          <Chip
                            label={
                              cert.verification_status === "pending"
                                ? "Pending Verification"
                                : "Unverified"
                            }
                            color="warning"
                            size="small"
                            icon={<PendingIcon />}
                          />
                        )}
                        <Button size="small" onClick={() => startEdit(cert)}>
                          Edit
                        </Button>
                        {cert.media_path && (
                          <Button
                            size="small"
                            className="glossy-btn"
                            startIcon={<OpenInNewIcon />}
                            onClick={async () => {
                              try {
                                // Use resolved URL if available, otherwise attempt to resolve on demand
                                let url = cert.mediaUrl;
                                if (!url && cert.media_path) {
                                  url =
                                    await certificationsService.resolveMediaUrl(
                                      cert.media_path
                                    );
                                }
                                if (!url)
                                  throw new Error("Unable to resolve file URL");
                                // open in new tab safely
                                window.open(
                                  url,
                                  "_blank",
                                  "noopener,noreferrer"
                                );
                              } catch (err) {
                                handleError(
                                  err,
                                  "Failed to open certificate file"
                                );
                              }
                            }}
                            aria-label={`Open ${cert.name} in a new tab`}
                          >
                            Open
                          </Button>
                        )}
                      </Stack>
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      {cert.organization} — {cert.category}
                    </Typography>
                    <Typography variant="body2">
                      Earned: {cert.dateEarned}
                      {!cert.doesNotExpire &&
                        ` | Expires: ${cert.expirationDate || "N/A"}`}
                    </Typography>
                    {expiringSoon && !cert.doesNotExpire && (
                      <Typography
                        color="error"
                        variant="body2"
                        className="expiring-text"
                      >
                        Warning: This certification expires soon!
                      </Typography>
                    )}
                    {cert.certId && (
                      <Typography variant="caption" color="text.secondary">
                        ID: {cert.certId}
                      </Typography>
                    )}
                    {cert.media_path && (
                      <Typography variant="caption" display="block">
                        📎 File stored at: {cert.media_path}
                      </Typography>
                    )}
                    {cert.verification_status !== "verified" && (
                      <Button
                        className="verify-btn"
                        size="small"
                        onClick={() => void handleVerify(cert.id)}
                      >
                        Mark as Verified
                      </Button>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
        {filteredCerts.length === 0 && (
          <Typography color="text.secondary" textAlign="center">
            No certifications found.
          </Typography>
        )}
      </Stack>
      <ErrorSnackbar notification={notification} onClose={closeNotification} />
    </Box>
  );
};

export default Certifications;
