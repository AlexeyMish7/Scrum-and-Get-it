/**
 * System Resume Templates - Pre-built professional templates
 */

import type { Template } from "../../types";

export const CHRONOLOGICAL_RESUME: Template = {
  id: "resume-chronological",
  name: "Professional Chronological",
  category: "resume",
  subtype: "chronological",

  layout: {
    columns: 1,
    pageSize: "letter",
    margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
    sectionOrder: [
      {
        id: "header",
        name: "Header",
        type: "header",
        required: true,
        defaultEnabled: true,
      },
      {
        id: "summary",
        name: "Summary",
        type: "summary",
        required: false,
        defaultEnabled: true,
      },
      {
        id: "experience",
        name: "Experience",
        type: "experience",
        required: true,
        defaultEnabled: true,
      },
      {
        id: "education",
        name: "Education",
        type: "education",
        required: true,
        defaultEnabled: true,
      },
      {
        id: "skills",
        name: "Skills",
        type: "skills",
        required: true,
        defaultEnabled: true,
      },
      {
        id: "certifications",
        name: "Certifications",
        type: "certifications",
        required: false,
        defaultEnabled: true,
      },
    ],
  },

  schema: {
    requiredSections: ["header", "experience", "education", "skills"],
    optionalSections: ["summary", "certifications", "projects"],
    customSections: false,
    maxSections: 10,
  },

  features: {
    atsOptimized: true,
    customizable: true,
    skillsHighlight: true,
    portfolioSupport: false,
    photoSupport: false,
    multiLanguage: false,
  },

  metadata: {
    thumbnail: "/templates/chronological.png",
    description:
      "Traditional timeline-based resume with maximum ATS compatibility.",
    industry: ["Technology", "Finance", "Healthcare"],
    experienceLevel: ["Mid-level", "Senior"],
    tags: ["professional", "traditional", "ats-friendly"],
    usageCount: 0,
    rating: 4.8,
  },

  version: 1,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  author: "system",
  isDefault: true,
};

export const FUNCTIONAL_RESUME: Template = {
  id: "resume-functional",
  name: "Skills-Based Functional",
  category: "resume",
  subtype: "functional",

  layout: {
    columns: 1,
    pageSize: "letter",
    margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
    sectionOrder: [
      {
        id: "header",
        name: "Header",
        type: "header",
        required: true,
        defaultEnabled: true,
      },
      {
        id: "summary",
        name: "Summary",
        type: "summary",
        required: true,
        defaultEnabled: true,
      },
      {
        id: "skills",
        name: "Skills",
        type: "skills",
        required: true,
        defaultEnabled: true,
      },
      {
        id: "projects",
        name: "Projects",
        type: "projects",
        required: false,
        defaultEnabled: true,
      },
      {
        id: "experience",
        name: "Experience",
        type: "experience",
        required: true,
        defaultEnabled: true,
      },
      {
        id: "education",
        name: "Education",
        type: "education",
        required: true,
        defaultEnabled: true,
      },
    ],
  },

  schema: {
    requiredSections: [
      "header",
      "summary",
      "skills",
      "experience",
      "education",
    ],
    optionalSections: ["projects", "certifications"],
    customSections: false,
    maxSections: 10,
  },

  features: {
    atsOptimized: false,
    customizable: true,
    skillsHighlight: true,
    portfolioSupport: true,
    photoSupport: false,
    multiLanguage: false,
  },

  metadata: {
    thumbnail: "/templates/functional.png",
    description: "Focus on skills and competencies. Ideal for career changers.",
    industry: ["Technology", "Creative", "Consulting"],
    experienceLevel: ["Entry-level", "Career-change"],
    tags: ["skills-focused", "career-change", "modern"],
    usageCount: 0,
    rating: 4.3,
  },

  version: 1,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  author: "system",
  isDefault: false,
};

export const HYBRID_RESUME: Template = {
  id: "resume-hybrid",
  name: "Modern Hybrid",
  category: "resume",
  subtype: "hybrid",

  layout: {
    columns: 1,
    pageSize: "letter",
    margins: { top: 0.7, right: 0.7, bottom: 0.7, left: 0.7 },
    sectionOrder: [
      {
        id: "header",
        name: "Header",
        type: "header",
        required: true,
        defaultEnabled: true,
      },
      {
        id: "summary",
        name: "Summary",
        type: "summary",
        required: true,
        defaultEnabled: true,
      },
      {
        id: "skills",
        name: "Skills",
        type: "skills",
        required: true,
        defaultEnabled: true,
      },
      {
        id: "experience",
        name: "Experience",
        type: "experience",
        required: true,
        defaultEnabled: true,
      },
      {
        id: "education",
        name: "Education",
        type: "education",
        required: true,
        defaultEnabled: true,
      },
      {
        id: "certifications",
        name: "Certifications",
        type: "certifications",
        required: false,
        defaultEnabled: true,
      },
    ],
  },

  schema: {
    requiredSections: [
      "header",
      "summary",
      "skills",
      "experience",
      "education",
    ],
    optionalSections: ["certifications", "projects"],
    customSections: false,
    maxSections: 10,
  },

  features: {
    atsOptimized: true,
    customizable: true,
    skillsHighlight: true,
    portfolioSupport: false,
    photoSupport: false,
    multiLanguage: false,
  },

  metadata: {
    thumbnail: "/templates/hybrid.png",
    description:
      "Combines skills with chronological history. Balanced approach.",
    industry: ["Technology", "Business", "Marketing"],
    experienceLevel: ["Entry-level", "Mid-level", "Senior"],
    tags: ["balanced", "modern", "versatile", "recommended"],
    usageCount: 0,
    rating: 4.7,
  },

  version: 1,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  author: "system",
  isDefault: false,
};

export const CREATIVE_RESUME: Template = {
  id: "resume-creative",
  name: "Creative Professional",
  category: "resume",
  subtype: "creative",

  layout: {
    columns: 2,
    pageSize: "letter",
    margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    sectionOrder: [
      {
        id: "header",
        name: "Header",
        type: "header",
        required: true,
        defaultEnabled: true,
      },
      {
        id: "summary",
        name: "Summary",
        type: "summary",
        required: true,
        defaultEnabled: true,
      },
      {
        id: "experience",
        name: "Experience",
        type: "experience",
        required: true,
        defaultEnabled: true,
      },
      {
        id: "skills",
        name: "Skills",
        type: "skills",
        required: true,
        defaultEnabled: true,
      },
      {
        id: "projects",
        name: "Portfolio",
        type: "projects",
        required: false,
        defaultEnabled: true,
      },
      {
        id: "education",
        name: "Education",
        type: "education",
        required: true,
        defaultEnabled: true,
      },
    ],
  },

  schema: {
    requiredSections: [
      "header",
      "summary",
      "experience",
      "skills",
      "education",
    ],
    optionalSections: ["projects", "awards"],
    customSections: true,
    maxSections: 12,
  },

  features: {
    atsOptimized: false,
    customizable: true,
    skillsHighlight: true,
    portfolioSupport: true,
    photoSupport: true,
    multiLanguage: false,
  },

  metadata: {
    thumbnail: "/templates/creative.png",
    description: "Modern, visually striking design for creative professionals.",
    industry: ["Design", "Creative", "Marketing", "Media"],
    experienceLevel: ["Entry-level", "Mid-level"],
    tags: ["creative", "design", "visual", "portfolio", "modern"],
    usageCount: 0,
    rating: 4.5,
  },

  version: 1,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  author: "system",
  isDefault: false,
};

export const ACADEMIC_RESUME: Template = {
  id: "resume-academic",
  name: "Academic & Research",
  category: "resume",
  subtype: "academic",

  layout: {
    columns: 1,
    pageSize: "letter",
    margins: { top: 1.0, right: 1.0, bottom: 1.0, left: 1.0 },
    sectionOrder: [
      {
        id: "header",
        name: "Header",
        type: "header",
        required: true,
        defaultEnabled: true,
      },
      {
        id: "education",
        name: "Education",
        type: "education",
        required: true,
        defaultEnabled: true,
      },
      {
        id: "publications",
        name: "Publications",
        type: "publications",
        required: true,
        defaultEnabled: true,
      },
      {
        id: "experience",
        name: "Research",
        type: "experience",
        required: true,
        defaultEnabled: true,
      },
      {
        id: "awards",
        name: "Awards",
        type: "awards",
        required: false,
        defaultEnabled: true,
      },
      {
        id: "skills",
        name: "Skills",
        type: "skills",
        required: false,
        defaultEnabled: true,
      },
    ],
  },

  schema: {
    requiredSections: ["header", "education", "publications", "experience"],
    optionalSections: ["awards", "skills", "certifications"],
    customSections: true,
    maxSections: 12,
  },

  features: {
    atsOptimized: false,
    customizable: true,
    skillsHighlight: false,
    portfolioSupport: false,
    photoSupport: false,
    multiLanguage: true,
  },

  metadata: {
    thumbnail: "/templates/academic.png",
    description: "For academic positions with publications and research focus.",
    industry: ["Academia", "Research", "Education"],
    experienceLevel: ["Graduate", "Postdoc", "Faculty"],
    tags: ["academic", "research", "publications", "teaching"],
    usageCount: 0,
    rating: 4.6,
  },

  version: 1,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  author: "system",
  isDefault: false,
};

export const SYSTEM_RESUME_TEMPLATES: Template[] = [
  CHRONOLOGICAL_RESUME,
  HYBRID_RESUME,
  FUNCTIONAL_RESUME,
  CREATIVE_RESUME,
  ACADEMIC_RESUME,
];

export const SYSTEM_COVER_LETTER_TEMPLATES: Template[] = [];
