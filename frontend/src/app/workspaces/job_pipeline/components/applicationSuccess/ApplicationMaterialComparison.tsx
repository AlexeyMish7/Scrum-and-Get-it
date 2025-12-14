import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Stack,
  Chip,
  Alert,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  List,
  ListItem,
  ListItemText
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import AddLinkIcon from '@mui/icons-material/AddLink';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { withUser } from "@shared/services/crud";

// --- Interfaces ---

interface DocumentRow {
  id: string;
  name: string;
}

interface DocumentVersionRow {
  id: string;
  document_id: string;
  version_number: number;
  name: string;
  created_at: string;
}

interface DocumentJobRow {
  id: string;
  job_id: number;
  version_id: string;
  document_id: string;
}

interface JobRow {
  id: number;
  job_title: string;
  company_name: string;
  job_status: string;
  created_at: string;
  status_changed_at: string;
}

interface VersionMetrics {
  versionId: string;
  displayName: string;
  totalApps: number;
  responses: number;
  interviews: number;
  offers: number;
  responseRate: number;
  interviewRate: number;
  offerRate: number;
  associatedJobs: JobRow[];
}

// --- Constants ---

// Response Rate: Includes Phone Screen (User Request: "update response rate")
const RESPONDED_STAGES = ['Phone Screen', 'Interview', 'Offer', 'Accepted', 'Declined', 'Rejected'];

// Interview Rate: STRICTLY excludes Phone Screen (User Request: "not the interview rate")
const INTERVIEW_STAGES = ['Interview', 'Offer', 'Accepted', 'Declined'];

// Offer Rate
const OFFER_STAGES = ['Offer', 'Accepted', 'Declined'];

export default function ResumeVersionAnalytics() {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();

  // State
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  
  // Data for the selected document
  const [versions, setVersions] = useState<DocumentVersionRow[]>([]);
  const [docJobs, setDocJobs] = useState<DocumentJobRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);

  // Modal & UI State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [versionToLink, setVersionToLink] = useState<string | null>(null);
  const [jobIdToLink, setJobIdToLink] = useState<string>(""); 
  const [linking, setLinking] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 1. Initial Load: Fetch Documents only
  useEffect(() => {
    if (!user?.id) return;
    const fetchDocs = async () => {
      try {
        const userCrud = withUser(user.id);
        const { data, error } = await userCrud.listRows<DocumentRow>("documents", "id, name");
        if (error) throw error;
        setDocuments(data || []);
      } catch (err) {
        handleError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [user?.id, handleError]);

  // 2. Fetch Details (Reusable)
  const refreshData = useCallback(async () => {
    if (!user?.id || !selectedDocId) return;

    try {
      const userCrud = withUser(user.id);

      // A. Fetch Versions
      const vRes = await userCrud.listRows<DocumentVersionRow>(
        "document_versions",
        "*",
        {
          eq: { document_id: selectedDocId },
          order: { column: "version_number", ascending: true },
        }
      );
      if (vRes.error) throw vRes.error;

      // B. Fetch Links (Filtered by Document ID)
      const djRes = await userCrud.listRows<DocumentJobRow>(
        "document_jobs",
        "id, job_id, version_id, document_id",
        { eq: { document_id: selectedDocId } }
      );
      if (djRes.error) throw djRes.error;

      // C. Fetch All Jobs
      const jRes = await userCrud.listRows<JobRow>(
        "jobs", 
        "id, job_title, company_name, job_status, created_at, status_changed_at"
      );
      if (jRes.error) throw jRes.error;

      setVersions(vRes.data || []);
      setDocJobs(djRes.data || []);
      setJobs(jRes.data || []);

    } catch (err) {
      handleError(err as Error);
    }
  }, [selectedDocId, user?.id, handleError]);

  // Trigger refresh when selection changes
  useEffect(() => {
    if (selectedDocId) {
      setLoading(true);
      refreshData().finally(() => setLoading(false));
    }
  }, [selectedDocId, refreshData]);

  // 3. Link Job Logic
  const handleLinkJob = async () => {
    // Validations to ensure we can link
    if (!user?.id || !versionToLink || !jobIdToLink || !selectedDocId) return;
    
    setLinking(true);
    try {
      const userCrud = withUser(user.id);
      
      const { error } = await userCrud.insertRow("document_jobs", {
        document_id: selectedDocId,
        version_id: versionToLink,
        job_id: parseInt(jobIdToLink), // Ensure number
        status: "submitted",
      });

      if (error) throw error;

      setToastMsg("Job successfully linked!");
      setIsLinkModalOpen(false);
      setJobIdToLink("");
      setVersionToLink(null);

      // Refresh data to reflect stats immediately
      await refreshData();

    } catch (err) {
      handleError(err as Error);
    } finally {
      setLinking(false);
    }
  };

  // 4. Calculate Metrics
  const metricsData = useMemo(() => {
    const results: VersionMetrics[] = [];

    versions.forEach(v => {
      // Find links for this version
      const linkedJobIds = docJobs
        .filter(dj => dj.version_id === v.id)
        .map(dj => dj.job_id);
      
      // Get the actual job objects
      const associatedJobs = jobs.filter(j => linkedJobIds.includes(j.id));
      const totalApps = associatedJobs.length;

      // --- Metric Logic ---
      // Response Rate: Includes Phone Screen
      const responses = associatedJobs.filter(j => RESPONDED_STAGES.includes(j.job_status)).length;
      
      // Interview Rate: Excludes Phone Screen
      const interviews = associatedJobs.filter(j => INTERVIEW_STAGES.includes(j.job_status)).length;
      
      // Offer Rate
      const offers = associatedJobs.filter(j => OFFER_STAGES.includes(j.job_status)).length;

      results.push({
        versionId: v.id,
        displayName: v.name || `v${v.version_number}`,
        totalApps,
        responses,
        interviews,
        offers,
        responseRate: totalApps > 0 ? Math.round((responses / totalApps) * 100) : 0,
        interviewRate: totalApps > 0 ? Math.round((interviews / totalApps) * 100) : 0,
        offerRate: totalApps > 0 ? Math.round((offers / totalApps) * 100) : 0,
        associatedJobs
      });
    });

    return results;
  }, [versions, docJobs, jobs]);

  // Helper: Open Modal
  const openLinkModal = (vId: string) => {
    setVersionToLink(vId);
    setJobIdToLink("");
    setIsLinkModalOpen(true);
  };

  // Helper: Filter jobs for the dropdown
  const availableJobs = useMemo(() => {
    if (!versionToLink) return [];
    
    // 1. Identify jobs already linked to *THIS DOCUMENT* (any version).
    // This prevents linking the same job to Version 1 AND Version 2 (which is usually an error).
    const linkedIds = docJobs.map(dj => dj.job_id);
    
    // 2. Filter available jobs (ensure IDs are valid)
    return jobs.filter(j => j.id && !linkedIds.includes(j.id));
  }, [jobs, docJobs, versionToLink]);

  // Helper: Status Color for List
  const getStatusColor = (status: string) => {
    if (OFFER_STAGES.includes(status)) return "success";
    if (INTERVIEW_STAGES.includes(status)) return "primary";
    if (status === 'Phone Screen') return "info";
    if (['Rejected', 'Declined'].includes(status)) return "error";
    return "default";
  };


  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', p: 2 }}>
      
      {/* HEADER & SELECTOR */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: {xs: 'column', md: 'row'}, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Box>
           <Typography variant="h5" fontWeight="700">Resume Analytics</Typography>
           <Typography variant="body2" color="text.secondary">Select a document to analyze version performance</Typography>
        </Box>

        <FormControl sx={{ minWidth: 250 }} size="small">
          <InputLabel>Select Document</InputLabel>
          <Select
            value={selectedDocId}
            label="Select Document"
            onChange={(e) => setSelectedDocId(e.target.value)}
            disabled={documents.length === 0}
          >
            {documents.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* LOADING STATE */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {/* EMPTY STATE */}
      {!loading && !selectedDocId && (
        <Alert severity="info">Please select a resume document from the dropdown above to view analytics.</Alert>
      )}

      {/* DASHBOARD CONTENT */}
      {!loading && selectedDocId && (
        <>
           {metricsData.every(m => m.totalApps === 0) && (
             <Alert severity="warning" sx={{ mb: 3 }}>
               No job applications are linked to versions of this document yet. 
             </Alert>
           )}

           {/* CHART */}
           {metricsData.some(m => m.totalApps > 0) && (
            <Card sx={{ mb: 4, borderRadius: 2 }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
                <Typography variant="h6">Funnel Volume (Counts)</Typography>
              </Box>
              <Box sx={{ height: 350, width: '100%', p: 2 }}>
                <ResponsiveContainer>
                  <BarChart data={metricsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="displayName" tick={{fontSize: 12}} />
                    <YAxis allowDecimals={false} label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                    <RechartsTooltip cursor={{fill: 'transparent'}} />
                    <Legend />
                    <Bar name="Applied" dataKey="totalApps" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar name="Interviews" dataKey="interviews" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar name="Offers" dataKey="offers" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card>
           )}

           {/* VERSIONS CARDS */}
           <Typography variant="h6" sx={{ mb: 2 }}>Detailed Statistics</Typography>
           
           <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {metricsData.map((m) => (
                <Card 
                  key={m.versionId} 
                  variant="outlined" 
                  sx={{ 
                    borderRadius: 2, 
                    display: 'flex', 
                    flexDirection: 'column',
                    // Flex basis sizing instead of grid
                    width: { xs: '100%', md: 'calc(50% - 12px)', lg: 'calc(33.333% - 16px)' }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Header */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle1" fontWeight="bold">{m.displayName}</Typography>
                      <Chip 
                        label={`${m.totalApps} Apps`} 
                        size="small" 
                        variant="outlined" 
                      />
                    </Stack>

                    <Divider sx={{ mb: 2 }} />

                    {m.totalApps > 0 ? (
                      <Box>
                         {/* Stats Row */}
                         <Stack direction="row" spacing={1} width="100%" mb={2}>
                            <Box sx={{ flex: 1, textAlign: 'center', p: 1, bgcolor: '#f8fafc', borderRadius: 1 }}>
                               <Typography variant="h6" color="primary.main" fontWeight="bold">{m.responseRate}%</Typography>
                               <Typography variant="caption" display="block" lineHeight={1.2} color="text.secondary">Response<br/>Rate</Typography>
                            </Box>

                            <Box sx={{ flex: 1, textAlign: 'center', p: 1, bgcolor: '#f8fafc', borderRadius: 1 }}>
                               <Typography variant="h6" color="secondary.main" fontWeight="bold">{m.interviewRate}%</Typography>
                               <Typography variant="caption" display="block" lineHeight={1.2} color="text.secondary">Interview<br/>Rate</Typography>
                            </Box>

                            <Box sx={{ flex: 1, textAlign: 'center', p: 1, bgcolor: '#f8fafc', borderRadius: 1 }}>
                               <Typography variant="h6" color="success.main" fontWeight="bold">{m.offerRate}%</Typography>
                               <Typography variant="caption" display="block" lineHeight={1.2} color="text.secondary">Offer<br/>Rate</Typography>
                            </Box>
                         </Stack>
                         
                         {/* Linked Jobs List */}
                         <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '0.85rem', color: 'text.secondary' }}>
                            Linked Applications:
                         </Typography>
                         
                         <List dense sx={{ 
                             maxHeight: '150px', 
                             overflowY: 'auto', 
                             bgcolor: '#fafafa', 
                             borderRadius: 1,
                             border: '1px solid #eee',
                             p: 0
                           }}>
                           {m.associatedJobs.map((job) => (
                             <ListItem key={job.id} divider sx={{ py: 0.5, px: 1 }}>
                                <ListItemText 
                                  primary={
                                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                                      <Typography variant="body2" noWrap sx={{ maxWidth: '60%', fontWeight: 500 }}>
                                        {job.company_name}
                                      </Typography>
                                      <Chip 
                                        label={job.job_status} 
                                        size="small" 
                                        color={getStatusColor(job.job_status) as any} 
                                        sx={{ height: 20, fontSize: '0.7rem' }} 
                                      />
                                    </Stack>
                                  }
                                  secondary={
                                    <Typography variant="caption" color="text.secondary" noWrap>
                                      {job.job_title}
                                    </Typography>
                                  }
                                />
                             </ListItem>
                           ))}
                         </List>

                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic', textAlign: 'center' }}>
                        No usage data yet.
                      </Typography>
                    )}
                  </CardContent>
                  
                  <Divider />
                  
                  <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
                     <Button 
                        startIcon={<AddLinkIcon />} 
                        size="small" 
                        onClick={() => openLinkModal(m.versionId)}
                     >
                       Link Job
                     </Button>
                  </Box>
                </Card>
              ))}
           </Box>
        </>
      )}

      {/* --- MODAL --- */}
      <Dialog open={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, pb: 0 }}>
           <DialogTitle sx={{ p: 0 }}>Link Job to Version</DialogTitle>
           <IconButton onClick={() => setIsLinkModalOpen(false)}><CloseIcon /></IconButton>
        </Box>
        
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            Select a job from your board. Jobs already linked to this document are hidden.
          </Typography>

          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Select Job Application</InputLabel>
            <Select
              value={jobIdToLink}
              label="Select Job Application"
              onChange={(e) => setJobIdToLink(e.target.value)}
            >
              {availableJobs.length > 0 ? (
                availableJobs.map((j) => (
                  <MenuItem key={j.id} value={j.id.toString()}>
                    {j.company_name} - {j.job_title} ({j.job_status})
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled value="">
                  {jobs.length === 0 ? "No jobs found" : "All jobs already linked"}
                </MenuItem>
              )}
            </Select>
          </FormControl>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsLinkModalOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleLinkJob} 
            disabled={!jobIdToLink || linking}
          >
            {linking ? "Linking..." : "Link Job"}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={!!toastMsg}
        autoHideDuration={4000}
        onClose={() => setToastMsg(null)}
        message={toastMsg}
      />

    </Box>
  );
}