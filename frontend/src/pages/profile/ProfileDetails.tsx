import React, { useState, useEffect } from "react";
import {
  TextField,
  MenuItem,
  Typography,
  Button,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import { useAuth } from "../../app/shared/context/AuthContext";
import ProfilePicture from "../../components/common/ProfilePicture";
import profileService from "../../app/workspaces/profile/services/profileService";
import "./ProfileDetails.css";
import type { ProfileData } from "../../types/profile";

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
  const [editMode, setEditMode] = useState(true);

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
        setFormData(mapped);
      } catch (err) {
        // Unexpected error while loading profile
        console.error("Error loading profile", err);
      }
    };
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
    <div className="profile-container">
      <Paper className="profile-paper">
        <Typography className="profile-header" variant="h4" gutterBottom>
          {editMode ? "Edit Profile" : "Profile Details"}
        </Typography>

        {editMode ? (
          <>
            {/* ---- EDIT MODE ---- */}
            <ProfilePicture />
            <div className="profile-row">
              <div className="profile-col">
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
              </div>
              <div className="profile-col">
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
              </div>
            </div>

            <div className="profile-row profile-single">
              <div className="profile-col">
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
              </div>
              <div className="profile-col-sm">
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
              </div>
              <div className="profile-col-sm">
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
              </div>
            </div>

            <div className="profile-single">
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
            </div>

            <div className="profile-single">
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
            </div>

            <div className="profile-row profile-single">
              <div className="profile-col">
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
              </div>
              <div className="profile-col">
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
              </div>
            </div>

            <div className="actions">
              <Button className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* ---- VIEW MODE ---- */}
            <div className="profile-single">
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
            </div>

            <div className="profile-single">
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
              <Typography className="bio-title">
                <strong>Bio:</strong>
              </Typography>
              <Typography variant="body2">{formData.bio || "—"}</Typography>
            </div>

            <div className="actions" style={{ marginTop: 16 }}>
              <Button
                className="btn btn-primary"
                onClick={() => setEditMode(true)}
              >
                Edit
              </Button>
            </div>
          </>
        )}
      </Paper>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity="success"
          className="full-width-alert"
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
          className="full-width-alert"
        >
          {errorMsg || "Failed to save profile"}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ProfileDetails;
