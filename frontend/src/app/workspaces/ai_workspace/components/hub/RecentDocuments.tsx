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
        sx={{ mb: 3 }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}
        >
          Recent Documents
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "primary.main",
            cursor: "pointer",
            fontWeight: 600,
            "&:hover": {
              textDecoration: "underline",
            },
          }}
          onClick={() => navigate("/ai/library")}
        >
          View All →
        </Typography>
      </Stack>

      <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap", gap: 3 }}>
        {displayDocuments.map((doc) => {
          // Type-specific color accents
          const typeColor =
            doc.type === "resume"
              ? "#1976d2" // Blue for resume
              : "#388e3c"; // Green for cover letter

          return (
            <Box
              key={doc.id}
              sx={{ flex: "1 1 calc(25% - 24px)", minWidth: 240 }}
            >
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  border: 1,
                  borderColor: "divider",
                  borderLeft: 3,
                  borderLeftColor: typeColor,
                  "&:hover": {
                    borderColor: typeColor,
                    borderLeftColor: typeColor,
                    transform: "translateY(-4px)",
                    boxShadow: `0 8px 16px ${typeColor}20`,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => navigate(`/ai/document/${doc.id}`)}
                  sx={{ height: "100%" }}
                >
                  <Box sx={{ p: 2.5 }}>
                    {/* Document header with type-colored icon */}
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="flex-start"
                      sx={{ mb: 2 }}
                    >
                      {doc.type === "resume" ? (
                        <ResumeIcon
                          sx={{
                            fontSize: 28,
                            color: typeColor,
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <CoverLetterIcon
                          sx={{
                            fontSize: 28,
                            color: typeColor,
                            flexShrink: 0,
                          }}
                        />
                      )}
                      {/* Title with stronger weight for better scannability */}
                      <Typography
                        variant="subtitle1"
                        sx={{
                          flex: 1,
                          fontWeight: 700,
                          lineHeight: 1.3,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {doc.name}
                      </Typography>
                    </Stack>

                    {/* Document preview */}
                    <Box
                      sx={{
                        width: "100%",
                        height: 72,
                        backgroundColor: "action.hover",
                        borderRadius: 1,
                        p: 1.5,
                        mb: 2,
                        overflow: "hidden",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.disabled",
                          lineHeight: 1.4,
                          fontSize: "0.6875rem",
                        }}
                      >
                        {doc.type === "resume"
                          ? "Professional Experience\nSoftware Engineer | Company Name\n• Led development of key features..."
                          : "Dear Hiring Manager,\n\nI am writing to express my strong interest..."}
                      </Typography>
                    </Box>

                    {/* Metadata badges - reduced visual weight */}
                    <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                      <Chip
                        label={
                          doc.type === "resume" ? "Resume" : "Cover Letter"
                        }
                        size="small"
                        sx={{
                          backgroundColor: `${typeColor}15`,
                          color: typeColor,
                          fontWeight: 600,
                          borderColor: `${typeColor}30`,
                          fontSize: "0.6875rem",
                        }}
                      />
                      <Chip
                        label={`v${doc.versionNumber}`}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontSize: "0.6875rem",
                          fontWeight: 500,
                        }}
                      />
                    </Stack>

                    {/* Timestamp - reduced prominence */}
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <ClockIcon
                        sx={{ fontSize: 14, color: "text.disabled" }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.disabled",
                          fontSize: "0.6875rem",
                        }}
                      >
                        {formatDistanceToNow(new Date(doc.lastEditedAt), {
                          addSuffix: true,
                        })}
                      </Typography>
                    </Stack>
                  </Box>
                </CardActionArea>
              </Card>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
