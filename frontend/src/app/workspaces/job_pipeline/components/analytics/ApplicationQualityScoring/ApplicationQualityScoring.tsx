import React, { useEffect, useState, useCallback } from "react";
import { 
  Box, Typography, Card, CardContent, Chip, Stack, Divider, 
  Alert, Button, Switch, FormControlLabel, CircularProgress, 
  FormControl, InputLabel, Select, MenuItem, Checkbox, List, ListItem, ListItemIcon, ListItemText
} from "@mui/material";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useAuth } from "@shared/context/AuthContext";

// Services (We still list docs to populate the dropdowns, but we don't fetch text)
import { listDocuments, type DocumentRow } from "@shared/services/documents"; 

// --- 1. PURE SIMULATION SERVICE ---
// This function ignores actual text and generates a "realistic" fake result
interface AnalysisResult {
  score: number;
  matchLevel: "Excellent" | "Good" | "Fair";
  feedback: string[];
  missingSkills: string[];
  strengths: string[];
  suggestions?: Suggestion[];
}

interface Suggestion {
  id: string;
  text: string;
  impact: number; // points to add to score when applied
}

const simulateAIAnalysis = async (): Promise<AnalysisResult> => {
  return new Promise((resolve) => {
    // Simulate network/processing delay (1.5s - 2.5s)
    const delay = Math.floor(Math.random() * 1000) + 1500;

    setTimeout(() => {
      // Generate a random "Good" score (75 - 98)
      const score = Math.floor(Math.random() * (98 - 75 + 1) + 75);
      
      let level: AnalysisResult['matchLevel'] = "Good";
      if (score >= 90) level = "Excellent";
      else if (score < 80) level = "Fair";

      // Randomize feedback to make it feel "live"
      const feedbackOptions = [
        "Experience timeline is clear and relevant to the job description.",
        "Strong use of action verbs in recent roles.",
        "Quantifiable metrics (e.g., '20% growth') are well placed.",
        "Skills section aligns perfectly with the required tech stack.",
        "Summary statement effectively captures career trajectory.",
        "Education section is concise and formatted correctly."
      ];
      
      // Shuffle and pick 3 random feedback points
      const shuffledFeedback = feedbackOptions.sort(() => 0.5 - Math.random()).slice(0, 3);

      resolve({
        score,
        matchLevel: level,
        feedback: shuffledFeedback,
        // We hardcode some generic "tech" skills for the simulation
        missingSkills: ["Cloud Architecture", "System Design"], 
        strengths: ["React", "TypeScript", "Team Leadership", "Agile"]
        ,
        // Provide prioritized improvement suggestions with impact scores
        suggestions: [
          { id: 's1', text: "Add explicit System Design and Architecture examples in recent projects.", impact: 10 },
          { id: 's2', text: "Quantify achievements with metrics for two recent roles (e.g., % improvements).", impact: 7 },
          { id: 's3', text: "Add short summary sentence tying experience to cloud systems/architecture.", impact: 5 }
        ]
      });
    }, delay);
  });
};

// --- COMPONENT ---
interface ApplicationQualityScoringProps {
  job?: any | null;
  matchData?: any | null;
  onValidationChange?: (isValid: boolean) => void;
}

interface DocOption {
  id: string;
  name: string;
  created_at: string;
}

export default function ApplicationQualityScoring({ job, onValidationChange }: ApplicationQualityScoringProps) {
  const { user } = useAuth();
  
  // State
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [resumeOptions, setResumeOptions] = useState<DocOption[]>([]);
  const [coverOptions, setCoverOptions] = useState<DocOption[]>([]);
  
  // Selection State
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [selectedCoverId, setSelectedCoverId] = useState<string>("");
  const [linkedInVerified, setLinkedInVerified] = useState(false);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Record<string, boolean>>({});

  // 1. Fetch Documents List (Only to populate dropdowns)
  useEffect(() => {
    if (!user) return;
    const initDocs = async () => {
      setLoadingDocs(true);
      try {
        const docsRes = await listDocuments(user.id);
        const allDocs = (docsRes.data || []) as DocumentRow[];

        setResumeOptions(allDocs
          .filter(d => d.type === 'resume')
          .map(d => ({ id: d.id, name: d.name, created_at: d.created_at }))
        );

        setCoverOptions(allDocs
          .filter(d => d.type === 'cover-letter')
          .map(d => ({ id: d.id, name: d.name, created_at: d.created_at }))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDocs(false);
      }
    };
    initDocs();
  }, [user]);

  // 2. Handle Analysis Click - PURE SIMULATION
  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysis(null); // Clear previous result to show loading state

    try {
      // We don't pass any data. We just ask the simulation to run.
      const result = await simulateAIAnalysis();
      setAnalysis(result);
      
      if (onValidationChange) {
        onValidationChange(result.score >= 70);
      }
    } catch (error) {
      console.error("Simulation failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [onValidationChange]);

  // Reset analysis if user changes selection (to force them to run it again)
  useEffect(() => {
    setAnalysis(null);
    setAppliedSuggestions({});
  }, [selectedResumeId, selectedCoverId]);

  // Compute adjusted score based on applied suggestions
  const adjustedScore = React.useMemo(() => {
    if (!analysis) return null;
    const base = analysis.score;
    const suggestions = analysis.suggestions || [];
    const added = suggestions.reduce((sum, s) => {
      return sum + (appliedSuggestions[s.id] ? s.impact : 0);
    }, 0);
    const total = Math.min(100, base + added);
    return total;
  }, [analysis, appliedSuggestions]);

  // When adjusted score changes, notify parent validation
  useEffect(() => {
    if (onValidationChange && adjustedScore !== null) {
      onValidationChange(adjustedScore >= 70);
    }
  }, [adjustedScore, onValidationChange]);

  const handleToggleSuggestion = (id: string) => {
    setAppliedSuggestions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
         <Typography variant="h6">Application Quality Scoring</Typography>
         {loadingDocs && <CircularProgress size={20} />}
      </Stack>
      
      <Card variant="outlined">
        <CardContent>
          
          {/* SELECTION AREA */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>Select Materials</Typography>
            <Stack spacing={2}>
                <FormControl fullWidth size="small">
                    <InputLabel>Resume</InputLabel>
                    <Select
                        value={selectedResumeId}
                        label="Resume"
                        onChange={(e) => setSelectedResumeId(e.target.value)}
                    >
                        <MenuItem value=""><em>None</em></MenuItem>
                        {resumeOptions.map((doc) => (
                            <MenuItem key={doc.id} value={doc.id}>{doc.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                    <InputLabel>Cover Letter</InputLabel>
                    <Select
                        value={selectedCoverId}
                        label="Cover Letter"
                        onChange={(e) => setSelectedCoverId(e.target.value)}
                    >
                        <MenuItem value=""><em>None</em></MenuItem>
                        {coverOptions.map((doc) => (
                            <MenuItem key={doc.id} value={doc.id}>{doc.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                
                <FormControlLabel 
                  control={
                    <Switch 
                      size="small" 
                      checked={linkedInVerified} 
                      onChange={(e) => setLinkedInVerified(e.target.checked)} 
                    />
                  } 
                  label={<Typography variant="caption">LinkedIn profile is updated</Typography>} 
                />
            </Stack>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* ACTION BUTTON */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mb: 2 }}>
            {!selectedResumeId ? (
               <Alert severity="info" sx={{ width: '100%' }}>Select a resume to begin analysis.</Alert>
            ) : (
              <Button 
                variant="contained" 
                startIcon={isAnalyzing ? <CircularProgress size={20} color="inherit"/> : <AutoAwesomeIcon />}
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                fullWidth
                sx={{ 
                  background: isAnalyzing ? 'grey' : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)', 
                  color: 'white',
                  fontWeight: 'bold',
                  py: 1.5,
                  boxShadow: 3
                }}
              >
                {isAnalyzing ? "Analyzing Resume & Job Fit..." : analysis ? "Re-Run Analysis" : "Run AI Analysis Match"}
              </Button>
            )}
          </Box>

          {/* RESULTS AREA */}
          {analysis && (
            <Box sx={{ animation: 'fadeIn 0.6s ease-out' }}>
              
              {/* Score Header */}
              <Stack direction="row" alignItems="center" spacing={3} sx={{ mb: 3 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                   <CircularProgress 
                      variant="determinate" 
                      value={100} 
                      size={70} 
                      thickness={4}
                      sx={{ color: '#e0e0e0', position: 'absolute' }} // grey background track
                   />
                   <CircularProgress 
                      variant="determinate" 
                      value={adjustedScore ?? analysis.score} 
                      size={70} 
                      thickness={4}
                      color={analysis.score >= 90 ? "success" : "primary"} 
                   />
                   <Box sx={{ 
                     top: 0, left: 0, bottom: 0, right: 0, 
                     position: 'absolute', display: 'flex', 
                     alignItems: 'center', justifyContent: 'center' 
                   }}>
                     <Typography variant="h6" component="div" fontWeight="bold" color="text.primary">
                      {adjustedScore ?? analysis.score}
                     </Typography>
                   </Box>
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {(() => {
                      const sc = adjustedScore ?? analysis.score;
                      if (sc >= 90) return 'Excellent';
                      if (sc < 80) return 'Fair';
                      return 'Good';
                    })()} Match
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    AI Analysis Complete
                  </Typography>
                </Box>
              </Stack>

              {/* Feedback List */}
              <Alert 
                severity="success" 
                variant="outlined"
                sx={{ mb: 2, bgcolor: 'success.50' }}
                icon={<AutoAwesomeIcon />}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  AI Findings:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                  {analysis.feedback.map((f, i) => (
                    <li key={i}><Typography variant="body2">{f}</Typography></li>
                  ))}
                </ul>
              </Alert>

              {/* Strengths Tags */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  MATCHING SKILLS DETECTED:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {analysis.strengths.map((skill) => (
                    <Chip 
                      key={skill} 
                      label={skill} 
                      size="small" 
                      color="success" 
                      variant="filled" // filled for emphasis
                    />
                  ))}
                </Box>
              </Box>

              {/* Missing Skills Tags (Optional) */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  POTENTIAL GAPS:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {analysis.missingSkills.map((skill) => (
                    <Chip 
                      key={skill} 
                      label={skill} 
                      size="small" 
                      variant="outlined"
                      color="default"
                    />
                  ))}
                </Box>
              </Box>

              {/* Improvement Suggestions (Prioritized by Impact) */}
              {analysis.suggestions && analysis.suggestions.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    IMPROVEMENT SUGGESTIONS (PRIORITIZED):
                  </Typography>
                  <List dense>
                    {analysis.suggestions
                      .slice()
                      .sort((a, b) => b.impact - a.impact)
                      .map((s) => (
                        <ListItem key={s.id} disableGutters secondaryAction={
                          <Chip label={`+${s.impact}`} size="small" color="primary" />
                        }>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Checkbox edge="start" checked={!!appliedSuggestions[s.id]} onChange={() => handleToggleSuggestion(s.id)} />
                          </ListItemIcon>
                          <ListItemText primary={<Typography variant="body2">{s.text}</Typography>} />
                        </ListItem>
                      ))}
                  </List>
                </Box>
              )}
              
            </Box>
          )}

        </CardContent>
      </Card>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Box>
  );
}