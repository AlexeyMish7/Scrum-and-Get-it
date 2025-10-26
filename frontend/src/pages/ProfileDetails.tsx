import React, { useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Typography,
  Button,
  Paper,
  Snackbar,
  Alert,
} from '@mui/material';

interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  headline: string;
  bio: string;
  industry: string;
  experience: string;
}

const industries = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Marketing',
  'Engineering',
  'Law',
  'Real Estate',
  'Manufacturing',
  'Consulting',
  'Retail',
  'Hospitality',
  'Government',
  'Nonprofit',
  'Other',
];

const experienceLevels = ['Entry', 'Mid', 'Senior', 'Executive'];

const usStates = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const ProfileDetails: React.FC = () => {
  const [formData, setFormData] = useState<ProfileData>({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    headline: '',
    bio: '',
    industry: '',
    experience: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bioCount, setBioCount] = useState(0);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [editMode, setEditMode] = useState(true);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'bio') {
      setBioCount(value.length);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;

    if (!formData.fullName) newErrors.fullName = 'Full name is required';

    if (!formData.email) newErrors.email = 'Email is required';
    else if (!emailRegex.test(formData.email)) newErrors.email = 'Enter a valid email address';

    if (!formData.phone) newErrors.phone = 'Phone is required';
    else if (!phoneRegex.test(formData.phone.replace(/\D/g, '')))
      newErrors.phone = 'Phone must be 10 digits';

    if (!formData.city) newErrors.city = 'City is required';

    if (!formData.state) newErrors.state = 'Please select your state';

    if (!formData.headline) newErrors.headline = 'Professional headline is required';
    if (!formData.industry) newErrors.industry = 'Please select an industry';
    if (!formData.experience) newErrors.experience = 'Please select experience level';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      setOpenSnackbar(true);
      setEditMode(false);
    }
  };

  const handleCancel = () => {
    setErrors({});
    setEditMode(false);
  };

  return (
    <Box sx={{ p: 4, backgroundColor: 'background.default', minHeight: '100vh' }}>
      <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h4" gutterBottom>
          {editMode ? 'Edit Profile' : 'Profile Details'}
        </Typography>

        {editMode ? (
          <>
            {/* ---- EDIT MODE ---- */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 250 }}>
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
              <Box sx={{ flex: 1, minWidth: 250 }}>
                <TextField
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!errors.email}
                  helperText={errors.email}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
              <Box sx={{ flex: 1, minWidth: 250 }}>
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
              <Box sx={{ flex: 1, minWidth: 150 }}>
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
              <Box sx={{ flex: 1, minWidth: 150 }}>
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

            <Box sx={{ mt: 2 }}>
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

            <Box sx={{ mt: 2 }}>
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

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
              <Box sx={{ flex: 1, minWidth: 250 }}>
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
              <Box sx={{ flex: 1, minWidth: 250 }}>
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

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave}>
                Save
              </Button>
            </Box>
          </>
        ) : (
          <>
            {/* ---- VIEW MODE ---- */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">Basic Information</Typography>
              <Typography><strong>Full Name:</strong> {formData.fullName || '—'}</Typography>
              <Typography><strong>Email:</strong> {formData.email || '—'}</Typography>
              <Typography><strong>Phone:</strong> {formData.phone || '—'}</Typography>
              <Typography><strong>Location:</strong> {`${formData.city || '—'}, ${formData.state || '—'}`}</Typography>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6">Professional Details</Typography>
              <Typography><strong>Headline:</strong> {formData.headline || '—'}</Typography>
              <Typography><strong>Industry:</strong> {formData.industry || '—'}</Typography>
              <Typography><strong>Experience:</strong> {formData.experience || '—'}</Typography>
              <Typography sx={{ mt: 1 }}><strong>Bio:</strong></Typography>
              <Typography variant="body2">{formData.bio || '—'}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
              <Button variant="primary" onClick={() => setEditMode(true)}>
                Edit
              </Button>
            </Box>
          </>
        )}
      </Paper>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          Profile saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfileDetails;