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
  Divider,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SearchIcon from "@mui/icons-material/Search";
import dayjs from "dayjs";
import { useAuth } from "@shared/context/AuthContext";
import { useProfileChange } from "@shared/context";
import { useUnifiedCacheUtils } from "@profile/cache";
import { AutoBreadcrumbs } from "@shared/components/navigation/AutoBreadcrumbs";
import certificationsService from "../../services/certifications";
import type {
  Certification as CertificationType,
  CertificationRow,
  NewCert,
} from "../../types/certification";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "@shared/components/feedback/ErrorSnackbar";
import LoadingSpinner from "@shared/components/feedback/LoadingSpinner";
import { useConfirmDialog } from "@shared/hooks/useConfirmDialog";
import { useCertificationsList } from "@profile/cache";

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
// Uses React Query via useCertificationsList hook for cached data fetching
// and `useErrorHandler` for consistent error/success messaging.
const Certifications: React.FC = () => {
  // Use React Query hook for cached certifications data
  const { data: certificationsData, isLoading: queryLoading } =
    useCertificationsList();

  // Local state for certifications (allows optimistic updates)
  const [certifications, setCertifications] = useState<CertificationType[]>([]);
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

  const {
    handleError,
    notification,
    closeNotification,
    showSuccess,
    showWarning,
  } = useErrorHandler();
  const { markProfileChanged } = useProfileChange();
  const { confirm } = useConfirmDialog();

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<NewCert>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [addShowErrors, setAddShowErrors] = useState(false);
  const [editShowErrors, setEditShowErrors] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const { invalidateAll } = useUnifiedCacheUtils();

  // Update local state when query data changes
  useEffect(() => {
    if (certificationsData) {
      setCertifications(certificationsData);
    }
  }, [certificationsData]);

  // Filtered by organization search
  const filteredCerts = useMemo(() => {
    if (!search) return certifications;
    return certifications.filter((c) =>
      c.organization.toLowerCase().includes(search.toLowerCase())
    );
  }, [certifications, search]);

  if (authLoading || queryLoading) return <LoadingSpinner />;

  // Handler for saving a new certification. Validates required fields,
  // uploads an attached file (if provided) and inserts the DB row.
  const handleAddCert = async (): Promise<boolean> => {
    if (addSubmitting || authLoading) return false;

    setAddShowErrors(true);

    const trimmedName = newCert.name.trim();
    const trimmedOrg = newCert.organization.trim();
    const trimmedDate = newCert.dateEarned.trim();
    const trimmedCertId = (newCert.certId || "").trim();

    if (!user) {
      showWarning("Please sign in to add a certification");
      return false;
    }

    if (!trimmedName || !trimmedOrg || !trimmedDate) {
      showWarning(
        "Please fill required fields (name, organization, date earned)"
      );
      return false;
    }

    setAddSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        name: trimmedName,
        issuing_org: trimmedOrg,
        category: newCert.category || null,
        date_earned: trimmedDate,
        expiration_date: newCert.doesNotExpire
          ? null
          : newCert.expirationDate || null,
        does_not_expire: Boolean(newCert.doesNotExpire),
        certification_id: trimmedCertId || null,
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

      // Optimistic update then invalidate cache
      setCertifications((prev) => [created, ...prev]);

      // Invalidate unified cache so all components get fresh data
      await invalidateAll();

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
      setAddShowErrors(false);
      window.dispatchEvent(new Event("certifications:changed"));
      markProfileChanged(); // Invalidate analytics cache
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

      return true;
    } catch (err) {
      handleError(err, "Failed to add certification");
      return false;
    } finally {
      setAddSubmitting(false);
    }
  };

  // Simple file picker handler for the Add dialog
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setNewCert({ ...newCert, file });
  };

  const closeAdd = () => {
    setAddOpen(false);
    setAddShowErrors(false);
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
    setEditShowErrors(false);
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
    setEditShowErrors(false);
    setEditForm({});
    setEditingCertId(null);
  };

  // Save changes made in the Edit dialog (metadata only).
  // File replacement is intentionally not supported here yet.
  const handleSaveEdit = async (): Promise<boolean> => {
    if (editSubmitting) return false;
    setEditShowErrors(true);
    if (!user) {
      showWarning("Please sign in to edit a certification");
      return false;
    }
    if (!editingCertId) return false;

    const trimmedName = (editForm.name ?? "").trim();
    const trimmedOrg = (editForm.organization ?? "").trim();
    const trimmedDate = (editForm.dateEarned ?? "").trim();
    const trimmedCertId = (editForm.certId ?? "").trim();

    if (!trimmedName || !trimmedOrg || !trimmedDate) {
      showWarning(
        "Please fill required fields (name, organization, date earned)"
      );
      return false;
    }

    setEditSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        name: trimmedName,
        issuing_org: trimmedOrg,
        category: editForm.category || null,
        date_earned: trimmedDate,
        expiration_date: editForm.doesNotExpire
          ? null
          : editForm.expirationDate || null,
        does_not_expire: Boolean(editForm.doesNotExpire),
        certification_id: trimmedCertId || null,
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
                  certId:
                    (payload.certification_id as string | null) ?? c.certId,
                } as Partial<CertificationType>),
              }
            : c
        )
      );

      // Invalidate unified cache so all components get fresh data
      await invalidateAll();

      // Close dialog and notify other parts of the app if needed
      setEditShowErrors(false);
      closeEdit();
      window.dispatchEvent(new Event("certifications:changed"));
      markProfileChanged(); // Invalidate analytics cache
      showSuccess("Certification updated");

      return true;
    } catch (err) {
      handleError(err, "Failed to update certification");
      return false;
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete the certification and any associated storage/documents.
  // Uses the service which attempts to clean up storage objects.
  const handleDeleteCertification = async () => {
    if (editSubmitting) return;
    if (!user) {
      showWarning("Please sign in to delete a certification");
      return;
    }
    if (!editingCertId) return;

    const confirmed = await confirm({
      title: "Delete certification",
      message:
        "Delete this certification and its files? This cannot be undone.",
      confirmText: "Delete",
      confirmColor: "error",
    });

    if (!confirmed) return;

    setEditSubmitting(true);

    try {
      const res = await certificationsService.deleteCertification(
        user.id,
        editingCertId
      );
      if (res.error) throw res.error;
      // remove from local state so the list updates immediately
      setCertifications((prev) => prev.filter((c) => c.id !== editingCertId));

      // Invalidate unified cache so all components get fresh data
      await invalidateAll();

      closeEdit();
      window.dispatchEvent(new Event("certifications:changed"));
      markProfileChanged(); // Invalidate analytics cache
      showSuccess("Certification deleted");
    } catch (err) {
      handleError(err, "Failed to delete certification");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Mark a certification as verified
  const handleVerify = async (id: string) => {
    if (verifyingId === id) return;
    if (!user) {
      showWarning("Please sign in to verify");
      return;
    }

    setVerifyingId(id);

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

      // Invalidate unified cache so all components get fresh data
      await invalidateAll();

      window.dispatchEvent(new Event("certifications:changed"));
      showSuccess("Certification marked verified");
    } catch (err) {
      handleError(err, "Failed to verify certification");
    } finally {
      setVerifyingId(null);
    }
  };

  // No inline preview. Users can open the file in a new tab.

  const today = dayjs();

  const isExpiringSoon = (date?: string) =>
    date ? dayjs(date).diff(today, "day") <= 30 : false;

  const addNameError = addShowErrors && !newCert.name.trim();
  const addOrgError = addShowErrors && !newCert.organization.trim();
  const addDateError = addShowErrors && !newCert.dateEarned.trim();

  const editNameError = editShowErrors && !editForm.name?.trim();
  const editOrgError = editShowErrors && !editForm.organization?.trim();
  const editDateError = editShowErrors && !editForm.dateEarned?.trim();

  return (
    <Box sx={{ width: "100%", p: 3, pt: 2 }}>
      <AutoBreadcrumbs />
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Manage Your Certifications
        </Typography>

        {/* Add New Certification (opens dialog) */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardHeader title="Add Certification" />
          <Divider />
          <CardContent sx={{ display: "flex", gap: 2 }}>
            <Button
              onClick={() => setAddOpen(true)}
              startIcon={<CloudUploadIcon />}
              variant="contained"
            >
              Add Certification
            </Button>
          </CardContent>
        </Card>

        {/* Add dialog */}
        <Dialog open={addOpen} onClose={closeAdd} fullWidth maxWidth="sm">
          <DialogTitle>Add Certification</DialogTitle>
          <DialogContent dividers sx={{ pt: 3 }}>
            <Stack spacing={2}>
              <TextField
                required
                label="Certification Name"
                fullWidth
                value={newCert.name}
                onChange={(e) =>
                  setNewCert({ ...newCert, name: e.target.value })
                }
                error={addNameError}
                helperText={
                  addNameError
                    ? "Certification name is required"
                    : "e.g., AWS Solutions Architect"
                }
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
                error={addOrgError}
                helperText={
                  addOrgError
                    ? "Issuing organization is required"
                    : "Select or type the provider"
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
                  error={addDateError}
                  helperText={addDateError ? "Date earned is required" : ""}
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
            <Button onClick={closeAdd} disabled={addSubmitting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={async () => {
                const saved = await handleAddCert();
                if (saved) closeAdd();
              }}
              disabled={
                addSubmitting ||
                !newCert.name ||
                !newCert.organization ||
                !newCert.dateEarned
              }
            >
              {addSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit dialog */}
        <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="sm">
          <DialogTitle>Edit Certification</DialogTitle>
          <DialogContent dividers sx={{ pt: 3 }}>
            <Stack spacing={2}>
              <TextField
                required
                label="Certification Name"
                fullWidth
                value={editForm.name ?? ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                error={editNameError}
                helperText={
                  editNameError
                    ? "Certification name is required"
                    : "e.g., Google Data Engineer"
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
                error={editOrgError}
                helperText={
                  editOrgError
                    ? "Issuing organization is required"
                    : "Select or type the provider"
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
                  error={editDateError}
                  helperText={editDateError ? "Date earned is required" : ""}
                />
                {!editForm.doesNotExpire && (
                  <TextField
                    label="Expiration Date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={editForm.expirationDate ?? ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        expirationDate: e.target.value,
                      })
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
              onClick={async () => {
                await handleDeleteCertification();
              }}
              disabled={editSubmitting}
            >
              Delete
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button onClick={closeEdit} disabled={editSubmitting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={async () => {
                await handleSaveEdit();
              }}
              disabled={
                editSubmitting ||
                !editForm.name ||
                !editForm.organization ||
                !editForm.dateEarned
              }
            >
              {editSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Search bar */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
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

        {/* Certification list (minimal interactive version) */}
        <Stack spacing={2}>
          <Typography variant="body1">
            You have {filteredCerts.length} certifications.
          </Typography>
          {filteredCerts.map((cert) => (
            <Card key={cert.id} variant="outlined">
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography variant="h6">{cert.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {cert.organization}
                    </Typography>
                    {isExpiringSoon(cert.expirationDate) && (
                      <Typography color="error" variant="body2">
                        Expires soon
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button size="small" onClick={() => startEdit(cert)}>
                      Edit
                    </Button>
                    {cert.verification_status !== "verified" && (
                      <Button
                        size="small"
                        onClick={() => void handleVerify(cert.id)}
                        variant="outlined"
                        disabled={verifyingId === cert.id || editSubmitting}
                      >
                        {verifyingId === cert.id
                          ? "Marking..."
                          : "Mark Verified"}
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
          {filteredCerts.length === 0 && (
            <Typography color="text.secondary" textAlign="center">
              No certifications found.
            </Typography>
          )}
        </Stack>
        <ErrorSnackbar
          notification={notification}
          onClose={closeNotification}
        />
      </Box>
    </Box>
  );
};

export default Certifications;
