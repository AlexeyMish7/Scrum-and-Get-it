import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
} from "@mui/material";

interface PrivacyPolicyProps {
  open: boolean;
  onClose: () => void;
}

export default function PrivacyPolicy({ open, onClose }: PrivacyPolicyProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Privacy Policy</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Last updated: December 5, 2025
          </Typography>

          <Box>
            <Typography variant="h6">1. Information We Collect</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              We collect information you provide directly to us, such as:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              • Account registration information (name, email, password) • Profile
              information (skills, education, employment history, projects) • Job
              and interview data you add to the pipeline • Documents you generate
              or upload • Team and network information
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6">2. How We Use Your Information</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              We use the information we collect to:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              • Provide, maintain, and improve the Service • Generate AI-powered
              recommendations and generated documents • Enable team members and
              mentors to view your progress with your permission • Send important
              service updates and security alerts • Analyze usage trends to
              improve our service
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6">3. Data Security</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              We implement appropriate technical and organizational measures to
              protect your personal information against unauthorized access,
              alteration, disclosure, or destruction. However, no method of
              transmission over the Internet or electronic storage is 100%
              secure.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6">4. Sharing Your Information</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              We do not sell your personal information. We may share your
              information with:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              • Team members and mentors you explicitly invite • Service providers
              who perform services on our behalf • Law enforcement if required by
              law
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6">5. Your Rights</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              You have the right to:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              • Access your personal information • Update or correct your
              information • Request deletion of your account and data • Opt-out
              of certain communications
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6">6. Changes to This Policy</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              We may update this Privacy Policy from time to time. We will notify
              you of any changes by posting the new policy and updating the
              "Last updated" date.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6">7. Contact Us</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              If you have questions about this Privacy Policy or our practices,
              please contact us at support@scrum-and-get-it.com
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
