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
  Divider,
} from "@mui/material";

interface TermsOfServiceProps {
  open: boolean;
  onClose: () => void;
}

export default function TermsOfService({ open, onClose }: TermsOfServiceProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Terms of Service</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Last updated: December 5, 2025
          </Typography>

          <Box>
            <Typography variant="h6">1. Acceptance of Terms</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              By accessing and using Scrum-and-Get-it, you agree to be bound by
              these Terms of Service. If you disagree with any part of these
              terms, you may not use the Service.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6">2. Use License</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Permission is granted to temporarily download one copy of the
              materials (information or software) on Scrum-and-Get-it for
              personal, non-commercial transitory viewing only. This is the
              grant of a license, not a transfer of title, and under this
              license you may not:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              • Modify or copy the materials • Use the materials for any
              commercial purpose or for any public display • Attempt to decompile
              or reverse engineer any software • Remove or alter any copyright
              or proprietary notations • Transfer the materials to another
              person or "mirror" the materials on any other server
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6">3. Disclaimer</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              The materials on Scrum-and-Get-it are provided on an 'as is' basis.
              Scrum-and-Get-it makes no warranties, expressed or implied, and
              hereby disclaims and negates all other warranties including,
              without limitation, implied warranties or conditions of
              merchantability, fitness for a particular purpose, or
              non-infringement of intellectual property or other violation of
              rights.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6">4. Limitations</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              In no event shall Scrum-and-Get-it or its suppliers be liable for
              any damages (including, without limitation, damages for loss of
              data or profit, or due to business interruption) arising out of the
              use or inability to use the materials on Scrum-and-Get-it.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6">5. Accuracy of Materials</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              The materials appearing on Scrum-and-Get-it could include technical,
              typographical, or photographic errors. Scrum-and-Get-it does not
              warrant that any of the materials on its website are accurate,
              complete, or current.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6">6. Modifications</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Scrum-and-Get-it may revise these terms of service for its website
              at any time without notice. By using this website, you are agreeing
              to be bound by the then current version of these terms of service.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6">7. Governing Law</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              These terms and conditions are governed by and construed in
              accordance with the laws of the jurisdiction in which
              Scrum-and-Get-it operates, and you irrevocably submit to the
              exclusive jurisdiction of the courts in that location.
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
