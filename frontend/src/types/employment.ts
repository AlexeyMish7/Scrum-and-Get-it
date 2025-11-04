export type EmploymentRow = {
  id: string;
  user_id: string;
  job_title: string;
  company_name: string;
  location?: string | null;
  start_date: string; // ISO date (YYYY-MM-DD)
  end_date?: string | null;
  job_description?: string | null;
  current_position: boolean;
  created_at: string;
  updated_at: string;
};

export type EmploymentFormData = {
  jobTitle: string;
  companyName: string;
  location?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  isCurrent: boolean;
  description?: string;
};
