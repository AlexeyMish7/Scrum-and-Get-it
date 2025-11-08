import React from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import useResumeDrafts from "@workspaces/ai/hooks/useResumeDrafts";

/**
 * ResumeDraftPreviewPanel
 * Full-draft visual preview applying per-draft template style (stored at `sgt:resume_style_<draftId>`).
 * Inputs: active draft from useResumeDrafts (content + section order/visibility), stored style payload.
 * Output: Styled resume preview card showing summary, skills, experience (placeholders for missing sections).
 * Error Modes: If no active draft or style present, fall back to neutral styling and placeholders.
 */
export default function ResumeDraftPreviewPanel() {
  const { active } = useResumeDrafts();

  const stylePayload = React.useMemo(() => {
    if (!active) return null;
    try {
      const raw = localStorage.getItem(`sgt:resume_style_${active.id}`);
      if (!raw) return null;
      return JSON.parse(raw) as {
        templateId?: string;
        colors?: { primary: string; accent: string; bg: string };
        font?: string;
        layout?: "single" | "two-column" | "modern";
      };
    } catch {
      return null;
    }
  }, [active]);

  const colors = stylePayload?.colors || {
    primary: "#0044cc",
    accent: "#666",
    bg: "#ffffff",
  };
  const font = stylePayload?.font || "Inter";
  const layout = stylePayload?.layout || "single";

  const sectionOrder = active?.content.sectionOrder || [
    "summary",
    "skills",
    "experience",
    "education",
    "projects",
  ];
  const visible = new Set(
    active?.content.visibleSections || [
      "summary",
      "skills",
      "experience",
      "education",
      "projects",
    ]
  );

  const summary = active?.content.summary;
  const skills = active?.content.skills || [];
  const experience = active?.content.experience || [];

  if (!active) {
    return (
      <Card variant="outlined" sx={{ p: 1 }}>
        <CardHeader
          title="Resume Preview"
          subheader="Select or create a draft first"
        />
      </Card>
    );
  }

  function renderSummary() {
    return (
      <Box>
        <Typography variant="h6" sx={{ color: colors.primary }}>
          Summary
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {summary ||
            "No summary yet. Generate or write a professional profile summary."}
        </Typography>
      </Box>
    );
  }

  function renderSkills() {
    return (
      <Box>
        <Typography variant="h6" sx={{ color: colors.primary }}>
          Skills
        </Typography>
        {skills.length ? (
          <Stack direction="row" flexWrap="wrap" gap={1} mt={0.5}>
            {skills.map((s) => (
              <Box
                key={s}
                sx={{
                  px: 1,
                  py: 0.5,
                  border: `1px solid ${colors.accent}`,
                  borderRadius: 1,
                  fontSize: 12,
                }}
              >
                {s}
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            No skills applied yet. Use AI skills ordering or add manually.
          </Typography>
        )}
      </Box>
    );
  }

  function renderExperience() {
    return (
      <Box>
        <Typography variant="h6" sx={{ color: colors.primary }}>
          Experience
        </Typography>
        {!experience.length && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            No experience entries yet. Merge AI bullets or add roles.
          </Typography>
        )}
        <Stack spacing={1} mt={1}>
          {experience.map((e, idx) => (
            <Box key={idx}>
              <Typography sx={{ fontWeight: 600 }}>
                {e.role} {e.company ? `— ${e.company}` : ""}
              </Typography>
              {e.dates && (
                <Typography variant="caption" color="text.secondary">
                  {e.dates}
                </Typography>
              )}
              <Stack component="ul" sx={{ pl: 2, mt: 0.5 }} spacing={0.5}>
                {e.bullets.map((b, bi) => (
                  <Typography
                    key={bi}
                    component="li"
                    variant="body2"
                    sx={{ listStyleType: "disc" }}
                  >
                    {b}
                  </Typography>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
    );
  }

  function renderEducation() {
    return (
      <Box>
        <Typography variant="h6" sx={{ color: colors.primary }}>
          Education
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          Education section placeholder (future integration).
        </Typography>
      </Box>
    );
  }

  function renderProjects() {
    return (
      <Box>
        <Typography variant="h6" sx={{ color: colors.primary }}>
          Projects
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          Projects section placeholder (future integration).
        </Typography>
      </Box>
    );
  }

  // Layout variants. For two-column we place skills/summary sidebar and experience main.
  const content = (
    <Stack spacing={2}>
      {sectionOrder.map((sec) => {
        if (!visible.has(sec)) return null;
        switch (sec) {
          case "summary":
            return <Box key={sec}>{renderSummary()}</Box>;
          case "skills":
            return <Box key={sec}>{renderSkills()}</Box>;
          case "experience":
            return <Box key={sec}>{renderExperience()}</Box>;
          case "education":
            return <Box key={sec}>{renderEducation()}</Box>;
          case "projects":
            return <Box key={sec}>{renderProjects()}</Box>;
          default:
            return null;
        }
      })}
    </Stack>
  );

  const twoColumn = layout === "two-column";

  return (
    <Card variant="outlined" sx={{ bgcolor: colors.bg }}>
      <CardHeader
        title="Full Draft Preview"
        subheader={
          stylePayload
            ? `Template ${stylePayload.templateId || "(custom)"} • ${layout}`
            : "No style applied yet"
        }
      />
      <CardContent
        sx={{
          fontFamily: font,
          color: "text.primary",
        }}
      >
        <Box
          sx={{
            border: `1px solid ${colors.accent}`,
            p: 2,
            borderRadius: 1,
            fontSize: 14,
          }}
        >
          {twoColumn ? (
            <Box sx={{ display: "flex", gap: 2 }}>
              <Box
                sx={{
                  width: 260,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {visible.has("summary") && renderSummary()}
                <Divider />
                {visible.has("skills") && renderSkills()}
              </Box>
              <Box sx={{ flex: 1 }}>{renderExperience()}</Box>
            </Box>
          ) : (
            content
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
