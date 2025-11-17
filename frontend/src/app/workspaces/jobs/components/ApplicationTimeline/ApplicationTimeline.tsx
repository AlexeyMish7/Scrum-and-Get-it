import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

type HistoryEntry = {
  to?: string | null;
  changed_at?: string | number | null;
  timestamp?: string | number | null;
  [k: string]: unknown;
};

type Props = {
  history?: HistoryEntry[] | null;
  createdAt?: string | null | Date;
};

/**
 * ApplicationTimeline
 * - Renders a simple vertical timeline of application status changes.
 * - Ensures the first event is always `Interested` with the provided `createdAt` timestamp.
 *
 * Inputs:
 *  - history: array of objects (each should include `to` and a `changed_at` or `timestamp`)
 *  - createdAt: ISO date or Date for the job creation (used to seed the initial Interested event)
 *
 * Output: visual timeline (read-only)
 */
export default function ApplicationTimeline({ history, createdAt }: Props) {
  const normalizeWhen = (raw: unknown) => {
    if (!raw) return null;
    try {
      const d = raw instanceof Date ? raw : new Date(String(raw));
      if (Number.isNaN(d.getTime())) return null;
      return d.toISOString();
    } catch {
      return null;
    }
  };

  const entries: { to: string; when: string }[] = [];

  /**
   * Map a status label to a color string from the theme palette so the
   * timeline colors align with the pipeline column colors.
   */
  const statusColor = (
    status: string | undefined | null,
    theme: {
      palette: {
        grey?: Record<number, string>;
        info?: { main: string };
        primary: { main: string };
        success?: { main: string };
        warning?: { main: string };
        error?: { main: string };
      };
    }
  ) => {
    if (!status) return theme.palette.grey?.[700] ?? "#666";
    const s = String(status).toLowerCase().trim();
    switch (s) {
      case "interested":
        return theme.palette.info?.main ?? theme.palette.primary.main;
      case "applied":
        return theme.palette.primary?.main ?? theme.palette.primary.main;
      case "phone screen":
      case "phonescreen":
      case "phone_screen":
        return theme.palette.warning?.main ?? theme.palette.grey?.[700];
      case "interview":
        return theme.palette.secondary?.main ?? theme.palette.grey?.[700];
      case "offer":
        return theme.palette.success?.main ?? theme.palette.grey?.[700];
      case "rejected":
        return theme.palette.error?.main ?? theme.palette.grey?.[700];
      case "archived":
        return theme.palette.grey?.[700] ?? "#666";
      default:
        return theme.palette.grey?.[700] ?? "#666";
    }
  };

  if (Array.isArray(history)) {
    for (const h of history) {
      const when = normalizeWhen(
        h.changed_at ?? h.timestamp ?? h.date ?? h.when ?? null
      );
      let toRaw = String(h.to ?? h.status ?? "").trim();
      // Normalize archive label to a user-friendly form
      if (toRaw.toLowerCase() === "archive") toRaw = "Archived";
      if (when) entries.push({ to: toRaw || "-", when });
    }
  }

  // sort descending (newest first) so the oldest event appears at the bottom
  entries.sort((a, b) => (a.when < b.when ? 1 : a.when > b.when ? -1 : 0));

  const createdIso = normalizeWhen(createdAt ?? null);

  // Ensure initial Interested entry exists at the job's created_at
  // Since we render newest-first, the oldest entry should be the last element.
  if (createdIso) {
    const last = entries[entries.length - 1];
    const needSeed =
      !last ||
      last.to.toLowerCase() !== "interested" ||
      last.when !== createdIso;
    if (needSeed) {
      // Append the Interested event as the oldest
      entries.push({ to: "Interested", when: createdIso });
    }
  } else if (entries.length === 0) {
    // fallback: show a single Interested event with current time
    entries.push({ to: "Interested", when: new Date().toISOString() });
  }

  if (entries.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        No history
      </Typography>
    );
  }

  return (
    <Box>
      {entries.map((e, i) => {
        const isLast = i === entries.length - 1;
        const whenLabel = (() => {
          try {
            return new Date(e.when).toLocaleString();
          } catch {
            return String(e.when ?? "-");
          }
        })();

        return (
          <Box key={`${i}-${e.when}-${e.to}`} sx={{ display: "flex", mb: 1 }}>
            <Box
              sx={{
                width: 36,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  bgcolor: (theme) => statusColor(e.to, theme),
                }}
              />
              {!isLast && (
                <Box
                  sx={{
                    width: 2,
                    flex: 1,
                    mt: 0.5,
                    bgcolor: (theme) => {
                      const c = statusColor(e.to, theme);
                      try {
                        return alpha(c, 0.45);
                      } catch {
                        return theme.palette.divider;
                      }
                    },
                  }}
                />
              )}
            </Box>
            <Box sx={{ ml: 1, flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {whenLabel}
              </Typography>
              <Typography variant="body2">{String(e.to ?? "-")}</Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
