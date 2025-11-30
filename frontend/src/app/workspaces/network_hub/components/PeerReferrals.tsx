/**
 * PEER REFERRALS COMPONENT
 *
 * Displays and manages job referrals shared within a peer group.
 * Members can share referral opportunities and express interest.
 *
 * Features:
 * - Browse referrals shared by group members
 * - Share new referral opportunities
 * - Express interest in referrals
 * - Track referral status
 */

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  Avatar,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Link,
  Tooltip,
} from "@mui/material";
import {
  Share as ShareIcon,
  Work as WorkIcon,
  LocationOn as LocationIcon,
  AttachMoney as SalaryIcon,
  CalendarToday as DeadlineIcon,
  Launch as ExternalLinkIcon,
  Add as AddIcon,
  Handshake as ReferralIcon,
  CheckCircle as AppliedIcon,
  Favorite as InterestedIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import {
  getGroupReferrals,
  createReferral,
  expressInterest,
} from "../services/peerGroupsService";
import type {
  PeerReferralWithSharer,
  CreateReferralData,
} from "../types/peerGroups.types";

// ============================================================================
// PROPS AND TYPES
// ============================================================================

interface PeerReferralsProps {
  groupId: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const days = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}

function daysUntilDeadline(dateString: string | null): number | null {
  if (!dateString) return null;
  const deadline = new Date(dateString);
  const now = new Date();
  return Math.ceil(
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
}

// ============================================================================
// REFERRAL CARD COMPONENT
// ============================================================================

interface ReferralCardProps {
  referral: PeerReferralWithSharer;
  onInterest: (referralId: string, status: "interested" | "applied") => void;
  isUpdating: boolean;
}

function ReferralCard({ referral, onInterest, isUpdating }: ReferralCardProps) {
  const daysLeft = daysUntilDeadline(referral.application_deadline);
  const isExpired = daysLeft !== null && daysLeft < 0;
  const isUrgent = daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;

  const userStatus = referral.user_interest?.status;

  return (
    <Card
      sx={{
        mb: 2,
        opacity: isExpired ? 0.6 : 1,
        border: referral.is_internal_referral ? "2px solid" : "none",
        borderColor: referral.is_internal_referral ? "success.main" : undefined,
      }}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: referral.is_internal_referral
                ? "success.main"
                : "primary.main",
              width: 48,
              height: 48,
            }}
          >
            {referral.is_internal_referral ? <ReferralIcon /> : <WorkIcon />}
          </Avatar>
          <Box sx={{ ml: 2, flexGrow: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h6">{referral.job_title}</Typography>
              {referral.is_internal_referral && (
                <Tooltip title="This person can refer you directly">
                  <Chip
                    label="Internal Referral"
                    size="small"
                    color="success"
                    sx={{ fontSize: "0.7rem" }}
                  />
                </Tooltip>
              )}
            </Box>
            <Typography variant="body2" color="primary.main" fontWeight="bold">
              {referral.company_name}
            </Typography>
          </Box>
          {isUrgent && (
            <Chip
              label={`${daysLeft} days left!`}
              size="small"
              color="warning"
            />
          )}
          {isExpired && <Chip label="Expired" size="small" color="default" />}
        </Box>

        {/* Details */}
        <Stack spacing={1} sx={{ mb: 2 }}>
          {referral.location && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <LocationIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                {referral.location}
              </Typography>
            </Box>
          )}
          {referral.salary_range && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <SalaryIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                {referral.salary_range}
              </Typography>
            </Box>
          )}
          {referral.application_deadline && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <DeadlineIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                Deadline:{" "}
                {new Date(referral.application_deadline).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Description */}
        {referral.job_description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {referral.job_description}
          </Typography>
        )}

        {/* Referral notes */}
        {referral.referral_notes && (
          <Box
            sx={{
              p: 1.5,
              bgcolor: "grey.100",
              borderRadius: 1,
              mb: 2,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              📝 Notes from {referral.sharer?.display_name || "member"}:
            </Typography>
            <Typography variant="body2">{referral.referral_notes}</Typography>
          </Box>
        )}

        {/* Shared by and link */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar sx={{ width: 24, height: 24, fontSize: "0.8rem" }}>
              {referral.sharer?.display_name?.charAt(0) || <PersonIcon />}
            </Avatar>
            <Typography variant="caption" color="text.secondary">
              Shared by {referral.sharer?.display_name || "a member"} •{" "}
              {getTimeAgo(referral.created_at)}
            </Typography>
          </Box>
          {referral.job_link && (
            <Link
              href={referral.job_link}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <ExternalLinkIcon fontSize="small" />
              View Job
            </Link>
          )}
        </Box>

        {/* Interest count and actions */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {referral.interested_count || 0} people interested
          </Typography>

          {!isExpired && (
            <Stack direction="row" spacing={1}>
              {userStatus === "applied" ? (
                <Chip
                  icon={<AppliedIcon />}
                  label="Applied!"
                  color="success"
                  size="small"
                />
              ) : userStatus === "interested" ? (
                <>
                  <Chip
                    icon={<InterestedIcon />}
                    label="Interested"
                    color="primary"
                    size="small"
                  />
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={() => onInterest(referral.id, "applied")}
                    disabled={isUpdating}
                  >
                    Mark Applied
                  </Button>
                </>
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={
                    isUpdating ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <InterestedIcon />
                    )
                  }
                  onClick={() => onInterest(referral.id, "interested")}
                  disabled={isUpdating}
                >
                  I'm Interested
                </Button>
              )}
            </Stack>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SHARE REFERRAL DIALOG
// ============================================================================

interface ShareReferralDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateReferralData) => void;
  submitting: boolean;
  groupId: string;
}

function ShareReferralDialog({
  open,
  onClose,
  onSubmit,
  submitting,
  groupId,
}: ShareReferralDialogProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [jobLink, setJobLink] = useState("");
  const [location, setLocation] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!jobTitle || !company) return;

    const data: CreateReferralData = {
      group_id: groupId,
      job_title: jobTitle,
      company_name: company,
      job_description: description || undefined,
      job_link: jobLink || undefined,
      location: location || undefined,
      salary_range: salaryRange || undefined,
      application_deadline: deadline || undefined,
      is_internal_referral: isInternal,
      referral_notes: notes || undefined,
    };

    onSubmit(data);
  };

  const handleClose = () => {
    // Reset form
    setJobTitle("");
    setCompany("");
    setDescription("");
    setJobLink("");
    setLocation("");
    setSalaryRange("");
    setDeadline("");
    setIsInternal(false);
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ShareIcon color="primary" />
          Share a Referral
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {/* Required fields */}
          <TextField
            fullWidth
            label="Job Title *"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Company Name *"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Internal referral toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
              />
            }
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <ReferralIcon fontSize="small" />I can refer people directly
                (internal referral)
              </Box>
            }
            sx={{ mb: 2 }}
          />

          {/* Optional fields */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Job Description"
            placeholder="Key requirements, responsibilities, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Job Link"
            placeholder="https://..."
            value={jobLink}
            onChange={(e) => setJobLink(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Location"
              placeholder="e.g., Remote, NYC"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <TextField
              fullWidth
              label="Salary Range"
              placeholder="e.g., $100k-$130k"
              value={salaryRange}
              onChange={(e) => setSalaryRange(e.target.value)}
            />
          </Stack>

          <TextField
            fullWidth
            type="date"
            label="Application Deadline"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Notes for Group Members"
            placeholder="Any tips, context, or instructions for interested members..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!jobTitle || !company || submitting}
          startIcon={
            submitting ? <CircularProgress size={16} /> : <ShareIcon />
          }
        >
          {submitting ? "Sharing..." : "Share Referral"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PeerReferrals({ groupId }: PeerReferralsProps) {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<PeerReferralWithSharer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingReferralId, setUpdatingReferralId] = useState<string | null>(
    null
  );

  const userId = user?.id;

  // Fetch referrals
  const fetchReferrals = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    const result = await getGroupReferrals(userId, groupId);

    if (result.error) {
      setError(result.error.message);
    } else {
      setReferrals(result.data || []);
    }
    setLoading(false);
  }, [userId, groupId]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  // Handle sharing a referral
  async function handleShareReferral(data: CreateReferralData) {
    if (!userId) return;

    setSubmitting(true);
    const result = await createReferral(userId, data);

    if (result.error) {
      setError(result.error.message);
    } else {
      setShareDialogOpen(false);
      fetchReferrals();
    }
    setSubmitting(false);
  }

  // Handle expressing interest
  async function handleInterest(
    referralId: string,
    status: "interested" | "applied"
  ) {
    if (!userId) return;

    setUpdatingReferralId(referralId);
    const result = await expressInterest(userId, referralId, status);

    if (result.error) {
      setError(result.error.message);
    } else {
      // Update local state
      setReferrals((prev) =>
        prev.map((r) =>
          r.id === referralId
            ? {
                ...r,
                user_interest: {
                  ...r.user_interest,
                  status,
                } as typeof r.user_interest,
                interested_count:
                  (r.interested_count || 0) + (r.user_interest ? 0 : 1),
              }
            : r
        )
      );
    }
    setUpdatingReferralId(null);
  }

  if (!userId) {
    return <Alert severity="warning">Please log in to view referrals.</Alert>;
  }

  // Separate internal referrals for priority display
  const internalReferrals = referrals.filter((r) => r.is_internal_referral);
  const externalReferrals = referrals.filter((r) => !r.is_internal_referral);

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <ReferralIcon color="primary" />
            Peer Referrals
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Job opportunities shared by group members
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShareDialogOpen(true)}
        >
          Share Referral
        </Button>
      </Box>

      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Referrals list */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : referrals.length === 0 ? (
        <Card sx={{ p: 4, textAlign: "center" }}>
          <ReferralIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No referrals shared yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Be the first to share a job opportunity with your peers!
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShareDialogOpen(true)}
          >
            Share Referral
          </Button>
        </Card>
      ) : (
        <>
          {/* Internal referrals first */}
          {internalReferrals.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="overline" color="success.main">
                🤝 Internal Referrals (Direct Referral Available)
              </Typography>
              <Stack spacing={2}>
                {internalReferrals.map((referral) => (
                  <ReferralCard
                    key={referral.id}
                    referral={referral}
                    onInterest={handleInterest}
                    isUpdating={updatingReferralId === referral.id}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* External referrals */}
          {externalReferrals.length > 0 && (
            <Box>
              {internalReferrals.length > 0 && (
                <Typography variant="overline" color="text.secondary">
                  Other Opportunities
                </Typography>
              )}
              <Stack spacing={2}>
                {externalReferrals.map((referral) => (
                  <ReferralCard
                    key={referral.id}
                    referral={referral}
                    onInterest={handleInterest}
                    isUpdating={updatingReferralId === referral.id}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </>
      )}

      {/* Share Referral Dialog */}
      <ShareReferralDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        onSubmit={handleShareReferral}
        submitting={submitting}
        groupId={groupId}
      />
    </Box>
  );
}
