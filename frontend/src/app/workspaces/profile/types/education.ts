// Shared types for education feature

export type DbEducationRow = {
  id?: string;
  user_id?: string | null;
  degree_type?: string | null;
  institution_name?: string | null;
  field_of_study?: string | null;
  graduation_date?: string | null; // SQL date string
  start_date?: string | null; // SQL date string
  gpa?: number | null;
  honors?: string | null;
  enrollment_status?: string | null;
  education_level?: string | null;
  metadata?: { privateGpa?: boolean } | null;
  created_at?: string | null;
  updated_at?: string | null;
};

// UI-facing entry used throughout components
export type EducationEntry = {
  id: string;
  degree: string; // degree_type
  institution: string; // institution_name
  fieldOfStudy: string; // field_of_study
  startDate: string; // YYYY-MM
  endDate?: string; // YYYY-MM or undefined for ongoing
  gpa?: number;
  gpaPrivate?: boolean;
  honors?: string | undefined;
  active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

// Form data shape (similar to EducationEntry, used when creating/updating)
export type EducationFormData = {
  degree?: string;
  institution?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string | undefined;
  gpa?: number | undefined;
  gpaPrivate?: boolean | undefined;
  honors?: string | undefined;
  active?: boolean | undefined;
};
