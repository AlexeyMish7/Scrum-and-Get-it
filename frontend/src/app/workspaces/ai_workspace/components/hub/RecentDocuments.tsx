/**
 * RecentDocuments - Recent Documents List
 *
 * Displays recently edited documents with quick access.
 */

import {
  Box,
  Typography,
  Card,
  CardActionArea,
  Chip,
  Stack,
} from "@mui/material";
import {
  Description as ResumeIcon,
  Email as CoverLetterIcon,
  Schedule as ClockIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import type { RecentDocument } from "../../types";

interface RecentDocumentsProps {
  /** Recent documents to display */
  documents: RecentDocument[];

  /** Maximum documents to show */
  maxDocuments?: number;
}

/**
 * RecentDocuments Component
 *
 * Displays a grid of recently edited documents.
 */
export default function RecentDocuments({
  documents,
  maxDocuments = 8,
}: RecentDocumentsProps) {
  const navigate = useNavigate();

  const displayDocuments = documents.slice(0, maxDocuments);

  if (displayDocuments.length === 0) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
          Recent Documents
        </Typography>

        <Card
          elevation={0}
          sx={{
            border: 1,
            borderColor: "divider",
            p: 4,
            textAlign: "center",
          }}
        >
          <Typography color="text.secondary">
            No documents yet. Create your first resume or cover letter!
          </Typography>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Recent Documents
        </Typography>

        <Typography
          variant="body2"
          color="primary"
          sx={{
            cursor: "pointer",
            "&:hover": { textDecoration: "underline" },
          }}
          onClick={() => navigate("/ai/library")}
        >
          View All →
        </Typography>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", gap: 2 }}>
        {displayDocuments.map((doc) => (
          <Box
            key={doc.id}
            sx={{ flex: "1 1 calc(25% - 16px)", minWidth: 220 }}
          >
            <Card
              elevation={0}
              sx={{
                border: 1,
                borderColor: "divider",
                height: "100%",
                transition: "all 0.2s",
                "&:hover": {
                  borderColor: "primary.main",
                  boxShadow: 2,
                },
              }}
            >
              <CardActionArea
                onClick={() => navigate(`/ai/document/${doc.id}`)}
                sx={{ height: "100%" }}
              >
                <Box sx={{ p: 2 }}>
                  {/* Document icon */}
                  <Box
                    sx={{
                      width: "100%",
                      height: 120,
                      backgroundColor: "background.default",
                      borderRadius: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 2,
                    }}
                  >
                    {doc.type === "resume" ? (
                      <ResumeIcon
                        sx={{ fontSize: 48, color: "text.secondary" }}
                      />
                    ) : (
                      <CoverLetterIcon
                        sx={{ fontSize: 48, color: "text.secondary" }}
                      />
                    )}
                  </Box>

                  {/* Document info */}
                  <Typography variant="subtitle2" noWrap gutterBottom>
                    {doc.name}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                    <Chip
                      label={doc.type === "resume" ? "Resume" : "Cover Letter"}
                      size="small"
                      color={doc.type === "resume" ? "primary" : "success"}
                    />
                    <Chip
                      label={`v${doc.versionNumber}`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>

                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <ClockIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(doc.lastEditedAt), {
                        addSuffix: true,
                      })}
                    </Typography>
                  </Stack>
                </Box>
              </CardActionArea>
            </Card>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
