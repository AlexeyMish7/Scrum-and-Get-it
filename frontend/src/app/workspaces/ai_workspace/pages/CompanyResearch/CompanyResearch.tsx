/**
 * CompanyResearch - Company Research Page
 *
 * Research companies for job applications.
 * PLACEHOLDER - Will be implemented in next phase.
 */

import { Container, Typography, Box, Alert } from "@mui/material";

export default function CompanyResearch() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Company Research
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Research companies to create better-targeted applications.
      </Typography>

      <Box sx={{ mt: 4 }}>
        <Alert severity="info">
          Company Research is coming soon! This will include:
          <ul>
            <li>Automated company information gathering</li>
            <li>Recent news and press releases</li>
            <li>Company culture and values insights</li>
            <li>Key executives and team information</li>
            <li>Integration with cover letter generation</li>
          </ul>
        </Alert>
      </Box>
    </Container>
  );
}
