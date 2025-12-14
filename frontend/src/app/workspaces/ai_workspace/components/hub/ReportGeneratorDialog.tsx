import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Checkbox,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import jsPDF from "jspdf";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@shared/context/AuthContext";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import { fetchCoreContacts, fetchCoreJobs } from "@shared/cache/coreFetchers";
import {
  type JobRecord,
  computeSuccessRates,
  computeAvgResponseDays,
  compareToBenchmarks,
  computeResponseRate,
  computeAvgStageDurations,
  computeMonthlyApplications,
  computeDeadlineAdherence,
  computeTimeToOffer,
  generateAIInsights,
} from "../../../job_pipeline/pages/AnalyticsPage/analyticsHelpers";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ReportGeneratorDialog({ open, onClose }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const lastLoadedUserIdRef = useRef<string | null>(null);

  const [applicationMetricsChecked, setApplicationMetricsChecked] =
    useState(false);
  const [interviewMetricsChecked, setInterviewMetricsChecked] = useState(false);
  const [offerMetricsChecked, setOfferMetricsChecked] = useState(false);

  const [companies, setCompanies] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);

  const [companiesOptions, setCompaniesOptions] = useState<string[]>([]);
  const [rolesOptions, setRolesOptions] = useState<string[]>([]);
  const [industriesOptions, setIndustriesOptions] = useState<string[]>([]);

  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [contactsOptions, setContactsOptions] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Load jobs and populate filter options
  useEffect(() => {
    if (!open) return;
    if (!user?.id) return;

    // Avoid preloading heavy report data during page navigation.
    // Only load once per user session unless the user changes.
    if (lastLoadedUserIdRef.current === user.id) return;

    async function loadJobOptions() {
      try {
        const fullJobs = await queryClient.ensureQueryData({
          queryKey: coreKeys.jobs(user.id),
          queryFn: () => fetchCoreJobs<JobRecord>(user.id),
          staleTime: 60 * 60 * 1000,
        });
        setJobs(fullJobs);

        const companiesSet = new Set<string>();
        const rolesSet = new Set<string>();
        const industriesSet = new Set<string>();

        fullJobs.forEach((r) => {
          const c = r.company_name?.trim();
          const t = r.job_title?.trim();
          const i = r.industry?.trim();
          if (c) companiesSet.add(c);
          if (t) rolesSet.add(t);
          if (i) industriesSet.add(i);
        });

        setCompaniesOptions(Array.from(companiesSet));
        setRolesOptions(Array.from(rolesSet));
        setIndustriesOptions(Array.from(industriesSet));
      } catch (err) {
        console.error("Failed to load job options:", err);
      }
    }

    loadJobOptions();

    // load contacts for sharing
    async function loadContacts() {
      setLoadingContacts(true);
      try {
        const contacts = await queryClient.ensureQueryData({
          queryKey: coreKeys.contacts(user.id),
          queryFn: () => fetchCoreContacts<any>(user.id),
          staleTime: 60 * 60 * 1000,
        });

        if (Array.isArray(contacts)) {
          setContactsOptions(
            (contacts as any[]).map((c) => ({
              id: c.id,
              label: `${(c.first_name || "").trim()} ${(
                c.last_name || ""
              ).trim()}${c.email ? ` <${c.email}>` : ""}`.trim(),
              raw: c,
            }))
          );
        } else {
          setContactsOptions([]);
        }
      } catch (err) {
        console.error("Failed to load contacts:", err);
      } finally {
        setLoadingContacts(false);
      }
    }

    loadContacts();
    lastLoadedUserIdRef.current = user.id;
  }, [open, user?.id]);

  // --- Generate PDF ---
  const handleGenerate = () => {
    const filteredJobs = jobs.filter((job) => {
      const companyOk =
        companies.length === 0 ||
        (job.company_name && companies.includes(job.company_name));
      const roleOk =
        roles.length === 0 || (job.job_title && roles.includes(job.job_title));
      const industryOk =
        industries.length === 0 ||
        (job.industry && industries.includes(job.industry));
      return companyOk && roleOk && industryOk;
    });

    const successRates = computeSuccessRates(filteredJobs);
    const avgResponseDays = computeAvgResponseDays(filteredJobs);
    const responseRate = computeResponseRate(filteredJobs);
    const stageDurations = computeAvgStageDurations(filteredJobs);
    const monthlyApplications = computeMonthlyApplications(filteredJobs);
    const deadlineAdherence = computeDeadlineAdherence(filteredJobs);
    const timeToOffer = computeTimeToOffer(filteredJobs);
    const offerRates = compareToBenchmarks(successRates);
    const aiInsights = generateAIInsights(
      filteredJobs,
      stageDurations,
      responseRate,
      deadlineAdherence.adherence,
      timeToOffer,
      0, // weekly goal placeholder
      0 // this week applications placeholder
    );

    // --- Create PDF ---
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    let y = margin;

    doc.setFontSize(20);
    doc.text("Custom Job Search Report", margin, y);
    y += 30;

    doc.setFontSize(12);
    doc.text(`Filtered Companies: ${companies.join(", ") || "All"}`, margin, y);
    y += 14;
    doc.text(`Filtered Roles: ${roles.join(", ") || "All"}`, margin, y);
    y += 14;
    doc.text(
      `Filtered Industries: ${industries.join(", ") || "All"}`,
      margin,
      y
    );
    y += 30;

    // --- Application Metrics ---
    if (applicationMetricsChecked) {
      doc.setFontSize(16);
      doc.text("Application Metrics", margin, y);
      y += 20;
      doc.setFontSize(11);
      doc.text(`- Total applications: ${filteredJobs.length}`, margin, y);
      y += 12;
      doc.text(
        `- Monthly applications: ${monthlyApplications
          .map((m) => `${m.month}: ${m.count}`)
          .join(", ")}`,
        margin,
        y
      );
      y += 12;
      doc.text(
        `- Response rate: ${(responseRate * 100).toFixed(1)}%`,
        margin,
        y
      );
      y += 12;
      doc.text(
        `- Deadline adherence: ${(deadlineAdherence.adherence * 100).toFixed(
          1
        )}% (Met: ${deadlineAdherence.met}, Missed: ${
          deadlineAdherence.missed
        })`,
        margin,
        y
      );
      y += 12;
      doc.text(
        `- Average time to offer: ${timeToOffer.toFixed(1)} days`,
        margin,
        y
      );
      y += 12;
      y += 10;
    }

    // --- Interview Metrics ---
    if (interviewMetricsChecked) {
      doc.setFontSize(16);
      doc.text("Interview Metrics", margin, y);
      y += 20;
      doc.setFontSize(11);
      avgResponseDays.forEach((item) => {
        doc.text(
          `- Avg response days (${item.key}): ${item.avgDays.toFixed(1)} days`,
          margin,
          y
        );
        y += 12;
      });
      doc.text("- Avg stage durations:", margin, y);
      y += 12;
      Object.entries(stageDurations).forEach(([stage, dur]) => {
        doc.text(`  • ${stage}: ${dur.toFixed(1)} days`, margin, y);
        y += 12;
      });
      y += 10;
    }

    // --- Offer Metrics ---
    if (offerMetricsChecked) {
      doc.setFontSize(16);
      doc.text("Offer Metrics", margin, y);
      y += 20;
      doc.setFontSize(11);
      offerRates.forEach((o) => {
        doc.text(
          `- ${o.key}: Offer rate ${(o.userRate * 100).toFixed(
            1
          )}%, Benchmark ${(o.benchmarkRate * 100).toFixed(1)}%, Delta ${(
            o.delta * 100
          ).toFixed(1)}%`,
          margin,
          y
        );
        y += 12;
      });
      y += 10;
    }

    // --- AI Insights ---
    doc.setFontSize(16);
    //doc.text("AI Insights", margin, y); y += 20;
    doc.setFontSize(11);
    //aiInsights.forEach(i => { doc.text(`- ${i}`, margin, y); y += 12; });

    // Output PDF as blob so we can record metadata and optionally share
    const fileName = `custom_report_${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`;
    const blob = doc.output("blob");

    // Trigger browser download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    // Persist export metadata and create contact interactions for shared recipients
    (async () => {
      if (!user?.id) return;
      try {
        await db.createExportHistory(user.id, {
          document_id: "custom_report",
          version_id: new Date().toISOString(),
          format: "pdf",
          file_name: fileName,
          file_size_bytes: blob.size,
          storage_path: null,
          storage_url: null,
          export_options: {
            filters: { companies, roles, industries },
            metrics: {
              applicationMetrics: applicationMetricsChecked,
              interviewMetrics: interviewMetricsChecked,
              offerMetrics: offerMetricsChecked,
            },
            shared_with: selectedContacts.map((c) => c.id),
          },
          status: "completed",
        });

        for (const c of selectedContacts) {
          try {
            await db.createContactInteraction(user.id, {
              contact_id: c.id,
              interaction_type: "share",
              notes: `Shared report ${fileName}`,
              occurred_at: new Date().toISOString(),
              tags: ["report_share"],
            });
          } catch (err) {
            console.warn("Failed to create contact interaction for", c, err);
          }
        }

        if (selectedContacts.length > 0) {
          alert(
            `Report generated and shared with ${selectedContacts.length} contact(s).`
          );
        } else {
          alert("Report generated.");
        }
      } catch (err) {
        console.error("Failed to save export metadata:", err);
        alert("Report generated, but failed to save share metadata.");
      }
    })();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Customize Your Report</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="subtitle1">Select Metrics</Typography>
          <Stack direction="row" spacing={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={applicationMetricsChecked}
                  onChange={() =>
                    setApplicationMetricsChecked(!applicationMetricsChecked)
                  }
                />
              }
              label="Application Metrics"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={interviewMetricsChecked}
                  onChange={() =>
                    setInterviewMetricsChecked(!interviewMetricsChecked)
                  }
                />
              }
              label="Interview Metrics"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={offerMetricsChecked}
                  onChange={() => setOfferMetricsChecked(!offerMetricsChecked)}
                />
              }
              label="Offer Metrics"
            />
          </Stack>

          <Typography variant="subtitle1">Filters</Typography>
          <Autocomplete
            multiple
            freeSolo
            options={companiesOptions}
            value={companies}
            onChange={(_, v) => setCompanies(v as string[])}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option} {...getTagProps({ index })} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Companies"
                placeholder="Add companies"
                fullWidth
              />
            )}
          />
          <Autocomplete
            multiple
            freeSolo
            options={rolesOptions}
            value={roles}
            onChange={(_, v) => setRoles(v as string[])}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option} {...getTagProps({ index })} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Roles"
                placeholder="Add roles"
                fullWidth
              />
            )}
          />
          <Autocomplete
            multiple
            freeSolo
            options={industriesOptions}
            value={industries}
            onChange={(_, v) => setIndustries(v as string[])}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option} {...getTagProps({ index })} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Industries"
                placeholder="Add industries"
                fullWidth
              />
            )}
          />

          <Typography variant="subtitle1">Share</Typography>
          <Autocomplete
            multiple
            options={contactsOptions}
            getOptionLabel={(opt) => (opt?.label ? opt.label : String(opt))}
            value={selectedContacts}
            onChange={(_, v) => setSelectedContacts(v as any[])}
            loading={loadingContacts}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option.label} {...getTagProps({ index })} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Share with contacts"
                placeholder="Select contacts to share with"
                fullWidth
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleGenerate}>
          Generate PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}
