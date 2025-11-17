import { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Grid,
  Alert,
  Switch,
  FormControlLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
} from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function SalaryResearchCard() {
  const { session } = useAuth();

  // form
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [company, setCompany] = useState("");
  const [companySize, setCompanySize] = useState(""); // ✅ company size
  const [currentSalary, setCurrentSalary] = useState("");

  // ui
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [showComparison, setShowComparison] = useState(false);

  const handleResearch = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_AI_BASE_URL}/api/salary-research`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : { "x-user-id": "demo-user" }), // dev fallback
          },
          body: JSON.stringify({
            title,
            location,
            experience,
            company,
            companySize,
            currentSalary,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch salary data");
      }

      // put AI content on top level for the UI
      const content = data.content ?? data.artifact?.content ?? data;
      setResult(content);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ current vs market
  const comparisonPct =
    currentSalary && result?.range?.avg
      ? ((Number(currentSalary) - result.range.avg) / result.range.avg) * 100
      : null;

  // ✅ historical chart (derived if AI didn’t send it)
  const trendData =
    result?.history && Array.isArray(result.history)
      ? result.history
      : [
          {
            year: "2019",
            avg: result?.range?.avg ? result.range.avg * 0.78 : 0,
          },
          {
            year: "2020",
            avg: result?.range?.avg ? result.range.avg * 0.85 : 0,
          },
          {
            year: "2021",
            avg: result?.range?.avg ? result.range.avg * 0.9 : 0,
          },
          {
            year: "2022",
            avg: result?.range?.avg ? result.range.avg * 0.95 : 0,
          },
          {
            year: "2023",
            avg: result?.range?.avg ? result.range.avg : 0,
          },
        ];

  // ✅ multi-company comparison (use AI data if present, otherwise mock)
  const comparisonRows: Array<{
    company: string;
    low: number;
    avg: number;
    high: number;
  }> =
    (result?.comparisons as any)?.length
      ? result.comparisons
      : [
          {
            company: company || "Target Co.",
            low: result?.range?.low ?? 0,
            avg: result?.range?.avg ?? 0,
            high: result?.range?.high ?? 0,
          },
          {
            company: "Competitor A",
            low: (result?.range?.low ?? 0) * 0.93,
            avg: (result?.range?.avg ?? 0) * 0.97,
            high: (result?.range?.high ?? 0) * 1.01,
          },
          {
            company: "Competitor B",
            low: (result?.range?.low ?? 0) * 1.03,
            avg: (result?.range?.avg ?? 0) * 1.04,
            high: (result?.range?.high ?? 0) * 1.06,
          },
        ];

  // ✅ export helpers
  const handleExport = (type: "json" | "csv") => {
    if (!result) return;
    if (type === "json") {
      const blob = new Blob([JSON.stringify(result, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `salary_research_${title || "report"}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // csv
      const row = [
        "Low",
        "Average",
        "High",
        "TotalComp",
        "Trend",
        "Recommendation",
      ].join(",");
      const dataRow = [
        result?.range?.low ?? "",
        result?.range?.avg ?? "",
        result?.range?.high ?? "",
        result?.totalComp ?? "",
        `"${result?.trend ?? ""}"`,
        `"${result?.recommendation ?? ""}"`,
      ].join(",");
      const blob = new Blob([row + "\n" + dataRow], {
        type: "text/csv",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `salary_research_${title || "report"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{ p: 4, mt: 3, borderRadius: 4, backgroundColor: "#fff" }}
    >
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        💰 Salary Research & Comparison
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
        AI-driven salary insights based on your role and experience
      </Typography>

      {/* inputs */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Job Title ***"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Experience Level"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Company Size (e.g. 50-200, 1k+, enterprise)"
            value={companySize}
            onChange={(e) => setCompanySize(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            label="Current Salary (optional)"
            value={currentSalary}
            onChange={(e) => setCurrentSalary(e.target.value)}
            fullWidth
          />
        </Grid>
      </Grid>

      <FormControlLabel
        sx={{ mt: 2 }}
        control={
          <Switch
            checked={showComparison}
            onChange={() => setShowComparison((v) => !v)}
          />
        }
        label="Compare across companies"
      />

      <Box sx={{ mt: 3 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={handleResearch}
          disabled={loading}
          sx={{ py: 1.2, fontWeight: 600, textTransform: "none" }}
        >
          {loading ? (
            <CircularProgress size={22} color="inherit" />
          ) : (
            "Run Salary Research"
          )}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Salary Insights
          </Typography>

          {/* main range */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="subtitle2">Low</Typography>
              <Typography variant="body1">
                ${result?.range?.low?.toLocaleString() ?? "N/A"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="subtitle2">Average</Typography>
              <Typography variant="body1">
                ${result?.range?.avg?.toLocaleString() ?? "N/A"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="subtitle2">High</Typography>
              <Typography variant="body1">
                ${result?.range?.high?.toLocaleString() ?? "N/A"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="subtitle2">Total Compensation</Typography>
              <Typography variant="body1">
                ${result?.totalComp?.toLocaleString() ?? "N/A"}
              </Typography>
            </Grid>
          </Grid>

          {/* current vs market */}
          {comparisonPct !== null && (
            <Typography
              variant="body2"
              sx={{
                mt: 2,
                fontWeight: 500,
                color: comparisonPct > 0 ? "green" : "red",
              }}
            >
              {comparisonPct > 0
                ? `Your current salary is ${comparisonPct.toFixed(
                    1
                  )}% above the market average.`
                : `Your current salary is ${Math.abs(comparisonPct).toFixed(
                    1
                  )}% below the market average.`}
            </Typography>
          )}

          {/* historical chart */}
          <Box sx={{ mt: 4, height: 250 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Historical Salary Trend
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#1976d2"
                  strokeWidth={2}
                  dot
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>

          {/* multi-company comparison */}
          {showComparison && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Company Comparison
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Company</TableCell>
                    <TableCell align="right">Low</TableCell>
                    <TableCell align="right">Average</TableCell>
                    <TableCell align="right">High</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comparisonRows.map((row) => (
                    <TableRow key={row.company}>
                      <TableCell>{row.company}</TableCell>
                      <TableCell align="right">
                        ${Math.round(row.low).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        ${Math.round(row.avg).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        ${Math.round(row.high).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* text insights */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2">Trend:</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {result?.trend || "N/A"}
            </Typography>
            <Typography variant="subtitle2">Recommendation:</Typography>
            <Typography variant="body1">
              {result?.recommendation || "N/A"}
            </Typography>
          </Box>

          {/* exports */}
          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleExport("json")}
            >
              Export JSON
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleExport("csv")}
            >
              Export CSV
            </Button>
          </Stack>
        </Box>
      )}
    </Paper>
  );
}
