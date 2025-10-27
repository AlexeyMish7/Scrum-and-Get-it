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
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VerifiedIcon from "@mui/icons-material/Verified";
import PendingIcon from "@mui/icons-material/HourglassEmpty";
import SearchIcon from "@mui/icons-material/Search";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";
import crud from "../services/crud";
import { supabase } from "../supabaseClient";

type Certification = {
  id: string;
  name: string;
  organization: string;
  category: string;
  dateEarned: string;
  expirationDate?: string;
  doesNotExpire: boolean;
  certId?: string;
  file?: File | null;
  media_path?: string | null;
  verification_status?: string | null; // maps to verification_status_enum
};

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

const Certifications: React.FC = () => {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [search, setSearch] = useState("");
  const [newCert, setNewCert] = useState<Certification>({
    id: "",
    name: "",
    organization: "",
    category: "",
    dateEarned: "",
    expirationDate: "",
    doesNotExpire: false,
    certId: "",
    file: null,
    media_path: null,
    verification_status: "unverified",
  });

  // Filtered by organization search
  const filteredCerts = useMemo(() => {
    if (!search) return certifications;
    return certifications.filter((c) =>
      c.organization.toLowerCase().includes(search.toLowerCase())
    );
  }, [certifications, search]);

  const { user, loading } = useAuth();

  useEffect(() => {
    let mounted = true;
    if (loading) return;
    if (!user) {
      setCertifications([]);
      return;
    }

    const load = async () => {
      try {
        const userCrud = crud.withUser(user.id);
        const res = await userCrud.listRows(
          "certifications",
          "id,name,issuing_org,category,date_earned,expiration_date,does_not_expire,cert_id,media_path,verification_status",
          { order: { column: "date_earned", ascending: false } }
        );
        if (!mounted) return;
        if (res.error) {
          console.error("Failed to load certifications:", res.error);
          setCertifications([]);
          return;
        }
        const rows = Array.isArray(res.data)
          ? res.data
          : res.data
          ? [res.data]
          : [];
        const mapped: Certification[] = (rows as Record<string, unknown>[]).map(
          (r) => ({
            id: (r["id"] as string) ?? "",
            name: (r["name"] as string) ?? "",
            organization: (r["issuing_org"] as string) ?? "",
            category: (r["category"] as string) ?? "",
            dateEarned: (r["date_earned"] as string) ?? "",
            expirationDate: (r["expiration_date"] as string) ?? "",
            doesNotExpire: Boolean(r["does_not_expire"] ?? false),
            certId: (r["cert_id"] as string) ?? "",
            media_path: (r["media_path"] as string) ?? null,
            verification_status: (r["verification_status"] as string) ?? null,
            file: null,
          })
        );
        setCertifications(mapped);
      } catch (err) {
        console.error("Error loading certifications", err);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [user, loading]);

  const handleAddCert = async () => {
    if (loading) return;
    if (!user) throw new Error("Please sign in to add a certification");
    if (!newCert.name || !newCert.organization || !newCert.dateEarned) return;

    const userCrud = crud.withUser(user.id);

    let mediaPath: string | null = null;
    try {
      if (newCert.file) {
        const file = newCert.file;
        const key = `${user.id}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("certifications")
          .upload(key, file);
        if (uploadError) {
          console.error("Certification file upload failed:", uploadError);
          throw uploadError;
        }
        mediaPath = uploadData.path;
      }

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
        media_path: mediaPath,
        verification_status: "unverified",
      };

      const res = await userCrud.insertRow("certifications", payload, "*");
      if (res.error) {
        console.error("Insert certification failed:", res.error);
        // cleanup uploaded file if any
        if (mediaPath) {
          try {
            await supabase.storage.from("certifications").remove([mediaPath]);
          } catch (cleanupErr) {
            console.warn(
              "Failed to cleanup uploaded certification file:",
              cleanupErr
            );
          }
        }
        throw new Error(res.error.message || "Failed to add certification");
      }

      const row = res.data as Record<string, unknown>;
      const created: Certification = {
        id: (row["id"] as string) ?? "",
        name: (row["name"] as string) ?? "",
        organization: (row["issuing_org"] as string) ?? newCert.organization,
        category: (row["category"] as string) ?? newCert.category,
        dateEarned: (row["date_earned"] as string) ?? newCert.dateEarned,
        expirationDate:
          (row["expiration_date"] as string) ?? newCert.expirationDate,
        doesNotExpire: Boolean(row["does_not_expire"] ?? false),
        certId: (row["cert_id"] as string) ?? newCert.certId,
        media_path: (row["media_path"] as string) ?? mediaPath,
        verification_status:
          (row["verification_status"] as string) ?? "unverified",
        file: null,
      };

      // Optionally create a documents row pointing to the uploaded file
      if (mediaPath && newCert.file) {
        try {
          const docPayload: Record<string, unknown> = {
            kind: "other",
            file_name: newCert.file.name,
            file_path: mediaPath,
            mime_type: newCert.file.type || null,
            bytes: newCert.file.size || null,
            meta: { source: "certification", certification_id: created.id },
          };
          const docRes = await userCrud.insertRow("documents", docPayload, "*");
          if (docRes.error) {
            console.warn(
              "Failed to create documents row for certification:",
              docRes.error
            );
          } else {
            window.dispatchEvent(new Event("documents:changed"));
          }
        } catch (docErr) {
          console.warn("Error creating documents row:", docErr);
        }
      }

      setCertifications((prev) => [created, ...prev]);
      // reset form
      setNewCert({
        id: "",
        name: "",
        organization: "",
        category: "",
        dateEarned: "",
        expirationDate: "",
        doesNotExpire: false,
        certId: "",
        file: null,
        media_path: null,
        verification_status: "unverified",
      } as Certification);

      window.dispatchEvent(new Event("certifications:changed"));
    } catch (err) {
      console.error("Failed to add certification", err);
      // For now keep UI feedback minimal; callers may show snackbar
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setNewCert({ ...newCert, file });
  };

  const handleVerify = async (id: string) => {
    if (loading) return;
    if (!user) throw new Error("Please sign in to verify");
    try {
      const userCrud = crud.withUser(user.id);
      const res = await userCrud.updateRow(
        "certifications",
        { verification_status: "verified" },
        { eq: { id } },
        "*"
      );
      if (res.error) {
        console.error("Failed to set certification verified:", res.error);
        return;
      }
      // update local state
      const updated = (res.data as Record<string, unknown>) ?? {};
      const newStatus =
        (updated["verification_status"] as string) ?? "verified";
      setCertifications((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, verification_status: newStatus } : c
        )
      );
      window.dispatchEvent(new Event("certifications:changed"));
    } catch (err) {
      console.error("Error verifying certification", err);
    }
  };

  const today = dayjs();

  const isExpiringSoon = (date?: string) =>
    date ? dayjs(date).diff(today, "day") <= 30 : false;

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>
        Manage Your Certifications
      </Typography>

      {/* Add New Certification Form */}
      <Card sx={{ mb: 4, boxShadow: 3 }}>
        <CardHeader title="Add Certification" />
        <Divider />
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="Certification Name"
              fullWidth
              value={newCert.name}
              onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
            />

            <TextField
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

            {/* certification files are always saved to documents */}

            <Button
              variant="contained"
              color="primary"
              onClick={handleAddCert}
              disabled={!newCert.name || !newCert.organization}
            >
              Add Certification
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Search bar */}
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
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
              sx={{
                boxShadow: 2,
                borderRadius: 2,
                borderLeft: `5px solid ${
                  cert.verification_status === "verified"
                    ? "#2e7d32"
                    : expiringSoon
                    ? "#ed6c02"
                    : "#1976d2"
                }`,
              }}
            >
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h6">{cert.name}</Typography>
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
                  <Typography color="error" variant="body2" mt={1}>
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
                    size="small"
                    onClick={() => void handleVerify(cert.id)}
                    sx={{ mt: 1 }}
                  >
                    Mark as Verified
                  </Button>
                )}
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
    </Box>
  );
};

export default Certifications;
