import React, { useState, useMemo } from "react";
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
  IconButton,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VerifiedIcon from "@mui/icons-material/Verified";
import PendingIcon from "@mui/icons-material/HourglassEmpty";
import SearchIcon from "@mui/icons-material/Search";
import dayjs from "dayjs";

type Certification = {
  id: string;
  name: string;
  organization: string;
  category: string;
  dateEarned: string;
  expirationDate?: string;
  doesNotExpire: boolean;
  certId?: string;
  file?: File;
  verified: boolean;
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
    verified: false,
  });

  // Filtered by organization search
  const filteredCerts = useMemo(() => {
    if (!search) return certifications;
    return certifications.filter((c) =>
      c.organization.toLowerCase().includes(search.toLowerCase())
    );
  }, [certifications, search]);

  const handleAddCert = () => {
    if (!newCert.name || !newCert.organization || !newCert.dateEarned) return;
    setCertifications([
      ...certifications,
      { ...newCert, id: Date.now().toString(), verified: false },
    ]);
    setNewCert({
      id: "",
      name: "",
      organization: "",
      category: "",
      dateEarned: "",
      expirationDate: "",
      doesNotExpire: false,
      certId: "",
      verified: false,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setNewCert({ ...newCert, file });
  };

  const handleVerify = (id: string) => {
    setCertifications((prev) =>
      prev.map((c) => (c.id === id ? { ...c, verified: true } : c))
    );
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
                      expirationDate: e.target.checked ? "" : newCert.expirationDate,
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
              onChange={(e) => setNewCert({ ...newCert, certId: e.target.value })}
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
                  cert.verified ? "#2e7d32" : expiringSoon ? "#ed6c02" : "#1976d2"
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
                  {cert.verified ? (
                    <Chip
                      label="Verified"
                      color="success"
                      size="small"
                      icon={<VerifiedIcon />}
                    />
                  ) : (
                    <Chip
                      label="Pending Verification"
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
                {cert.file && (
                  <Typography variant="caption" display="block">
                    📎 File: {cert.file.name}
                  </Typography>
                )}
                {!cert.verified && (
                  <Button
                    size="small"
                    onClick={() => handleVerify(cert.id)}
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