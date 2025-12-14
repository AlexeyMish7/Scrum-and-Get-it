import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Stack,
  IconButton,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type Offer = {
  id: string;
  title: string;
  company: string;
  salary: number; // base salary
  bonus: number; // expected annual bonus
  equityValue: number; // estimated annualized equity value
  benefitsValue: number; // estimated annual benefits value
  location: string;
  colIndex?: number; // cost of living index (1.0 = baseline)
  remote: string; // e.g., Remote / Hybrid / Onsite
  culture: number; // 0-10
  growth: number; // 0-10
  worklife: number; // 0-10
  archived?: boolean;
  archiveReason?: string;
};

const STORAGE_KEY = "offers:compare";
const ARCHIVE_KEY = "offers:archive";

function genId(prefix = "o") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export default function OfferComparisonDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [offers, setOffers] = useState<Offer[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Offer[]) : [];
    } catch {
      return [];
    }
  });

  const [editing, setEditing] = useState<Partial<Offer> | null>(null);
  const [scenarioPct, setScenarioPct] = useState<number>(10);

  const saveOffers = (next: Offer[]) => {
    setOffers(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const addOffer = () => {
    const o: Offer = {
      id: genId(),
      title: "New Role",
      company: "Company",
      salary: 100000,
      bonus: 0,
      equityValue: 0,
      benefitsValue: 10000,
      location: "US",
      colIndex: 1,
      remote: "Hybrid",
      culture: 5,
      growth: 5,
      worklife: 5,
    };
    const next = [...offers, o];
    saveOffers(next);
  };

  const updateOffer = (id: string, patch: Partial<Offer>) => {
    const next = offers.map((o) => (o.id === id ? { ...o, ...patch } : o));
    saveOffers(next);
  };

  const removeOffer = (id: string) => {
    const next = offers.filter((o) => o.id !== id);
    saveOffers(next);
  };

  const archiveOffer = (id: string, reason?: string) => {
    const next = offers.map((o) =>
      o.id === id ? { ...o, archived: true, archiveReason: reason } : o
    );
    saveOffers(next);
    // persist archive separately for quick reference
    try {
      const raw = localStorage.getItem(ARCHIVE_KEY) || "[]";
      const arr = JSON.parse(raw);
      const target = next.find((x) => x.id === id);
      if (target) {
        arr.unshift({ ...target, archivedAt: new Date().toISOString() });
        localStorage.setItem(ARCHIVE_KEY, JSON.stringify(arr));
      }
    } catch {}
  };

  const totalComp = (o: Offer) => {
    // total compensation = salary + bonus + equityValue + benefitsValue + 401k match estimate (3% of salary)
    const match = Math.round((o.salary || 0) * 0.03);
    return (
      (o.salary || 0) +
      (o.bonus || 0) +
      (o.equityValue || 0) +
      (o.benefitsValue || 0) +
      match
    );
  };

  const adjustedForCOL = (o: Offer) => {
    const col = o.colIndex && o.colIndex > 0 ? o.colIndex : 1;
    return Math.round(totalComp(o) / col);
  };

  const nonFinancialScore = (o: Offer) => {
    // scale scores 0-10 into weighted 0-1 and return composite
    const weights = { culture: 0.4, growth: 0.35, worklife: 0.25 };
    const s =
      ((o.culture || 0) / 10) * weights.culture +
      ((o.growth || 0) / 10) * weights.growth +
      ((o.worklife || 0) / 10) * weights.worklife;
    return Math.round(s * 100);
  };

  const withScenario = (o: Offer, pct: number) => {
    const increased = {
      ...o,
      salary: Math.round((o.salary || 0) * (1 + pct / 100)),
    } as Offer;
    return { total: totalComp(increased), adjusted: adjustedForCOL(increased) };
  };

  // negotiation recommendations generator
  const computeNegotiationRecommendations = (o: Offer) => {
    const total = totalComp(o);
    const adj = adjustedForCOL(o);

    // baseline counter-offer heuristics
    const suggestedSalary = Math.round(
      Math.max(o.salary * 1.12, o.salary + 5000)
    );
    const suggestedBonus = Math.round(
      Math.max(o.bonus * 1.25, (o.salary || 0) * 0.05)
    );
    const suggestedEquity = Math.round(Math.max(o.equityValue * 1.5, 0));

    // what to emphasize in talking points
    const nf = nonFinancialScore(o);
    const emphasize: string[] = [];
    if (nf >= 70)
      emphasize.push(
        "This role has strong non-financial upside (culture/growth/work-life). Emphasize long-term impact and career growth."
      );
    if (nf < 70)
      emphasize.push(
        "Non-financial factors look weaker — prioritize clear monetary improvements and a signing bonus."
      );
    if (o.remote && o.remote.toLowerCase().includes("remote"))
      emphasize.push(
        "Leverage remote flexibility to negotiate for higher pay or extra equity."
      );
    if ((o.bonus || 0) < (o.salary || 0) * 0.05)
      emphasize.push(
        "Ask for a structured bonus or performance review within 6-12 months."
      );

    // BATNA / fallback
    const batna = `If they can't meet the numbers, consider asking for a sign-on bonus (~$${Math.round(
      suggestedSalary - o.salary
    )}), accelerated equity vesting, or a guaranteed review in 6 months.`;

    // sample email template
    const email = `Hi ${o.company} Hiring Team,

Thank you again for the offer for the ${
      o.title
    } role. I'm excited about the opportunity and the team. Based on market research and the responsibilities of this role, I'm seeking a base salary of $${suggestedSalary.toLocaleString()} (or a total compensation package closer to $${Math.round(
      total * 1.12
    ).toLocaleString()}), with an improved bonus and equity component.

I'd welcome a conversation to find a figure that works for both of us — for example, a $${suggestedSalary.toLocaleString()} base, a bonus target around $${suggestedBonus.toLocaleString()}, and a larger equity grant or accelerated vesting schedule. If a higher base isn't possible today, a sign-on bonus or committed performance review in 6 months would also be meaningful.

Thanks for considering — I'm excited to continue the conversation.

Best,
[Your name]`;

    const points = [
      `Target a base salary of $${suggestedSalary.toLocaleString()} (≈${Math.round(
        ((suggestedSalary - o.salary) / o.salary) * 100
      )}% increase).`,
      `Ask for a bonus of ~$${suggestedBonus.toLocaleString()} and consider a sign-on bonus if needed.`,
      `Request increased equity (~$${suggestedEquity.toLocaleString()}) or faster vesting.`,
      ...emphasize,
      batna,
    ];

    return {
      suggestedSalary,
      suggestedBonus,
      suggestedEquity,
      talkingPoints: points,
      sampleEmail: email,
      total,
      adjusted: adj,
    };
  };

  const [showRec, setShowRec] = useState<Record<string, boolean>>({});

  // Simple built-in COL index lookup by location (fallback dataset).
  // Values are multipliers where 1.0 = baseline US average.
  const COL_LOOKUP: Record<string, number> = {
    // Bay Area
    "san francisco": 1.6,
    "san francisco, ca": 1.6,
    sf: 1.6,
    "san jose": 1.7,
    "palo alto": 1.8,
    "bay area": 1.6,
    // New York
    "new york": 1.5,
    "new york city": 1.5,
    nyc: 1.5,
    // Large US metros
    seattle: 1.25,
    boston: 1.3,
    "los angeles": 1.35,
    la: 1.35,
    chicago: 1.1,
    austin: 1.05,
    denver: 1.05,
    atlanta: 0.95,
    miami: 1.0,
    dallas: 0.95,
    houston: 0.95,
    // International examples
    london: 1.4,
    berlin: 0.9,
    toronto: 1.1,
    vancouver: 1.15,
    sydney: 1.2,
    madrid: 0.9,
    paris: 1.2,
    bangalore: 0.4,
    mumbai: 0.45,
    india: 0.45,
    "mexico city": 0.6,
    "sao paulo": 0.7,
  };

  function estimateCOLFromLocation(loc?: string) {
    if (!loc) return 1;
    const s = loc.toLowerCase().trim();
    // try direct match
    if (COL_LOOKUP[s]) return COL_LOOKUP[s];
    // try to find a key contained in the string (e.g., 'San Francisco, CA')
    for (const key of Object.keys(COL_LOOKUP)) {
      if (s.includes(key)) return COL_LOOKUP[key];
    }
    // fallback heuristics
    if (s.includes("remote")) return 1; // remote baseline
    if (s.includes("us") || s.includes("usa") || s.includes("united states"))
      return 1;
    // country-level fallbacks
    if (s.includes("canada")) return 1.05;
    if (s.includes("uk") || s.includes("united kingdom")) return 1.3;
    if (s.includes("india")) return 0.45;
    return 1; // default baseline
  }

  const summary = useMemo(() => {
    return offers.map((o) => ({
      id: o.id,
      company: o.company,
      title: o.title,
      total: totalComp(o),
      adjusted: adjustedForCOL(o),
      nonFin: nonFinancialScore(o),
    }));
  }, [offers]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        Offer Comparison
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="contained" onClick={addOffer}>
              Add Offer
            </Button>
            <TextField
              label="Scenario % salary increase"
              type="number"
              size="small"
              value={scenarioPct}
              onChange={(e) => setScenarioPct(Number(e.target.value || 0))}
            />
            <Button
              onClick={() => {
                /* noop, recompute on the fly via summary */
              }}
            >
              Apply Scenario
            </Button>
          </Stack>

          <Grid container spacing={2}>
            {offers.map((o) => (
              <Grid item xs={12} md={6} key={o.id}>
                <Paper sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Grid container spacing={1} sx={{ alignItems: "center" }}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Role / Title"
                            size="small"
                            value={o.title}
                            onChange={(e) =>
                              updateOffer(o.id, { title: e.target.value })
                            }
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Company"
                            size="small"
                            value={o.company}
                            onChange={(e) =>
                              updateOffer(o.id, { company: e.target.value })
                            }
                          />
                        </Grid>
                      </Grid>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          onClick={() => archiveOffer(o.id, "Declined")}
                        >
                          Archive
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => removeOffer(o.id)}
                        >
                          Remove
                        </Button>
                      </Stack>
                    </Stack>
                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Base Salary"
                          type="number"
                          size="small"
                          value={o.salary}
                          onChange={(e) =>
                            updateOffer(o.id, {
                              salary: Number(e.target.value || 0),
                            })
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Bonus"
                          type="number"
                          size="small"
                          value={o.bonus}
                          onChange={(e) =>
                            updateOffer(o.id, {
                              bonus: Number(e.target.value || 0),
                            })
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Equity (annualized)"
                          type="number"
                          size="small"
                          value={o.equityValue}
                          onChange={(e) =>
                            updateOffer(o.id, {
                              equityValue: Number(e.target.value || 0),
                            })
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Benefits value"
                          type="number"
                          size="small"
                          value={o.benefitsValue}
                          onChange={(e) =>
                            updateOffer(o.id, {
                              benefitsValue: Number(e.target.value || 0),
                            })
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={5}>
                        <TextField
                          fullWidth
                          label="Location"
                          size="small"
                          value={o.location}
                          onChange={(e) =>
                            updateOffer(o.id, { location: e.target.value })
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TextField
                            fullWidth
                            label="COL index"
                            size="small"
                            type="number"
                            value={o.colIndex ?? 1}
                            onChange={(e) =>
                              updateOffer(o.id, {
                                colIndex: Number(e.target.value || 1),
                              })
                            }
                          />
                          <Button
                            size="small"
                            onClick={() =>
                              updateOffer(o.id, {
                                colIndex: estimateCOLFromLocation(o.location),
                              })
                            }
                          >
                            Auto
                          </Button>
                        </Stack>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Remote Policy"
                          size="small"
                          value={o.remote}
                          onChange={(e) =>
                            updateOffer(o.id, { remote: e.target.value })
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography
                          variant="caption"
                          sx={{ display: "block", mb: 0.5 }}
                        >
                          Culture fit (0-10)
                        </Typography>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          value={o.culture}
                          onChange={(e) =>
                            updateOffer(o.id, {
                              culture: Number(e.target.value),
                            })
                          }
                          inputProps={{ "aria-label": "Culture fit" }}
                        >
                          {Array.from({ length: 11 }).map((_, i) => (
                            <MenuItem key={i} value={i}>
                              {i}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography
                          variant="caption"
                          sx={{ display: "block", mb: 0.5 }}
                        >
                          Growth (0-10)
                        </Typography>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          value={o.growth}
                          onChange={(e) =>
                            updateOffer(o.id, {
                              growth: Number(e.target.value),
                            })
                          }
                          inputProps={{ "aria-label": "Growth" }}
                        >
                          {Array.from({ length: 11 }).map((_, i) => (
                            <MenuItem key={i} value={i}>
                              {i}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography
                          variant="caption"
                          sx={{ display: "block", mb: 0.5 }}
                        >
                          Work-life (0-10)
                        </Typography>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          value={o.worklife}
                          onChange={(e) =>
                            updateOffer(o.id, {
                              worklife: Number(e.target.value),
                            })
                          }
                          inputProps={{ "aria-label": "Work-life" }}
                        >
                          {Array.from({ length: 11 }).map((_, i) => (
                            <MenuItem key={i} value={i}>
                              {i}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                    </Grid>
                    <Typography variant="body2">
                      Total comp: ${totalComp(o).toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      Adjusted (COL): ${adjustedForCOL(o).toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      Non-financial score: {nonFinancialScore(o)}%
                    </Typography>
                    <Typography variant="body2">
                      Scenario (+{scenarioPct}% salary): $
                      {withScenario(o, scenarioPct).total.toLocaleString()} (adj
                      ${withScenario(o, scenarioPct).adjusted.toLocaleString()})
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button
                        size="small"
                        onClick={() =>
                          setShowRec((s) => ({ ...s, [o.id]: !s[o.id] }))
                        }
                      >
                        {showRec[o.id]
                          ? "Hide Negotiation Tips"
                          : "Show Negotiation Tips"}
                      </Button>
                    </Stack>
                    {showRec[o.id] && (
                      <Paper
                        sx={{
                          p: 2,
                          mt: 1,
                          backgroundColor: (theme) => theme.palette.grey[50],
                        }}
                      >
                        {(() => {
                          const r = computeNegotiationRecommendations(o);
                          return (
                            <Stack spacing={1}>
                              <Typography variant="subtitle2">
                                Suggested counter-offer
                              </Typography>
                              <Typography variant="body2">
                                Base salary: $
                                {r.suggestedSalary.toLocaleString()}
                              </Typography>
                              <Typography variant="body2">
                                Bonus target: $
                                {r.suggestedBonus.toLocaleString()}
                              </Typography>
                              <Typography variant="body2">
                                Equity (annualized): $
                                {r.suggestedEquity.toLocaleString()}
                              </Typography>
                              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                                Talking points
                              </Typography>
                              {r.talkingPoints.map((p, i) => (
                                <Typography variant="body2" key={i}>
                                  • {p}
                                </Typography>
                              ))}
                              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                                Sample email
                              </Typography>
                              <TextField
                                fullWidth
                                multiline
                                minRows={6}
                                value={r.sampleEmail}
                              />
                            </Stack>
                          );
                        })()}
                      </Paper>
                    )}
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Comparison Matrix</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Offer</TableCell>
                  <TableCell>Total Comp</TableCell>
                  <TableCell>Adj (COL)</TableCell>
                  <TableCell>Non-fin%</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summary.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      {s.title} — {s.company}
                    </TableCell>
                    <TableCell>${s.total.toLocaleString()}</TableCell>
                    <TableCell>${s.adjusted.toLocaleString()}</TableCell>
                    <TableCell>{s.nonFin}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
