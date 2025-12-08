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
import { useFullProfile, useProfileCacheUtils } from "../../cache";
import { AutoBreadcrumbs } from "@shared/components/navigation/AutoBreadcrumbs";

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
// Navigation state type for profile prefill
interface ProfilePrefillState {
  prefill?: {
    first_name?: string;
    last_name?: string;
    headline?: string;
    professional_title?: string;
  };
}

// Responsible for rendering and editing a user's profile information.
// - Shows an editable form (Edit mode) and a read-only summary (View mode).
// - Uses `profileService` to load and save profile data. The service
//   maps between the DB row shape and the UI-friendly `ProfileData`.
// - The email field is intentionally read-only in the form (managed by auth).
const ProfileDetails: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navPrefill =
    (location.state as ProfilePrefillState | null)?.prefill ?? null;

  // Use cached profile data from React Query - shares cache with dashboard
  const { data: cachedProfile, isLoading: profileLoading } = useFullProfile();
  const { invalidateAll } = useProfileCacheUtils();

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

  // Sync form data when cached profile loads
  // Uses React Query cache - no duplicate network requests
  useEffect(() => {
    if (profileLoading || !cachedProfile) return;

    // If navigation provided prefill values, merge them with cached data
    if (navPrefill) {
      const prefillMapped: Partial<ProfileData> = {};
      if (navPrefill.first_name || navPrefill.last_name) {
        const fn = navPrefill.first_name ?? "";
        const ln = navPrefill.last_name ?? "";
        prefillMapped.fullName = `${fn} ${ln}`.trim();
      }
      // Accept either `headline` or `professional_title` from prefill
      if (navPrefill.headline) prefillMapped.headline = navPrefill.headline;
      else if (navPrefill.professional_title)
        prefillMapped.headline = navPrefill.professional_title;

      setFormData({ ...cachedProfile, ...prefillMapped });
      setEditMode(true);
    } else {
      setFormData(cachedProfile);
    }

    // Update bio character count
    setBioCount(cachedProfile.bio?.length ?? 0);
  }, [cachedProfile, profileLoading, navPrefill]);

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
        // Invalidate the profile cache so dashboard sees updated data
        invalidateAll();
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
    <Box sx={{ maxWidth: 1000, mx: "auto", p: { xs: 2, sm: 3 }, pt: 2 }}>
      <AutoBreadcrumbs />
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
