import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import QuickActionButton from "../../../../shared/components/common/QuickActionButton";
import InformationInterviewContactPicker from "./InformationInterviewContactPicker";
import InformationInterviewJobPicker from "./InformationInterviewJobPicker";
import { useAuth } from "@shared/context/AuthContext";
import aiClient from "@shared/services/ai/client";
import * as db from "@shared/services/dbMappers";

type Props = {
  open?: boolean;
  onClose: () => void;
};

function AIPlaceholder({ label }: { label: string }) {
  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", p: 2, borderRadius: 1 }}>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <QuickActionButton label="Generate (placeholder)" onClick={() => {}} size="small" />
    </Box>
  );
}

export default function InformationInterviewDialog({ open, onClose }: Props) {
  const isOpen = !!open;

  // number of steps currently revealed (starts with 1)
  const [revealed, setRevealed] = useState(1);

  // Step data
  const [contactId, setContactId] = useState<string>("");
  const [selectedContact, setSelectedContact] = useState<Record<string, any> | null>(null);
  const [jobId, setJobId] = useState<string>("");
  const [selectedJob, setSelectedJob] = useState<Record<string, any> | null>(null);
  const [topic, setTopic] = useState<string>("");
  const [preferredTime, setPreferredTime] = useState<string | null>(null);

  const { user } = useAuth();

  const [generateLoading, setGenerateLoading] = useState(false);
  const [persistedRowId, setPersistedRowId] = useState<string | null>(null);

  const [generatedEmail, setGeneratedEmail] = useState<string | null>(null);
  const [generatedPrep, setGeneratedPrep] = useState<string | null>(null);
  const [generatedSubject, setGeneratedSubject] = useState<string | null>(null);

  function reset() {
    setRevealed(1);
    setContactId("");
    setJobId("");
    setTopic("");
    setGeneratedEmail(null);
    setGeneratedPrep(null);
  }

  function close() {
    reset();
    onClose();
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={close} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        Request Informational Interview
        <IconButton aria-label="close" onClick={close} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Step 1 */}
          <Box>
            <Typography variant="h6">1. Select a contact</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Search your contacts by name, company, industry or role.
            </Typography>
            {/* Contact picker component */}
            <InformationInterviewContactPicker
              initialQuery={contactId}
              onSelect={(row: any) => {
                // store full row for richer AI prompt
                setSelectedContact(row);
                setContactId(String(row.id ?? row.contact_id ?? row.uid ?? ""));
                setRevealed((r) => Math.max(r, 2));
              }}
            />
            {selectedContact && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">Selected: {`${selectedContact.first_name ?? ""} ${selectedContact.last_name ?? ""}`.trim() || selectedContact.full_name || contactId}</Typography>
              </Box>
            )}
          </Box>

          {/* Step 2: select job AND/OR choose a topic */}
          {revealed >= 2 && (
            <Box>
              <Typography variant="h6">2. Optional: Select a job and/or choose a topic</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Search your saved jobs by title or company and optionally pick a topic for the interview.
              </Typography>

              <InformationInterviewJobPicker
                initialQuery={jobId}
                initialTopic={topic}
                onSelectJob={(row) => {
                  setSelectedJob(row ?? null);
                  setJobId(row ? String(row.id ?? row.job_id ?? "") : "");
                }}
                onChangeTopic={(t) => setTopic(t)}
              />

              <Box sx={{ mt: 1 }}>
                <QuickActionButton label="Continue" onClick={() => setRevealed((r) => Math.max(r, 3))} size="small" />
              </Box>
            </Box>
          )}

          {/* Step 3: optional preferred date/time to propose */}
          {revealed >= 3 && (
            <Box>
              <Typography variant="h6">3. Optional: Propose a date & time</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Optionally pick a preferred date and time to propose in your outreach. We'll include this explicitly in the generated email (e.g., "Are you available on ...?").
              </Typography>

              <TextField
                label="Preferred meeting time"
                type="datetime-local"
                value={preferredTime ?? ""}
                onChange={(e) => setPreferredTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <Box sx={{ mt: 1 }}>
                <QuickActionButton label="Continue" onClick={() => setRevealed((r) => Math.max(r, 4))} size="small" />
              </Box>
            </Box>
          )}

          {/* Step 4 (email generation) - was step 3 previously */}
          {revealed >= 4 && (
            <Box>
              <Typography variant="h6">3. Generate Email Template and Preparation Notes </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                This step will use an AI helper to generate a professional email template and prepartion notes for the interview.
              </Typography>
              <Box>
                <Box sx={{ mb: 1 }}>
                  <QuickActionButton
                    label={generateLoading ? "Generating…" : "Generate"}
                    onClick={async () => {
                      if (!user) return;
                      if (!selectedContact) return alert("Please select a contact first.");
                      setGenerateLoading(true);
                      setPersistedRowId(null);
                      try {
                        const payload: Record<string, unknown> = {
                          name: `${selectedContact.first_name ?? ""} ${selectedContact.last_name ?? ""}`.trim() || undefined,
                          company: selectedContact.company ?? selectedJob?.company_name ?? undefined,
                          industry: selectedContact.industry ?? undefined,
                          // Do NOT send personal_notes or professional_notes to the generation endpoint.
                            contact_id: selectedContact.id ?? selectedContact.contact_id ?? undefined,
                            preferred_time: preferredTime ?? undefined,
                          jobId: selectedJob?.id ?? selectedJob?.job_id ?? undefined,
                          job_title: selectedJob?.job_title ?? undefined,
                          job_company: selectedJob?.company_name ?? undefined,
                          topic: topic ?? undefined,
                        };

                        const resp = await aiClient.postJson<{ subject?: string; email?: string; prep?: string[] }>(
                          "/api/generate/interview-request",
                          payload,
                          user.id
                        );

                        // Show generated content
                        setGeneratedSubject(resp.subject ?? null);
                        setGeneratedEmail(resp.email ?? null);
                        setGeneratedPrep(Array.isArray(resp.prep) ? resp.prep.join("\n") : (resp.prep ? String(resp.prep) : null));

                        // Do not persist yet — wait for user to review and click Finish.
                      } catch (err) {
                        console.error("Generate interview request failed", err);
                        alert("Failed to generate interview request. Try again.");
                      } finally {
                        setGenerateLoading(false);
                        setRevealed((r) => Math.max(r, 4));
                      }
                    }}
                    size="small"
                  />
                </Box>

                {generateLoading && <Typography variant="body2">Generating…</Typography>}

                {generatedEmail ? (
                  <TextField
                    fullWidth
                    multiline
                    minRows={6}
                    value={generatedEmail}
                    onChange={(e) => setGeneratedEmail(e.target.value)}
                  />
                ) : null}

                {generatedPrep ? (
                  <TextField fullWidth multiline minRows={3} value={generatedPrep} sx={{ mt: 1 }} />
                ) : null}

                {persistedRowId ? (
                  <Typography variant="caption" color="success.main">Saved as informational_interviews id: {persistedRowId}</Typography>
                ) : null}
              </Box>
            </Box>
          )}

        </Stack>
      </DialogContent>

      <DialogActions>
        <QuickActionButton label="Cancel" onClick={close} size="small" />
        <QuickActionButton
          label="Finish"
          onClick={async () => {
            if (!user) return alert("You must be signed in to save this interview.");

            const requestTemplate: Record<string, unknown> = {
              subject: generatedSubject ?? (selectedJob ? `Quick question about ${selectedJob.job_title ?? selectedJob.job_title}` : topic ?? ""),
              email: generatedEmail ?? "",
              prep: generatedPrep ? generatedPrep.split("\n").map((s) => s.trim()).filter(Boolean) : [],
            };

            const payload: Record<string, unknown> = {
              contact_id: (selectedContact?.id ?? selectedContact?.contact_id ?? contactId) || null,
              request_template: requestTemplate,
                preferred_time: preferredTime ?? null,
                // Persist the chosen preferred meeting time into the interview_date field
                interview_date: preferredTime ? new Date(preferredTime).toISOString() : null,
              prepartion_notes: { prep: requestTemplate.prep ?? [] },
              additional_notes: null,
            };

            try {
              if (persistedRowId) {
                // update existing row
                await db.updateInformationalInterview(user.id, persistedRowId, payload);
              } else {
                const created = await db.createInformationalInterview(user.id, payload);
                if (!created.error && created.data && (created.data as any).id) {
                  setPersistedRowId(String((created.data as any).id));
                }
              }
              close();
            } catch (e) {
              console.error("Failed to save informational interview", e);
              alert("Failed to save informational interview. Please try again.");
            }
          }}
          size="small"
        />
      </DialogActions>
    </Dialog>
  );
}
//This will be a step by step process and upon completing one step it will open the next one 
//The steps will be:
//1. Select a contact from your connections (allow the user to search by name, company, or role, or the three of them and sort by relationship strength)
//2. Optionally select a job that they want to talk about from their saved jobs (allow the user to search by job title, company, or location)
//2. Optionally allow the to choose a general topic like "career advice", "industry insights", "resume review", etc.
//3. Generate a professional email template that they can customize and send to the contact
//4. Generate a prepartion frameowrk for the interview such as questions to ask depending on the job or topic selected and information about the contact (professional or personal notes )
