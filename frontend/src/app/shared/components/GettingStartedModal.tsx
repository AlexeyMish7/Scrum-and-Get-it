import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Stack,
  useTheme,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  AutoAwesome as AIIcon,
  Work as WorkIcon,
  People as NetworkIcon,
  EventNote as InterviewIcon,
  School as EducationIcon,
} from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";

interface GettingStartedModalProps {
  open: boolean;
  onClose: () => void;
}

const GETTING_STARTED_CONTENT = {
  welcome:
    "Welcome to Flow ATS! This guide will help you get started with your job search journey.",
  sections: [
    {
      title: "Profile Setup",
      icon: <EducationIcon />,
      description:
        "Complete your professional profile with education, employment history, and skills.",
      steps: [
        "Go to Profile > Education to add your academic background",
        "Add your work experience in Profile > Employment",
        "List your technical and soft skills in Profile > Skills",
        "Upload certifications and courses in Profile > Certifications",
      ],
    },
    {
      title: "Create Your Resume",
      icon: <AIIcon />,
      description:
        "Generate tailored resumes using AI or create them manually.",
      steps: [
        "Navigate to AI Hub to start generating documents",
        "Use the Resume Generator to create tailored versions",
        "Customize templates to match your style",
        "Save drafts and manage multiple versions",
      ],
    },
    {
      title: "Track Job Applications",
      icon: <WorkIcon />,
      description:
        "Organize and monitor your job applications in one place.",
      steps: [
        "Add jobs to your pipeline with job details",
        "Track application status through different stages",
        "Set application deadlines to stay organized",
        "View analytics to understand your job search metrics",
      ],
    },
    {
      title: "Prepare for Interviews",
      icon: <InterviewIcon />,
      description:
        "Access interview prep resources and schedule practice sessions.",
      steps: [
        "Use the Interview Hub for preparation materials",
        "Create custom prep checklists for specific roles",
        "Schedule interviews and set reminders",
        "Track follow-ups and interview feedback",
      ],
    },
    {
      title: "Build Your Network",
      icon: <NetworkIcon />,
      description: "Manage professional contacts and leverage your network.",
      steps: [
        "Add contacts to your professional network",
        "Organize contacts by industry, company, or relationship",
        "Track interactions and follow-ups",
        "Join peer groups for collaborative support",
      ],
    },
  ],
  faq: [
    {
      question: "How do I get started?",
      answer:
        "Start by completing your profile with your education, employment history, and skills. This will help generate more personalized resume recommendations.",
    },
    {
      question: "Can I generate multiple resumes?",
      answer:
        "Yes! You can generate and save multiple versions of your resume tailored to different job applications. Each version can be customized separately.",
    },
    {
      question: "How does the job matching work?",
      answer:
        "Our AI analyzes your profile and compares it against job requirements to calculate match scores. This helps you prioritize applications and understand your competitiveness.",
    },
    {
      question: "Can I track multiple applications?",
      answer:
        "Absolutely. Use the Pipeline view to track all your applications across different stages from 'Interested' to 'Offer'.",
    },
    {
      question: "How do I use the Interview Hub?",
      answer:
        "Visit the Interview Hub to access prep materials, create custom checklists, and schedule interview practice sessions.",
    },
    {
      question: "Is my data private?",
      answer:
        "Yes, your data is encrypted and stored securely. You have full control over what information you share and can delete it anytime.",
    },
    {
      question: "How do I reset my password?",
      answer:
        "Go to Profile > Settings and click 'Reset Password'. You'll receive an email with instructions.",
    },
  ],
};

export default function GettingStartedModal({
  open,
  onClose,
}: GettingStartedModalProps) {
  const theme = useTheme();
  const [expandedFaq, setExpandedFaq] = useState<string | false>(false);

  const handleClose = () => {
    // Mark as seen
    try {
      localStorage.setItem("sgt:seen_getting_started", "true");
    } catch {}
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: "90vh",
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Box>
          <Typography variant="h6" component="span" fontWeight={700}>
            Getting Started with Flow ATS
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {GETTING_STARTED_CONTENT.welcome}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 3 }}>
        <Stack spacing={3}>
          {/* Quick Start Sections */}
          {GETTING_STARTED_CONTENT.sections.map((section, idx) => (
            <Accordion
              key={idx}
              defaultExpanded={idx === 0}
              sx={{
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.02)",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ color: theme.palette.primary.main }}>
                    {section.icon}
                  </Box>
                  <Box>
                    <Typography fontWeight={600}>{section.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {section.description}
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack component="ol" spacing={1} sx={{ pl: 2 }}>
                  {section.steps.map((step, stepIdx) => (
                    <Typography
                      component="li"
                      key={stepIdx}
                      variant="body2"
                      color="text.secondary"
                    >
                      {step}
                    </Typography>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}

          <Divider sx={{ my: 1 }} />

          {/* FAQ Section */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
              Frequently Asked Questions
            </Typography>
            <Stack spacing={1}>
              {GETTING_STARTED_CONTENT.faq.map((item, idx) => (
                <Accordion
                  key={idx}
                  expanded={expandedFaq === `faq-${idx}`}
                  onChange={() =>
                    setExpandedFaq(
                      expandedFaq === `faq-${idx}` ? false : `faq-${idx}`
                    )
                  }
                  sx={{
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.03)"
                        : "rgba(0,0,0,0.01)",
                    "&:before": { display: "none" },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body2" fontWeight={500}>
                      {item.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      {item.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} variant="contained">
          Get Started
        </Button>
      </DialogActions>
    </Dialog>
  );
}
