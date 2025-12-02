import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  MenuItem,
  Typography,
  Button,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import { useLocation } from "react-router-dom";
import ProfilePicture from "@shared/components/common/ProfilePicture";
import profileService from "../../services/profileService";
import GenerateProfileTips from "../../components/profile/GenerateProfileTips";
// Note: removed legacy ProfileDetails.css to rely on theme tokens and MUI sx props
import type { ProfileData } from "../../types/profile";
import { Breadcrumbs } from "@shared/components/navigation";

const industries = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Marketing",
  "Engineering",
  "Law",
  "Real Estate",
  "Manufacturing",
  "Consulting",
  "Retail",
  "Hospitality",
  "Government",
  "Nonprofit",
  "Other",
];

const experienceLevels = ["Entry", "Mid", "Senior", "Executive"];

const usStates = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

// ProfileDetails
// Responsible for rendering and editing a user's profile information.
// - Shows an editable form (Edit mode) and a read-only summary (View mode).
// - Uses `profileService` to load and save profile data. The service
//   maps between the DB row shape and the UI-friendly `ProfileData`.
// - The email field is intentionally read-only in the form (managed by auth).
const ProfileDetails: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navPrefill = (location.state as any)?.prefill ?? null;

  const [formData, setFormData] = useState<ProfileData>({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    headline: "",
    bio: "",
    industry: "",
    experience: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bioCount, setBioCount] = useState(0);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [openErrorSnackbar, setOpenErrorSnackbar] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Load profile from DB when user is available
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (authLoading) return;
      if (!user) return;
      try {
        // Ask the profileService to fetch and map the profile row.
        // This keeps DB-specific shape (first_name/last_name etc.) out of the UI.
        const res = await profileService.getProfile(user.id);
        if (!mounted) return;
        if (res.error) {
          // Non-fatal: show in console but don't crash the page
          console.warn("Failed to load profile", res.error);
          return;
        }
        const p = res.data as Record<string, unknown> | null;
        if (!p) return;
        const mapped = profileService.mapRowToProfile(p);
        // If navigation provided prefill values, let them override mapped values
        if (navPrefill) {
          const prefillMapped: Partial<ProfileData> = {};
          if (navPrefill.first_name || navPrefill.last_name) {
            const fn = navPrefill.first_name ?? "";
            const ln = navPrefill.last_name ?? "";
            prefillMapped.fullName = `${fn} ${ln}`.trim();
          }
          // Accept either `headline` or `professional_title` from prefill (mapping sources vary)
          if (navPrefill.headline) prefillMapped.headline = navPrefill.headline;
          else if (navPrefill.professional_title)
            prefillMapped.headline = navPrefill.professional_title;
          // Merge with mapped, prefilling wins
          setFormData({ ...mapped, ...prefillMapped });
        } else {
          setFormData(mapped);
        }
      } catch (err) {
        // Unexpected error while loading profile
        console.error("Error loading profile", err);
      }
    };
    // If navigation state included prefill, apply it immediately and open edit mode
    if (navPrefill) {
      const initial: ProfileData = {
        ...formData,
        fullName:
          navPrefill.first_name || navPrefill.fullName || formData.fullName,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        // Prefer either headline or professional_title from prefill
        headline:
          navPrefill.headline ??
          navPrefill.professional_title ??
          formData.headline,
        bio: formData.bio,
        industry: formData.industry,
        experience: formData.experience,
      };
      setFormData(initial);
      setEditMode(true);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "bio") {
      // Track character count for the bio textarea (max 500)
      setBioCount(value.length);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;

    // Basic client-side validation to provide immediate feedback.
    if (!formData.fullName) newErrors.fullName = "Full name is required";

    if (!formData.email) newErrors.email = "Email is required";
    else if (!emailRegex.test(formData.email))
      newErrors.email = "Enter a valid email address";

    if (!formData.phone) newErrors.phone = "Phone is required";
    else if (!phoneRegex.test(formData.phone.replace(/\D/g, "")))
      newErrors.phone = "Phone must be 10 digits";

    if (!formData.city) newErrors.city = "City is required";

    if (!formData.state) newErrors.state = "Please select your state";

    if (!formData.headline)
      newErrors.headline = "Professional headline is required";
    if (!formData.industry) newErrors.industry = "Please select an industry";
    if (!formData.experience)
      newErrors.experience = "Please select experience level";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    (async () => {
      if (!validateForm()) return;
      if (authLoading) return;
      if (!user) {
        setErrorMsg("You must be signed in to save your profile");
        setOpenErrorSnackbar(true);
        return;
      }
      setSaving(true);
      try {
        // Build the payload and upsert via the profileService. The service
        // will normalize fields (email -> lowercase) and split fullName into
        // first_name / last_name so DB NOT NULL constraints are satisfied.
        const res = await profileService.upsertProfile(user.id, formData);
        if (res.error) {
          console.error("Failed to save profile", res.error);
          setErrorMsg(res.error.message || "Failed to save profile");
          setOpenErrorSnackbar(true);
          return;
        }
        setOpenSnackbar(true);
        setEditMode(false);
      } catch (err) {
        console.error("Error saving profile", err);
        setErrorMsg(String(err));
        setOpenErrorSnackbar(true);
      } finally {
        setSaving(false);
      }
    })();
  };

  const handleCancel = () => {
    setErrors({});
    setEditMode(false);
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", p: { xs: 2, sm: 3 } }}>
      <Breadcrumbs
        items={[{ label: "Profile", path: "/profile" }, { label: "Details" }]}
      />
      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
          {editMode ? "Edit Profile" : "Profile Details"}
        </Typography>

        {/* Show profile picture in both view and edit modes */}
        <ProfilePicture />

        {editMode ? (
          <>
            {/* Row: Full name + Email */}
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <TextField
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!errors.fullName}
                  helperText={errors.fullName}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <TextField
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!errors.email}
                  helperText={errors.email || "Email can't be changed."}
                  InputProps={{ readOnly: true }}
                  disabled
                  inputProps={{ "aria-readonly": true }}
                />
              </Box>
            </Box>

            {/* Row: Phone / City / State */}
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!errors.phone}
                  helperText={errors.phone}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 160 }}>
                <TextField
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!errors.city}
                  helperText={errors.city}
                />
              </Box>
              <Box sx={{ width: 160 }}>
                <TextField
                  select
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!errors.state}
                  helperText={errors.state}
                >
                  {usStates.map((abbrev) => (
                    <MenuItem key={abbrev} value={abbrev}>
                      {abbrev}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <TextField
                label="Professional Headline / Title"
                name="headline"
                value={formData.headline}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.headline}
                helperText={errors.headline}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <TextField
                label="Brief Bio / Summary"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                fullWidth
                multiline
                minRows={4}
                inputProps={{ maxLength: 500 }}
                helperText={`${bioCount} / 500 characters`}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <TextField
                  select
                  label="Industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!errors.industry}
                  helperText={errors.industry}
                >
                  {industries.map((ind) => (
                    <MenuItem key={ind} value={ind}>
                      {ind}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <TextField
                  select
                  label="Experience Level"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!errors.experience}
                  helperText={errors.experience}
                >
                  {experienceLevels.map((lvl) => (
                    <MenuItem key={lvl} value={lvl}>
                      {lvl}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button variant="outlined" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">Basic Information</Typography>
              <Typography>
                <strong>Full Name:</strong> {formData.fullName || "—"}
              </Typography>
              <Typography>
                <strong>Email:</strong> {formData.email || "—"}
              </Typography>
              <Typography>
                <strong>Phone:</strong> {formData.phone || "—"}
              </Typography>
              <Typography>
                <strong>Location:</strong>{" "}
                {`${formData.city || "—"}, ${formData.state || "—"}`}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">Professional Details</Typography>
              <Typography>
                <strong>Headline:</strong> {formData.headline || "—"}
              </Typography>
              <Typography>
                <strong>Industry:</strong> {formData.industry || "—"}
              </Typography>
              <Typography>
                <strong>Experience:</strong> {formData.experience || "—"}
              </Typography>
              <Typography sx={{ mt: 1 }}>
                <strong>Bio:</strong>
              </Typography>
              <Typography variant="body2">{formData.bio || "—"}</Typography>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Button variant="contained" onClick={() => setEditMode(true)}>
                Edit
              </Button>
            </Box>
          </>
        )}
      </Paper>

      {/* Generate profile tips button placed at the bottom of the details page */}
      <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
        <GenerateProfileTips
          profile={{
            first_name:
              (formData.fullName || "").split(" ").slice(0, -1).join(" ") ||
              (formData.fullName || "").split(" ")[0] ||
              null,
            last_name:
              (formData.fullName || "").split(" ").slice(-1).join(" ") || null,
            headline: formData.headline || null,
            bio: formData.bio || null,
            experience_summary: formData.experience || null,
            location: `${formData.city || ""}${
              formData.state ? ", " + formData.state : ""
            }`,
          }}
        />
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          Profile saved successfully!
        </Alert>
      </Snackbar>
      <Snackbar
        open={openErrorSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenErrorSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setOpenErrorSnackbar(false)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {errorMsg || "Failed to save profile"}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfileDetails;
